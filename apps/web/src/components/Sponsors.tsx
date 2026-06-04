import { Link } from 'react-router-dom';
import { MASTER_SPONSORS, APOIADORES, type TierSponsor } from '@/data/sponsors';

const GOLD_SOFT = 'linear-gradient(180deg,#f3c84a,#d29a1f)';

/** Co-patrocinadores que aparecem ao lado do AGROTEC (empilhados à direita). */
const CO_SPONSORS = [
  { name: 'SOMAX', image: '/sponsors/somax.jpg' },
  { name: 'AGROFÉRTIL', image: '/sponsors/agrofertil.jpg' },
];

export function Sponsors({ isEs }: { isEs: boolean }) {
  const master = MASTER_SPONSORS[0];
  const logos = APOIADORES;

  return (
    <section
      id="patrocinadores"
      className="text-center px-6 py-14 md:py-16"
      style={{ background: 'linear-gradient(180deg,#faf7f1 0%,#f3eee4 100%)' }}
    >
      <div className="text-[11px] tracking-[.34em] uppercase font-heavy text-gold-700">
        ★ {isEs ? 'Quienes lo hacen posible' : 'Quem torna isso possível'}
      </div>
      <h2 className="font-serif text-[32px] md:text-[40px] mt-1.5" style={{ color: '#2a3346' }}>
        {isEs ? 'Nuestros Patrocinadores' : 'Nossos Patrocinadores'}
      </h2>
      <p className="text-[14px] max-w-[520px] mx-auto mt-3 leading-relaxed" style={{ color: '#5b6478' }}>
        {isEs
          ? 'Empresas del agronegocio que apoyan la Capilla Sagrado Corazón de Jesús y la Fiesta del Bingo.'
          : 'Empresas do agronegócio que apoiam a Capela Sagrado Coração de Jesus e a Festa do Bingo.'}
      </p>

      {/* MASTER + CO-PATROCINADORES */}
      <div className="max-w-[1040px] mx-auto mt-9 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-stretch">
        {/* AGROTEC (master, grande) */}
        {master && (
          <div
            className="rounded-[20px] overflow-hidden flex flex-col"
            style={{
              background: '#0c0e14',
              border: '1px solid rgba(199,147,32,.4)',
              boxShadow: '0 40px 80px -36px rgba(40,30,10,.4), 0 0 0 1px rgba(199,147,32,.12)',
            }}
          >
            <div
              className="text-[11px] tracking-[.26em] uppercase font-heavy py-2.5"
              style={{ background: 'linear-gradient(180deg,#1a1f2b,#0d1018)', color: '#e6b836' }}
            >
              ★ {isEs ? 'Patrocinador Oficial' : 'Patrocinador Oficial'}
            </div>
            {master.image ? (
              <img src={master.image} alt={master.name} className="block w-full h-auto flex-1 object-cover" />
            ) : (
              <div className="py-10 font-display text-white text-3xl">{master.name}</div>
            )}
          </div>
        )}

        {/* SOMAX + AGROFÉRTIL (empilhados à direita) */}
        <div className="flex flex-col gap-4">
          {CO_SPONSORS.map((s) => (
            <div
              key={s.name}
              className="flex-1 rounded-[18px] overflow-hidden magnetic"
              style={{
                background: '#0c0e14',
                border: '1px solid rgba(199,147,32,.3)',
                boxShadow: '0 24px 50px -30px rgba(40,30,10,.35), 0 0 0 1px rgba(199,147,32,.1)',
              }}
            >
              <img src={s.image} alt={s.name} className="block w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* APOIADORES */}
      <div className="flex items-center gap-3 max-w-[900px] mx-auto mt-10 mb-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(28,34,48,.1)' }} />
        <span className="text-[10.5px] tracking-[.24em] uppercase font-heavy" style={{ color: '#5b6478' }}>
          {isEs ? 'Auspiciantes' : 'Apoiadores'}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(28,34,48,.1)' }} />
      </div>

      <div className="max-w-[980px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-3.5">
        {logos.map((s) => (
          <LogoTile key={s.name} sponsor={s} />
        ))}
      </div>

      <div className="mt-9">
        <Link
          to="/events"
          className="inline-block rounded-[12px] font-extrabold text-[12px] tracking-[.08em] text-[#3a2a06]"
          style={{ padding: '13px 24px', background: GOLD_SOFT, boxShadow: '0 16px 30px -14px rgba(199,147,32,.5)' }}
        >
          {isEs ? 'QUIERO PATROCINAR ✦' : 'QUERO PATROCINAR ✦'}
        </Link>
      </div>
    </section>
  );
}

function LogoTile({ sponsor }: { sponsor: TierSponsor }) {
  return (
    <div
      className="h-[86px] rounded-[14px] flex items-center justify-center overflow-hidden font-heavy text-center px-2 leading-tight magnetic"
      style={{
        background: '#fff',
        border: '1px solid rgba(28,34,48,.1)',
        color: '#2a3346',
        fontSize: 13.5,
        boxShadow: '0 12px 24px -16px rgba(40,30,10,.25)',
      }}
    >
      {sponsor.logo ? (
        <img src={sponsor.logo} alt={sponsor.name} className="max-h-[68px] max-w-[90%] object-contain" loading="lazy" />
      ) : (
        sponsor.name
      )}
    </div>
  );
}
