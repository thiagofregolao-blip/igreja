import { useTranslation } from 'react-i18next';
import { useRadioStore } from '@/store/radio';

export default function Radio() {
  const { t } = useTranslation();
  const config = useRadioStore((s) => s.config);
  const nowPlaying = useRadioStore((s) => s.nowPlaying);
  const isPlaying = useRadioStore((s) => s.isPlaying);
  const toggle = useRadioStore((s) => s.toggle);

  const enabled = Boolean(config?.isEnabled && config?.streamUrl);
  const station = config?.stationName || 'Rádio Catedral';
  const cover = nowPlaying?.art || config?.coverImageUrl || null;

  return (
    <div className="max-w-[760px] mx-auto px-5 py-12 md:py-20">
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold tracking-[.28em] text-gold-700 uppercase">{t('radio.eyebrow')}</p>
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-ink-900 mt-2">{t('radio.title')}</h1>
      </div>

      {!enabled ? (
        <div className="card-dark text-center py-16 px-6">
          <div className="text-5xl mb-4">📻</div>
          <p className="text-white/80 text-lg">{t('radio.offline')}</p>
          <p className="text-white/50 text-sm mt-2">{t('radio.offlineHint')}</p>
        </div>
      ) : (
        <div className="card-dark px-6 py-10 md:px-12 md:py-12 text-center">
          {/* Capa */}
          <div className="mx-auto w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(230,184,54,.3)', boxShadow: '0 24px 60px -20px rgba(0,0,0,.6)' }}>
            {cover ? (
              <img src={cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-ink-700">📻</div>
            )}
          </div>

          {/* Estação + ao vivo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[.22em] text-gold-400 uppercase">{station} · {t('radio.live')}</span>
          </div>

          {/* Tocando agora */}
          <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight min-h-[2em]">
            {nowPlaying?.title || nowPlaying?.artist
              ? [nowPlaying?.artist, nowPlaying?.title].filter(Boolean).join(' — ')
              : t('radio.nowPlayingUnknown')}
          </h2>
          {typeof nowPlaying?.listeners === 'number' && (
            <p className="text-white/50 text-sm mt-2">
              {t('radio.listeners', { count: nowPlaying.listeners })}
            </p>
          )}

          {/* Botão grande */}
          <button onClick={toggle} className="btn-gold mt-8 inline-flex items-center gap-2.5 !px-8 !py-3.5">
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                {t('radio.pause')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                {t('radio.play')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
