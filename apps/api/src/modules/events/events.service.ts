import { prisma } from '../../lib/prisma.js';
import { BadRequest, NotFound } from '../../lib/errors.js';
import { emitEventUpdate } from '../../lib/io.js';
import type { CreateEventInput, UpdateEventInput } from './events.schemas.js';

export async function listActiveEvents() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    orderBy: { eventDate: 'asc' },
    include: {
      _count: { select: { coupons: { where: { status: 'SOLD' } } } },
    },
  });
  return events.map((e) => ({
    ...e,
    soldCount: e._count.coupons,
    availableCount: Math.max(0, e.maxCoupons - e._count.coupons),
  }));
}

export async function getEventDetail(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      sponsors: { orderBy: { order: 'asc' } },
      draws: { orderBy: { order: 'asc' } },
      _count: { select: { coupons: { where: { status: 'SOLD' } } } },
    },
  });
  if (!event) throw NotFound('Evento não encontrado');
  return {
    ...event,
    soldCount: event._count.coupons,
    availableCount: Math.max(0, event.maxCoupons - event._count.coupons),
  };
}

export async function listAllEventsAdmin() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          coupons: true,
          tickets: true,
          sponsors: true,
        },
      },
    },
  });
  return events;
}

export async function createEvent(input: CreateEventInput) {
  const { draws, ...eventData } = input;
  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({ data: eventData });
    if (draws && draws.length > 0) {
      await tx.draw.createMany({
        data: draws.map((d) => ({ ...d, eventId: created.id })),
      });
    }
    // pré-gera cupons no inventário (status AVAILABLE)
    const couponsData = [];
    for (let i = 1; i <= created.maxCoupons; i++) {
      couponsData.push({ eventId: created.id, couponNumber: i });
    }
    if (couponsData.length > 0) {
      await tx.coupon.createMany({ data: couponsData });
    }
    return created;
  });
  return event;
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  const exists = await prisma.event.findUnique({ where: { id } });
  if (!exists) throw NotFound('Evento não encontrado');
  const { draws: _ignore, ...data } = input;
  const updated = await prisma.event.update({ where: { id }, data });
  emitEventUpdate(id, { type: 'updated' });
  return updated;
}

export async function toggleEventActive(id: string) {
  const evt = await prisma.event.findUnique({ where: { id } });
  if (!evt) throw NotFound();
  return prisma.event.update({ where: { id }, data: { isActive: !evt.isActive } });
}

export async function setEventHero(id: string, heroImageUrl: string) {
  return prisma.event.update({ where: { id }, data: { heroImageUrl } });
}

// Draws
export async function addDraw(eventId: string, data: { order: number; prizeName: string; prizeNameEs: string; prizeValue: number }) {
  const exists = await prisma.event.findUnique({ where: { id: eventId } });
  if (!exists) throw NotFound();
  const duplicate = await prisma.draw.findUnique({ where: { eventId_order: { eventId, order: data.order } } });
  if (duplicate) throw BadRequest(`Já existe sorteio com ordem ${data.order}`);
  return prisma.draw.create({ data: { ...data, eventId } });
}

export async function updateDraw(id: string, data: Partial<{ order: number; prizeName: string; prizeNameEs: string; prizeValue: number }>) {
  const exists = await prisma.draw.findUnique({ where: { id } });
  if (!exists) throw NotFound('Sorteio não encontrado');
  return prisma.draw.update({ where: { id }, data });
}

export async function setDrawWinner(id: string, winnerCardId: string) {
  const draw = await prisma.draw.findUnique({ where: { id } });
  if (!draw) throw NotFound('Sorteio não encontrado');
  const card = await prisma.card.findUnique({ where: { id: winnerCardId }, include: { coupon: true } });
  if (!card) throw BadRequest('Cartão informado não existe');
  if (card.coupon.eventId !== draw.eventId) throw BadRequest('Cartão não pertence ao evento do sorteio');
  return prisma.draw.update({
    where: { id },
    data: { winnerCardId, drawnAt: new Date() },
  });
}

// Sponsors
export async function addSponsor(eventId: string, data: { name: string; logoUrl: string; websiteUrl?: string | null; order?: number }) {
  const exists = await prisma.event.findUnique({ where: { id: eventId } });
  if (!exists) throw NotFound();
  return prisma.sponsor.create({
    data: {
      eventId,
      name: data.name,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl ?? null,
      order: data.order ?? 0,
    },
  });
}

export async function removeSponsor(id: string) {
  return prisma.sponsor.delete({ where: { id } });
}

export async function reorderSponsors(eventId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.sponsor.update({ where: { id }, data: { order: idx, eventId } }),
    ),
  );
  return prisma.sponsor.findMany({ where: { eventId }, orderBy: { order: 'asc' } });
}
