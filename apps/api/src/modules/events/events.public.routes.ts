import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { getEventDetail, listActiveEvents } from './events.service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const events = await listActiveEvents();
    res.json({ events });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await getEventDetail(req.params.id);
    res.json({ event });
  }),
);

export default router;
