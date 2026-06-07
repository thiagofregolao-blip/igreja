import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isPt = i18n.language?.startsWith('pt');

  const setLang = (lng: 'pt' | 'es') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const links: [string, string, boolean][] = [
    [t('nav.home'), '/', true],
    ['PATROCINADORES', '/#patrocinadores', false],
    [t('nav.howItWorks'), '/#how', false],
    [t('nav.buy'), '/events', false],
    [t('nav.radio'), '/radio', false],
    ...(user ? [[t('nav.myTickets'), '/my-tickets', false] as [string, string, boolean]] : []),
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white"
      style={{ borderBottom: '1px solid rgba(28,34,48,.1)', boxShadow: '0 6px 20px -16px rgba(20,28,45,.35)' }}
    >
      <div className="max-w-[1480px] mx-auto px-5 md:px-8 h-[68px] flex items-center gap-4 whitespace-nowrap">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <Logo size={42} />
          <div className="hidden sm:block leading-tight">
            <div className="font-serif font-bold text-[19px] text-ink-900 tracking-[.02em]">Catedral Sagrado Corazón</div>
            <div className="text-[8.5px] tracking-[.3em] text-muted font-bold mt-0.5">KATUETÉ • PARAGUAY</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-7 ml-6">
          {links.map(([label, href, isHome]) => (
            <NavLink
              key={String(label)}
              to={String(href)}
              end={Boolean(isHome)}
              className={({ isActive }) =>
                `relative text-[12.5px] font-heavy tracking-[.06em] uppercase py-1.5 transition ${
                  isActive ? 'text-ink-900' : 'text-muted hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && <span className="absolute left-[8%] right-[8%] -bottom-0.5 h-[2px] bg-gold-500 rounded" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Lang */}
        <div className="flex items-center gap-1.5 shrink-0 text-[12px] font-bold tracking-[.08em]">
          <button onClick={() => setLang('pt')} className={isPt ? 'text-ink-900' : 'text-muted hover:text-ink-900 transition'}>PT</button>
          <span className="text-line">·</span>
          <button onClick={() => setLang('es')} className={!isPt ? 'text-ink-900' : 'text-muted hover:text-ink-900 transition'}>ES</button>
        </div>

        {/* User area */}
        {user ? (
          <div className="hidden md:flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <a href="/admin" className="btn-outline-cream !py-[8px] !px-3 text-[11px] !text-gold-700 !border-gold-500/50">
                ADMIN
              </a>
            )}
            <Link to="/account" className="btn-outline-cream !py-[8px] !px-3 text-[11px]">
              {user.name.split(' ')[0]}
            </Link>
            <button onClick={() => { logout(); nav('/'); }} className="btn-outline-cream !py-[8px] !px-3 text-[11px]">
              Sair
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-outline-cream hidden md:inline-flex !py-[8px] !px-4 text-[11px]">
            Entrar
          </Link>
        )}

        {/* Comprar CTA */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2.5 rounded-[12px] font-extrabold tracking-[.08em] text-[12px] text-[#3a2a06] px-4 md:px-5 py-[11px] shrink-0"
          style={{
            background: 'linear-gradient(180deg, #f5cb4f 0%, #e3ae28 100%)',
            boxShadow: '0 12px 24px -10px rgba(199,147,32,.55), inset 0 1px 0 rgba(255,255,255,.45)',
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
            <path d="M9 7v10" />
          </svg>
          {t('nav.cta')}
        </Link>
      </div>
    </header>
  );
}
