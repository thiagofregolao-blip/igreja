import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { getCouponPreview, listCouponsForEvent, releaseCoupon, reserveCoupon } from './coupons.service.js';

const router = Router();

router.get(
  '/events/:eventId/coupons',
  asyncHandler(async (req, res) => {
    const coupons = await listCouponsForEvent(req.params.eventId);
    res.json({ coupons });
  }),
);

router.get(
  '/coupons/:id/preview',
  asyncHandler(async (req, res) => {
    const coupon = await getCouponPreview(req.params.id);
    res.json({ coupon });
  }),
);

const reserveSchema = z.object({
  couponId: z.string().uuid(),
  sessionId: z.string().min(8).max(80),
});

router.post(
  '/events/:eventId/coupons/reserve',
  validate(reserveSchema),
  asyncHandler(async (req, res) => {
    const coupon = await reserveCoupon(req.params.eventId, req.body.couponId, req.body.sessionId);
    res.json({ coupon });
  }),
);

router.post(
  '/events/:eventId/coupons/release',
  validate(reserveSchema),
  asyncHandler(async (req, res) => {
    await releaseCoupon(req.params.eventId, req.body.couponId, req.body.sessionId);
    res.status(204).end();
  }),
);

export default router;
