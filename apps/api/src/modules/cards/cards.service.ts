import fs from 'node:fs';
import { prisma } from '../../lib/prisma.js';
import { BadRequest, NotFound } from '../../lib/errors.js';

/**
 * Upload em massa de imagens de cartelas para um evento.
 * Cada imagem vira 1 cartão. O sistema agrupa em cupons (cardsPerCoupon).
 * Os cupons são preenchidos sequencialmente: cupons já existem (criados na criação do evento)
 * com status AVAILABLE.
 */
export async function uploadCards(eventId: string, files: Express.Multer.File[], startCardNumber?: number) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw NotFound('Evento não encontrado');
  if (files.length === 0) throw BadRequest('Nenhum arquivo enviado');

  // Determinar próximo cardNumber
  const lastCard = await prisma.card.findFirst({
    where: { coupon: { eventId } },
    orderBy: { cardNumber: 'desc' },
  });
  let nextCardNumber = startCardNumber ?? (lastCard ? lastCard.cardNumber + 1 : 1);

  // Buscar cupons ainda sem todas as cartelas atribuídas
  const couponsWithCards = await prisma.coupon.findMany({
    where: { eventId },
    orderBy: { couponNumber: 'asc' },
    include: { _count: { select: { cards: true } } },
  });

  let fileIdx = 0;
  const created: Array<{ cardId: string; cardNumber: number; couponId: string }> = [];

  for (const coupon of couponsWithCards) {
    if (fileIdx >= files.length) break;
    const missing = event.cardsPerCoupon - coupon._count.cards;
    if (missing <= 0) continue;
    for (let i = 0; i < missing && fileIdx < files.length; i++) {
      const f = files[fileIdx++];
      const url = `/uploads/cards/${f.filename}`;
      const card = await prisma.card.create({
        data: {
          couponId: coupon.id,
          cardNumber: nextCardNumber++,
          cardIndex: coupon._count.cards + i,
          imageUrl: url,
        },
      });
      created.push({ cardId: card.id, cardNumber: card.cardNumber, couponId: coupon.id });
    }
  }

  if (fileIdx < files.length) {
    // ainda sobraram arquivos — limpar do disco
    for (let i = fileIdx; i < files.length; i++) {
      try { fs.unlinkSync(files[i].path); } catch {}
    }
    return { createdCount: created.length, skippedCount: files.length - fileIdx, cards: created };
  }

  return { createdCount: created.length, skippedCount: 0, cards: created };
}

/**
 * Import CSV de números: cada linha = um cartão.
 * Formato:
 *   cardNumber,drawOrder,numbers...
 *   4657,1,2,4,9,10,20,21,22,23,24,27,30,34,43,45,49,54,56,57,58,65,66,70,75
 *   4657,2,2,4,9,10,20,21,22,23,24,27,30,34,43,46,49,54,57,58,65,66,70,75
 *   4658,1,...
 * Ou alternativa simples (1 linha por cartão com todos os sorteios em colunas separadas).
 */
export async function importCardNumbersCsv(eventId: string, csvContent: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { draws: { orderBy: { order: 'asc' } } },
  });
  if (!event) throw NotFound('Evento não encontrado');
  if (event.draws.length === 0) throw BadRequest('Cadastre os sorteios do evento antes de importar números');

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  // Detectar header
  let startIdx = 0;
  if (lines[0] && /[a-zA-Z]/.test(lines[0].split(',')[0])) startIdx = 1;

  const drawByOrder = new Map(event.draws.map((d) => [d.order, d]));
  let imported = 0;
  const errors: string[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim());
    if (parts.length < 3) { errors.push(`Linha ${i + 1}: poucos campos`); continue; }
    const cardNumber = parseInt(parts[0], 10);
    const drawOrder = parseInt(parts[1], 10);
    const numbers = parts.slice(2).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));

    if (isNaN(cardNumber) || isNaN(drawOrder) || numbers.length === 0) {
      errors.push(`Linha ${i + 1}: dados inválidos`); continue;
    }

    const card = await prisma.card.findFirst({
      where: { cardNumber, coupon: { eventId } },
    });
    if (!card) { errors.push(`Linha ${i + 1}: cartão ${cardNumber} não existe`); continue; }

    const draw = drawByOrder.get(drawOrder);
    if (!draw) { errors.push(`Linha ${i + 1}: sorteio ${drawOrder} não existe`); continue; }

    await prisma.drawNumber.upsert({
      where: { cardId_drawId: { cardId: card.id, drawId: draw.id } },
      update: { numbers },
      create: { cardId: card.id, drawId: draw.id, numbers },
    });
    imported++;
  }

  return { imported, errors };
}

/** Resumo leve das cartelas do evento (sem puxar todas as linhas). */
export async function getEventCardsStats(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw NotFound('Evento não encontrado');

  const [totalCards, couponsWithPdf, statusGroups] = await Promise.all([
    prisma.card.count({ where: { coupon: { eventId } } }),
    prisma.coupon.count({ where: { eventId, pdfUrl: { not: null } } }),
    prisma.coupon.groupBy({ by: ['status'], where: { eventId }, _count: true }),
  ]);

  const byStatus: Record<string, number> = { AVAILABLE: 0, RESERVED: 0, PENDING: 0, SOLD: 0 };
  for (const g of statusGroups) byStatus[g.status] = g._count;
  const totalCoupons = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const [blocked, availableForSale] = await Promise.all([
    prisma.coupon.count({ where: { eventId, status: 'AVAILABLE', locked: true } }),
    prisma.coupon.count({ where: { eventId, status: 'AVAILABLE', locked: false } }),
  ]);

  return {
    maxCoupons: event.maxCoupons,
    cardsPerCoupon: event.cardsPerCoupon,
    totalCoupons,
    couponsWithPdf,       // cupons que já têm PDF importado
    couponsWithoutPdf: totalCoupons - couponsWithPdf,
    totalCards,           // cartelas (imagens) importadas
    expectedCards: totalCoupons * event.cardsPerCoupon,
    byStatus,
    availableForSale,     // cupons livres e liberados (visíveis para compra)
    blocked,              // cupons livres porém bloqueados (aparecem como vendidos)
  };
}

export async function listEventCards(eventId: string) {
  const cards = await prisma.card.findMany({
    where: { coupon: { eventId } },
    orderBy: { cardNumber: 'asc' },
    include: {
      coupon: { select: { id: true, couponNumber: true, status: true } },
      drawNumbers: { include: { draw: { select: { order: true, prizeName: true, prizeValue: true } } } },
    },
  });
  return cards;
}
