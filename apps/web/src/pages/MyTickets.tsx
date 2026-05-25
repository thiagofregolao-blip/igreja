import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { formatGs } from '@/lib/format';

export default function MyTickets() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tickets/my').then((r) => { setTickets(r.data.tickets ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-gold-700 animate-pulse">Carregando…</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-[44px] text-ink-900 mb-2 tracking-tight">{t('myTickets.title')}</h1>
      <p className="text-muted mb-8">Acompanhe seus bilhetes e o status do pagamento.</p>

      {tickets.length === 0 && (
        <div className="card-light rounded-[24px] p-12 text-center">
          <p className="text-muted text-lg mb-6">{t('myTickets.empty')}</p>
          <Link to="/events" className="btn-gold">Ver eventos</Link>
        </div>
      )}

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="card-light rounded-[20px] p-5 magnetic flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-gold-700 shrink-0"
                 style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.3)' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-lg text-ink-900">{t.event.name}</p>
              <p className="text-muted text-sm">Bilhete #{t.ticketNumber} • {t.coupons.length} cupons</p>
            </div>
            <div className="text-right">
              <StatusBadge status={t.status} />
              <p className="font-display text-2xl text-gold-gradient mt-1.5">{formatGs(t.totalAmount)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'PAID' | 'CANCELLED' }) {
  const { t } = useTranslation();
  const cfg = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-300',
    PAID: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    CANCELLED: 'bg-red-50 text-red-700 border-red-300',
  } as const;
  return <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border tracking-widest ${cfg[status]}`}>{t(`status.${status}`)}</span>;
}
