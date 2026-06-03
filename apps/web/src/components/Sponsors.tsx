import { Link } from 'react-router-dom';
import { GOLD_SPONSORS, SUPPORTER_SPONSORS, type TierSponsor } from '@/data/sponsors';

export function Sponsors({ isEs }: { isEs: boolean }) {
  return (
    <section id="patrocinadores" className="card-dark rounded-[28px] text-white mt-7" style={{ padding: '36px 28px 40px' }}>
      {/* head */}
      <div className="text-center mb-2">
        <div className="text-[10px] tracking-[.32em] uppercase font-heavy text-gold-500">
          ★ {isEs ? 'Quienes lo hacen posible' : 'Quem torna isso possível'}
        </div>
        <h2 className="font-display text-[22px] sm:text-[26px] mt-1.5 text-white">
          {isEs ? 'Nuestros Patrocinadores' : 'Nossos Patrocinadores'}
        </h2>
        <p className="text-white/55 text-[12.5px] max-w-[460px] mx-auto mt-2 leading-relaxed">
          {isEs
            ? 'Empresas del agronegocio que apoyan la Capilla y la Fiesta del Bingo.'
            : 'Empresas do agronegócio que apoiam a Capela e a Festa do Bingo.'}
        </p>
      </div>

      {/* COTA OURO */}
      <Tier label={isEs ? 'Cota Oro' : 'Cota Ouro'} variant="gold" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 max-w-[980px] mx-auto">
        {GOLD_SPONSORS.map((s) => (
          <GoldCard key={s.name} sponsor={s} isEs={isEs} />
        ))}
      </div>

      {/* APOIADORES */}
      <Tier label={isEs ? 'Auspiciantes' : 'Apoiadores'} variant="silver" />
      <div
        className="max-w-[980px] mx-auto overflow-hidden sponsors-marquee"
        style={{ WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)' }}
      >
        <div className="flex items-center gap-2.5 w-max sponsors-marquee-track" style={{ animationDuration: '32s' }}>
          {[...SUPPORTER_SPONSORS, ...SUPPORTER_SPONSORS].map((s, i) => (
            <span
              key={`${s.name}-${i}`}
              className="shrink-0 h-[44px] px-4 rounded-[10px] flex items-center font-heavy text-[11px] tracking-[.05em] text-[#e7e3da] whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="max-w-[560px] mx-auto mt-7 rounded-[16px] text-center"
        style={{ padding: 18, background: 'linear-gradient(180deg,#14171f,#0d0f15)', border: '1px dashed rgba(230,184,54,.4)' }}
      >
        <b className="font-display text-[15px] block mb-1 text-white">{isEs ? 'Tu marca aquí ✦' : 'Sua marca aqui ✦'}</b>
        <span className="text-white/55 text-[11.5px]">
          {isEs
            ? 'Sé patrocinador de la Fiesta del Bingo y aparece para miles de personas.'
            : 'Seja patrocinador da Festa do Bingo e apareça para milhares de pessoas.'}
        </span>
        <div className="mt-3">
          <Link
            to="/events"
            className="inline-block rounded-[10px] font-extrabold text-[11px] tracking-[.1em] text-[#231a06]"
            style={{ padding: '9px 18px', background: 'linear-gradient(180deg,#f5cb4f 0%,#e3ae28 100%)' }}
          >
            {isEs ? 'QUIERO PATROCINAR' : 'QUERO PATROCINAR'}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Tier({ label, variant }: { label: string; variant: 'gold' | 'silver' }) {
  const bg =
    variant === 'gold'
      ? 'linear-gradient(180deg,#f5cb4f 0%,#e3ae28 100%)'
      : 'linear-gradient(180deg,#e9edf2,#c3c9d2)';
  const color = variant === 'gold' ? '#231a06' : '#1a1d23';
  return (
    <div className="flex items-center gap-2.5 max-w-[980px] mx-auto my-6">
      <div className="flex-1 h-px bg-white/10" />
      <div className="text-[10px] font-heavy tracking-[.24em] uppercase rounded-full" style={{ padding: '5px 12px', background: bg, color }}>
        {label}
      </div>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function GoldCard({ sponsor, isEs }: { sponsor: TierSponsor; isEs: boolean }) {
  return (
    <div
      className="rounded-[16px] flex flex-col items-center text-center magnetic"
      style={{
        padding: '16px 12px',
        background: 'linear-gradient(180deg,#1c2030,#0c0e14)',
        border: '1px solid rgba(230,184,54,.22)',
        boxShadow: '0 10px 24px -12px rgba(0,0,0,.5)',
      }}
    >
      <div
        className="w-full h-[56px] rounded-[10px] flex items-center justify-center font-heavy text-[#16130c] text-[14px] sm:text-[15px] mb-2.5 px-2 text-center leading-tight"
        style={{ background: 'linear-gradient(180deg,#f7f3ea,#e7e0cf)' }}
      >
        {sponsor.logo ? (
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-[40px] max-w-full object-contain" />
        ) : (
          sponsor.name
        )}
      </div>
      <div className="font-bold text-[11px] tracking-[.05em] text-white">{sponsor.name}</div>
      <div className="text-[8px] tracking-[.22em] uppercase text-white/40 font-bold mt-1.5">{isEs ? 'Oro' : 'Ouro'}</div>
    </div>
  );
}
