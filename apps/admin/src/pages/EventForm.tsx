import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, formatGs } from '@/lib/api';

interface DrawDraft { id?: string; order: number; prizeName: string; prizeNameEs: string; prizeValue: number; }

export default function EventForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const [tab, setTab] = useState<'basic' | 'draws' | 'sponsors' | 'cards'>('basic');
  const [event, setEvent] = useState<any>({
    name: '', nameEs: '', location: 'Salão Paroquial de Katueté',
    description: '', descriptionEs: '',
    eventDate: '', startTime: '20:00',
    maxCoupons: 100, couponPrice: 100000, cardsPerCoupon: 2, drawCount: 5,
    mainPrizeValue: 200_000_000, totalPrizeValue: 450_000_000,
  });
  const [draws, setDraws] = useState<DrawDraft[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id as string));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/events/${id}`).then((r) => {
      const e = r.data.event;
      setEvent({ ...e, eventDate: new Date(e.eventDate).toISOString().slice(0, 16) });
      setDraws(e.draws ?? []);
      setSponsors(e.sponsors ?? []);
    });
  }, [id, isNew]);

  async function saveBasic() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...event,
        eventDate: new Date(event.eventDate).toISOString(),
        maxCoupons: Number(event.maxCoupons),
        couponPrice: Number(event.couponPrice),
        cardsPerCoupon: Number(event.cardsPerCoupon),
        drawCount: Number(event.drawCount),
        mainPrizeValue: Number(event.mainPrizeValue),
        totalPrizeValue: Number(event.totalPrizeValue),
      };
      if (isNew && !savedId) {
        const { data } = await api.post('/admin/events', payload);
        setSavedId(data.event.id);
        nav(`/events/${data.event.id}`, { replace: true });
      } else {
        await api.put(`/admin/events/${savedId}`, payload);
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function addDraw() {
    if (!savedId) { alert('Salve as informações básicas primeiro'); return; }
    const draft: DrawDraft = { order: draws.length + 1, prizeName: '', prizeNameEs: '', prizeValue: 0 };
    setDraws([...draws, draft]);
  }
  async function saveDraw(idx: number) {
    if (!savedId) return;
    const d = draws[idx];
    if (d.id) {
      await api.put(`/admin/events/draws/${d.id}`, { order: Number(d.order), prizeName: d.prizeName, prizeNameEs: d.prizeNameEs, prizeValue: Number(d.prizeValue) });
    } else {
      const { data } = await api.post(`/admin/events/${savedId}/draws`, { order: Number(d.order), prizeName: d.prizeName, prizeNameEs: d.prizeNameEs, prizeValue: Number(d.prizeValue) });
      const copy = [...draws]; copy[idx] = { ...d, id: data.draw.id }; setDraws(copy);
    }
  }
  function updDraw(idx: number, patch: Partial<DrawDraft>) {
    const copy = [...draws]; copy[idx] = { ...copy[idx], ...patch }; setDraws(copy);
  }

  async function uploadSponsor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!savedId) return;
    const fd = new FormData(e.currentTarget);
    await api.post(`/admin/events/${savedId}/sponsors`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const { data } = await api.get(`/admin/events/${savedId}`);
    setSponsors(data.event.sponsors);
    (e.currentTarget as HTMLFormElement).reset();
  }
  async function removeSponsor(spId: string) {
    if (!confirm('Remover este patrocinador?')) return;
    await api.delete(`/admin/events/sponsors/${spId}`);
    setSponsors(sponsors.filter((s) => s.id !== spId));
  }

  async function uploadHero(e: React.ChangeEvent<HTMLInputElement>) {
    if (!savedId || !e.target.files?.[0]) return;
    const fd = new FormData();
    fd.append('hero', e.target.files[0]);
    const { data } = await api.post(`/admin/events/${savedId}/hero`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setEvent({ ...event, heroImageUrl: data.event.heroImageUrl });
  }

  async function uploadCardImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (!savedId || !e.target.files) return;
    const fd = new FormData();
    for (const f of e.target.files) fd.append('cards', f);
    const { data } = await api.post(`/admin/events/${savedId}/cards/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    alert(`${data.createdCount} cartões criados${data.skippedCount ? ` (${data.skippedCount} ignorados — sem cupom vazio)` : ''}`);
  }
  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    if (!savedId || !e.target.files?.[0]) return;
    const fd = new FormData();
    fd.append('csv', e.target.files[0]);
    const { data } = await api.post(`/admin/events/${savedId}/cards/import-numbers`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    alert(`${data.imported} linhas importadas. ${data.errors?.length ? `Erros:\n${data.errors.join('\n')}` : ''}`);
  }

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => nav('/events')} className="text-white/50 hover:text-gold text-sm mb-3">← Eventos</button>
      <h1 className="text-3xl font-bold mb-1">{isNew && !savedId ? 'Novo evento' : event.name || 'Editar evento'}</h1>
      <p className="text-white/40 text-sm mb-6">{savedId ? `ID: ${savedId}` : 'Preencha as informações básicas para começar'}</p>

      <div className="flex gap-1 border-b border-white/10 mb-6">
        {(['basic', 'draws', 'sponsors', 'cards'] as const).map((k) => (
          <button
            key={k}
            disabled={k !== 'basic' && !savedId}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-bold transition border-b-2 ${tab === k ? 'border-gold text-gold' : 'border-transparent text-white/60 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {k === 'basic' ? 'Informações' : k === 'draws' ? 'Sorteios' : k === 'sponsors' ? 'Patrocinadores' : 'Cartelas'}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nome (PT)</label><input className="input" value={event.name} onChange={(e) => setEvent({ ...event, name: e.target.value })} /></div>
            <div><label className="label">Nome (ES)</label><input className="input" value={event.nameEs} onChange={(e) => setEvent({ ...event, nameEs: e.target.value })} /></div>
          </div>
          <div><label className="label">Local</label><input className="input" value={event.location} onChange={(e) => setEvent({ ...event, location: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Descrição (PT)</label><textarea className="input min-h-[80px]" value={event.description ?? ''} onChange={(e) => setEvent({ ...event, description: e.target.value })} /></div>
            <div><label className="label">Descrição (ES)</label><textarea className="input min-h-[80px]" value={event.descriptionEs ?? ''} onChange={(e) => setEvent({ ...event, descriptionEs: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="label">Data do sorteio</label><input type="datetime-local" className="input" value={event.eventDate} onChange={(e) => setEvent({ ...event, eventDate: e.target.value })} /></div>
            <div><label className="label">Hora exibida</label><input className="input" value={event.startTime} onChange={(e) => setEvent({ ...event, startTime: e.target.value })} /></div>
            <div><label className="label">Nº de sorteios</label><input type="number" className="input" value={event.drawCount} onChange={(e) => setEvent({ ...event, drawCount: Number(e.target.value) })} /></div>
            <div><label className="label">Máximo de cupons</label><input type="number" className="input" value={event.maxCoupons} onChange={(e) => setEvent({ ...event, maxCoupons: Number(e.target.value) })} disabled={!isNew && !!savedId} /></div>
            <div><label className="label">Preço do cupom (Gs.)</label><input type="number" className="input" value={event.couponPrice} onChange={(e) => setEvent({ ...event, couponPrice: Number(e.target.value) })} /></div>
            <div><label className="label">Cartões por cupom</label><input type="number" className="input" value={event.cardsPerCoupon} onChange={(e) => setEvent({ ...event, cardsPerCoupon: Number(e.target.value) })} disabled={!isNew && !!savedId} /></div>
            <div><label className="label">Prêmio principal (Gs.)</label><input type="number" className="input" value={event.mainPrizeValue} onChange={(e) => setEvent({ ...event, mainPrizeValue: Number(e.target.value) })} /></div>
            <div><label className="label">Total em prêmios (Gs.)</label><input type="number" className="input" value={event.totalPrizeValue} onChange={(e) => setEvent({ ...event, totalPrizeValue: Number(e.target.value) })} /></div>
          </div>
          {savedId && (
            <div>
              <label className="label">Imagem de destaque</label>
              <input type="file" accept="image/*" onChange={uploadHero} className="input" />
              {event.heroImageUrl && <img src={event.heroImageUrl} alt="" className="w-32 h-32 object-cover rounded-xl mt-3" />}
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={saveBasic} disabled={saving} className="btn-gold">{saving ? '...' : isNew && !savedId ? 'Criar evento' : 'Salvar'}</button>
        </div>
      )}

      {tab === 'draws' && savedId && (
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Sorteios e prêmios</h3>
            <button onClick={addDraw} className="btn-ghost">+ Adicionar sorteio</button>
          </div>
          <div className="space-y-3">
            {draws.length === 0 && <p className="text-white/50 text-sm">Nenhum sorteio cadastrado.</p>}
            {draws.map((d, i) => (
              <div key={d.id ?? i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-1"><label className="label">Ordem</label><input type="number" className="input" value={d.order} onChange={(e) => updDraw(i, { order: Number(e.target.value) })} /></div>
                <div className="col-span-3"><label className="label">Prêmio (PT)</label><input className="input" value={d.prizeName} onChange={(e) => updDraw(i, { prizeName: e.target.value })} /></div>
                <div className="col-span-3"><label className="label">Prêmio (ES)</label><input className="input" value={d.prizeNameEs} onChange={(e) => updDraw(i, { prizeNameEs: e.target.value })} /></div>
                <div className="col-span-3"><label className="label">Valor (Gs.)</label><input type="number" className="input" value={d.prizeValue} onChange={(e) => updDraw(i, { prizeValue: Number(e.target.value) })} /></div>
                <div className="col-span-2"><button onClick={() => saveDraw(i)} className="btn-gold w-full">Salvar</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sponsors' && savedId && (
        <div className="space-y-6">
          <form onSubmit={uploadSponsor} className="card p-6 space-y-3">
            <h3 className="font-bold">Adicionar patrocinador</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="label">Nome</label><input name="name" required className="input" /></div>
              <div><label className="label">Website (opcional)</label><input name="websiteUrl" className="input" /></div>
              <div><label className="label">Logo (PNG/JPG)</label><input name="logo" type="file" accept="image/*" required className="input" /></div>
            </div>
            <button className="btn-gold">Adicionar</button>
          </form>
          <div className="card p-6">
            <h3 className="font-bold mb-4">{sponsors.length} patrocinadores cadastrados</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {sponsors.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-2 relative group">
                  <img src={s.logoUrl} alt={s.name} className="h-16 w-full object-contain" />
                  <p className="text-ink-900 text-[10px] truncate text-center mt-1">{s.name}</p>
                  <button onClick={() => removeSponsor(s.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'cards' && savedId && (
        <div className="space-y-6">
          <div className="card p-6 space-y-3">
            <h3 className="font-bold">Upload em massa de cartelas (imagens)</h3>
            <p className="text-white/50 text-sm">Cada imagem vira 1 cartão. Sistema agrupa automaticamente em cupons ({event.cardsPerCoupon} por cupom).</p>
            <input type="file" accept="image/*" multiple onChange={uploadCardImages} className="input" />
          </div>
          <div className="card p-6 space-y-3">
            <h3 className="font-bold">Importar números via CSV</h3>
            <p className="text-white/50 text-sm">Formato: <code className="bg-black px-2 py-1 rounded text-gold">cardNumber,drawOrder,n1,n2,n3,...</code></p>
            <input type="file" accept=".csv" onChange={importCsv} className="input" />
          </div>
        </div>
      )}
    </div>
  );
}
