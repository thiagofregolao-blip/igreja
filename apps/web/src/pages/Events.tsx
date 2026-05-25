import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { formatLongDatePT, formatLongDateES, millionsLabel } from '@/lib/format';
import type { EventSummary } from '@catedral/types';

export default function Events() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then((r) => { setEvents(r.data.events ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-gold-700 animate-pulse">Carregando…</div>;
  if (events.length === 0) {
    return <div className="text-center py-20 text-muted">Nenhum evento ativo</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-[44px] text-ink-900 mb-2 tracking-tight">Eventos ativos</h1>
      <p className="text-muted mb-9">Escolha um bingo e participe.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e) => {
          const fmt = isEs ? formatLongDateES(e.eventDate) : formatLongDatePT(e.eventDate);
          return (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              className="card-light rounded-[24px] p-7 magnetic block"
            >
              <p className="text-gold-700 text-[11px] tracking-[.24em] font-extrabold mb-2.5">
                {fmt.day} DE {fmt.month} {fmt.year} • {fmt.time}
              </p>
              <h3 className="font-display text-[22px] text-ink-900 leading-tight mb-2">{isEs ? e.nameEs : e.name}</h3>
              <p className="text-muted text-sm mb-4 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {e.location}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[36px] text-gold-gradient">{millionsLabel(e.totalPrizeValue)}</span>
                <span className="text-muted text-sm font-semibold">MI em prêmios</span>
              </div>
              <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-xs">
                <span className="text-muted">{e.availableCount} de {e.maxCoupons} disponíveis</span>
                <span className="text-gold-700 font-extrabold tracking-wider">COMPRAR →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
