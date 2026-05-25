import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { publicUrl, uploadReceipt } from '../../middleware/upload.js';
import { createTicketFromCheckout, getMyTicketDetail, listMyTickets, uploadReceiptForTicket } from './tickets.service.js';
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
