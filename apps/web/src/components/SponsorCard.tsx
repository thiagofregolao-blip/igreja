interface SponsorData {
  name: string;
  /** opcional: ícone SVG personalizado, senão usa a inicial */
  icon?: 'leaf' | 'tractor' | 'shield' | 'star' | 'bolt' | 'circle';
}

/**
 * 22 marcas reais visíveis no verso do bingo Millonario.
 * Mantém ordem de relevância visual.
 */
export const SPONSORS: SponsorData[] = [
  { name: 'AGRIDESA',         icon: 'leaf' },
  { name: 'STARA',            icon: 'tractor' },
  { name: 'JOHN DEERE KUROSU',icon: 'tractor' },
  { name: 'SOMAX',            icon: 'circle' },
  { name: 'ADM',              icon: 'star' },
  { name: 'CORTEVA',          icon: 'leaf' },
  { name: 'C.VALE',           icon: 'circle' },
  { name: 'MATRISOJA',        icon: 'leaf' },
  { name: 'TIMAC AGRO',       icon: 'leaf' },
  { name: 'GLYMAX',           icon: 'bolt' },
  { name: 'CIABAY',           icon: 'leaf' },
  { name: 'AGROTEC',          icon: 'leaf' },
  { name: 'TECNOMYL',         icon: 'shield' },
  { name: 'OVETRIL',          icon: 'circle' },
  { name: 'ANDROPAR',         icon: 'bolt' },
  { name: 'IASA',             icon: 'circle' },
  { name: 'DEKALPAR',         icon: 'shield' },
  { name: 'SANCOR SEGUROS',   icon: 'shield' },
  { name: 'RAINBOW',          icon: 'star' },
  { name: 'COTRIPAR',         icon: 'circle' },
  { name: 'SIMBIOSE',         icon: 'leaf' },
  { name: 'VACCARO',          icon: 'shield' },
];

const ICONS: Record<NonNullable<SponsorData['icon']>, JSX.Element> = {
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13c0-3.86 3.14-7 7-7h7v7a7 7 0 0 1-7 7z" />
      <path d="M11 13 4 20" />
    </svg>
  ),
  tractor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M3 17h2M9 17h6" />
      <path d="M5 14V8h7l3 6" />
      <path d="M15 14h6" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9 12 2" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

export function SponsorCard({ sponsor, size = 'md' }: { sponsor: SponsorData; size?: 'sm' | 'md' }) {
  const isSmall = size === 'sm';
  return (
    <div
      className="shrink-0 relative rounded-2xl flex flex-col items-center justify-center text-center magnetic group"
      style={{
        width: isSmall ? 130 : 160,
        height: isSmall ? 110 : 140,
        background: 'linear-gradient(180deg,#1c2030 0%, #0c0e14 100%)',
        border: '1px solid rgba(230,184,54,.25)',
        padding: '14px 12px',
        boxShadow: '0 10px 24px -10px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)',
        transition: 'box-shadow .3s, transform .3s',
      }}
    >
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: '0 0 0 1px rgba(230,184,54,.55), 0 18px 36px -10px rgba(230,184,54,.45), inset 0 0 60px rgba(230,184,54,.08)' }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-gold-500 mb-2"
        style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.3)' }}
      >
        <div className="w-5 h-5">{ICONS[sponsor.icon ?? 'circle']}</div>
      </div>
      <p
        className="font-display text-white leading-tight tracking-wider px-1"
        style={{ fontSize: isSmall ? 11 : 12, letterSpacing: '.06em' }}
      >
        {sponsor.name}
      </p>
      <div
        className="mt-2 h-px rounded-sm"
        style={{ width: 28, background: 'linear-gradient(90deg,transparent, #e6b836, transparent)' }}
      />
      <p className="text-white/40 text-[8.5px] tracking-[.24em] uppercase mt-1.5 font-bold">
        Auspiciante
      </p>
    </div>
  );
}

/**
 * Marquee horizontal de patrocinadores — rolagem automática infinita.
 * Duplicamos a lista para que ao chegar no fim do primeiro grupo, o segundo
 * já esteja visível e a animação possa reiniciar sem corte.
 * Pausa no hover para o usuário ler com calma.
 */
export function SponsorsRow({ size = 'md', speedSeconds = 50 }: { size?: 'sm' | 'md'; speedSeconds?: number }) {
  return (
    <div className="sponsors-marquee relative overflow-hidden">
      <div
        className="sponsors-marquee-track flex items-center gap-3 w-max"
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {[...SPONSORS, ...SPONSORS].map((s, idx) => (
          <SponsorCard key={`${s.name}-${idx}`} sponsor={s} size={size} />
        ))}
      </div>
      {/* fade nas bordas para visual mais limpo */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10"
           style={{ background: 'linear-gradient(90deg, #0d0f15 0%, transparent 100%)' }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10"
           style={{ background: 'linear-gradient(270deg, #0d0f15 0%, transparent 100%)' }} />
    </div>
  );
}
