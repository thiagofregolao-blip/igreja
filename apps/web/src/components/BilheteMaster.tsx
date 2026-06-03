import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterSponsor } from '@/data/sponsors';

const GOLD_SHINE =
  'linear-gradient(180deg,#8a5310 0%,#d99820 8%,#f6cf5a 18%,#fff3c4 28%,#e7b53a 42%,#a86b13 55%,#d99820 68%,#f4cb55 80%,#6f4310 100%)';

interface BingoInfo {
  day: string;
  month: string;
  year: string;
  time: string;
  totalM: string;
  drawCount: number;
  eventId: string;
}

export function BilheteMaster({
  masters,
  info,
  isEs,
}: {
  masters: MasterSponsor[];
  info: BingoInfo;
  isEs: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const count = masters.length;
  const master = masters[idx] ?? masters[0];

  // Rotação automática do carrossel
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  // Reseta erro de imagem ao trocar de patrocinador
  useEffect(() => setImgError(false), [idx]);

  const showImg = master?.image && !imgError;

  return (
    <section className="pt-10 pb-4">
      {/* eyebrow */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="h-px w-12 sm:w-16" style={{ background: 'linear-gradient(90deg,transparent,#e6b836)' }} />
        <span className="text-[10px] sm:text-[11px] tracking-[.28em] font-heavy uppercase text-gold-700">
          ★ {isEs ? 'Fiesta del Bingo · Patrocinador Master' : 'Festa do Bingo · Patrocinador Master'} ★
        </span>
        <span className="h-px w-12 sm:w-16" style={{ background: 'linear-gradient(270deg,transparent,#e6b836)' }} />
      </div>

      {/* TICKET */}
      <div
        className="relative w-full rounded-[24px] p-[3px]"
        style={{
          background: GOLD_SHINE,
          boxShadow:
            '0 40px 80px -36px rgba(0,0,0,.55), 0 0 0 1px rgba(230,184,54,.3), 0 0 60px -20px rgba(230,184,54,.3)',
        }}
      >
        <div className="relative grid grid-cols-1 lg:grid-cols-[2fr_3fr] rounded-[21px] overflow-hidden bg-[#0c0e14]">
          {/* ===== LADO 1: arte do master ===== */}
          <div className="relative aspect-[3/2] lg:aspect-auto lg:min-h-[330px] overflow-hidden bg-[#0c0e14]">
            {showImg ? (
              <img
                src={master.image}
                alt={master.name}
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <MasterPlaceholder name={master?.name ?? ''} slogan={master?.slogan} isEs={isEs} />
            )}
            {/* leve escurecimento na emenda (desktop) p/ destacar a picotagem */}
            <div
              className="hidden lg:block absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent 72%,rgba(12,14,20,.5) 100%)' }}
            />
            {/* selo (só no placeholder — a arte real já traz "patrocinador oficial") */}
            {!showImg && (
              <div
                className="absolute top-3.5 left-3.5 z-[4] inline-flex items-center gap-1.5 rounded-full text-gold-500 font-heavy uppercase"
                style={{ background: 'rgba(8,10,14,.72)', border: '1px solid rgba(230,184,54,.5)', padding: '7px 12px', fontSize: 9.5, letterSpacing: '.18em' }}
              >
                ★ Patrocinador Master
              </div>
            )}
            {/* dots do carrossel */}
            {count > 1 && (
              <div className="absolute bottom-3.5 left-4 z-[4] flex gap-[7px]">
                {masters.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Patrocinador ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === idx ? 20 : 7, height: 7, background: i === idx ? '#e6b836' : 'rgba(255,255,255,.55)' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ===== LADO 2: canhoto com dados do bingo ===== */}
          <div
            className="relative flex flex-col justify-center px-7 py-7 lg:px-10 lg:py-9 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed"
            style={{ background: 'linear-gradient(180deg,#141823 0%,#0c0e14 100%)', borderColor: 'rgba(230,184,54,.45)' }}
          >
            {/* furos da picotagem — alinham sempre com a emenda real */}
            <span className="lg:hidden absolute -top-[13px] -left-[13px] w-[26px] h-[26px] rounded-full z-[6]" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
            <span className="lg:hidden absolute -top-[13px] -right-[13px] w-[26px] h-[26px] rounded-full z-[6]" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
            <span className="hidden lg:block absolute -left-[13px] -top-[13px] w-[26px] h-[26px] rounded-full z-[6]" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
            <span className="hidden lg:block absolute -left-[13px] -bottom-[13px] w-[26px] h-[26px] rounded-full z-[6]" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />

            {/* header */}
            <div className="flex items-center gap-3">
              <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#3a2a06] font-extrabold text-[16px] shrink-0" style={{ background: GOLD_SHINE }}>✚</div>
              <div className="leading-tight">
                <b className="block font-heavy text-white text-[15px] lg:text-[17px] tracking-[.05em] uppercase">{isEs ? 'Fiesta del Bingo' : 'Festa do Bingo'}</b>
                <small className="block text-[9.5px] tracking-[.18em] text-white/50 font-bold uppercase">{isEs ? 'Capilla Sagrado Corazón de Jesús' : 'Capela Sagrado Coração de Jesus'}</small>
              </div>
            </div>

            {/* DATA */}
            <div className="mt-5 lg:mt-6">
              <div className="text-[11px] lg:text-[12.5px] tracking-[.28em] uppercase text-white/55 font-heavy">{isEs ? 'Fecha del Sorteo' : 'Data do Sorteio'}</div>
              <div className="font-display text-white leading-[.9] mt-1.5" style={{ fontSize: 'clamp(46px,5.4vw,76px)' }}>
                {info.day} <span className="text-gold-500">{info.month.slice(0, 3)}</span>
              </div>
              <div className="font-heavy tracking-[.14em] text-white/80 text-[13px] lg:text-[15px] mt-2 inline-flex items-center gap-2">
                🕗 {info.time} · {info.year}
              </div>
            </div>

            {/* PRÊMIO — protagonista */}
            <div className="mt-5 lg:mt-6 pt-5 lg:pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
              <div className="text-[11px] lg:text-[12.5px] tracking-[.28em] uppercase text-gold-500 font-heavy">{isEs ? 'En premios · en efectivo' : 'Em prêmios · em dinheiro'}</div>
              <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                <span className="text-gold-gradient font-display leading-[.82]" style={{ fontSize: 'clamp(64px,9vw,128px)' }}>{info.totalM}</span>
                <span className="font-display text-white leading-none" style={{ fontSize: 'clamp(30px,3.6vw,54px)' }}>{isEs ? 'MILLONES' : 'MILHÕES'}</span>
              </div>
              <div className="text-white/65 text-[12.5px] lg:text-[14px] font-heavy tracking-[.14em] uppercase mt-2">
                {info.drawCount} {isEs ? 'sorteos millonarios' : 'sorteios milionários'}
              </div>
            </div>

            {/* CTA */}
            <Link
              to={`/events/${info.eventId}`}
              className="mt-6 lg:mt-7 flex w-full items-center justify-center gap-3 rounded-[14px] font-extrabold tracking-[.1em] text-[14px] lg:text-[15px] text-[#231a06]"
              style={{
                padding: '17px 22px',
                background: 'linear-gradient(180deg,#f5cb4f 0%,#e3ae28 100%)',
                boxShadow: '0 18px 32px -14px rgba(230,184,54,.6), inset 0 1px 0 rgba(255,255,255,.45)',
              }}
            >
              🎟 {isEs ? 'COMPRAR BINGOS' : 'COMPRAR BINGOS'}
              <span className="ml-auto w-[30px] h-[30px] rounded-full bg-[#231a06] text-gold-500 flex items-center justify-center">→</span>
            </Link>

            <div className="mt-4 h-[28px] rounded-[5px] opacity-60" style={{ background: 'repeating-linear-gradient(90deg,#cfd3de 0 2px,transparent 2px 4px,#cfd3de 4px 5px,transparent 5px 9px)' }} />
            <div className="mt-2 text-center text-[9px] tracking-[.3em] text-white/45 font-heavy">Nº {String(info.day).padStart(4, '0')} · KATUETÉ-PY</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MasterPlaceholder({ name, slogan, isEs }: { name: string; slogan?: string; isEs: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-5"
      style={{
        background:
          'radial-gradient(70% 55% at 42% 22%, rgba(255,214,120,.28), transparent 70%), linear-gradient(180deg,#5f8230 0%,#3c5a1c 32%,#28380f 56%,#160f06 80%,#0c0a06 100%)',
      }}
    >
      {slogan && (
        <div className="font-heavy italic uppercase text-[#cfe6a8] mb-1.5" style={{ fontSize: 11, letterSpacing: '.05em', textShadow: '0 2px 8px rgba(0,0,0,.7)' }}>
          {slogan}
        </div>
      )}
      <div className="font-display" style={{ fontSize: 'clamp(40px,7vw,84px)', lineHeight: .9, color: '#2f7d2f', textShadow: '0 3px 0 #1f5a1f,0 10px 24px rgba(0,0,0,.65)' }}>
        {name}
      </div>
      <div className="font-heavy text-white mt-2.5 text-[13px] tracking-[.06em]" style={{ textShadow: '0 2px 10px rgba(0,0,0,.8)' }}>
        {isEs ? 'PATROCINADOR OFICIAL' : 'PATROCINADOR OFICIAL'}
      </div>
    </div>
  );
}
