import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, NotFound } from '../../lib/errors.js';
import { env } from '../../config/env.js';
import { emitCouponUpdate, emitCouponsRefresh } from '../../lib/io.js';

const TTL_MS = env.RESERVATION_TTL_MINUTES * 60 * 1000;

export async function getCouponPreview(couponId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      cards: {
        orderBy: { cardIndex: 'asc' },
        include: {
          drawNumbers: {
            include: { draw: { select: { order: true, prizeName: true, prizeValue: true } } },
          },
        },
      },
    },
  });
  if (!coupon) throw NotFound('Cupom não encontrado');
  return {
    id: coupon.id,
    couponNumber: coupon.couponNumber,
    status: coupon.status,
    cards: coupon.cards.map((c) => ({
      id: c.id,
      cardNumber: c.cardNumber,
      imageUrl: c.imageUrl,
      drawNumbers: c.drawNumbers
        .map((dn) => ({ drawOrder: dn.draw.order, prizeName: dn.draw.prizeName, prizeValue: dn.draw.prizeValue, numbers: dn.numbers }))
        .sort((a, b) => a.drawOrder - b.drawOrder),
    })),
  };
}

export async function listCouponsForEvent(eventId: string) {
  // Limpa reservas expiradas em silêncio
  await releaseExpiredReservations(eventId);

  const coupons = await prisma.coupon.findMany({
    where: { eventId },
    orderBy: { couponNumber: 'asc' },
    include: {
      cards: { select: { cardNumber: true }, orderBy: { cardIndex: 'asc' } },
    },
  });
  return coupons.map((c) => ({
    id: c.id,
    couponNumber: c.couponNumber,
    // Cupom bloqueado (vitrine) aparece como VENDIDO — o público não distingue de venda real
    status: c.locked ? 'SOLD' : c.status,
    cardNumbers: c.cards.map((card) => card.cardNumber),
    // Devolve a sessionId que reservou (não o userId) para o cliente saber se é "dele"
    reservedBy: c.locked ? null : c.reservedSessionId,
  }));
}

export async function reserveCoupon(eventId: string, couponId: string, sessionId: string, userId?: string) {
  await releaseExpiredReservations(eventId);

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw NotFound('Cupom não encontrado');
  if (coupon.eventId !== eventId) throw BadRequest('Cupom não pertence ao evento');
  if (coupon.locked) throw Conflict('Cartela não disponível');
  if (coupon.status === 'SOLD') throw Conflict('Cupom já vendido');
  if (coupon.status === 'PENDING') throw Conflict('Cupom em processo de pagamento');
  if (coupon.status === 'RESERVED' && coupon.reservedSessionId !== sessionId) {
    throw Conflict('Cupom reservado por outro usuário');
  }

  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data: {
      status: 'RESERVED',
      reservedAt: new Date(),
      reservedBy: userId ?? null,
      reservedSessionId: sessionId,
    },
  });
  emitCouponUpdate(eventId, {
    eventId,
    couponId,
    status: 'RESERVED',
    reservedBy: sessionId,
  });
  return updated;
}

export async function releaseCoupon(eventId: string, couponId: string, sessionId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon || coupon.eventId !== eventId) return;
  if (coupon.status !== 'RESERVED') return;
  if (coupon.reservedSessionId !== sessionId) return;
  await prisma.coupon.update({
    where: { id: couponId },
    data: { status: 'AVAILABLE', reservedAt: null, reservedBy: null, reservedSessionId: null },
  });
  emitCouponUpdate(eventId, { eventId, couponId, status: 'AVAILABLE' });
}

/**
 * Controle de vitrine: define quantos cupons ficam DISPONÍVEIS para venda.
 * O restante dos cupons livres é "bloqueado" (aparece como vendido ao público),
 * escolhidos aleatoriamente para o efeito de vendas espalhadas / senso de urgência.
 * Nunca mexe em cupons com venda/reserva real (RESERVED/PENDING/SOLD).
 */
export async function setCouponAvailability(eventId: string, available: number) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw NotFound('Evento não encontrado');

  await releaseExpiredReservations(eventId);

  // Só cupons "livres" (status AVAILABLE) podem alternar entre liberado/bloqueado
  const free = await prisma.coupon.findMany({
    where: { eventId, status: 'AVAILABLE' },
    select: { id: true, locked: true },
  });
  const target = Math.max(0, Math.min(available, free.length));

  const unlocked = free.filter((c) => !c.locked);
  const locked = free.filter((c) => c.locked);

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  if (unlocked.length > target) {
    // bloquear o excedente (aleatório)
    const toLock = shuffle(unlocked).slice(0, unlocked.length - target).map((c) => c.id);
    await prisma.coupon.updateMany({ where: { id: { in: toLock } }, data: { locked: true } });
  } else if (unlocked.length < target) {
    // liberar mais (aleatório entre os bloqueados)
    const toUnlock = shuffle(locked).slice(0, target - unlocked.length).map((c) => c.id);
    await prisma.coupon.updateMany({ where: { id: { in: toUnlock } }, data: { locked: false } });
  }

  emitCouponsRefresh(eventId);
  return getAvailabilitySummary(eventId);
}

export async function getAvailabilitySummary(eventId: string) {
  const [availableForSale, blocked, reserved, pending, sold] = await Promise.all([
    prisma.coupon.count({ where: { eventId, status: 'AVAILABLE', locked: false } }),
    prisma.coupon.count({ where: { eventId, status: 'AVAILABLE', locked: true } }),
    prisma.coupon.count({ where: { eventId, status: 'RESERVED' } }),
    prisma.coupon.count({ where: { eventId, status: 'PENDING' } }),
    prisma.coupon.count({ where: { eventId, status: 'SOLD' } }),
  ]);
  return { availableForSale, blocked, reserved, pending, sold };
}

async function releaseExpiredReservations(eventId: string) {
  const expired = await prisma.coupon.findMany({
    where: {
      eventId,
      status: 'RESERVED',
      reservedAt: { lt: new Date(Date.now() - TTL_MS) },
    },
    select: { id: true },
  });
  if (expired.length === 0) return;
  await prisma.coupon.updateMany({
    where: { id: { in: expired.map((e) => e.id) } },
    data: { status: 'AVAILABLE', reservedAt: null, reservedBy: null, reservedSessionId: null },
  });
  for (const e of expired) {
    emitCouponUpdate(eventId, { eventId, couponId: e.id, status: 'AVAILABLE' });
  }
}
