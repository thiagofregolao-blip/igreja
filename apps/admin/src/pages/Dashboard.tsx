import { useEffect, useState } from 'react';
import { api, formatGs } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { DashboardData } from '@catedral/types';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { api.get('/admin/dashboard').then((r) => setData(r.data)); }, []);
  if (!data) return <div className="p-8 text-gold">Carregando…</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-white/40 text-sm mb-8">Visão geral em tempo real</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Vendidos" value={data.totalSold.toString()} tint="emerald" />
        <Kpi label="Arrecadado" value={formatGs(data.totalRevenue)} tint="gold" big />
        <Kpi label="Pendentes" value={data.totalPending.toString()} tint="amber" />
        <Kpi label="Disponíveis" value={data.totalAvailable.toString()} tint="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold mb-4">Vendas (últimos 30 dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesByDay}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #f5b800', borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#f5b800" strokeWidth={2} dot={{ fill: '#f5b800', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-4">Últimas transações</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentTransactions.length === 0 && <p className="text-white/40 text-sm">Sem transações ainda.</p>}
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm bg-[#0a0a0a] rounded-xl p-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{tx.userName}</p>
                  <p className="text-white/40 text-xs truncate">{tx.eventName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gold font-bold">{formatGs(tx.amount)}</p>
                  <p className={`text-xs ${tx.status === 'CONFIRMED' ? 'text-emerald-400' : tx.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tint, big }: { label: string; value: string; tint: 'gold' | 'emerald' | 'amber' | 'blue'; big?: boolean }) {
  const colors = {
    gold: 'border-gold/40 bg-gold/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
  };
  return (
    <div className={`card p-5 border ${colors[tint]}`}>
      <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-black ${big ? 'text-2xl' : 'text-3xl'} text-white`}>{value}</p>
    </div>
  );
}
