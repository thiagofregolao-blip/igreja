import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function Login() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [params] = useSearchParams();
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
      setSession(data);
      const redirect = params.get('redirect');
      if (redirect) {
        nav(redirect);
      } else if (data.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        nav('/');
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('auth.login')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label={t('auth.password')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full justify-center !py-[14px]">
          {loading ? '...' : t('auth.submit')}
        </button>
      </form>
      <Link to="/register" className="block text-center text-muted hover:text-gold-700 text-sm mt-6 font-semibold">
        {t('auth.switchToRegister')}
      </Link>
    </AuthShell>
  );
}

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[78vh] flex items-center justify-center px-6 py-12">
      <div className="card-light rounded-[28px] p-8 md:p-10 w-full max-w-md">
        <h1 className="font-display text-ink-900 text-[34px] text-center mb-1 tracking-tight">{title}</h1>
        <div className="divider-gold w-32 mx-auto mb-7" />
        {children}
      </div>
    </div>
  );
}

export function Field({
  label, type = 'text', value, onChange, error, hint,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-muted mb-1.5 tracking-[.22em] uppercase font-bold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`input-cream ${error ? '!border-red-500 focus:!border-red-500' : ''}`}
      />
      {error && <span className="block text-red-600 text-xs mt-1.5 font-semibold">{error}</span>}
      {!error && hint && <span className="block text-muted text-xs mt-1.5">{hint}</span>}
    </label>
  );
}
