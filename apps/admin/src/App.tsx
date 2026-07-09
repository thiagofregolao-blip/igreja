import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Events from '@/pages/Events';
import EventForm from '@/pages/EventForm';
import Cards from '@/pages/Cards';
import Payments from '@/pages/Payments';
import Tickets from '@/pages/Tickets';
import Users from '@/pages/Users';
import Reports from '@/pages/Reports';
import Banners from '@/pages/Banners';
import Radio from '@/pages/Radio';
import { useAuthStore } from '@/store/auth';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  if (!user || !token || user.role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventForm />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/banners" element={<Banners />} />
        <Route path="/radio" element={<Radio />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
