"use client";
import { useState } from "react";
import Link from "next/link";
import {
  IdentificationIcon,
  PlusIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ReceiptPercentIcon,
  ChevronRightIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import FilterBar, { SearchInput } from "../../../components/ui/FilterBar";
import Pagination from "../../../components/ui/Pagination";
import Badge from "../../../components/ui/Badge";
import { EmptyState, LoadingState } from "../../../components/ui/States";
import ClienteFormModal from "../../../components/clientes/ClienteFormModal";
import useApiList, { useFilters } from "../../../hooks/useApiList";
import { formatMoney } from "../../../libs/money";
import { formatDate } from "../../../libs/dates";

export default function ClientesPage() {
  const { hasPermission } = useAuth();
  const { filters, setFilter, clear, page, setPage, activeCount } = useFilters({
    q: "",
  });
  const { data, stats, pagination, loading, reload } = useApiList(
    "/api/clientes",
    {
      ...filters,
      page,
      limit: 12,
    },
  );
  const [formOpen, setFormOpen] = useState(false);

  return (
    <DashboardLayout permission="clientes:read">
      <PageHeader
        icon={IdentificationIcon}
        color="indigo"
        title="Clientes"
        subtitle="Clientes, veículos e histórico de serviços"
      >
        {hasPermission("clientes", "create") && (
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Cliente
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={IdentificationIcon}
          color="indigo"
          label="Clientes"
          value={stats?.clientes ?? 0}
          loading={!stats}
        />
        <StatCard
          icon={TruckIcon}
          label="Veículos"
          value={stats?.carros ?? 0}
          loading={!stats}
        />
        <StatCard
          icon={WrenchScrewdriverIcon}
          color="purple"
          label="Serviços"
          value={stats?.servicos ?? 0}
          loading={!stats}
        />
        <StatCard
          icon={ReceiptPercentIcon}
          color="green"
          label="Média por cliente"
          value={formatMoney(stats?.ticketMedioCliente)}
          loading={!stats}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Nome, telefone, modelo ou placa"
          className="sm:col-span-2"
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && data.length === 0 ? (
          <LoadingState text="Carregando clientes..." />
        ) : data.length === 0 ? (
          <EmptyState
            icon={IdentificationIcon}
            title="Nenhum cliente encontrado"
            text={
              activeCount
                ? "Tente outra busca."
                : "Clientes são criados automaticamente ao lançar serviços."
            }
          />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <ul className="divide-y divide-gray-100">
              {data.map((c) => (
                <li key={c._id}>
                  <Link
                    href={`/dashboard/clientes/${c._id}`}
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-semibold">
                        {c.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {c.nome}
                        </span>
                        {c.pendentes > 0 && (
                          <Badge color="orange">{c.pendentes} a receber</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {c.carros.length
                          ? c.carros
                              .map(
                                (car) =>
                                  car.modelo +
                                  (car.placa ? ` (${car.placa})` : ""),
                              )
                              .join(", ")
                          : "Sem veículos"}
                      </div>
                      {c.telefone && (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3" />
                          {c.telefone}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(c.valorTotal)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.servicos} serviço(s)
                        {c.ultimoServico &&
                          ` · último ${formatDate(c.ultimoServico)}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0 sm:hidden">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(c.valorTotal)}
                      </div>
                      <div className="text-xs text-gray-500">{c.servicos}x</div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-300 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
            {pagination.totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <ClienteFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
    </DashboardLayout>
  );
}
