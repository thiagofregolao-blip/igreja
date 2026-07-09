import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface CardsStats {
  maxCoupons: number;
  cardsPerCoupon: number;
  totalCoupons: number;
  couponsWithPdf: number;
  couponsWithoutPdf: number;
  totalCards: number;
  expectedCards: number;
  byStatus: Record<string, number>;
  availableForSale: number;
  blocked: number;
}

interface ImportFileResult {
  file: string;
  couponNumber?: number;
  cardNumbers?: [number, number];
  status: 'imported' | 'skipped' | 'error';
  reason?: string;
}

const BATCH_SIZE = 100; // o endpoint aceita até 200; 100 mantém a request leve

export default function Cards() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [stats, setStats] = useState<CardsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [force, setForce] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [report, setReport] = useState<{ imported: number; skipped: number; failed: number; errors: ImportFileResult[] } | null>(null);

  const [availableInput, setAvailableInput] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/events').then(({ data }) => {
      const evs = data.events ?? [];
      setEvents(evs);
      const active = evs.find((e: any) => e.isActive) ?? evs[0];
      if (active) setEventId(active.id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function loadStats() {
    try {
      const { data } = await api.get(`/admin/events/${eventId}/cards/stats`);
      setStats(data.stats);
      // sincroniza o input com o valor atual (livres+liberados)
      const onSale = (data.stats.availableForSale ?? 0);
      const blocked = (data.stats.blocked ?? 0);
      setAvailableInput(String(onSale + blocked > 0 ? onSale : onSale));
    } catch { setStats(null); }
  }

  async function saveAvailability() {
    const n = parseInt(availableInput, 10);
    if (isNaN(n) || n < 0) { setAvailMsg('Informe um número válido'); return; }
    setSavingAvail(true);
    setAvailMsg(null);
    try {
      const { data } = await api.put(`/admin/events/${eventId}/cards/availability`, { available: n });
      setAvailMsg(`✓ ${data.summary.availableForSale} disponíveis · ${data.summary.blocked} bloqueadas`);
      loadStats();
    } catch (e: any) {
      setAvailMsg(e?.response?.data?.message ?? 'Erro ao aplicar');
    } finally {
      setSavingAvail(false);
    }
  }

  const validPdfs = useMemo(
    () => files.filter((f) => /^\d+-\d+\.pdf$/i.test(f.name)),
    [files],
  );
  const invalidNames = files.length - validPdfs.length;

  async function runImport() {
    if (validPdfs.length === 0) return;
    setImporting(true);
    setReport(null);
    setProgress({ done: 0, total: validPdfs.length });

    const agg = { imported: 0, skipped: 0, failed: 0, errors: [] as ImportFileResult[] };
    // ordena por número para importar em ordem
    const sorted = [...validPdfs].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
      const batch = sorted.slice(i, i + BATCH_SIZE);
      const fd = new FormData();
      for (const f of batch) fd.append('pdfs', f);
      if (force) fd.append('force', 'true');
      try {
        const { data } = await api.post(`/admin/events/${eventId}/cards/import-bingos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        agg.imported += data.imported ?? 0;
        agg.skipped += data.skipped ?? 0;
        agg.failed += data.failed ?? 0;
        for (const r of (data.results ?? []) as ImportFileResult[]) {
          if (r.status === 'error') agg.errors.push(r);
        }
      } catch (e: any) {
        // lote inteiro falhou (ex.: erro de rede) — marca todos como erro
        agg.failed += batch.length;
        agg.errors.push({ file: `lote ${i / BATCH_SIZE + 1}`, status: 'error', reason: e?.response?.data?.message ?? 'Falha no envio do lote' });
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, sorted.length), total: sorted.length });
    }

    setReport(agg);
    setImporting(false);
    setFiles([]);
    loadStats();
  }

  if (loading) return <div className="p-8 text-gold">Carregando…</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cartelas</h1>
        <p className="text-white/40 text-sm">Importar e gerenciar as cartelas de bingo do evento</p>
      </div>

      {/* Seletor de evento */}
      <div className="card p-5 mb-6">
        <label className="block text-xs text-white/50 uppercase tracking-widest font-bold mb-2">Evento</label>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="input w-full">
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}{e.isActive ? ' (ativo)' : ''}</option>
          ))}
        </select>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Cupons com PDF" value={stats.couponsWithPdf} sub={`de ${stats.maxCoupons}`} highlight />
          <Stat label="Disponíveis p/ venda" value={stats.availableForSale} sub={`${stats.blocked} bloqueadas`} />
          <Stat label="Vendidos (real)" value={stats.byStatus.SOLD ?? 0} sub={`${stats.byStatus.RESERVED ?? 0} reservados`} />
          <Stat label="Faltam importar" value={stats.couponsWithoutPdf} sub="sem PDF" warn={stats.couponsWithoutPdf > 0} />
        </div>
      )}

      {/* Controle de venda / senso de urgência */}
      {stats && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-lg mb-1">Controle de venda</h2>
          <p className="text-white/50 text-sm mb-4">
            Defina quantas cartelas ficam <b className="text-white/80">disponíveis</b> para o público agora.
            As demais ficam <b className="text-white/80">bloqueadas</b> e aparecem como <b className="text-white/80">vendidas</b> na grade
            (escolhidas aleatoriamente, para simular vendas espalhadas). Vendas e reservas reais não são afetadas.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-widest font-bold mb-1.5">Disponíveis para venda</label>
              <input
                type="number" min={0} max={stats.availableForSale + stats.blocked}
                value={availableInput} onChange={(e) => setAvailableInput(e.target.value)}
                className="input w-40"
              />
            </div>
            <button onClick={saveAvailability} disabled={savingAvail} className="btn-gold disabled:opacity-40">
              {savingAvail ? 'Aplicando…' : 'Aplicar'}
            </button>
            <div className="flex gap-1.5">
              {[200, 400, 600].map((n) => (
                <button key={n} onClick={() => setAvailableInput(String(n))}
                        className="btn-ghost text-xs px-3 py-1.5">{n}</button>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs mt-3">
            Total de cartelas livres: {stats.availableForSale + stats.blocked} (bloqueadas + disponíveis).
            Conforme forem vendidas de verdade, aumente este número para liberar mais.
          </p>
          {availMsg && <p className="text-sm mt-3 text-gold font-semibold">{availMsg}</p>}
        </div>
      )}

      {/* Importação */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Importar PDFs das cartelas</h2>
        <p className="text-white/50 text-sm mb-4">
          Cada arquivo <code className="text-gold">NNNN-MMMM.pdf</code> vira 1 cupom com 2 cartelas.
          A numeração impressa é conferida contra o nome do arquivo. Pode selecionar todos os 1000 de uma vez.
        </p>

        <label className="block border-2 border-dashed border-white/15 hover:border-gold rounded-xl p-6 text-center cursor-pointer transition mb-4">
          <input
            type="file" accept="application/pdf" multiple
            onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setReport(null); }}
            className="hidden"
          />
          <p className="text-sm font-bold text-white/80">
            {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : 'Clique para selecionar os PDFs'}
          </p>
          {validPdfs.length > 0 && (
            <p className="text-white/40 text-xs mt-1">{validPdfs.length} com nome válido (NNNN-MMMM.pdf)</p>
          )}
          {invalidNames > 0 && (
            <p className="text-amber-300 text-xs mt-1">{invalidNames} arquivo(s) ignorado(s) por nome fora do padrão</p>
          )}
        </label>

        <label className="flex items-center gap-2 mb-4 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          Reimportar cupons já existentes (substitui imagens; só para cupons ainda disponíveis)
        </label>

        {importing && (
          <div className="mb-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gold transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="text-white/50 text-xs mt-1.5">{progress.done} / {progress.total} processados…</p>
          </div>
        )}

        <button onClick={runImport} disabled={importing || validPdfs.length === 0} className="btn-gold disabled:opacity-40">
          {importing ? 'Importando…' : `Importar ${validPdfs.length || ''} cartela(s)`}
        </button>
      </div>

      {/* Relatório */}
      {report && (
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-4">Resultado da importação</h2>
          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-emerald-300 font-bold">✓ {report.imported} importados</span>
            <span className="text-white/50">⏭ {report.skipped} pulados</span>
            <span className={report.failed > 0 ? 'text-red-300 font-bold' : 'text-white/50'}>✗ {report.failed} erros</span>
          </div>
          {report.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-h-72 overflow-y-auto">
              <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">Erros / divergências</p>
              <ul className="space-y-1 text-xs text-white/70">
                {report.errors.map((r, i) => (
                  <li key={i}><span className="text-red-300 font-mono">{r.file}</span>: {r.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, highlight, warn }: { label: string; value: number; sub?: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-1 ring-gold/40' : ''}`}>
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{label}</p>
      <p className={`text-2xl font-black mt-1 ${warn ? 'text-amber-300' : highlight ? 'text-gold' : ''}`}>{value.toLocaleString('pt-BR')}</p>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}
