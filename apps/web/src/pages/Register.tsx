import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AuthShell, Field } from './Login';

export default function Register() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ name: '', cedula: '', phone: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        preferredLanguage: i18n.language?.startsWith('es') ? 'es' : 'pt',
      });
      setSession(data);
      nav(params.get('redirect') ?? '/');
    } catch (e: any) {
      const resp = e.response?.data;
      if (resp?.details && Array.isArray(resp.details)) {
        const fe: Record<string, string> = {};
        for (const d of resp.details) fe[d.path] = d.message;
        setFieldErrors(fe);
        setError('Verifique os campos destacados');
      } else {
        setError(resp?.message ?? 'Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('auth.register')}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('auth.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={fieldErrors.name} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.cedula')} value={form.cedula} onChange={(v) => setForm({ ...form, cedula: v })} error={fieldErrors.cedula} />
          <Field label={t('auth.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={fieldErrors.phone} />
        </div>
        <Field label={t('auth.email')} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={fieldErrors.email} />
        <Field label={t('auth.password')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={fieldErrors.password} hint="Mínimo 6 caracteres" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full justify-center !py-3.5">
          {loading ? '...' : t('auth.submitRegister')}
        </button>
      </form>
      <Link to="/login" className="block text-center text-white/60 hover:text-gold text-sm mt-6">
        {t('auth.switchToLogin')}
      </Link>
    </AuthShell>
  );
}
