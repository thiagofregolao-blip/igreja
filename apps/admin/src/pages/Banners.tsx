import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string | null;
  linkUrl?: string | null;
  order: number;
  isActive: boolean;
}

const MEDIA = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '');

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileMobile, setFileMobile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileMobileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await api.get('/admin/banners');
    setBanners(data.banners ?? []);
  }
  useEffect(() => { load(); }, []);

  async function upload() {
    if (!file) return;
    setError(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (fileMobile) fd.append('imageMobile', fileMobile);
      if (title) fd.append('title', title);
      if (linkUrl) fd.append('linkUrl', linkUrl);
      await api.post('/admin/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null); setFileMobile(null); setTitle(''); setLinkUrl('');
      if (fileRef.current) fileRef.current.value = '';
      if (fileMobileRef.current) fileMobileRef.current.value = '';
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao enviar banner');
    } finally { setLoading(false); }
  }

  async function toggle(b: Banner) {
    await api.patch(`/admin/banners/${b.id}`, { isActive: !b.isActive });
    load();
  }
  async function remove(b: Banner) {
    if (!confirm('Remover este banner?')) return;
    await api.delete(`/admin/banners/${b.id}`);
    load();
  }
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
      <h1 className="text-2xl font-black text-white mb-1">Banners do site</h1>
      <p className="text-white/50 text-sm mb-6">Imagens do carrossel principal (topo da home). Arraste a ordem com as setas.</p>

      {/* Upload */}
      <div className="bg-[#101010] border border-white/10 rounded-2xl p-5 mb-8">
        <p className="text-gold font-bold text-sm mb-3">Adicionar banner</p>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Imagem desktop (ideal 1920×819)</label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-white/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-ink-900 file:font-bold" />
            <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 mt-3">Imagem mobile (opcional · ideal 1080×1350)</label>
            <input ref={fileMobileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFileMobile(e.target.files?.[0] ?? null)}
              className="text-sm text-white/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-bold" />
          </div>
          <div>
            <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Link (opcional)</label>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button onClick={upload} disabled={!file || loading}
            className="bg-gold text-ink-900 font-bold rounded-lg px-5 py-2.5 text-sm disabled:opacity-40">
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título/descrição (opcional)"
          className="w-full mt-3 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {banners.length === 0 && <p className="text-white/40 text-sm">Nenhum banner. O site mostra a arte padrão até você adicionar.</p>}
        {banners.map((b, i) => (
          <div key={b.id} className="flex items-center gap-4 bg-[#101010] border border-white/10 rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/50 hover:text-white disabled:opacity-20 text-xs">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="text-white/50 hover:text-white disabled:opacity-20 text-xs">▼</button>
            </div>
            <img src={`${MEDIA}${b.imageUrl}`} alt="" className="w-40 h-[68px] object-cover rounded-lg bg-black/40" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{b.title || 'Sem título'}</p>
              {b.linkUrl && <p className="text-white/40 text-xs truncate">{b.linkUrl}</p>}
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'}`}>
                {b.isActive ? 'ATIVO' : 'OCULTO'}
              </span>
            </div>
            <button onClick={() => toggle(b)} className="text-xs font-bold text-white/70 hover:text-white border border-white/15 rounded-lg px-3 py-1.5">
              {b.isActive ? 'Ocultar' : 'Ativar'}
            </button>
            <button onClick={() => remove(b)} className="text-xs font-bold text-red-300 hover:text-red-200 border border-red-400/30 rounded-lg px-3 py-1.5">
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
