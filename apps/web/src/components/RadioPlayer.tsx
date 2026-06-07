import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useRadioStore } from '@/store/radio';

/**
 * Player flutuante persistente. Fica no Layout (fora do <Outlet/>),
 * então NÃO para ao navegar entre páginas. Um único <audio>.
 */
export function RadioPlayer() {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const config = useRadioStore((s) => s.config);
  const nowPlaying = useRadioStore((s) => s.nowPlaying);
  const isPlaying = useRadioStore((s) => s.isPlaying);
  const volume = useRadioStore((s) => s.volume);
  const muted = useRadioStore((s) => s.muted);
  const setConfig = useRadioStore((s) => s.setConfig);
  const setNowPlaying = useRadioStore((s) => s.setNowPlaying);
  const toggle = useRadioStore((s) => s.toggle);
  const setVolume = useRadioStore((s) => s.setVolume);
  const pause = useRadioStore((s) => s.pause);

  // Carrega a config uma vez.
  useEffect(() => {
    api
      .get('/radio')
      .then((r) => setConfig(r.data?.config ?? null))
      .catch(() => setConfig(null));
  }, [setConfig]);

  const enabled = Boolean(config?.isEnabled && config?.streamUrl);

  // Polling do "tocando agora" (só quando a rádio está ativa).
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const tick = () =>
      api
        .get('/radio/now-playing')
        .then((r) => alive && setNowPlaying(r.data?.nowPlaying ?? null))
        .catch(() => {});
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled, setNowPlaying]);

  // Controla o elemento de áudio.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => pause()); // se o navegador bloquear, volta pra pausado
    } else {
      el.pause();
    }
  }, [isPlaying, pause]);

  if (!enabled) return null;

  const station = config?.stationName || 'Rádio';
  const songLine =
    nowPlaying?.title || nowPlaying?.artist
      ? [nowPlaying?.artist, nowPlaying?.title].filter(Boolean).join(' — ')
      : t('radio.live');
  const cover = nowPlaying?.art || config?.coverImageUrl || null;

  return (
    <>
      {/* Stream: preload none, sem controles nativos */}
      <audio ref={audioRef} src={config!.streamUrl!} preload="none" />

      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-20px)] max-w-[560px]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
          style={{
            background: 'rgba(12,15,22,.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(230,184,54,.35)',
            boxShadow: '0 16px 40px -12px rgba(0,0,0,.6)',
          }}
        >
          {/* Play / pause */}
          <button
            onClick={toggle}
            aria-label={isPlaying ? t('radio.pause') : t('radio.play')}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#3a2a06] transition hover:scale-105"
            style={{ background: 'linear-gradient(180deg,#f5cb4f,#e3ae28)' }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Capa */}
          {cover && (
            <img src={cover} alt="" className="shrink-0 w-11 h-11 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,.12)' }} />
          )}

          {/* Texto */}
          <Link to="/radio" className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[.18em] text-gold-400 uppercase truncate">{station}</span>
            </div>
            <div className="text-[12.5px] text-white/90 font-medium truncate">{songLine}</div>
          </Link>

          {/* Volume (desktop) */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={t('radio.volume')}
            className="hidden sm:block w-20 accent-gold-500"
          />
        </div>
      </div>
    </>
  );
}
