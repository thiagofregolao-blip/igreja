import { prisma } from '../../lib/prisma.js';
import { BadRequest, Conflict, Forbidden, NotFound } from '../../lib/errors.js';
import { emitCouponUpdate } from '../../lib/io.js';
import { sendPendingPaymentEmail, sendTicketConfirmationEmail } from '../integrations/email.service.js';
import { sendTicketWhatsApp } from '../integrations/whatsapp.service.js';
import { generateTicketPdf } from '../integrations/pdf.service.js';
import type { CheckoutInput } from './tickets.schemas.js';

export async function createTicketFromCheckout(input: CheckoutInput, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) throw NotFound('Evento não encontrado');
  if (!event.isActive) throw BadRequest('Evento inativo');

  // Buscar cupons
  const coupons = await prisma.coupon.findMany({
    where: { id: { in: input.couponIds } },
  });
  if (coupons.length !== input.couponIds.length) throw NotFound('Cupom não encontrado');

  // Validar que pertencem ao evento + status compatível com checkout
  for (const c of coupons) {
    if (c.eventId !== input.eventId) throw BadRequest('Cupom não pertence ao evento');
    if (c.locked) throw Conflict(`Cartela ${c.couponNumber} não está disponível`);
    if (c.status === 'SOLD') throw Conflict(`Cupom ${c.couponNumber} já vendido`);
    if (c.status === 'PENDING') throw Conflict(`Cupom ${c.couponNumber} em outro processo de pagamento`);
    if (c.status === 'RESERVED' && c.reservedSessionId !== input.sessionId) {
      throw Conflict(`Cupom ${c.couponNumber} reservado por outro usuário`);
    }
  }

  // Calcular ticketNumber (sequencial por evento)
  const lastTicket = await prisma.ticket.findFirst({
    where: { eventId: input.eventId },
    orderBy: { ticketNumber: 'desc' },
  });
  const nextNumber = (lastTicket?.ticketNumber ?? 0) + 1;
  const totalAmount = coupons.length * event.couponPrice;

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        eventId: input.eventId,
        userId,
        ticketNumber: nextNumber,
        status: 'PENDING',
        totalAmount,
      },
    });

    // Claim atômico: só entra na compra cupom livre ou reservado POR ESTA sessão.
    // Se alguém reservou/comprou no meio do caminho, o count não bate e tudo é revertido.
    const claimed = await tx.coupon.updateMany({
      where: {
        id: { in: input.couponIds },
        eventId: input.eventId,
        locked: false,
        OR: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedSessionId: input.sessionId },
        ],
      },
      data: { ticketId: ticket.id, status: 'PENDING' },
    });
    if (claimed.count !== input.couponIds.length) {
      throw Conflict('Uma ou mais cartelas não estão mais disponíveis. Revise seu carrinho.');
    }

    const payment = await tx.payment.create({
      data: {
        ticketId: ticket.id,
        userId,
        method: input.paymentMethod,
        amount: totalAmount,
        status: 'PENDING',
      },
    });
    return { ticket, payment };
  });

  // Notificar Socket.io
  for (const c of coupons) {
    emitCouponUpdate(input.eventId, { eventId: input.eventId, couponId: c.id, status: 'PENDING' });
  }

  // Email PENDING
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    sendPendingPaymentEmail(user.email, user.name, nextNumber, totalAmount, user.preferredLanguage as 'pt' | 'es')
      .catch((e) => console.error(e));
  }

  return result;
}

export async function uploadReceiptForTicket(ticketId: string, userId: string, receiptUrl: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { payment: true } });
  if (!ticket) throw NotFound('Bilhete não encontrado');
  if (ticket.userId !== userId) throw Forbidden();
  if (ticket.status !== 'PENDING') throw BadRequest('Bilhete não está pendente');
  if (!ticket.payment) throw BadRequest('Pagamento não inicializado');

  return prisma.payment.update({
    where: { id: ticket.payment.id },
    data: { receiptUrl },
  });
}

export async function listMyTickets(userId: string) {
  return prisma.ticket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      event: { select: { id: true, name: true, nameEs: true, eventDate: true, location: true, startTime: true } },
      coupons: {
        include: {
          cards: {
            include: {
              drawNumbers: { include: { draw: { select: { order: true, prizeName: true, prizeNameEs: true, prizeValue: true } } } },
            },
          },
        },
      },
      payment: true,
    },
  });
}

