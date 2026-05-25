import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getDashboard } from './dashboard.service.js';
import { listAdminTickets, listPayments } from './payments.service.js';
import { getCustomer, listCustomers, toggleBlock } from './users.service.js';
import { generateExcelReport, generatePdfReport } from './reports.service.js';
import { confirmPayment, rejectPayment } from '../tickets/tickets.service.js';

const router = Router();
router.use(authRequired, requireAdmin);

// Dashboard
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const data = await getDashboard();
    res.json(data);
  }),
);

// Tickets
const ticketsFilterSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
router.get(
  '/tickets',
  validate(ticketsFilterSchema, 'query'),
  asyncHandler(async (req, res) => {
    const tickets = await listAdminTickets({ ...(req.query as any), ticketStatus: (req.query as any).status });
    res.json({ tickets });
  }),
);

// Payments
const paymentsFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).optional(),
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
router.get(
  '/payments',
  validate(paymentsFilterSchema, 'query'),
  asyncHandler(async (req, res) => {
    const payments = await listPayments(req.query as any);
    res.json({ payments });
  }),
);

router.put(
  '/payments/:id/confirm',
  validate(z.object({ notes: z.string().max(500).optional() })),
  asyncHandler(async (req, res) => {
    const payment = await confirmPayment(req.params.id, req.user!.sub, req.body.notes);
    res.json({ payment });
  }),
);

router.put(
  '/payments/:id/reject',
  validate(z.object({ notes: z.string().min(1).max(500) })),
  asyncHandler(async (req, res) => {
    const payment = await rejectPayment(req.params.id, req.user!.sub, req.body.notes);
    res.json({ payment });
  }),
);

// Users
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await listCustomers();
    res.json({ users });
  }),
);
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await getCustomer(req.params.id);
    res.json({ user });
  }),
);
router.put(
  '/users/:id/block',
  asyncHandler(async (req, res) => {
    const user = await toggleBlock(req.params.id);
    res.json({ user });
  }),
);

// Reports
const reportFilterSchema = z.object({
  eventId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.get(
  '/reports/excel',
  validate(reportFilterSchema, 'query'),
  asyncHandler(async (req, res) => {
    const buffer = await generateExcelReport(req.query as any);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${Date.now()}.xlsx"`);
    res.send(buffer);
  }),
);

router.get(
  '/reports/pdf',
  validate(reportFilterSchema, 'query'),
  asyncHandler(async (req, res) => {
    const buffer = await generatePdfReport(req.query as any);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${Date.now()}.pdf"`);
    res.send(buffer);
  }),
);

export default router;
