import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/admin/users');
    setUsers(data.users);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleBlock(id: string) {
    if (!confirm('Confirmar bloqueio/desbloqueio?')) return;
    await api.put(`/admin/users/${id}/block`);
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-1">Clientes</h1>
      <p className="text-white/40 text-sm mb-6">{users.length} clientes cadastrados</p>

      {loading && <p className="text-gold">Carregando…</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-white/50 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Cédula</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">WhatsApp</th>
              <th className="px-4 py-3 text-center">Bilhetes</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-bold">{u.name}</td>
                <td className="px-4 py-3 text-white/70">{u.cedula}</td>
                <td className="px-4 py-3 text-white/70">{u.email}</td>
                <td className="px-4 py-3 text-white/70">{u.phone}</td>
                <td className="px-4 py-3 text-center text-gold font-bold">{u._count?.tickets ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${u.isBlocked ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {u.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleBlock(u.id)} className={u.isBlocked ? 'btn-gold !py-1.5 !px-3 text-xs' : 'btn-danger !py-1.5 !px-3 text-xs'}>
                    {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
