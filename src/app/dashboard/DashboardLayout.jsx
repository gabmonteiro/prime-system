"use client";
import { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { BrandLogo } from "../../context/brandingContext";
import Sidebar from "../../components/ui/Sidebar";
import { useAuth } from "../../context/authContext";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { EmptyState, LoadingState } from "../../components/ui/States";

/**
 * `permission` ("recurso:acao"): sem ela, mostra "Acesso negado" em vez da página.
 * (A API também bloqueia; isto evita telas quebradas ao acessar a URL direto.)
 */
export default function DashboardLayout({ children, permission }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, hasPermission } = useAuth();
  const [resource, action] = (permission || ":").split(":");
  const permitido = !permission || hasPermission(resource, action);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {/* min-w-0 impede que tabelas largas estiquem a página no celular */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior no mobile */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-3 bg-white/95 backdrop-blur border-b border-gray-200">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>
          <BrandLogo size="sm" />
          <span className="font-bold text-gray-800">Prime System</span>
        </header>
        <main className="flex-1 min-w-0 overflow-x-hidden p-3 sm:p-6">
          <div className="w-full max-w-[1600px] mx-auto">
            {loading || !user ? (
              <LoadingState />
            ) : permitido ? (
              children
            ) : (
              <EmptyState
                icon={LockClosedIcon}
                title="Acesso negado"
                text="Seu perfil não tem permissão para ver esta página. Fale com um administrador."
              >
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:underline"
                >
                  Voltar para o início
                </Link>
              </EmptyState>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
