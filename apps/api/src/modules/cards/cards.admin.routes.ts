import fs from 'node:fs';
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { uploadCardImages, uploadCsv } from '../../middleware/upload.js';
import { importCardNumbersCsv, listEventCards, uploadCards } from './cards.service.js';

const router = Router();
router.use(authRequired, requireAdmin);

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
