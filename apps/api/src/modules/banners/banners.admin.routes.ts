import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { publicUrl, uploadBanner } from '../../middleware/upload.js';
import { createBanner, listAllBanners, removeBanner, reorderBanners, updateBanner } from './banners.service.js';

const router = Router();
router.use(authRequired, requireAdmin);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const banners = await listAllBanners();
    res.json({ banners });
  }),
);

/** Cria um banner (upload da imagem + campos opcionais). */
router.post(
  '/',
  uploadBanner,
  asyncHandler(async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const desktop = files?.image?.[0];
    const mobile = files?.imageMobile?.[0];
    if (!desktop) return res.status(400).json({ error: 'BadRequest', message: 'Imagem (desktop) obrigatória' });
    const banner = await createBanner({
      imageUrl: publicUrl(desktop.path),
      mobileImageUrl: mobile ? publicUrl(mobile.path) : undefined,
      title: req.body?.title,
      linkUrl: req.body?.linkUrl,
    });
    res.status(201).json({ banner });
  }),
);

const updateSchema = z.object({
  title: z.string().max(120).optional(),
  linkUrl: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const banner = await updateBanner(req.params.id, req.body);
    res.json({ banner });
  }),
);

router.post(
  '/reorder',
  validate(z.object({ ids: z.array(z.string()).min(1) })),
  asyncHandler(async (req, res) => {
    const banners = await reorderBanners(req.body.ids);
    res.json({ banners });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await removeBanner(req.params.id);
    res.json(result);
  }),
);

export default router;
