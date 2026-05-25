import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export interface PaymentFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  eventId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listPayments(filters: PaymentFilters) {
  const where: Prisma.PaymentWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.userId) where.userId = filters.userId;
  if (filters.eventId) where.ticket = { eventId: filters.eventId };
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, cedula: true, phone: true } },
      ticket: { include: { event: { select: { id: true, name: true } }, coupons: { select: { couponNumber: true } } } },
    },
  });
}

export async function listAdminTickets(filters: PaymentFilters & { ticketStatus?: 'PENDING' | 'PAID' | 'CANCELLED' }) {
  const where: Prisma.TicketWhereInput = {};
  if (filters.ticketStatus) where.status = filters.ticketStatus;
  if (filters.userId) where.userId = filters.userId;
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, cedula: true, phone: true } },
      event: { select: { id: true, name: true } },
      payment: true,
      coupons: { select: { id: true, couponNumber: true } },
    },
  });
}
