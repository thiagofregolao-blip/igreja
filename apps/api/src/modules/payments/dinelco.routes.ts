import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/prisma.js';
import { confirmPayment } from '../tickets/tickets.service.js';
import {
  isDinelcoConfigured,
  createCheckoutSession,
  getCheckoutSession,
  checkoutFormUrl,
} from './dinelco.service.js';

const router = Router();

/**
 * Confirma um Payment contra a Bepsa (fonte da verdade) e, se aprovado,
 * marca o bilhete como pago. Idempotente: pagamento já confirmado retorna ok.
 */
async function settlePayment(paymentId: string): Promise<{ ok: boolean; status: string }> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, status: 'NOT_FOUND' };
  if (payment.status === 'CONFIRMED') return { ok: true, status: 'APPROVED' };
  if (!payment.bancardRef) return { ok: false, status: 'NO_SESSION' };

  const state = await getCheckoutSession(payment.bancardRef);
  const approved = state.paymentStatus === 'APPROVED' || state.sessionStatus === 'SUCCESS';
  if (!approved) return { ok: false, status: state.paymentStatus ?? state.sessionStatus };

  try {
    await confirmPayment(
      payment.id,
      'DINELCO',
      `Cartão aprovado · auth ${state.authorizationCode ?? '-'} · op ${state.operationNumber ?? '-'} · sessão ${payment.bancardRef}`,
    );
  } catch (e) {
    // Corrida entre o postMessage (/confirm) e o /callback: se já confirmou, tudo certo.
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    if (fresh?.status !== 'CONFIRMED') throw e;
  }
  return { ok: true, status: 'APPROVED' };
}

/**
 * Callback da Bepsa (público, sem auth). O corpo não tem assinatura,
 * então NUNCA confiamos nele: só extraímos a referência e validamos
 * o estado real da sessão direto na API da Bepsa.
 */
router.post(
  '/callback',
  asyncHandler(async (req, res) => {
    const ref: string | undefined = req.body?.clientReferenceId;
    // A Bepsa prefixa o clientReferenceId com "embed-"
    const paymentId = ref?.replace(/^embed-/, '');
    if (paymentId) {
      try {
        await settlePayment(paymentId);
      } catch (e) {
        console.error('[dinelco:callback]', e);
      }
    }
    // 200 sempre, para a Bepsa não reenviar indefinidamente
    res.status(200).json({ received: true });
  }),
);

router.use(authRequired);

/** Status da integração (o front decide se habilita o checkout). */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({ enabled: isDinelcoConfigured() });
  }),
);

const sessionSchema = z.object({ paymentId: z.string().min(1) });

/** Cria a sessão de checkout embutido para um Payment pendente do usuário. */
router.post(
  '/session',
  validate(sessionSchema),
  asyncHandler(async (req, res) => {
    if (!isDinelcoConfigured()) {
      return res.status(503).json({ error: 'Disabled', message: 'Pagamento com cartão (Dinelco) ainda não configurado.' });
    }
    const { paymentId } = req.body as { paymentId: string };

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { ticket: true, user: true },
    });
    if (!payment || payment.userId !== req.user!.sub) {
      return res.status(404).json({ error: 'NotFound', message: 'Pagamento não encontrado' });
    }
    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'BadRequest', message: 'Pagamento já processado' });
    }

    const [firstName, ...rest] = payment.user.name.split(' ');
    // Origem real (domínio + protocolo) — a Bepsa valida o targetOrigin do iframe.
    // Depende de app.set('trust proxy') para req.protocol vir como https em produção.
    const origin = `${req.protocol}://${req.get('host')}`;
    const session = await createCheckoutSession({
      amount: payment.amount,
      clientReferenceId: payment.id,
      customer: {
        customerId: payment.userId,
        name: firstName,
        lastname: rest.join(' ') || firstName,
        email: payment.user.email,
        phone: payment.user.phone,
      },
      metadata: { ticketId: payment.ticketId, ticketNumber: String(payment.ticket.ticketNumber) },
    }, origin);

    // Guarda o sessionId para a confirmação posterior
    await prisma.payment.update({
      where: { id: payment.id },
      data: { bancardRef: String(session.sessionId) },
    });

    res.json({
      integrityToken: session.integrityToken,
      formUrl: checkoutFormUrl(),
    });
  }),
);

const confirmSchema = z.object({ paymentId: z.string().min(1) });

/** Confirmação disparada pelo front após o postMessage de sucesso do iframe. */
router.post(
  '/confirm',
  validate(confirmSchema),
  asyncHandler(async (req, res) => {
    const { paymentId } = req.body as { paymentId: string };
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== req.user!.sub) {
      return res.status(404).json({ error: 'NotFound', message: 'Pagamento não encontrado' });
    }

    const result = await settlePayment(paymentId);
    if (result.ok) return res.json({ ok: true, ticketId: payment.ticketId });
    if (result.status === 'PROCESSING' || result.status === 'PENDING') {
      return res.status(202).json({ ok: false, status: result.status, message: 'Pagamento em processamento. Aguarde alguns instantes.' });
    }
    return res.status(402).json({ ok: false, status: result.status, message: 'Pagamento não aprovado.' });
  }),
);

export default router;
