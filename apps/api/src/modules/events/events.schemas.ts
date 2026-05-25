import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2).max(160),
  nameEs: z.string().min(2).max(160),
  location: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  descriptionEs: z.string().max(2000).optional().nullable(),
  eventDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  maxCoupons: z.number().int().positive().max(100000),
  couponPrice: z.number().int().positive().default(100000),
  cardsPerCoupon: z.number().int().min(1).max(10).default(2),
  drawCount: z.number().int().min(1).max(20).default(5),
  mainPrizeValue: z.number().int().nonnegative().default(0),
  totalPrizeValue: z.number().int().nonnegative().default(0),
  draws: z.array(z.object({
    order: z.number().int().positive(),
    prizeName: z.string().min(1).max(120),
    prizeNameEs: z.string().min(1).max(120),
    prizeValue: z.number().int().nonnegative(),
  })).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const createDrawSchema = z.object({
  order: z.number().int().positive(),
  prizeName: z.string().min(1).max(120),
  prizeNameEs: z.string().min(1).max(120),
  prizeValue: z.number().int().nonnegative(),
});

export const updateDrawSchema = createDrawSchema.partial();

export const winnerSchema = z.object({
  winnerCardId: z.string().uuid(),
});

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(120),
  websiteUrl: z.string().url().optional().nullable(),
  order: z.number().int().nonnegative().default(0),
});

export const reorderSponsorsSchema = z.object({
  order: z.array(z.string().uuid()),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
