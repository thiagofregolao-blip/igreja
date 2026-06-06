import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function Layout() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col py-6 px-4 shrink-0">
        <div className="px-2 mb-8">
          <p className="font-black text-gold tracking-wider text-sm leading-tight">CATEDRAL</p>
          <p className="text-white/40 text-[10px] tracking-[3px] mt-1">PANEL ADMIN</p>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            ['Dashboard', '/'],
            ['Eventos', '/events'],
            ['Banners', '/banners'],
            ['Pagamentos', '/payments'],
            ['Bilhetes', '/tickets'],
            ['Clientes', '/users'],
            ['Relatórios', '/reports'],
          ].map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-xl text-sm transition ${
                  isActive ? 'bg-gold text-ink-900 font-bold' : 'text-white/70 hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="border-t border-white/5 pt-4 px-2">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
            <button onClick={() => { logout(); nav('/login'); }} className="text-xs text-red-300 hover:text-red-200 mt-3">
              Sair
            </button>
          </div>
        )}
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
