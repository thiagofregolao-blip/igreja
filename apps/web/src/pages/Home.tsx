import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Sponsors } from '@/components/Sponsors';
import type { EventSummary } from '@catedral/types';

const GOLD_SOFT = 'linear-gradient(180deg,#f3c84a,#d29a1f)';

export default function Home() {
  const { i18n } = useTranslation();
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

  const sold = event.soldCount ?? 0;
  const total = event.maxCoupons ?? 0;
  const pct = total ? Math.min(100, (sold / total) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* ============ HERO: BANNER DA FESTA ============ */}
      <section className="relative overflow-hidden bg-white">
        <img src="/festa-banner.jpg" alt="Fiesta de la Costilla" className="block w-full h-auto hero-festa-img" />
      </section>

      {/* ============ COMPRAR + CONTADOR ============ */}
      <section
        className="flex justify-center items-center gap-4 md:gap-6 flex-wrap px-4 py-4 md:py-5"
        style={{ background: 'linear-gradient(180deg,#141925,#0d1018)' }}
      >
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-3 rounded-[14px] font-extrabold text-[#3a2a06] tracking-[.05em] text-[13px] md:text-[16px] magnetic"
          style={{
            padding: '13px 24px',
            background: GOLD_SOFT,
            boxShadow: '0 18px 34px -14px rgba(230,184,54,.6), inset 0 1px 0 rgba(255,255,255,.5)',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
            <path d="M9 7v10" />
          </svg>
          {isEs ? 'COMPRAR BINGOS' : 'COMPRAR BINGOS'}
        </Link>

        <div className="text-white text-center">
          <div className="font-display leading-none text-[20px] md:text-[30px]">
            <CountUp value={sold} />
            <span className="text-white/55 text-[12px] md:text-[15px] font-sans font-bold"> / {total.toLocaleString('es-PY')}</span>
          </div>
          <div className="text-[8px] md:text-[10px] tracking-[.18em] uppercase font-heavy text-white/60 mt-1">
            {isEs ? 'cartones vendidos' : 'cartelas vendidas'}
          </div>
          <div className="h-1 md:h-1.5 rounded-full bg-white/15 mt-2 overflow-hidden mx-auto" style={{ maxWidth: 220 }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: GOLD_SOFT }} />
          </div>
        </div>
      </section>

      {/* ============ PATROCINADORES ============ */}
      <Sponsors isEs={Boolean(isEs)} />

      {/* ============ DESTAQUES ============ */}
      <section className="max-w-[1000px] mx-auto px-8 md:px-10 py-12 grid grid-cols-1 md:grid-cols-3">
        <QuickCard
          icon="🎟"
          title={isEs ? 'Comprar Bingos' : 'Comprar Bingos'}
          text={isEs ? 'Elige tus números y participa en los 5 sorteos millonarios.' : 'Escolha seus números e concorra aos 5 sorteios milionários.'}
        />
        <QuickCard
          icon="🏆"
          title={isEs ? 'Los Premios' : 'Os Prêmios'}
          text={isEs ? 'De 30 a 200 millones — 450 millones en premios en total.' : 'De 30 a 200 milhões — 450 milhões em prêmios no total.'}
        />
        <QuickCard
          icon="⛪"
          title={isEs ? 'La Parroquia' : 'A Paróquia'}
          text={isEs ? 'Tu participación ayuda a la Capilla Sagrado Corazón de Jesús.' : 'Sua participação ajuda a Capela Sagrado Coração de Jesus.'}
        />
      </section>
    </div>
  );
}

function QuickCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="px-7 py-1.5 text-center border-t md:border-t-0 md:border-l first:border-t-0 md:first:border-l-0" style={{ borderColor: 'rgba(28,34,48,.1)' }}>
      <div
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center mx-auto mb-3.5 text-[22px] text-gold-700"
        style={{ border: '1px solid rgba(28,34,48,.1)' }}
      >
        {icon}
      </div>
      <h3 className="font-serif text-[23px]" style={{ color: '#2a3346' }}>{title}</h3>
      <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#5b6478' }}>{text}</p>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString('es-PY')}</>;
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
