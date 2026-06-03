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
        className="relative max-w-[1020px] mx-auto rounded-[24px] p-[3px]"
        style={{
          background: GOLD_SHINE,
          boxShadow:
            '0 40px 80px -36px rgba(0,0,0,.55), 0 0 0 1px rgba(230,184,54,.3), 0 0 60px -20px rgba(230,184,54,.3)',
        }}
      >
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] rounded-[21px] overflow-hidden bg-[#0c0e14]">
          {/* ===== LADO 1: arte do master ===== */}
          <div className="relative min-h-[200px] lg:min-h-[330px] overflow-hidden">
            {showImg ? (
              <img
                src={master.image}
                alt={master.name}
                onError={() => setImgError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <MasterPlaceholder name={master?.name ?? ''} slogan={master?.slogan} isEs={isEs} />
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent 60%,rgba(12,14,20,.55) 100%)' }}
            />
            {/* badge */}
            <div
              className="absolute top-3.5 left-3.5 z-[4] inline-flex items-center gap-1.5 rounded-full text-gold-500 font-heavy uppercase"
              style={{
                background: 'rgba(8,10,14,.72)',
                border: '1px solid rgba(230,184,54,.5)',
                padding: '7px 12px',
                fontSize: 9.5,
                letterSpacing: '.18em',
              }}
            >
              ★ {isEs ? 'Patrocinador Master' : 'Patrocinador Master'}
            </div>
            {/* dots */}
            {count > 1 && (
              <div className="absolute bottom-3.5 left-4 z-[4] flex gap-[7px]">
                {masters.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Patrocinador ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === idx ? 20 : 7,
                      height: 7,
                      background: i === idx ? '#e6b836' : 'rgba(255,255,255,.4)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* perfuração — desktop (vertical) */}
          <div className="hidden lg:block absolute top-0 bottom-0 z-[6] pointer-events-none" style={{ left: '58.33%' }}>
            <div className="absolute top-[18px] bottom-[18px] -left-px" style={{ borderLeft: '2px dashed rgba(230,184,54,.45)' }} />
            <div className="absolute -left-[13px] -top-[13px] w-[26px] h-[26px] rounded-full" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
            <div className="absolute -left-[13px] -bottom-[13px] w-[26px] h-[26px] rounded-full" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
          </div>

          {/* ===== LADO 2: canhoto com dados do bingo ===== */}
          <div
            className="relative flex flex-col justify-center px-7 py-6"
            style={{ background: 'linear-gradient(180deg,#141823 0%,#0c0e14 100%)' }}
          >
            {/* perfuração — mobile (horizontal, no topo do canhoto) */}
            <div className="lg:hidden absolute -top-px left-0 right-0 z-[6] pointer-events-none">
              <div className="absolute left-[18px] right-[18px] top-0" style={{ borderTop: '2px dashed rgba(230,184,54,.45)' }} />
              <div className="absolute -left-[13px] -top-[13px] w-[26px] h-[26px] rounded-full" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
              <div className="absolute -right-[13px] -top-[13px] w-[26px] h-[26px] rounded-full" style={{ background: '#f3efe6', boxShadow: 'inset 0 0 0 2px rgba(230,184,54,.25)' }} />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[#3a2a06] font-extrabold text-[13px]" style={{ background: GOLD_SHINE }}>✚</div>
              <div className="leading-tight">
                <b className="block font-heavy text-white text-[13px] tracking-[.06em] uppercase">{isEs ? 'Fiesta del Bingo' : 'Festa do Bingo'}</b>
                <small className="block text-[8px] tracking-[.2em] text-white/45 font-bold">{isEs ? 'Capilla Sagrado Corazón de Jesús' : 'Capela Sagrado Coração de Jesus'}</small>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[9.5px] tracking-[.26em] uppercase text-white/55 font-heavy">{isEs ? 'Fecha del Sorteo' : 'Data do Sorteio'}</div>
              <div className="font-display text-white leading-[.92] mt-1" style={{ fontSize: 'clamp(40px,11vw,52px)' }}>
                {info.day} <span className="text-gold-500">{info.month.slice(0, 3)}</span>
              </div>
              <div className="font-heavy tracking-[.16em] text-white/80 text-[12px] mt-1 inline-flex items-center gap-1.5">
                🕗 {info.time} · {info.year}
              </div>
            </div>

            <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <div className="text-[9.5px] tracking-[.26em] uppercase text-white/55 font-heavy">{isEs ? 'En premios' : 'Em prêmios'}</div>
              <div className="font-heavy text-white mt-1" style={{ fontSize: 26, lineHeight: 1 }}>
                <span className="text-gold-gradient" style={{ fontSize: 30 }}>{info.totalM}</span> {isEs ? 'MILLONES' : 'MILHÕES'}{' '}
                <small className="text-white/75 text-[12px] font-bold">· {info.drawCount} {isEs ? 'sorteos' : 'sorteios'}</small>
              </div>
            </div>

            <Link
              to={`/events/${info.eventId}`}
              className="mt-[18px] inline-flex items-center justify-center gap-2.5 rounded-[13px] font-extrabold tracking-[.1em] text-[13px] text-[#231a06]"
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg,#f5cb4f 0%,#e3ae28 100%)',
                boxShadow: '0 18px 30px -14px rgba(230,184,54,.55), inset 0 1px 0 rgba(255,255,255,.45)',
              }}
            >
              🎟 {isEs ? 'COMPRAR BINGOS' : 'COMPRAR BINGOS'}
              <span className="ml-auto w-[28px] h-[28px] rounded-full bg-[#231a06] text-gold-500 flex items-center justify-center">→</span>
            </Link>

            <div className="mt-3.5 h-[26px] rounded-[5px] opacity-60" style={{ background: 'repeating-linear-gradient(90deg,#cfd3de 0 2px,transparent 2px 4px,#cfd3de 4px 5px,transparent 5px 9px)' }} />
            <div className="mt-1.5 text-center text-[8.5px] tracking-[.3em] text-white/45 font-heavy">Nº {String(info.day).padStart(4, '0')} · KATUETÉ-PY</div>
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
