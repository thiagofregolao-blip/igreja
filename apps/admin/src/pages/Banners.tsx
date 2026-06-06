import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  title?: string | null;
  linkUrl?: string | null;
  order: number;
  isActive: boolean;
}

const MEDIA = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '');
const fullUrl = (u?: string | null) => (u ? `${MEDIA}${u}` : '');

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editor, setEditor] = useState<{ banner: Banner | null } | null>(null);

  async function load() {
    const { data } = await api.get('/admin/banners');
    setBanners(data.banners ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(b: Banner) { await api.patch(`/admin/banners/${b.id}`, { isActive: !b.isActive }); load(); }
  async function remove(b: Banner) { if (!confirm('Remover este banner?')) return; await api.delete(`/admin/banners/${b.id}`); load(); }
  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= banners.length) return;
    const ids = banners.map((b) => b.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setBanners((prev) => { const c = [...prev]; [c[i], c[j]] = [c[j], c[i]]; return c; });
    await api.post('/admin/banners/reorder', { ids });
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Banners do site</h1>
          <p className="text-white/50 text-sm">Carrossel do topo da home. Cada banner tem uma arte <b className="text-white/70">Web</b> e uma <b className="text-white/70">Mobile</b>.</p>
        </div>
        <button onClick={() => setEditor({ banner: null })} className="bg-gold text-ink-900 font-bold rounded-xl px-5 py-2.5 text-sm">+ Novo banner</button>
      </div>

      <div className="space-y-3">
        {banners.length === 0 && <p className="text-white/40 text-sm">Nenhum banner. O site mostra a arte padrão até você adicionar.</p>}
        {banners.map((b, i) => (
          <div key={b.id} className="flex items-center gap-4 bg-[#101010] border border-white/10 rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/50 hover:text-white disabled:opacity-20 text-xs">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="text-white/50 hover:text-white disabled:opacity-20 text-xs">▼</button>
            </div>
            <img src={fullUrl(b.imageUrl)} alt="" className="w-36 h-[60px] object-cover rounded-lg bg-black/40" />
            <div className="w-12 h-[60px] rounded-lg bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
              {b.mobileImageUrl
                ? <img src={fullUrl(b.mobileImageUrl)} alt="" className="w-full h-full object-cover" />
                : <span className="text-[8px] text-white/30 text-center leading-tight px-0.5">sem<br/>mobile</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{b.title || 'Sem título'}</p>
              {b.linkUrl && <p className="text-white/40 text-xs truncate">{b.linkUrl}</p>}
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'}`}>
                {b.isActive ? 'ATIVO' : 'OCULTO'}
              </span>
            </div>
            <button onClick={() => setEditor({ banner: b })} className="text-xs font-bold text-ink-900 bg-gold rounded-lg px-3 py-1.5">Editar</button>
            <button onClick={() => toggle(b)} className="text-xs font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5">{b.isActive ? 'Ocultar' : 'Ativar'}</button>
            <button onClick={() => remove(b)} className="text-xs font-bold text-red-300 hover:text-red-200 border border-red-400/30 rounded-lg px-3 py-1.5">Excluir</button>
          </div>
        ))}
      </div>

      {editor && <BannerEditor banner={editor.banner} onClose={() => setEditor(null)} onSaved={() => { load(); setEditor(null); }} />}
    </div>
  );
}

function BannerEditor({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !banner;
  const [tab, setTab] = useState<'web' | 'mobile'>('web');
  const [title, setTitle] = useState(banner?.title ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '');
  const [webFile, setWebFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [webPreview, setWebPreview] = useState(banner ? fullUrl(banner.imageUrl) : '');
  const [mobilePreview, setMobilePreview] = useState(banner?.mobileImageUrl ? fullUrl(banner.mobileImageUrl) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null); setBusy(true);
    try {
      if (isNew) {
        if (!webFile) { setTab('web'); setError('Envie a imagem Web (obrigatória).'); setBusy(false); return; }
        const fd = new FormData();
        fd.append('image', webFile);
        if (mobileFile) fd.append('imageMobile', mobileFile);
        if (title) fd.append('title', title);
        if (linkUrl) fd.append('linkUrl', linkUrl);
        await api.post('/admin/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (webFile || mobileFile) {
          const fd = new FormData();
          if (webFile) fd.append('image', webFile);
          if (mobileFile) fd.append('imageMobile', mobileFile);
          await api.post(`/admin/banners/${banner!.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        await api.patch(`/admin/banners/${banner!.id}`, { title, linkUrl });
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }} onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">{isNew ? 'Novo banner' : 'Editar banner'}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('web')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'web' ? 'bg-gold text-ink-900' : 'bg-white/5 text-white/60'}`}>🖥️ Web</button>
          <button onClick={() => setTab('mobile')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'mobile' ? 'bg-gold text-ink-900' : 'bg-white/5 text-white/60'}`}>📱 Mobile</button>
        </div>

        {tab === 'web' && (
          <Slot
            label="Imagem Web · horizontal (ideal 1920×819)"
            aspect="1920 / 819"
            preview={webPreview}
            onPick={(f) => { setWebFile(f); setWebPreview(URL.createObjectURL(f)); }}
          />
        )}
        {tab === 'mobile' && (
          <Slot
            label="Imagem Mobile · vertical (ideal 1080×1350)"
            aspect="4 / 5"
            preview={mobilePreview}
            onPick={(f) => { setMobileFile(f); setMobilePreview(URL.createObjectURL(f)); }}
          />
        )}

        <div className="mt-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link ao clicar (opcional) — https://..."
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/70 border border-white/15">Cancelar</button>
          <button onClick={save} disabled={busy} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gold text-ink-900 disabled:opacity-50">
            {busy ? 'Salvando…' : isNew ? 'Criar banner' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Slot({ label, aspect, preview, onPick }: { label: string; aspect: string; preview: string; onPick: (f: File) => void }) {
  return (
    <div>
      <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">{label}</label>
      <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 mb-2" style={{ aspectRatio: aspect }}>
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-contain" />
          : <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">Sem imagem</div>}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        className="text-sm text-white/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-ink-900 file:font-bold" />
    </div>
  );
}