export async function getMyTicketDetail(ticketId: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: { include: { sponsors: { orderBy: { order: 'asc' } } } },
      coupons: {
        include: {
          cards: {
            include: {
              drawNumbers: { include: { draw: true } },
            },
            orderBy: { cardIndex: 'asc' },
          },
        },
        orderBy: { couponNumber: 'asc' },
      },
      payment: true,
    },
  });
  if (!ticket) throw NotFound('Bilhete não encontrado');
  if (ticket.userId !== userId) throw Forbidden();
  return ticket;
}

export async function confirmPayment(paymentId: string, adminId: string, notes?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { ticket: { include: { coupons: true, event: { include: { sponsors: { orderBy: { order: 'asc' } } } } } }, user: true },
  });
  if (!payment) throw NotFound('Pagamento não encontrado');
  if (payment.status === 'CONFIRMED') throw BadRequest('Pagamento já confirmado');

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedBy: adminId, notes },
    });
    await tx.ticket.update({
      where: { id: payment.ticketId },
      data: { status: 'PAID', paidAt: new Date() },
    });
    await tx.coupon.updateMany({
      where: { ticketId: payment.ticketId },
      data: { status: 'SOLD' },
    });
  });

  // Socket.io
  for (const c of payment.ticket.coupons) {
    emitCouponUpdate(payment.ticket.eventId, { eventId: payment.ticket.eventId, couponId: c.id, status: 'SOLD' });
  }

  // Gerar PDF + enviar email + WhatsApp
  void notifyTicketConfirmed(payment.ticketId).catch((e) => console.error('[notify:error]', e));

  return prisma.payment.findUnique({ where: { id: paymentId } });
}

export async function rejectPayment(paymentId: string, adminId: string, notes: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { ticket: { include: { coupons: true } } },
  });
  if (!payment) throw NotFound();
  if (payment.status === 'CONFIRMED') throw BadRequest('Pagamento já confirmado');

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'REJECTED', notes, confirmedBy: adminId },
    });
    await tx.ticket.update({
      where: { id: payment.ticketId },
      data: { status: 'CANCELLED' },
    });
    await tx.coupon.updateMany({
      where: { ticketId: payment.ticketId },
      data: { status: 'AVAILABLE', ticketId: null, reservedAt: null, reservedBy: null, reservedSessionId: null },
    });
  });

  for (const c of payment.ticket.coupons) {
    emitCouponUpdate(payment.ticket.eventId, { eventId: payment.ticket.eventId, couponId: c.id, status: 'AVAILABLE' });
  }
  return prisma.payment.findUnique({ where: { id: paymentId } });
}

async function notifyTicketConfirmed(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: true,
      event: { include: { sponsors: { orderBy: { order: 'asc' } } } },
      coupons: {
        include: {
          cards: {
            include: { drawNumbers: { include: { draw: true } } },
            orderBy: { cardIndex: 'asc' },
          },
        },
        orderBy: { couponNumber: 'asc' },
      },
    },
  });
  if (!ticket) return;

  const pdfBuffer = await generateTicketPdf({
    ticketNumber: ticket.ticketNumber,
    userName: ticket.user.name,
    userCedula: ticket.user.cedula,
    eventName: ticket.event.name,
    eventDate: ticket.event.eventDate,
    eventLocation: ticket.event.location,
    startTime: ticket.event.startTime,
    totalAmount: ticket.totalAmount,
    coupons: ticket.coupons.map((c) => ({
      couponNumber: c.couponNumber,
      cards: c.cards.map((card) => ({
        cardNumber: card.cardNumber,
        imageUrl: card.imageUrl,
        drawNumbers: card.drawNumbers.map((dn) => ({
          drawOrder: dn.draw.order,
          prizeName: dn.draw.prizeName,
          prizeValue: dn.draw.prizeValue,
          numbers: dn.numbers,
        })).sort((a, b) => a.drawOrder - b.drawOrder),
      })),
    })),
    sponsors: ticket.event.sponsors.map((s) => ({ name: s.name, logoUrl: s.logoUrl })),
  });

  const lang = ticket.user.preferredLanguage as 'pt' | 'es';
  await Promise.allSettled([
    sendTicketConfirmationEmail(ticket.user.email, ticket.user.name, ticket.event.name, ticket.ticketNumber, pdfBuffer, lang),
    sendTicketWhatsApp(ticket.user.phone, ticket.user.name, ticket.event.name, ticket.ticketNumber, pdfBuffer, lang),
  ]);
}
