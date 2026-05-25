import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function Login() {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'ADMIN') {
        setError('Esta conta não tem permissão de administrador');
        setLoading(false);
        return;
      }
      setSession(data);
      nav('/');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 p-6">
      <div className="card p-10 w-full max-w-md">
        <p className="font-black text-gold tracking-wider text-sm mb-1">CATEDRAL</p>
        <h1 className="text-2xl font-bold mb-8">Painel Administrativo</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={loading} className="btn-gold w-full !py-3">{loading ? '...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}
