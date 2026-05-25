import { prisma } from '../../lib/prisma.js';

export async function getDashboard() {
  const [totalSold, totalPending, totalCancelled, maxAgg, revAgg, recentTx, salesByDay] = await Promise.all([
    prisma.ticket.count({ where: { status: 'PAID' } }),
    prisma.ticket.count({ where: { status: 'PENDING' } }),
    prisma.ticket.count({ where: { status: 'CANCELLED' } }),
    prisma.event.aggregate({ _sum: { maxCoupons: true }, where: { isActive: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'CONFIRMED' } }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
        ticket: { include: { event: { select: { name: true } } } },
      },
    }),
    prisma.$queryRaw<Array<{ date: Date; count: bigint; revenue: bigint }>>`
      SELECT DATE_TRUNC('day', "confirmedAt") AS date,
             COUNT(*)::bigint AS count,
             COALESCE(SUM(amount), 0)::bigint AS revenue
      FROM "Payment"
      WHERE status = 'CONFIRMED'
        AND "confirmedAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "confirmedAt")
      ORDER BY date ASC
    `,
  ]);

  return {
    totalSold,
    totalRevenue: Number(revAgg._sum.amount ?? 0),
    totalPending,
    totalCancelled,
    totalAvailable: Math.max(0, (maxAgg._sum.maxCoupons ?? 0) - totalSold),
    recentTransactions: recentTx.map((p) => ({
      id: p.id,
      userName: p.user.name,
      eventName: p.ticket.event.name,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    salesByDay: salesByDay.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      count: Number(d.count),
      revenue: Number(d.revenue),
    })),
  };
}
