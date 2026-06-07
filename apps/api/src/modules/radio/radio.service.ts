import { prisma } from '../../lib/prisma.js';

/**
 * WebRádio — configuração (singleton) + proxy "tocando agora".
 *
 * A transmissão é hospedada externamente (Sejahost: Shoutcast/Icecast).
 * O áudio toca direto no <audio> do site (cross-origin é permitido em mídia),
 * mas o "tocando agora" é bloqueado por CORS no navegador → este service
 * faz o proxy server-side e normaliza os formatos Shoutcast e Icecast.
 */

const SINGLETON_ID = 'singleton';

export interface RadioPublicConfig {
  streamUrl: string | null;
  stationName: string | null;
  coverImageUrl: string | null;
  isEnabled: boolean;
}

export interface NowPlaying {
  title: string | null;
  artist: string | null;
  art: string | null;
  listeners: number | null;
  isLive: boolean;
}

/** Cria (se não existir) e retorna a linha única de configuração. */
export async function getConfig() {
  const existing = await prisma.radioConfig.findFirst();
  if (existing) return existing;
  return prisma.radioConfig.create({ data: { id: SINGLETON_ID } });
}

/** Versão pública (sem a URL de status interna). */
export async function getPublicConfig(): Promise<RadioPublicConfig> {
  const c = await getConfig();
  return {
    streamUrl: c.streamUrl ?? null,
    stationName: c.stationName ?? null,
    coverImageUrl: c.coverImageUrl ?? null,
    isEnabled: c.isEnabled,
  };
}

export async function updateConfig(data: {
  streamUrl?: string | null;
  nowPlayingUrl?: string | null;
  stationName?: string | null;
  coverImageUrl?: string | null;
  isEnabled?: boolean;
}) {
  const current = await getConfig();
  return prisma.radioConfig.update({ where: { id: current.id }, data });
}

// --- "Tocando agora" com cache curto (evita martelar o servidor de stream) ---
let cache: { at: number; data: NowPlaying } | null = null;
const CACHE_MS = 10_000;

const EMPTY: NowPlaying = { title: null, artist: null, art: null, listeners: null, isLive: false };

/** Quebra "Artista - Título" quando aplicável. */
function splitSong(raw?: string | null): { artist: string | null; title: string | null } {
  if (!raw) return { artist: null, title: null };
  const s = String(raw).trim();
  if (!s) return { artist: null, title: null };
  const i = s.indexOf(' - ');
  if (i > 0) return { artist: s.slice(0, i).trim(), title: s.slice(i + 3).trim() };
  return { artist: null, title: s };
}

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza respostas de Shoutcast (v1/v2), Icecast e AzuraCast. */
function normalize(data: any): NowPlaying {
  if (!data || typeof data !== 'object') return { ...EMPTY };

  // AzuraCast: { now_playing: { song: { title, artist, art } }, listeners: { current } }
  if (data.now_playing?.song) {
    const song = data.now_playing.song;
    return {
      title: song.title ?? null,
      artist: song.artist ?? null,
      art: song.art ?? null,
      listeners: toNum(data.listeners?.current ?? data.listeners?.total),
      isLive: Boolean(data.live?.is_live),
    };
  }

  // Shoutcast v2: /stats?json=1 → { songtitle, currentlisteners, streamhitscounter... }
  if ('songtitle' in data || 'currentlisteners' in data || 'streamtitle' in data) {
    const { artist, title } = splitSong(data.songtitle ?? data.streamtitle ?? data.title);
    return {
      title,
      artist,
      art: null,
      listeners: toNum(data.currentlisteners ?? data.listeners),
      isLive: String(data.streamstatus ?? '1') !== '0',
    };
  }

  // Icecast: /status-json.xsl → { icestats: { source: {...} | [{...}] } }
  if (data.icestats) {
    let src = data.icestats.source;
    if (Array.isArray(src)) src = src[0];
    if (src) {
      const { artist, title } = splitSong(src.title ?? src.yp_currently_playing);
      return {
        title: title ?? src.server_name ?? null,
        artist: artist ?? src.artist ?? null,
        art: null,
        listeners: toNum(src.listeners),
        isLive: true,
      };
    }
  }

  return { ...EMPTY };
}

/** Busca e normaliza o "tocando agora" da URL configurada (com cache). */
export async function fetchNowPlaying(): Promise<NowPlaying> {
  const c = await getConfig();
  if (!c.isEnabled || !c.nowPlayingUrl) return { ...EMPTY };

  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.data;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(c.nowPlayingUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'catedral-bingo-radio/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Icecast às vezes responde XML/HTML; tentamos extrair o título de forma simples.
      const m = text.match(/<title>([^<]+)<\/title>/i);
      parsed = m ? { songtitle: m[1] } : {};
    }
    const data = normalize(parsed);
    cache = { at: now, data };
    return data;
  } catch {
    return { ...EMPTY };
  }
}
