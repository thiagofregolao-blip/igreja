import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { publicUrl, uploadRadioCover } from '../../middleware/upload.js';
import { getConfig, updateConfig } from './radio.service.js';

const router = Router();
router.use(authRequired, requireAdmin);

/** Config completa (admin). */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const config = await getConfig();
    res.json({ config });
  }),
);

const emptyToNull = (v: unknown) => (v === '' ? null : v);
const updateSchema = z.object({
  streamUrl: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  nowPlayingUrl: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  stationName: z.preprocess(emptyToNull, z.string().max(120).nullable().optional()),
  isEnabled: z.boolean().optional(),
});

router.patch(
  '/',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const config = await updateConfig(req.body);
    res.json({ config });
  }),
);

/** Upload da capa da rádio. */
router.post(
  '/cover',
  uploadRadioCover,
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'BadRequest', message: 'Imagem obrigatória' });
    const config = await updateConfig({ coverImageUrl: publicUrl(file.path) });
    res.json({ config });
  }),
);

export default router;
