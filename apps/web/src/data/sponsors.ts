/**
 * Dados de patrocinadores da home.
 *
 * FASE 1: estático aqui no front (rápido de ver no ar).
 * FASE 2: estes dados virão da API (model Sponsor já existe no Prisma —
 * basta adicionar `category` + `isActive` e expor um endpoint). O formato
 * abaixo foi pensado para mapear 1:1 com o backend depois.
 */

export interface MasterSponsor {
  name: string;
  /** Frase de efeito que aparece sobre a arte (opcional). */
  slogan?: string;
  /** Caminho da arte do banner (ideal 3:2, ex.: 1536×1024). Coloque o arquivo em /public/sponsors/. */
  image?: string;
  /** Link do patrocinador (abre em nova aba). */
  website?: string;
}

export interface TierSponsor {
  name: string;
  /** Caminho do logo (opcional). Sem logo, mostra o nome estilizado. */
  logo?: string;
  website?: string;
}

/** Patrocinadores MASTER — aparecem no bilhete dourado (carrossel) no topo. */
export const MASTER_SPONSORS: MasterSponsor[] = [
  {
    name: 'AGROTEC',
    slogan: 'Fuerza que alimenta, pasión que construye',
    image: '/sponsors/agrotec.jpg',
    website: 'https://www.agrotec.com.py',
  },
];

/** APOIADORES — grade de logos (imagens reais). */
export const APOIADORES: TierSponsor[] = [
  { name: 'Agridesa', logo: '/sponsors/agridesa.jpg' },
  { name: 'John Deere Kurosu & Cia', logo: '/sponsors/john-deere-kurosu.jpg' },
  { name: 'Matrisoja', logo: '/sponsors/matrisoja.jpg' },
  { name: 'Carga Granel S.A', logo: '/sponsors/carga-granel.jpg' },
  { name: 'Prime S.A', logo: '/sponsors/prime.jpg' },
  { name: 'Tafirel', logo: '/sponsors/tafirel.jpg' },
  { name: 'IASA', logo: '/sponsors/iasa.jpg' },
  { name: 'FIPYX', logo: '/sponsors/fipyx.jpg' },
  { name: 'Seguros Impacto', logo: '/sponsors/impacto.jpg' },
  { name: 'Básculas & Balanzas Colaco', logo: '/sponsors/colaco.jpg' },
  { name: 'Repuestos Espinola', logo: '/sponsors/espinola.jpg' },
  { name: 'Mapy', logo: '/sponsors/mapy.jpg' },
  { name: 'Supermercado Emanuel', logo: '/sponsors/emanuel.jpg' },
  { name: 'Rafaeli S.R.L', logo: '/sponsors/rafaeli.jpg' },
  { name: 'Katueté Hotel', logo: '/sponsors/katuete-hotel.jpg' },
];
