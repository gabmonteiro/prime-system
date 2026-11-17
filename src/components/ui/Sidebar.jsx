"use client";
import { useAuth } from "../../context/authContext";
import { useRouter, usePathname } from "next/navigation";
import {
  HomeIcon,
  CogIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  IdentificationIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  CogIcon as CogIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  IdentificationIcon as IdentificationIconSolid,
  BuildingLibraryIcon as BuildingLibraryIconSolid,
} from "@heroicons/react/24/solid";
import { ROLE_LABELS } from "../../libs/permissions";
import { BrandLogo } from "../../context/brandingContext";

const LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: "Visão geral do sistema",
    permission: "dashboard:read",
  },
  {
    href: "/dashboard/servicos",
    label: "Serviços",
    icon: CogIcon,
    iconSolid: CogIconSolid,
    description: "Gestão de serviços",
    permission: "servicos:read",
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: IdentificationIcon,
    iconSolid: IdentificationIconSolid,
    description: "Clientes e veículos",
    permission: "clientes:read",
  },
  {
    href: "/dashboard/despesas",
    label: "Despesas",
    icon: CurrencyDollarIcon,
    iconSolid: CurrencyDollarIconSolid,
    description: "Controle financeiro",
    permission: "despesas:read",
  },
  {
    href: "/dashboard/contas",
    label: "Contas",
    icon: BuildingLibraryIcon,
    iconSolid: BuildingLibraryIconSolid,
    description: "Saldos e transferências",
    permission: "contas:read",
  },
  {
    href: "/dashboard/tipos-servicos",
    label: "Tipos de Serviços",
    icon: WrenchScrewdriverIcon,
    iconSolid: WrenchScrewdriverIconSolid,
    description: "Configurar tipos",
    permission: "tipos-servicos:read",
  },
  {
    href: "/dashboard/lista-compras",
    label: "Lista de Compras",
    icon: ShoppingCartIcon,
    iconSolid: ShoppingCartIconSolid,
    description: "Compras futuras",
    permission: "lista-compras:read",
  },
  {
    href: "/dashboard/usuarios",
    label: "Usuários",
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    description: "Gerenciar usuários",
    permission: "usuarios:read",
  },
  {
    href: "/dashboard/auditoria",
    label: "Auditoria",
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    description: "Logs do sistema",
    permission: "auditoria:read",
  },
  {
    href: "/dashboard/configuracoes",
    label: "Configurações",
    icon: ShieldCheckIcon,
    iconSolid: ShieldCheckIconSolid,
    description: "Configurações do sistema",
    permission: "configuracoes:read",
  },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const links = LINKS.filter((link) => {
    const [resource, action] = link.permission.split(":");
    return hasPermission(resource, action);
  });

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isActive = (href) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-[9990] bg-black/40 transition-opacity duration-300 lg:hidden ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 z-[9995] w-72 h-screen bg-gray-50 flex flex-col shadow-xl lg:shadow-none lg:border-r lg:border-gray-200 overflow-y-auto transform transition-transform duration-300 ease-out lg:sticky lg:translate-x-0 shrink-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 lg:p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BrandLogo size="md" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Prime System</h1>
              <p className="text-xs text-gray-500 font-medium">Dashboard</p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-full hover:bg-gray-200"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <nav className="flex-1 px-5 py-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Menu Principal
          </h2>
          <ul className="space-y-1">
            {links.map((link) => {
              const active = isActive(link.href);
              const Icon = active ? link.iconSolid : link.icon;
              return (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(link.href);
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                      active
                        ? "bg-blue-100/70 text-blue-800 pl-2"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 pl-3"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-lg" />
                    )}
                    <Icon
                      className={`w-6 h-6 flex-shrink-0 transition-all duration-200 ${
                        active
                          ? "text-blue-600 bg-white rounded-lg p-1 shadow-[0_2px_8px_rgba(59,130,246,0.15)]"
                          : "text-gray-400 group-hover:text-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm ${active ? "text-blue-800" : "text-gray-700 group-hover:text-gray-900"}`}
                      >
                        {link.label}
                      </div>
                      <div
                        className={`text-xs ${active ? "text-blue-600" : "text-gray-500"}`}
                      >
                        {link.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Usuário"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {ROLE_LABELS[user?.role] || user?.email}
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
      </aside>
    </>
  );
}
