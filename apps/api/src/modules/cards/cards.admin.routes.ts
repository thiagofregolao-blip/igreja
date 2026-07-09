import fs from 'node:fs';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { uploadBingoPdfs, uploadCardImages, uploadCsv } from '../../middleware/upload.js';
import { getEventCardsStats, importCardNumbersCsv, listEventCards, uploadCards } from './cards.service.js';
import { importBingoPdfs } from './bingoPdf.service.js';
import { setCouponAvailability } from '../coupons/coupons.service.js';

const router = Router();
router.use(authRequired, requireAdmin);

router.get(
  '/events/:id/cards/stats',
  asyncHandler(async (req, res) => {
    const stats = await getEventCardsStats(req.params.id);
    res.json({ stats });
  }),
);

// Controle de vitrine: define quantos cupons ficam disponíveis para venda.
// Os demais (livres) ficam bloqueados e aparecem como vendidos ao público.
const availabilitySchema = z.object({ available: z.number().int().min(0) });
router.put(
  '/events/:id/cards/availability',
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    const summary = await setCouponAvailability(req.params.id, req.body.available);
    res.json({ summary });
  }),
);

router.get(
  '/events/:id/cards',
  asyncHandler(async (req, res) => {
    const cards = await listEventCards(req.params.id);
    res.json({ cards });
  }),
);

router.post(
  '/events/:id/cards/upload',
  uploadCardImages,
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const startCardNumber = req.body.startCardNumber ? Number(req.body.startCardNumber) : undefined;
    const result = await uploadCards(req.params.id, files, startCardNumber);
    res.status(201).json(result);
  }),
);

// Importação dos PDFs de bingo (1 PDF = 1 cupom com 2 cartelas, nome NNNN-MMMM.pdf).
// Envie em lotes (até 200 por request); a numeração impressa dentro do PDF é
// verificada contra o nome do arquivo antes de qualquer gravação.
router.post(
  '/events/:id/cards/import-bingos',
  uploadBingoPdfs,
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'BadRequest', message: 'Envie ao menos um PDF no campo "pdfs"' });
    }
    const result = await importBingoPdfs(
      req.params.id,
      files.map((f) => ({ filePath: f.path, originalName: f.originalname })),
      {
        baseCardNumber: req.body.baseCardNumber ? Number(req.body.baseCardNumber) : undefined,
        force: req.body.force === 'true' || req.body.force === '1',
      },
    );
    for (const f of files) {
      try { fs.unlinkSync(f.path); } catch {}
    }
    res.status(result.failed > 0 ? 207 : 201).json(result);
  }),
);

router.post(
  '/events/:id/cards/import-numbers',
  uploadCsv,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'BadRequest', message: 'CSV obrigatório' });
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const result = await importCardNumbersCsv(req.params.id, content);
    try { fs.unlinkSync(req.file.path); } catch {}
    res.json(result);
  }),
);

export default router;
