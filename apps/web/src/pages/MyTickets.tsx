import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { formatGs } from '@/lib/format';
import { DinelcoCard } from '@/components/DinelcoCard';
import { SALES_ENABLED } from '@/config';

export default function MyTickets() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingTicket, setPayingTicket] = useState<any | null>(null);

  const [downloading, setDownloading] = useState<string | null>(null);

  function load() {
    return api.get('/tickets/my').then((r) => { setTickets(r.data.tickets ?? []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function downloadTicket(tk: any) {
    setDownloading(tk.id);
    try {
      const res = await api.get(`/tickets/${tk.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bilhete-${String(tk.ticketNumber).padStart(6, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert(isEs ? 'No se pudo descargar el boleto.' : 'Não foi possível baixar o bilhete.');
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div className="text-center py-20 text-gold-700 animate-pulse">Carregando…</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-[44px] text-ink-900 mb-2 tracking-tight">{t('myTickets.title')}</h1>
      <p className="text-muted mb-8">Acompanhe seus bilhetes e o status do pagamento.</p>

      {tickets.length === 0 && (
        <div className="card-light rounded-[24px] p-12 text-center">
          <p className="text-muted text-lg mb-6">{t('myTickets.empty')}</p>
          {SALES_ENABLED && <Link to="/events" className="btn-gold">Ver eventos</Link>}
        </div>
      )}

      <div className="space-y-4">
        {tickets.map((tk) => (
          <div key={tk.id} className="card-light rounded-[20px] p-5 flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-gold-700 shrink-0"
                 style={{ background: 'rgba(230,184,54,.12)', border: '1px solid rgba(230,184,54,.3)' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-lg text-ink-900">{tk.event.name}</p>
              <p className="text-muted text-sm">Bilhete #{tk.ticketNumber} • {tk.coupons.length} cupons</p>
            </div>
            <div className="text-right">
              <StatusBadge status={tk.status} />
              <p className="font-display text-2xl text-gold-gradient mt-1.5">{formatGs(tk.totalAmount)}</p>
            </div>
            {/* Bilhete pendente → concluir/refazer pagamento (oculto se vendas desativadas) */}
            {SALES_ENABLED && tk.status === 'PENDING' && tk.payment && (
              <div className="w-full flex justify-end">
                <button onClick={() => setPayingTicket(tk)} className="btn-gold !py-2.5">
                  {isEs ? 'Pagar ahora' : 'Pagar agora'}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
            {/* Bilhete pago → baixar as cartelas em PDF */}
            {tk.status === 'PAID' && (
              <div className="w-full flex justify-end">
                <button onClick={() => downloadTicket(tk)} disabled={downloading === tk.id} className="btn-gold !py-2.5 disabled:opacity-50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  {downloading === tk.id ? (isEs ? 'Descargando…' : 'Baixando…') : (isEs ? 'Descargar cartones' : 'Baixar cartelas')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {payingTicket && (
        <PayModal
          ticket={payingTicket}
          isEs={isEs}
          onClose={() => setPayingTicket(null)}
          onSuccess={async () => { setPayingTicket(null); await load(); }}
        />
      )}
    </div>
  );
}

function PayModal({
  ticket, isEs, onClose, onSuccess,
}: { ticket: any; isEs: boolean; onClose: () => void; onSuccess: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
         style={{ background: 'rgba(10,11,16,.78)', backdropFilter: 'blur(6px)' }}
         onClick={onClose}>
      <div className="card-light rounded-[24px] overflow-hidden w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl"
           style={{ border: '1px solid rgba(230,184,54,.35)' }}
           onClick={(e) => e.stopPropagation()}>
        <div className="bg-ink-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] text-gold-500 tracking-[.28em] font-extrabold">
              {isEs ? 'PAGAR BOLETO' : 'PAGAR BILHETE'} #{ticket.ticketNumber}
            </p>
            <p className="font-display text-xl text-white leading-tight">{formatGs(ticket.totalAmount)}</p>
          </div>
          <button onClick={onClose} aria-label={isEs ? 'Cerrar' : 'Fechar'} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin p-4 grow">
          <DinelcoCard
            paymentId={ticket.payment.id}
            amountLabel={formatGs(ticket.totalAmount)}
            onSuccess={onSuccess}
          />
        </div>
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
