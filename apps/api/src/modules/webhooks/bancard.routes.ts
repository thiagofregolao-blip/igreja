import crypto from 'node:crypto';
import { Router, raw } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { confirmPayment } from '../tickets/tickets.service.js';

const router = Router();

/**
 * Webhook Bancard (preparado para ativação futura).
 *
 * Comportamento:
 * - Se BANCARD_WEBHOOK_SECRET não estiver configurado, responde 503 (desativado)
 * - Valida HMAC do payload contra header X-Bancard-Signature (formato a ajustar com Bancard real)
 * - Procura payment pelo bancardRef (transação) e confirma se status = approved
 *
 * IMPORTANTE: confirmar formato exato de assinatura/payload com a documentação da Bancard
 * no momento da integração definitiva.
 */
router.post(
  '/bancard',
  raw({ type: 'application/json', limit: '1mb' }),
  asyncHandler(async (req, res) => {
    if (!env.BANCARD_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Disabled', message: 'Webhook Bancard não configurado' });
    }

    const signature = req.header('x-bancard-signature') ?? '';
    const rawBody = (req.body as Buffer).toString('utf-8');

    const expected = crypto
      .createHmac('sha256', env.BANCARD_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.padEnd(expected.length, '0').slice(0, expected.length)))) {
      return res.status(401).json({ error: 'InvalidSignature' });
    }

    const payload = JSON.parse(rawBody) as {
      operation?: {
        token?: string;
        shop_process_id?: number | string;
        response?: 'S' | 'N';
        response_code?: string;
      };
    };

    const txRef = payload.operation?.token ?? String(payload.operation?.shop_process_id ?? '');
    const approved = payload.operation?.response === 'S';
    if (!txRef) return res.status(400).json({ error: 'MissingRef' });

    const payment = await prisma.payment.findFirst({ where: { bancardRef: txRef } });
    if (!payment) return res.status(404).json({ error: 'NotFound' });

    if (approved && payment.status === 'PENDING') {
      await confirmPayment(payment.id, 'BANCARD_WEBHOOK', `Auto-confirmado via Bancard (${txRef})`);
    }
    res.json({ ok: true });
  }),
);

export default router;
