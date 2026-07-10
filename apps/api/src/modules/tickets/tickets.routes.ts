import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { publicUrl, uploadReceipt } from '../../middleware/upload.js';
import { createTicketFromCheckout, generateMyTicketPdf, getMyTicketDetail, listMyTickets, resendTicketEmail, uploadReceiptForTicket } from './tickets.service.js';
import { checkoutSchema } from './tickets.schemas.js';

const router = Router();
router.use(authRequired);

router.post(
  '/',
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const result = await createTicketFromCheckout(req.body, req.user!.sub);
    res.status(201).json(result);
  }),
);

router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const tickets = await listMyTickets(req.user!.sub);
    res.json({ tickets });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await getMyTicketDetail(req.params.id, req.user!.sub);
    res.json({ ticket });
  }),
);

// Download do PDF do bilhete (cartelas) — só o dono, só se pago
router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const { pdf, ticketNumber } = await generateMyTicketPdf(req.params.id, req.user!.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bilhete-${String(ticketNumber).padStart(6, '0')}.pdf"`);
    res.send(pdf);
  }),
);

// Reenvia o e-mail com o bilhete — só o dono, só se pago
router.post(
  '/:id/resend-email',
  asyncHandler(async (req, res) => {
    const result = await resendTicketEmail(req.params.id, req.user!.sub);
    if (!result.emailSent) {
      return res.status(502).json({ error: 'EmailFailed', message: 'Não foi possível enviar o e-mail. Tente novamente em instantes.' });
    }
    res.json({ ok: true, to: result.to });
  }),
);

router.post(
  '/:id/payment',
  uploadReceipt,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'BadRequest', message: 'Comprovante obrigatório' });
    const url = publicUrl(req.file.path);
    const payment = await uploadReceiptForTicket(req.params.id, req.user!.sub, url);
    res.json({ payment });
  }),
);

export default router;
