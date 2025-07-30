"use client";
import React from "react";
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
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  CogIcon as CogIconSolid, 
  CurrencyDollarIcon as CurrencyDollarIconSolid, 
  ShoppingCartIcon as ShoppingCartIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid
} from '@heroicons/react/24/solid';



  export default function Sidebar() {

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
    href: '/dashboard/tipos-servicos', 
    label: 'Tipos de Serviços', 
    icon: WrenchScrewdriverIcon,
    iconSolid: WrenchScrewdriverIconSolid,
    description: 'Configurar tipos'
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

  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  function isActiveRoute(href) {
    return pathname === href;
  }

  // Sidebar content for reuse
  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Prime System</h1>
            <p className="text-xs text-gray-500 font-medium">Dashboard</p>
          </div>
        </div>
        {/* Botão fechar só no mobile */}
        <button
          className="lg:hidden p-2 rounded-full hover:bg-gray-200 focus:outline-none"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-6 space-y-2">
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
                    onClick={() => {
                      router.push(link.href);
                      setOpen(false); // Fecha sidebar no mobile ao navegar
                    }}
                    className={`w-full flex items-center space-x-3 py-3 rounded-xl text-left transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-blue-100 bg-opacity-70 text-blue-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:bg-opacity-50'
                      }
                      ${isActive ? 'pl-2' : 'pl-3'}
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-lg"></div>
                    )}
                    <Icon
                      className={`w-6 h-6 flex-shrink-0 transition-all duration-200 drop-shadow-sm ${
                        isActive 
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-blue-500'
                      }`}
                      style={{
                        backgroundColor: isActive ? '#fff' : 'transparent',
                        borderRadius: isActive ? '0.5rem' : undefined,
                        padding: isActive ? '0.25rem' : undefined,
                        boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.15)' : undefined,
                        color: isActive ? '#2563eb' : '#94a3b8',
                        border: 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        isActive ? 'text-blue-800' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {link.label}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
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
      <div className="p-4 pt-0 space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-600" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botão de abrir sidebar no mobile - Fixo na tela */}
      <div 
        className={`fixed top-4 left-4 z-[99999] lg:hidden ${open ? 'invisible' : 'visible'}`}
      >
        <button
          className="p-2 bg-white rounded-full shadow-lg border border-gray-200 backdrop-blur-sm hover:bg-gray-50 transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Overlay e sidebar mobile */}
      <div
        className={`h-full fixed inset-0 z-[9990] transition-opacity duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'} lg:hidden`}
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={() => setOpen(false)}
      ></div>
      <aside
        className={`h-full fixed top-0 left-0 z-[9995] w-72 bg-gray-50 flex flex-col shadow-xl transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:w-72 h-screen min-h-screen overflow-y-auto`}
      >
        {sidebarContent}
      </aside>
    </>
  );
    
}
