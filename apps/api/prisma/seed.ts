import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@catedralkatuete.org';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';
  const adminCedula = process.env.ADMIN_CEDULA ?? '0000000';
  const adminPhone = process.env.ADMIN_PHONE ?? '+595981000000';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✔ Admin already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: adminName,
        cedula: adminCedula,
        phone: adminPhone,
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin created: ${adminEmail} / (senha em ADMIN_PASSWORD)`);
  }

  // Evento de exemplo só em dev
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_EXAMPLE_EVENT === 'true') {
    const existingEvent = await prisma.event.findFirst({ where: { name: 'Bingo Millonario de Demonstração' } });
    if (!existingEvent) {
      const event = await prisma.event.create({
        data: {
          name: 'Bingo Millonario de Demonstração',
          nameEs: 'Bingo Millonario de Demostración',
          location: 'Salão Paroquial de Katueté',
          description: 'Evento de demonstração',
          descriptionEs: 'Evento de demostración',
          eventDate: new Date('2026-11-08T23:00:00Z'),
          startTime: '20:00',
          maxCoupons: 100,
          couponPrice: 100000,
          cardsPerCoupon: 2,
          drawCount: 5,
          mainPrizeValue: 200_000_000,
          totalPrizeValue: 450_000_000,
        },
      });
      await prisma.draw.createMany({
        data: [
          { eventId: event.id, order: 1, prizeName: '1º Prêmio', prizeNameEs: '1er Premio', prizeValue: 30_000_000 },
          { eventId: event.id, order: 2, prizeName: '2º Prêmio', prizeNameEs: '2do Premio', prizeValue: 50_000_000 },
          { eventId: event.id, order: 3, prizeName: '3º Prêmio', prizeNameEs: '3er Premio', prizeValue: 70_000_000 },
          { eventId: event.id, order: 4, prizeName: '4º Prêmio', prizeNameEs: '4to Premio', prizeValue: 100_000_000 },
          { eventId: event.id, order: 5, prizeName: 'Prêmio Final', prizeNameEs: 'Premio Final', prizeValue: 200_000_000 },
        ],
      });
      const coupons = [];
      for (let i = 1; i <= 100; i++) coupons.push({ eventId: event.id, couponNumber: i });
      await prisma.coupon.createMany({ data: coupons });
      console.log(`✅ Demo event created with 100 coupons`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
