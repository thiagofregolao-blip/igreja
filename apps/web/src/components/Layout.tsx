import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { RadioPlayer } from './RadioPlayer';

export function Layout() {
  return (
    <div className="min-h-screen text-ink-900 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <RadioPlayer />
    </div>
  );
}
