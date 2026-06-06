import { prisma } from '../../lib/prisma.js';
import { NotFound } from '../../lib/errors.js';

/** Banners ativos para o carrossel do site (ordenados). */
export function listActiveBanners() {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
}

/** Todos os banners (admin). */
export function listAllBanners() {
  return prisma.banner.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
}

export async function createBanner(data: { imageUrl: string; mobileImageUrl?: string; title?: string; linkUrl?: string }) {
  const last = await prisma.banner.findFirst({ orderBy: { order: 'desc' } });
  return prisma.banner.create({
    data: {
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl || null,
      title: data.title || null,
      linkUrl: data.linkUrl || null,
      order: (last?.order ?? -1) + 1,
    },
  });
}

export async function updateBanner(
  id: string,
  data: { title?: string; linkUrl?: string; isActive?: boolean; order?: number },
) {
  const exists = await prisma.banner.findUnique({ where: { id } });
  if (!exists) throw NotFound('Banner não encontrado');
  return prisma.banner.update({ where: { id }, data });
}

export async function removeBanner(id: string) {
  const exists = await prisma.banner.findUnique({ where: { id } });
  if (!exists) throw NotFound('Banner não encontrado');
  await prisma.banner.delete({ where: { id } });
  return { ok: true };
}

/** Reordena conforme uma lista de ids. */
export async function reorderBanners(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, idx) => prisma.banner.update({ where: { id }, data: { order: idx } })),
  );
  return listAllBanners();
}
