import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface RadioConfig {
  id: string;
  streamUrl: string | null;
  nowPlayingUrl: string | null;
  stationName: string | null;
  coverImageUrl: string | null;
  isEnabled: boolean;
}

const MEDIA = (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '');
const fullUrl = (u?: string | null) => (u ? `${MEDIA}${u}` : '');

export default function Radio() {
  const [cfg, setCfg] = useState<RadioConfig | null>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [nowPlayingUrl, setNowPlayingUrl] = useState('');
  const [stationName, setStationName] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get('/admin/radio');
    const c: RadioConfig = data.config;
    setCfg(c);
    setStreamUrl(c.streamUrl ?? '');
    setNowPlayingUrl(c.nowPlayingUrl ?? '');
    setStationName(c.stationName ?? '');
    setIsEnabled(c.isEnabled);
    setCoverPreview(c.coverImageUrl ? fullUrl(c.coverImageUrl) : '');
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setError(null); setMsg(null); setBusy(true);
    try {
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        await api.post('/admin/radio/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCoverFile(null);
      }
      await api.patch('/admin/radio', { streamUrl, nowPlayingUrl, stationName, isEnabled });
      setMsg('Configuração salva.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setBusy(false);
    }
  }

  if (!cfg) return <div className="p-8 text-white/50">Carregando…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">WebRádio</h1>
        <p className="text-white/50 text-sm">Configure a transmissão (Sejahost). Cole as URLs do painel da sua rádio e ligue quando estiver no ar.</p>
      </div>

      {/* Status atual */}
      <div className="flex items-center gap-3 mb-6 bg-[#101010] border border-white/10 rounded-xl p-4">
        <span className={`w-3 h-3 rounded-full ${isEnabled && streamUrl ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{isEnabled && streamUrl ? 'Rádio ativa no site' : 'Rádio desligada'}</p>
          <p className="text-white/40 text-xs">{isEnabled && streamUrl ? 'O player aparece para os visitantes.' : 'O player fica oculto até você ligar e salvar.'}</p>
        </div>
        <button
          onClick={() => setIsEnabled((v) => !v)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}
        >
          {isEnabled ? 'Ligada' : 'Desligada'}
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Nome da rádio" hint="Aparece no player (ex.: Rádio Catedral)">
          <input value={stationName} onChange={(e) => setStationName(e.target.value)} placeholder="Rádio Catedral"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
        </Field>

        <Field label="URL do stream (áudio)" hint="Listen URL MP3 do painel VoxTream — ex.: http://servidor.sejahost.com.br:8000/stream">
          <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="http://...:8000/stream"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" />
        </Field>

        <Field label="URL de status / tocando agora (opcional)" hint="Shoutcast: …/stats?json=1  ·  Icecast: …/status-json.xsl. Usada só para mostrar a faixa e ouvintes.">
          <input value={nowPlayingUrl} onChange={(e) => setNowPlayingUrl(e.target.value)} placeholder="http://...:8000/stats?json=1"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" />
        </Field>

        <Field label="Capa da rádio (opcional)" hint="Imagem quadrada mostrada no player quando não há capa da faixa.">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">📻</span>}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }}
              className="text-sm text-white/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-ink-900 file:font-bold" />
          </div>
        </Field>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      {msg && <p className="text-emerald-400 text-sm mt-4">{msg}</p>}

      <button onClick={save} disabled={busy} className="mt-6 bg-gold text-ink-900 font-bold rounded-xl px-6 py-3 text-sm disabled:opacity-50">
        {busy ? 'Salvando…' : 'Salvar configuração'}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-white/30 text-[11px] mt-1.5">{hint}</p>}
    </div>
  );
}
