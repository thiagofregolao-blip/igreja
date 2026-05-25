import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authRequired, requireAdmin } from '../../middleware/auth.js';
import { publicUrl, uploadEventHero, uploadSponsorLogo } from '../../middleware/upload.js';
import {
  addDraw,
  addSponsor,
  createEvent,
  getEventDetail,
  listAllEventsAdmin,
  removeSponsor,
  reorderSponsors,
  setDrawWinner,
  setEventHero,
  toggleEventActive,
  updateDraw,
  updateEvent,
} from './events.service.js';
import {
  createDrawSchema,
  createEventSchema,
  createSponsorSchema,
  reorderSponsorsSchema,
  updateDrawSchema,
  updateEventSchema,
  winnerSchema,
} from './events.schemas.js';

const router = Router();
router.use(authRequired, requireAdmin);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const events = await listAllEventsAdmin();
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

router.post(
  '/',
  validate(createEventSchema),
  asyncHandler(async (req, res) => {
    const event = await createEvent(req.body);
    res.status(201).json({ event });
  }),
);

router.put(
  '/:id',
  validate(updateEventSchema),
  asyncHandler(async (req, res) => {
    const event = await updateEvent(req.params.id, req.body);
    res.json({ event });
  }),
);

router.patch(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const event = await toggleEventActive(req.params.id);
    res.json({ event });
  }),
);

router.post(
  '/:id/hero',
  uploadEventHero,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'BadRequest', message: 'Arquivo ausente' });
    const url = publicUrl(req.file.path);
    const event = await setEventHero(req.params.id, url);
    res.json({ event });
  }),
);

// Draws
router.post(
  '/:id/draws',
  validate(createDrawSchema),
  asyncHandler(async (req, res) => {
    const draw = await addDraw(req.params.id, req.body);
    res.status(201).json({ draw });
  }),
);

router.put(
  '/draws/:drawId',
  validate(updateDrawSchema),
  asyncHandler(async (req, res) => {
    const draw = await updateDraw(req.params.drawId, req.body);
    res.json({ draw });
  }),
);

router.put(
  '/draws/:drawId/winner',
  validate(winnerSchema),
  asyncHandler(async (req, res) => {
    const draw = await setDrawWinner(req.params.drawId, req.body.winnerCardId);
    res.json({ draw });
  }),
);

// Sponsors
router.post(
  '/:id/sponsors',
  uploadSponsorLogo,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'BadRequest', message: 'Logo obrigatório' });
    const parsed = createSponsorSchema.parse({
      name: req.body.name,
      websiteUrl: req.body.websiteUrl || undefined,
      order: req.body.order ? Number(req.body.order) : 0,
    });
    const sponsor = await addSponsor(req.params.id, { ...parsed, logoUrl: publicUrl(req.file.path) });
    res.status(201).json({ sponsor });
  }),
);

router.delete(
  '/sponsors/:sponsorId',
  asyncHandler(async (req, res) => {
    await removeSponsor(req.params.sponsorId);
    res.status(204).end();
  }),
);

router.put(
  '/:id/sponsors/reorder',
  validate(reorderSponsorsSchema),
  asyncHandler(async (req, res) => {
    const sponsors = await reorderSponsors(req.params.id, req.body.order);
    res.json({ sponsors });
  }),
);

export default router;
