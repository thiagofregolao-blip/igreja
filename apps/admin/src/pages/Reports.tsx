import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function Reports() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { api.get('/admin/events').then((r) => setEvents(r.data.events)); }, []);

  function download(format: 'excel' | 'pdf') {
    const token = useAuthStore.getState().accessToken;
    const params = new URLSearchParams();
    if (eventId) params.set('eventId', eventId);
    if (startDate) params.set('startDate', new Date(startDate).toISOString());
    if (endDate) params.set('endDate', new Date(endDate).toISOString());

    fetch(`/api/admin/reports/${format}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'excel' ? `relatorio-${Date.now()}.xlsx` : `relatorio-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Relatórios</h1>
      <p className="text-white/40 text-sm mb-8">Exportar dados para Excel ou PDF</p>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Evento (opcional)</label>
          <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Todos os eventos</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">De</label><input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label className="label">Até</label><input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => download('excel')} className="btn-gold flex-1">📊 Baixar Excel</button>
          <button onClick={() => download('pdf')} className="btn-ghost flex-1">📄 Baixar PDF</button>
        </div>
      </div>
    </div>
  );
}
