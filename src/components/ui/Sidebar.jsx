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
    <aside className="w-72 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-primary">Prime System</h1>
            <p className="text-xs text-gray-500 font-medium">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Menu Principal
          </h2>
          <ul className="space-y-1">
            {navigationLinks.map(link => {
              const isActive = isActiveRoute(link.href);
              const Icon = isActive ? link.iconSolid : link.icon;
              
              return (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => router.push(link.href)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        isActive ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {link.label}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {link.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100 space-y-4">
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
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
