import { useEffect, useState } from 'react';
import { api, formatGs } from '@/lib/api';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/tickets', { params: status ? { status } : {} }).then((r) => {
      setTickets(r.data.tickets);
      setLoading(false);
    });
  }, [status]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-1">Bilhetes</h1>
      <p className="text-white/40 text-sm mb-6">Histórico completo de bilhetes vendidos</p>

      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'PAID', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`btn ${status === s ? 'btn-gold' : 'btn-ghost'}`}>{s || 'Todos'}</button>
        ))}
      </div>

      {loading && <p className="text-gold">Carregando…</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/50 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Evento</th>
              <th className="px-4 py-3 text-left">Cupons</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white/70">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-bold">#{t.ticketNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-bold">{t.user.name}</p>
                  <p className="text-white/40 text-xs">{t.user.cedula}</p>
                </td>
                <td className="px-4 py-3 text-white/70">{t.event.name}</td>
                <td className="px-4 py-3 text-white/70 text-xs">{t.coupons.map((c: any) => c.couponNumber).join(', ')}</td>
                <td className="px-4 py-3 text-right font-bold text-gold">{formatGs(t.totalAmount)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                    t.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-300' :
                    t.status === 'CANCELLED' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && !loading && (
              <tr><td colSpan={7} className="text-center py-8 text-white/40">Sem bilhetes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
