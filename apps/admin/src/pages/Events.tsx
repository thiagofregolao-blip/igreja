import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatGs } from '@/lib/api';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { reload(); }, []);
  async function reload() {
    setLoading(true);
    const { data } = await api.get('/admin/events');
    setEvents(data.events ?? []);
    setLoading(false);
  }

  async function toggle(id: string) {
    await api.patch(`/admin/events/${id}/toggle`);
    reload();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-white/40 text-sm">Gerenciar bingos e sorteios</p>
        </div>
        <Link to="/events/new" className="btn-gold">+ Novo evento</Link>
      </div>

      {loading && <p className="text-gold">Carregando…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {events.map((e) => (
          <div key={e.id} className="card p-5">
            <div className="flex items-start gap-4">
              {e.heroImageUrl && (
                <img src={e.heroImageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate">{e.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
                    {e.isActive ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>
                <p className="text-white/50 text-xs">{e.location}</p>
                <p className="text-white/50 text-xs mt-1">{new Date(e.eventDate).toLocaleDateString('pt-BR')} • {e.startTime}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
                  <span>{e._count?.coupons ?? 0} cupons</span>
                  <span>•</span>
                  <span>{e._count?.tickets ?? 0} bilhetes</span>
                  <span>•</span>
                  <span>{e._count?.sponsors ?? 0} sponsors</span>
                  <span>•</span>
                  <span className="text-gold">{formatGs(e.totalPrizeValue)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link to={`/events/${e.id}`} className="btn-ghost flex-1 justify-center">Editar</Link>
              <button onClick={() => toggle(e.id)} className="btn-ghost flex-1 justify-center">{e.isActive ? 'Desativar' : 'Ativar'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
