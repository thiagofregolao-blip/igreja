import { useEffect, useState } from 'react';
import { api, formatGs } from '@/lib/api';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/admin/payments', { params: status ? { status } : {} });
    setPayments(data.payments);
    setLoading(false);
  }
  useEffect(() => { load(); }, [status]);

  async function confirm(id: string) {
    const notes = prompt('Notas (opcional):') ?? undefined;
    await api.put(`/admin/payments/${id}/confirm`, { notes });
    load();
  }
  async function reject(id: string) {
    const notes = prompt('Motivo da rejeição:');
    if (!notes) return;
    await api.put(`/admin/payments/${id}/reject`, { notes });
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-1">Pagamentos</h1>
      <p className="text-white/40 text-sm mb-6">Aprovação manual de transferências bancárias</p>

      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'CONFIRMED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`btn ${status === s ? 'btn-gold' : 'btn-ghost'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {loading && <p className="text-gold">Carregando…</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/50 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Evento</th>
              <th className="px-4 py-3 text-left">Bilhete</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center">Comprovante</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white/70">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <p className="font-bold">{p.user.name}</p>
                  <p className="text-white/40 text-xs">{p.user.email} • {p.user.cedula}</p>
                </td>
                <td className="px-4 py-3 text-white/70">{p.ticket.event.name}</td>
                <td className="px-4 py-3 text-white/70">#{p.ticket.ticketNumber}</td>
                <td className="px-4 py-3 text-right font-bold text-gold">{formatGs(p.amount)}</td>
                <td className="px-4 py-3 text-center">
                  {p.receiptUrl
                    ? <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline text-xs">ver</a>
                    : <span className="text-white/30 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                    p.status === 'CONFIRMED' ? 'bg-emerald-500/15 text-emerald-300' :
                    p.status === 'REJECTED' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'PENDING' && (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => confirm(p.id)} className="btn-gold !py-1.5 !px-3 text-xs">Confirmar</button>
                      <button onClick={() => reject(p.id)} className="btn-danger !py-1.5 !px-3 text-xs">Rejeitar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && !loading && (
              <tr><td colSpan={8} className="text-center py-8 text-white/40">Sem pagamentos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
