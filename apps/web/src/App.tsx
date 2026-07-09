import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Checkout from '@/pages/Checkout';
import MyTickets from '@/pages/MyTickets';
import Account from '@/pages/Account';
import Radio from '@/pages/Radio';
import Help from '@/pages/Help';
import { useAuthStore } from '@/store/auth';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    // preserva o destino para voltar após login/cadastro (ex.: /checkout)
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/radio" element={<Radio />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="/my-tickets" element={<Protected><MyTickets /></Protected>} />
        <Route path="/account" element={<Protected><Account /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
