import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatLongDatePT, formatLongDateES, millionsLabel } from '@/lib/format';
import type { EventSummary } from '@catedral/types';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then((r) => {
      setEvent(r.data.events?.[0] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <HomeLoading />;
  if (!event) return <NoActiveEvent />;

  const fmt = isEs ? formatLongDateES(event.eventDate) : formatLongDatePT(event.eventDate);
  const totalM = millionsLabel(event.totalPrizeValue);
  const mainM = millionsLabel(event.mainPrizeValue);
  const drawValues = distributeDraws(event.totalPrizeValue, event.mainPrizeValue, event.drawCount);

  return (
    <div className="max-w-[1480px] mx-auto px-6 md:px-9 pb-16 pt-6 animate-fade-in">
      {/* ============ HERO ============ */}
      <section
        className="relative grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-12 lg:gap-12 items-center pt-12 pb-8"
        style={{ minHeight: 600 }}
      >
        {/* DATE CARD */}
        <div className="relative w-full max-w-[280px] mx-auto bg-date-card rounded-[30px] text-white text-center"
             style={{ padding: '86px 28px 30px', boxShadow: '0 40px 70px -28px rgba(15,15,25,.55), inset 0 1px 0 rgba(255,255,255,.04), inset 0 0 0 1px rgba(255,255,255,.03)' }}>
          <div className="absolute left-1/2 -top-[34px] -translate-x-1/2 w-[68px] h-[68px] rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(180deg,#1c2030 0%,#101320 100%)', border: '1px solid rgba(230,184,54,.4)', boxShadow: '0 12px 26px -10px rgba(0,0,0,.55)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e7b53a" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
              <rect x="7" y="12" width="3" height="3" fill="#e7b53a" stroke="none" />
            </svg>
          </div>
          <div className="text-[11px] font-heavy tracking-[.3em] text-white/70 mb-2">{t('hero.drawDate')}</div>
          <div className="font-display text-white" style={{ fontSize: 120, lineHeight: 1, letterSpacing: '-.02em', margin: '6px 0 14px' }}>{fmt.day}</div>
          <div className="font-heavy tracking-[.18em] text-gold-500 text-sm">DE {fmt.month}</div>
          <div className="text-[13px] text-white/65 tracking-[.32em] mt-2 font-heavy">{fmt.year}</div>
          <div className="divider-gold my-5 mx-1" />
          <div className="inline-flex items-center gap-2.5 font-heavy tracking-[.16em] text-white text-[13px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e7b53a" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            {fmt.time}
          </div>
        </div>

        {/* CENTER */}
        <div className="text-center relative">
          <div className="text-[13px] tracking-[.32em] font-heavy uppercase mb-3.5" style={{ color: '#3b3a36' }}>
            {t('hero.subtitle')}
          </div>
          <div className="text-gold-gradient whitespace-nowrap"
               style={{ fontSize: 'min(280px, 22vw)', lineHeight: 0.86, letterSpacing: '-.04em', marginBottom: 10, fontFamily: 'Archivo, sans-serif', fontWeight: 800 }}>
            {totalM}
          </div>
          <div className="flex flex-col items-center gap-[18px] mt-1.5">
            <div className="text-ink-900 whitespace-nowrap"
                 style={{ fontSize: 'min(128px, 10vw)', lineHeight: 0.9, letterSpacing: '-.025em', fontFamily: 'Archivo, sans-serif', fontWeight: 800 }}>
              {t('hero.millions')}
            </div>
            <div className="inline-block bg-gold-soft text-[#1a1408] rounded-[12px] font-heavy tracking-[.18em] text-[18px]"
                 style={{ padding: '10px 28px', boxShadow: '0 14px 26px -10px rgba(230,184,54,.55), inset 0 1px 0 rgba(255,255,255,.4)' }}>
              {t('hero.inCash')}
            </div>
          </div>
          <div className="mt-6 text-[14px] tracking-[.22em] font-heavy uppercase" style={{ color: '#3b3a36' }}>
            {event.drawCount} SORTEIOS &nbsp;•&nbsp;
            <b className="text-gold-700">{totalM} {t('hero.millions')}</b> EM DINHEIRO EM PRÊMIOS
          </div>
          <Link to={`/events/${event.id}`} className="btn-dark mt-8">
            <svg className="w-5 h-5 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/>
              <path d="M9 7v10"/>
            </svg>
            {t('nav.cta')}
          </Link>
        </div>

        {/* PRIZE CARD */}
        <div className="relative w-full max-w-[280px] mx-auto bg-prize-card rounded-[30px] text-center"
             style={{ padding: '86px 28px 30px', boxShadow: '0 40px 70px -28px rgba(60,45,15,.25), inset 0 1px 0 rgba(255,255,255,.7), inset 0 0 0 1px rgba(15,17,25,.04)' }}>
          <div className="absolute left-1/2 -top-[34px] -translate-x-1/2 w-[68px] h-[68px] rounded-full flex items-center justify-center text-gold-700"
               style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f1ead8 100%)', border: '1px solid rgba(230,184,54,.5)', boxShadow: '0 12px 26px -12px rgba(60,45,15,.3)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>
          </div>
          <div className="text-[11px] font-heavy tracking-[.3em] mb-2" style={{ color: '#3b3a36' }}>{t('hero.mainPrize')}</div>
          <div className="font-display text-ink-900" style={{ fontSize: 120, lineHeight: 1, letterSpacing: '-.02em', margin: '6px 0 4px' }}>{mainM}</div>
          <div className="font-heavy tracking-[.18em] text-gold-700 text-[18px] mb-4">{t('hero.millions')}</div>
          <div className="text-[11.5px] tracking-[.32em] font-heavy" style={{ color: '#3b3a36' }}>{t('hero.millionsLabel')}</div>
        </div>
      </section>

      {/* ============ BOTTOM PANEL ============ */}
      <section className="card-dark rounded-[28px] text-white mt-7" id="prizes"
               style={{ padding: '36px 40px 40px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-9 items-start">
          {/* LEFT: bingo picker */}
          <div>
            <div className="border-l-2 border-gold-500 pl-3.5 leading-tight">
              <div className="text-[13.5px] tracking-[.24em] font-heavy text-white/85">{t('grid.title')}</div>
              <b className="block text-[26px] tracking-[.14em] mt-1 font-heavy text-white">{t('grid.bingo')}</b>
            </div>
            <div className="mt-5 rounded-[22px] p-[22px]"
                 style={{ background: '#14171f', border: '1px solid rgba(255,255,255,.05)' }}>
              <div className="flex items-center gap-4">
                <div className="relative w-[54px] h-[54px] rounded-[14px] flex items-center justify-center text-gold-500"
                     style={{ background: 'rgba(230,184,54,.1)', border: '1px solid rgba(230,184,54,.18)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                  <span className="absolute -right-1.5 -bottom-1.5 bg-gold-500 text-[#1a1408] font-extrabold text-[11px] rounded-full px-1.5 py-0.5"
                        style={{ boxShadow: '0 4px 10px -3px rgba(230,184,54,.6)' }}>{event.cardsPerCoupon}</span>
                </div>
                <div>
                  <div className="text-[14px] tracking-[.18em] text-white/80 font-bold">{event.cardsPerCoupon} {t('grid.twoNumbers').includes('NÚMEROS') ? 'NÚMEROS' : 'NUMBERS'}</div>
                  <div className="font-display text-[26px] text-white tracking-[-.01em] mt-0.5">Gs. {event.couponPrice.toLocaleString('es-PY')}</div>
                </div>
                <div className="ml-auto px-2.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-[.18em] text-white/75"
                     style={{ border: '1px solid rgba(255,255,255,.12)' }}>{t('grid.singlePrice')}</div>
              </div>
              <div className="mt-3 text-[12.5px] text-white/60">{t('grid.chancesLabel', { count: event.cardsPerCoupon })}</div>
              <Link to={`/events/${event.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-3 rounded-[14px] font-extrabold tracking-[.16em] text-[13px] text-[#1a1408]"
                    style={{
                      padding: '16px 18px',
                      background: 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 100%)',
                      boxShadow: '0 18px 30px -14px rgba(230,184,54,.55), inset 0 1px 0 rgba(255,255,255,.45)',
                    }}>
                {t('grid.buyNow')}
                <span className="ml-auto w-[30px] h-[30px] rounded-full bg-[#1a1408] text-gold-500 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </span>
              </Link>
            </div>
          </div>

          {/* RIGHT: sorteios */}
          <div>
            <div className="text-[22px] tracking-[.16em] font-heavy mb-4.5 text-white">
              OS <em className="not-italic text-gold-500">{event.drawCount}</em> SORTEIOS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {drawValues.map((v, idx) => {
                const isFinal = idx === drawValues.length - 1;
                return (
                  <div
                    key={idx}
                    className={`relative rounded-[18px] text-center ${isFinal ? '' : ''}`}
                    style={{
                      padding: '18px 14px 20px',
                      background: isFinal
                        ? 'radial-gradient(circle at 50% 60%, #2a200a 0%, #16110a 50%, #0c0a07 100%)'
                        : '#14171f',
                      border: isFinal ? '1px solid rgba(230,184,54,.55)' : '1px solid rgba(255,255,255,.05)',
                      boxShadow: isFinal
                        ? '0 0 0 1px rgba(230,184,54,.15), 0 30px 60px -30px rgba(230,184,54,.4), inset 0 0 60px rgba(230,184,54,.08)'
                        : 'none',
                    }}
                  >
                    <div className="text-[11px] tracking-[.22em] font-heavy leading-tight" style={{ color: '#bdbdbd' }}>
                      {isFinal ? (
                        <span><span className="text-gold-500 mr-1.5">★</span></span>
                      ) : (
                        <>{idx + 1}º</>
                      )}
                      <b className={`block text-[13px] tracking-[.18em] mt-0.5 font-heavy ${isFinal ? 'text-gold-500' : 'text-white/85'}`}>
                        {isFinal ? 'PRÊMIO FINAL' : 'PRÊMIO'}
                      </b>
                    </div>
                    <div
                      className={`font-display my-2.5 ${isFinal ? 'text-gold-card' : 'text-gold-500'}`}
                      style={{ fontSize: isFinal ? 74 : 62, lineHeight: 1, letterSpacing: '-.03em' }}
                    >
                      {millionsLabel(v)}
                    </div>
                    <div className="text-[12px] tracking-[.22em] font-heavy text-white/85">MILHÕES</div>
                    {!isFinal && (
                      <div className="mx-auto mt-3 rounded-sm"
                           style={{ width: 46, height: 2, background: 'linear-gradient(90deg,transparent, #e6b836, transparent)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* INFO ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4.5" id="how">
              <InfoCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>}
                title={`${totalM} ${t('hero.millions')}`}
                sub={t('footer.prizes')}
              />
              <InfoCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9.5C7.4 20.4 4 16.5 4 12V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>}
                title={t('footer.secure')}
                sub={t('footer.secureSub')}
              />
              <InfoCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 20c0-2.4 1.6-4.5 4-5.3"/></svg>}
                title={t('footer.community')}
                sub={t('footer.communitySub')}
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function InfoCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div
      className="rounded-[18px] flex items-center gap-4.5"
      style={{
        padding: '18px 22px',
        background: '#14171f',
        border: '1px solid rgba(255,255,255,.05)',
        gap: 18,
      }}
    >
      <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center text-gold-500 shrink-0"
           style={{ background: 'rgba(230,184,54,.1)', border: '1px solid rgba(230,184,54,.18)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <b className="block text-[15px] font-heavy tracking-[.04em] text-white">{title}</b>
        <span className="block text-[11.5px] tracking-[.22em] uppercase font-heavy mt-0.5" style={{ color: '#bdbdbd' }}>{sub}</span>
      </div>
    </div>
  );
}

function distributeDraws(total: number, mainValue: number, drawCount: number): number[] {
  if (drawCount <= 1) return [mainValue];
  const others = Math.max(0, total - mainValue);
  const n = drawCount - 1;
  const factors = Array.from({ length: n }, (_, i) => 0.6 + (i * (1.4 / Math.max(1, n - 1))));
  const fSum = factors.reduce((a, b) => a + b, 0) || 1;
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const raw = (others * factors[i]) / fSum;
    values.push(Math.max(10_000_000, Math.round(raw / 10_000_000) * 10_000_000));
  }
  values.push(mainValue);
  return values;
}

function HomeLoading() {
  return <div className="min-h-screen flex items-center justify-center text-gold-700 animate-pulse">Carregando…</div>;
}

function NoActiveEvent() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-display text-ink-900 mb-3">Nenhum evento ativo no momento</h1>
      <p className="text-muted max-w-md">A paróquia ainda não publicou o próximo bingo. Volte em breve!</p>
    </div>
  );
}
