import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const setLang = (lng: 'pt' | 'es') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <header className="relative z-30 w-full px-6 pt-6">
      <div className="max-w-[1480px] mx-auto">
        <nav
          className="rounded-full text-white flex items-center gap-3 md:gap-5 whitespace-nowrap"
          style={{
            background: '#0c0e14',
            padding: '10px 14px 10px 18px',
            boxShadow: '0 24px 50px -22px rgba(10,12,18,.55), inset 0 1px 0 rgba(255,255,255,.04)',
          }}
        >
          <Link to="/" className="flex items-center gap-3 shrink-0 pr-2">
            <Logo size={48} />
            <div className="hidden sm:block leading-tight">
              <div className="font-extrabold tracking-[.03em] text-[13.5px]">CATEDRAL SAGRADO CORAZÓN</div>
              <div className="text-[9.5px] tracking-[.3em] text-white/55 mt-0.5 font-semibold">
                KATUETÉ • PARAGUAY
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7 ml-3">
            {[
              [t('nav.home'), '/', true],
              [t('nav.prizes'), '/#prizes', false],
              ['PATROCINADORES', '/#patrocinadores', false],
              [t('nav.howItWorks'), '/#how', false],
              [t('nav.buy'), '/events', false],
              ...(user ? [[t('nav.myTickets'), '/my-tickets', false] as [string, string, boolean]] : []),
            ].map(([label, href, isHome]) => (
              <NavLink
                key={String(label)}
                to={String(href)}
                end={Boolean(isHome)}
                className={({ isActive }) =>
                  `relative text-[12.5px] font-heavy tracking-[.08em] uppercase py-1.5 transition ${
                    isActive ? 'text-white' : 'text-white/65 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute left-[8%] right-[8%] -bottom-0.5 h-[2px] bg-gold-500 rounded" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex-1" />

          {/* Lang */}
          <div className="flex items-center bg-[#181b25] rounded-full p-[3px] shrink-0">
            <button
              onClick={() => setLang('pt')}
              className={`px-3 py-[6px] rounded-full text-[12px] font-bold tracking-[.1em] transition ${
                i18n.language?.startsWith('pt')
                  ? 'text-[#1a1408]'
                  : 'text-white/65 hover:text-white'
              }`}
              style={
                i18n.language?.startsWith('pt')
                  ? {
                      background: 'linear-gradient(180deg,#f3c84a 0%, #d29a1f 100%)',
                      boxShadow: '0 6px 14px -6px rgba(230,184,54,.6), inset 0 1px 0 rgba(255,255,255,.45)',
                    }
                  : {}
              }
            >
              PT
            </button>
            <button
              onClick={() => setLang('es')}
              className={`px-3 py-[6px] rounded-full text-[12px] font-bold tracking-[.1em] transition ${
                i18n.language?.startsWith('es')
                  ? 'text-[#1a1408]'
                  : 'text-white/65 hover:text-white'
              }`}
              style={
                i18n.language?.startsWith('es')
                  ? {
                      background: 'linear-gradient(180deg,#f3c84a 0%, #d29a1f 100%)',
                      boxShadow: '0 6px 14px -6px rgba(230,184,54,.6), inset 0 1px 0 rgba(255,255,255,.45)',
                    }
                  : {}
              }
            >
              ES
            </button>
          </div>

          {/* User area */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {user.role === 'ADMIN' && (
                <a
                  href="/admin"
                  className="btn-ghost-dark !py-[8px] !px-3 text-[11px] !text-gold-400 !border-gold-500/40"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3z" />
                  </svg>
                  ADMIN
                </a>
              )}
              <Link to="/account" className="btn-ghost-dark !py-[8px] !px-3 text-[11px]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  nav('/');
                }}
                className="btn-ghost-dark !py-[8px] !px-3 text-[11px]"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-ghost-dark hidden md:inline-flex !py-[8px] !px-4 text-[11px]">
              Entrar
            </Link>
          )}

          <Link
            to="/events"
            className="inline-flex items-center gap-2.5 rounded-[14px] font-extrabold tracking-[.12em] text-[12.5px] text-[#1a1408] px-5 md:px-[22px] py-[12px] shrink-0"
            style={{
              background: 'linear-gradient(180deg, #f5cb4f 0%, #e3ae28 55%, #c98e17 100%)',
              boxShadow:
                '0 14px 28px -10px rgba(230,184,54,.55), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(135,90,10,.35)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
              <path d="M9 7v10" />
            </svg>
            {t('nav.cta')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
