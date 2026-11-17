"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import FilterBar, { SearchInput } from "../../../components/ui/FilterBar";
import Select from "../../../components/ui/Select";
import Pagination from "../../../components/ui/Pagination";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import ServicoFormModal from "../../../components/servicos/ServicoFormModal";
import PagamentoModal from "../../../components/servicos/PagamentoModal";
import StatusPagamento from "../../../components/servicos/StatusPagamento";
import useApiList, { useFilters } from "../../../hooks/useApiList";
import useLookups from "../../../hooks/useLookups";
import { api } from "../../../libs/fetcher";
import { formatMoney } from "../../../libs/money";
import {
  formatDate,
  formatMonthKey,
  getFiscalMonthKey,
  shiftMonthKey,
} from "../../../libs/dates";

const INITIAL_FILTERS = {
  q: "",
  status: "",
  mes: "",
  tipoServico: "",
  participante: "",
  forma: "",
};

export default function ServicosPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const { tipos, usuarios, contas, fiscalStart } = useLookups([
    "tipos",
    "usuarios",
    "contas",
    "config",
  ]);
  const { filters, setFilter, clear, page, setPage, activeCount } =
    useFilters(INITIAL_FILTERS);
  const {
    data: servicos,
    stats,
    pagination,
    loading,
    reload,
  } = useApiList("/api/servico", { ...filters, page, limit: 15 });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = hasPermission("servicos", "create");
  const canUpdate = hasPermission("servicos", "update");
  const canDelete = hasPermission("servicos", "delete");

  const mesesOptions = useMemo(() => {
    const atual = getFiscalMonthKey(new Date(), fiscalStart);
    return Array.from({ length: 24 }, (_, i) => {
      const k = shiftMonthKey(atual, -i);
      return { value: k, label: formatMonthKey(k) };
    });
  }, [fiscalStart]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api("/api/servico", {
        method: "DELETE",
        body: { id: toDelete._id },
      });
      toast("Serviço excluído!");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const participantesNomes = (s) =>
    (s.participantes || []).map((p) => p.name).join(", ");

  const acoes = (s, compact = false) => (
    <div
      className={`flex items-center ${compact ? "justify-end gap-1" : "gap-2"}`}
    >
      <button
        onClick={() => setPagamento(s)}
        className={
          compact
            ? `p-1.5 rounded-full ${s.pago ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`
            : "flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100"
        }
        title="Pagamento"
      >
        <BanknotesIcon className="h-4 w-4" />
        {!compact && <span className="ml-1">Pagamento</span>}
      </button>
      {canUpdate && (
        <button
          onClick={() => {
            setEditing(s);
            setFormOpen(true);
          }}
          className={
            compact
              ? "p-1.5 rounded-full text-blue-600 hover:bg-blue-50"
              : "flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100"
          }
          title="Editar"
        >
          <PencilIcon className="h-4 w-4" />
          {!compact && <span className="ml-1">Editar</span>}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setToDelete(s)}
          className={
            compact
              ? "p-1.5 rounded-full text-red-600 hover:bg-red-50"
              : "inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100"
          }
          title="Excluir"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // Divisória por mês fiscal (como na v1)
  const withDividers = servicos.map((s, idx) => {
    const mes = getFiscalMonthKey(s.data, fiscalStart);
    const prev =
      idx > 0 ? getFiscalMonthKey(servicos[idx - 1].data, fiscalStart) : null;
    return { s, mes, divider: idx === 0 || mes !== prev };
  });

  return (
    <DashboardLayout permission="servicos:read">
      <PageHeader
        icon={WrenchScrewdriverIcon}
        title="Serviços"
        subtitle="Gerencie os serviços e recebimentos"
      >
        {canCreate && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Serviço
          </button>
        )}
      </PageHeader>

      {/* Estatísticas de TODOS os serviços que batem com os filtros (não só da página) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={WrenchScrewdriverIcon}
          label="Serviços"
          value={stats?.total ?? 0}
          hint={stats ? `Ticket médio ${formatMoney(stats.ticketMedio)}` : ""}
          loading={!stats}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          color="purple"
          label="Valor total"
          value={formatMoney(stats?.valorTotal)}
          loading={!stats}
        />
        <StatCard
          icon={CheckCircleIcon}
          color="green"
          label="Recebido"
          value={formatMoney(stats?.recebido)}
          valueClassName="text-green-600"
          loading={!stats}
        />
        <StatCard
          icon={ClockIcon}
          color="orange"
          label="A receber"
          value={formatMoney(stats?.aReceber)}
          valueClassName="text-orange-600"
          hint={
            stats?.atrasado
              ? `${formatMoney(stats.atrasado)} atrasado`
              : "Nada atrasado"
          }
          loading={!stats}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Buscar cliente ou veículo"
        />
        <Select
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "", label: "Todos os status" },
            { value: "pago", label: "Pagos" },
            { value: "pendente", label: "Não pagos / parciais" },
            { value: "atrasado", label: "Com parcela atrasada" },
          ]}
        />
        <Select
          value={filters.mes}
          onChange={(v) => setFilter("mes", v)}
          options={[{ value: "", label: "Todos os meses" }, ...mesesOptions]}
        />
        <Select
          value={filters.tipoServico}
          onChange={(v) => setFilter("tipoServico", v)}
          options={[
            { value: "", label: "Todos os tipos" },
            { value: "sem-tipo", label: "Sem tipo" },
            ...tipos.map((t) => ({ value: t._id, label: t.nome })),
          ]}
        />
        <Select
          value={filters.participante}
          onChange={(v) => setFilter("participante", v)}
          options={[
            { value: "", label: "Todos os participantes" },
            ...usuarios.map((u) => ({ value: u._id, label: u.name })),
          ]}
        />
        <Select
          value={filters.forma}
          onChange={(v) => setFilter("forma", v)}
          options={[
            { value: "", label: "À vista e parcelado" },
            { value: "avista", label: "À vista" },
            { value: "parcelado", label: "Parcelado" },
          ]}
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && servicos.length === 0 ? (
          <LoadingState text="Carregando serviços..." />
        ) : servicos.length === 0 ? (
          <EmptyState
            icon={WrenchScrewdriverIcon}
            title="Nenhum serviço encontrado"
            text={
              activeCount
                ? "Tente ajustar os filtros."
                : "Comece criando seu primeiro serviço."
            }
          />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            {/* Mobile */}
            <div className="lg:hidden p-3 space-y-3">
              {withDividers.map(({ s, mes, divider }) => (
                <React.Fragment key={s._id}>
                  {divider && <MonthDivider label={formatMonthKey(mes)} />}
                  <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <ClienteLink s={s} />
                        <p className="text-sm text-gray-600 truncate">
                          {s.nomeCarro}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.semTipo
                            ? "Sem tipo"
                            : s.tipoServico?.nome || "N/A"}{" "}
                          · {formatDate(s.data)}
                        </p>
                        {s.participantes?.length > 0 && (
                          <p className="text-xs text-gray-400 truncate">
                            {participantesNomes(s)}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {formatMoney(s.valorTotal)}
                        </div>
                        <StatusPagamento servico={s} />
                      </div>
                    </div>
                    {acoes(s)}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Cliente / Veículo",
                      "Tipo",
                      "Valor",
                      "Data",
                      "Participantes",
                      "Pagamento",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 xl:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withDividers.map(({ s, mes, divider }) => (
                    <React.Fragment key={s._id}>
                      {divider && (
                        <tr>
                          <td colSpan={7} className="py-2 px-4">
                            <MonthDivider label={formatMonthKey(mes)} />
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 xl:px-6 py-3">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3 min-w-0">
                              <ClienteLink s={s} />
                              <div className="text-sm text-gray-500">
                                {s.nomeCarro}
                                {s.carroRef?.placa
                                  ? ` · ${s.carroRef.placa}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-3 text-sm text-gray-900">
                          {s.semTipo ? (
                            <span className="text-orange-600 font-medium">
                              Sem tipo
                            </span>
                          ) : (
                            s.tipoServico?.nome || "N/A"
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMoney(s.valorTotal)}
                          {s.valorPersonalizado != null && !s.semTipo && (
                            <span className="ml-1 text-xs text-blue-600">
                              (pers.)
                            </span>
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(s.data)}
                        </td>
                        <td className="px-4 xl:px-6 py-3 text-sm text-gray-900 max-w-[220px]">
                          {s.participantes?.length ? (
                            <span className="flex items-center">
                              <UsersIcon className="h-4 w-4 text-gray-400 mr-1 shrink-0" />
                              <span className="truncate">
                                {participantesNomes(s)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-3 whitespace-nowrap">
                          <button
                            onClick={() => setPagamento(s)}
                            title="Ver pagamento"
                          >
                            <StatusPagamento servico={s} />
                          </button>
                        </td>
                        <td className="px-4 xl:px-6 py-3 whitespace-nowrap">
                          {acoes(s, true)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

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

      <ServicoFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        servico={editing}
        tipos={tipos}
        usuarios={usuarios}
        contas={contas}
        onSaved={reload}
      />
      <PagamentoModal
        isOpen={!!pagamento}
        onClose={() => setPagamento(null)}
        servico={pagamento}
        contas={contas}
        canEdit={canUpdate}
        onSaved={reload}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        danger
        title="Excluir serviço"
        confirmLabel="Excluir"
        message={
          toDelete &&
          `Excluir o serviço de ${toDelete.cliente} (${toDelete.nomeCarro}) em ${formatDate(toDelete.data)}? Os recebimentos dele também saem dos saldos das contas.`
        }
      />
    </DashboardLayout>
  );
}

function MonthDivider({ label }) {
  return (
    <div className="flex items-center">
      <div className="flex-1 border-t border-gray-300" />
      <span className="mx-4 text-xs font-semibold text-gray-500">{label}</span>
      <div className="flex-1 border-t border-gray-300" />
    </div>
  );
}

function ClienteLink({ s }) {
  if (!s.clienteRef?._id) {
    return (
      <span className="text-sm font-medium text-gray-900">{s.cliente}</span>
    );
  }
  return (
    <Link
      href={`/dashboard/clientes/${s.clienteRef._id}`}
      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
    >
      {s.cliente}
    </Link>
  );
}
