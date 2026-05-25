import { prisma } from '../../lib/prisma.js';
import { NotFound } from '../../lib/errors.js';

export async function listCustomers() {
  return prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { tickets: true } },
    },
  });
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tickets: {
        orderBy: { createdAt: 'desc' },
        include: {
          event: { select: { name: true } },
          payment: true,
          coupons: { select: { couponNumber: true } },
        },
      },
    },
  });
  if (!user) throw NotFound('Cliente não encontrado');
  return user;
}

export async function toggleBlock(id: string) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw NotFound();
  return prisma.user.update({ where: { id }, data: { isBlocked: !u.isBlocked } });
}
