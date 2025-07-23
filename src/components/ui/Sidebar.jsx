"use client";
import { useAuth } from '../../context/authContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CogIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  CogIcon as CogIconSolid, 
  CurrencyDollarIcon as CurrencyDollarIconSolid, 
  ShoppingCartIcon as ShoppingCartIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid';

const navigationLinks = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Visão geral do sistema'
  },
  { 
    href: '/dashboard/servicos', 
    label: 'Serviços', 
    icon: CogIcon,
    iconSolid: CogIconSolid,
    description: 'Gestão de serviços'
  },
  { 
    href: '/dashboard/despesas', 
    label: 'Despesas', 
    icon: CurrencyDollarIcon,
    iconSolid: CurrencyDollarIconSolid,
    description: 'Controle financeiro'
  },
  { 
    href: '/dashboard/lista-compras', 
    label: 'Lista de Compras', 
    icon: ShoppingCartIcon,
    iconSolid: ShoppingCartIconSolid,
    description: 'Compras futuras'
  },
  { 
    href: '/dashboard/usuarios', 
    label: 'Usuários', 
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    description: 'Gerenciar usuários'
  },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  function isActiveRoute(href) {
    return pathname === href;
  }

  return (
    <aside className="w-72 h-screen bg-gray-50 flex flex-col shadow-lg"> {/* Mudança 1: Fundo sutil e sombra mais forte */}
      {/* Logo Section */}
      <div className="p-8"> {/* Mudança 2: Mais padding, sem borda inferior */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md"> {/* Gradiente mais suave */}
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Prime System</h1> {/* Cor de texto mais sólida para o título */}
            <p className="text-xs text-gray-500 font-medium">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-6 space-y-2"> {/* Padding ajustado */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Menu Principal
          </h2>
          <ul className="space-y-1">
            {navigationLinks.map(link => {
              const isActive = isActiveRoute(link.href);
              const Icon = isActive ? link.iconSolid : link.icon;
              
              return (
                <li
                  key={link.href}
                  className="!border-0 !border-none bg-transparent rounded-xl"
                  style={{ border: 'none', background: 'transparent', boxShadow: 'none', margin: 0, padding: 0 }}
                >
                  <button
                    type="button"
                    onClick={() => router.push(link.href)}
                    className={`w-full flex items-center space-x-3 py-3 rounded-xl text-left transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-blue-100 bg-opacity-70 text-blue-800' // Fundo mais visível, mas ainda suave, texto mais escuro
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:bg-opacity-50' // Hover mais suave
                      }
                      ${isActive ? 'pl-2' : 'pl-3'}
                    `}
                  >
                    {isActive && ( // Indicador de ativo: barra lateral elegante
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-lg"></div>
                    )}
                    <Icon
                      className={`w-6 h-6 flex-shrink-0 transition-all duration-200 drop-shadow-sm ${
                        isActive 
                          ? 'text-blue-600' // cor do ícone ativo
                          : 'text-gray-400 group-hover:text-blue-500' // cor do ícone normal
                      }`}
                      style={{
                        backgroundColor: isActive ? '#fff' : 'transparent',
                        borderRadius: isActive ? '0.5rem' : undefined,
                        padding: isActive ? '0.25rem' : undefined,
                        boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.15)' : undefined,
                        color: isActive ? '#2563eb' : '#94a3b8', // azul para ativo, cinza para normal
                        border: 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        isActive ? 'text-blue-800' : 'text-gray-700 group-hover:text-gray-900' // Cor do texto principal
                      }`}>
                        {link.label}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-600' : 'text-gray-500' // Cor da descrição
                      }`}>
                        {link.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 pt-0 space-y-4"> {/* Mudança 3: Mais padding, sem borda superior */}
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100"> {/* Fundo branco, sombra sutil e borda muito leve */}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuário'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.email || 'user@empresa.com'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-600" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}