import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { confirmPayment } from '../tickets/tickets.service.js';
import { isCybsConfigured, createCaptureContext, processPayment } from './dinelco.service.js';

const router = Router();
router.use(authRequired);

/** Status da integração (útil pro front decidir se mostra o cartão). */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({ enabled: isCybsConfigured(), env: env.CYBS_RUN_ENV });
  }),
);

/** Gera o capture context (JWT) para o Microform no front. */
router.post(
  '/capture-context',
  asyncHandler(async (_req, res) => {
    if (!isCybsConfigured()) {
      return res.status(503).json({ error: 'Disabled', message: 'Pagamento com cartão (Dinelco) ainda não configurado.' });
    }
    const captureContext = await createCaptureContext(env.FRONTEND_URL);
    res.json({ captureContext });
  }),
);

const paySchema = z.object({
  paymentId: z.string().min(1),
  transientToken: z.string().min(1),
});

/** Processa o pagamento com o transient token do cartão. */
router.post(
  '/pay',
  validate(paySchema),
  asyncHandler(async (req, res) => {
    if (!isCybsConfigured()) {
      return res.status(503).json({ error: 'Disabled', message: 'Pagamento com cartão (Dinelco) ainda não configurado.' });
    }

    const { paymentId, transientToken } = req.body as { paymentId: string; transientToken: string };

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

    const result = await processPayment({
      transientTokenJwt: transientToken,
      amount: payment.amount,
      reference: `BINGO-${payment.ticket.ticketNumber}`,
      billTo: {
        firstName: payment.user.name.split(' ')[0],
        lastName: payment.user.name.split(' ').slice(1).join(' ') || payment.user.name,
        email: payment.user.email,
      },
    });

    if (!result.approved) {
      return res.status(402).json({ error: 'Declined', status: result.status, message: 'Pagamento recusado pelo cartão.' });
    }

    // Guarda a referência da transação e confirma (marca bilhete como PAGO)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { bancardRef: result.transactionId },
    });
    await confirmPayment(payment.id, 'DINELCO', `Cartão aprovado · auth ${result.approvalCode ?? ''} · tx ${result.transactionId ?? ''}`);

    res.json({ ok: true, status: result.status, ticketId: payment.ticketId });
  }),
);

export default router;
