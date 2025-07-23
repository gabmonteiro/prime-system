import { useAuth } from '../context/authContext';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/servicos', label: 'Serviços' },
  { href: '/dashboard/despesas', label: 'Despesas' },
  { href: '/dashboard/lista-compras', label: 'Lista de Compras' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="bg-blue-50 border-r border-blue-200 min-h-screen w-64 flex flex-col justify-between p-6">
      <nav>
        <h2 className="text-xl font-bold text-blue-700 mb-6">Menu</h2>
        <ul className="space-y-4">
          {links.map(link => (
            <li key={link.href}>
              <button
                type="button"
                className="text-blue-700 hover:underline font-medium w-full text-left"
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        {user && (
          <div className="mb-4 text-sm text-blue-700">Olá, {user.name || user.email}</div>
        )}
        <button
          onClick={handleLogout}
          className="w-full py-2 rounded font-semibold text-white bg-red-600 hover:bg-red-700 transition"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
