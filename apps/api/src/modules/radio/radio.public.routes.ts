import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { fetchNowPlaying, getPublicConfig } from './radio.service.js';

const router = Router();

/** Config pública da rádio (para o player do site). */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const config = await getPublicConfig();
    res.json({ config });
  }),
);

/** "Tocando agora" — proxy do status Shoutcast/Icecast (resolve CORS). */
router.get(
  '/now-playing',
  asyncHandler(async (_req, res) => {
    const nowPlaying = await fetchNowPlaying();
    res.json({ nowPlaying });
  }),
);

export default router;
