import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { listActiveBanners } from './banners.service.js';

const router = Router();

/** Banners ativos para o carrossel do hero (público). */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const banners = await listActiveBanners();
    res.json({ banners });
  }),
);

export default router;
