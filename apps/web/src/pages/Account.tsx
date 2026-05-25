import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatGs } from '@/lib/format';

export default function Account() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const nav = useNavigate();
  const [stats, setStats] = useState<{ total: number; paid: number; pending: number; spent: number } | null>(null);

  useEffect(() => {
    api.get('/tickets/my').then((r) => {
      const tickets = r.data.tickets ?? [];
      setStats({
        total: tickets.length,
        paid: tickets.filter((t: any) => t.status === 'PAID').length,
        pending: tickets.filter((t: any) => t.status === 'PENDING').length,
        spent: tickets.filter((t: any) => t.status === 'PAID').reduce((s: number, t: any) => s + t.totalAmount, 0),
      });
    });
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-[40px] text-ink-900 tracking-tight mb-2">Minha Conta</h1>
      <p className="text-muted mb-9">Seus dados e histórico de compras na paróquia.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">
        {/* PROFILE CARD */}
        <div className="card-light rounded-[24px] p-8">
          <div className="flex items-center gap-5 mb-7 pb-7 border-b border-line">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl text-[#1a1408]"
                 style={{ background: 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 100%)', boxShadow: '0 14px 24px -8px rgba(230,184,54,.55)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl text-ink-900">{user.name}</h2>
              <p className="text-muted text-sm">{user.email}</p>
              {user.role === 'ADMIN' && (
                <span className="inline-block mt-2 text-[10px] bg-gold-100 text-gold-800 px-2.5 py-1 rounded-full font-extrabold tracking-widest">
                  ADMINISTRADOR
                </span>
              )}
            </div>
          </div>

          <h3 className="text-muted text-xs uppercase tracking-widest font-bold mb-4">Dados pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoLine label="Nome completo" value={user.name} />
            <InfoLine label="Email" value={user.email} />
            <InfoLine label="Cédula" value={user.cedula} />
            <InfoLine label="WhatsApp" value={user.phone} />
            <InfoLine label="Idioma preferido" value={user.preferredLanguage === 'es' ? 'Español' : 'Português'} />
            <InfoLine label="Tipo de conta" value={user.role === 'ADMIN' ? 'Administrador' : 'Cliente'} />
          </div>

          <div className="mt-8 pt-6 border-t border-line flex flex-wrap gap-3">
            {user.role === 'ADMIN' && (
              <a href="/admin" className="btn-gold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3z"/></svg>
                Abrir Painel Admin
              </a>
            )}
            <Link to="/my-tickets" className="btn-outline-cream">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/></svg>
              Meus bilhetes
            </Link>
            <button
              onClick={() => { logout(); nav('/'); }}
              className="ml-auto text-red-600 hover:text-red-700 text-sm font-semibold"
            >
              Sair da conta
            </button>
          </div>
        </div>

        {/* STATS CARD */}
        <div className="space-y-4">
          <div className="card-dark rounded-[20px] p-6 text-white">
            <h3 className="text-gold-500 text-xs uppercase tracking-widest font-extrabold mb-4">Resumo</h3>
            {stats ? (
              <>
                <StatRow label="Bilhetes pagos" value={String(stats.paid)} highlight />
                <StatRow label="Aguardando pagamento" value={String(stats.pending)} />
                <StatRow label="Total comprado" value={String(stats.total)} />
                <div className="border-t border-white/10 mt-3 pt-3">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-1">Total investido</p>
                  <p className="font-display text-2xl text-gold-card">{formatGs(stats.spent)}</p>
                </div>
              </>
            ) : (
              <p className="text-white/50 text-sm">Carregando…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-[11px] uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className="text-ink-900 font-semibold">{value}</p>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-white/60 text-sm">{label}</span>
      <span className={`font-extrabold ${highlight ? 'text-gold-500 text-xl' : 'text-white'}`}>{value}</span>
    </div>
  );
}
