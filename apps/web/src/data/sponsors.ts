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

/** Cota OURO — grade de logos em destaque. */
export const GOLD_SPONSORS: TierSponsor[] = [
  { name: 'AGRIDESA' },
  { name: 'STARA' },
  { name: 'JOHN DEERE KUROSU' },
  { name: 'CORTEVA' },
  { name: 'ADM' },
  { name: 'C.VALE' },
  { name: 'MATRISOJA' },
  { name: 'TIMAC AGRO' },
];

/** APOIADORES — faixa rolando (marquee). */
export const SUPPORTER_SPONSORS: TierSponsor[] = [
  { name: 'GLYMAX' },
  { name: 'CIABAY' },
  { name: 'TECNOMYL' },
  { name: 'OVETRIL' },
  { name: 'ANDROPAR' },
  { name: 'IASA' },
  { name: 'DEKALPAR' },
  { name: 'SANCOR SEGUROS' },
  { name: 'RAINBOW' },
  { name: 'COTRIPAR' },
  { name: 'SIMBIOSE' },
  { name: 'VACCARO' },
];
