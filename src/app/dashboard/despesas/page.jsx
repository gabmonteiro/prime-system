"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  ReceiptRefundIcon,
  UsersIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import FilterBar, { SearchInput } from "../../../components/ui/FilterBar";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import DatePicker from "../../../components/ui/DatePicker";
import Pagination from "../../../components/ui/Pagination";
import Badge from "../../../components/ui/Badge";
import Field, { inputClass } from "../../../components/ui/Field";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import { FormButtons } from "../../../components/clientes/ClienteFormModal";
import ContaSelect from "../../../components/servicos/ContaSelect";
import useApiList, { useFilters } from "../../../hooks/useApiList";
import useLookups from "../../../hooks/useLookups";
import { api } from "../../../libs/fetcher";
import { formatMoney } from "../../../libs/money";
import {
  formatDate,
  formatMonthKey,
  getFiscalMonthKey,
  shiftMonthKey,
  todayYmd,
  toYmd,
} from "../../../libs/dates";

const TIPOS = {
  compra: { label: "Compra", color: "blue" },
  gasto: { label: "Gasto", color: "orange" },
  retirada: { label: "Retirada", color: "purple" },
};

export default function DespesasPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const { contas, fiscalStart } = useLookups(["contas", "config"]);
  const { filters, setFilter, clear, page, setPage, activeCount } = useFilters({
    q: "",
    tipo: "",
    conta: "",
    mes: "",
  });
  const { data, stats, pagination, loading, reload } = useApiList(
    "/api/despesa",
    {
      ...filters,
      page,
      limit: 15,
    },
  );
  const [modal, setModal] = useState({ open: false, despesa: null });
  const [toDelete, setToDelete] = useState(null);

  const mesesOptions = useMemo(() => {
    const atual = getFiscalMonthKey(new Date(), fiscalStart);
    return Array.from({ length: 24 }, (_, i) => {
      const k = shiftMonthKey(atual, -i);
      return { value: k, label: formatMonthKey(k) };
    });
  }, [fiscalStart]);

  async function confirmDelete() {
    try {
      await api("/api/despesa", {
        method: "DELETE",
        body: { id: toDelete._id },
      });
      toast("Despesa excluída!");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // Retiradas de sócios só podem ser mexidas por gerente/admin (despesas:manage)
  const podeRetirada = hasPermission("despesas", "manage");
  const acoes = (d) => (
    <div className="flex items-center justify-end gap-1">
      {hasPermission("despesas", "update") &&
        (d.tipo !== "retirada" || podeRetirada) && (
          <button
            onClick={() => setModal({ open: true, despesa: d })}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Editar"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      {hasPermission("despesas", "delete") &&
        (d.tipo !== "retirada" || podeRetirada) && (
          <button
            onClick={() => setToDelete(d)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
            title="Excluir"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
    </div>
  );

  return (
    <DashboardLayout permission="despesas:read">
      <PageHeader
        icon={CurrencyDollarIcon}
        color="red"
        title="Despesas"
        subtitle="Compras, gastos e retiradas dos sócios"
      >
        {hasPermission("despesas", "create") && (
          <button
            onClick={() => setModal({ open: true, despesa: null })}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Nova Despesa
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={CurrencyDollarIcon}
          color="red"
          label="Total"
          value={formatMoney(stats?.valorTotal)}
          valueClassName="text-red-600"
          hint={`${stats?.total ?? 0} lançamentos`}
          loading={!stats}
        />
        <StatCard
          icon={ShoppingBagIcon}
          label="Compras"
          value={formatMoney(stats?.compras)}
          loading={!stats}
        />
        <StatCard
          icon={ReceiptRefundIcon}
          color="orange"
          label="Gastos"
          value={formatMoney(stats?.gastos)}
          loading={!stats}
        />
        <StatCard
          icon={UsersIcon}
          color="purple"
          label="Retiradas"
          value={formatMoney(stats?.retiradas)}
          hint="não contam no lucro"
          loading={!stats}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Buscar despesa"
        />
        <Select
          value={filters.tipo}
          onChange={(v) => setFilter("tipo", v)}
          options={[
            { value: "", label: "Todos os tipos" },
            { value: "operacional", label: "Compras e gastos" },
            { value: "compra", label: "Compras" },
            { value: "gasto", label: "Gastos" },
            { value: "retirada", label: "Retiradas" },
          ]}
        />
        <Select
          value={filters.conta}
          onChange={(v) => setFilter("conta", v)}
          options={[
            { value: "", label: "Todas as contas" },
            ...contas.map((c) => ({ value: c._id, label: c.nome })),
          ]}
        />
        <Select
          value={filters.mes}
          onChange={(v) => setFilter("mes", v)}
          options={[{ value: "", label: "Todos os meses" }, ...mesesOptions]}
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && data.length === 0 ? (
          <LoadingState text="Carregando despesas..." />
        ) : data.length === 0 ? (
          <EmptyState
            icon={CurrencyDollarIcon}
            title="Nenhuma despesa encontrada"
            text={activeCount ? "Tente ajustar os filtros." : ""}
          />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <ul className="lg:hidden divide-y divide-gray-100">
              {data.map((d) => (
                <li key={d._id} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {d.nome}
                      </span>
                      <Badge color={TIPOS[d.tipo]?.color}>
                        {TIPOS[d.tipo]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(d.data)} · {d.conta?.nome || "Sem conta"}
                    </p>
                    {d.desc && (
                      <p className="text-xs text-gray-400 break-words">
                        {d.desc}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-red-600">
                      {formatMoney(d.valor)}
                    </p>
                    {acoes(d)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Despesa", "Tipo", "Conta", "Data", "Valor", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i >= 4 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((d) => (
                    <tr key={d._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 max-w-md">
                        <div className="text-sm font-medium text-gray-900">
                          {d.nome}
                        </div>
                        {d.desc && (
                          <div className="text-xs text-gray-500 truncate">
                            {d.desc}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <Badge color={TIPOS[d.tipo]?.color}>
                          {TIPOS[d.tipo]?.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <BuildingLibraryIcon className="h-4 w-4 text-gray-400" />
                          {d.conta?.nome || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(d.data)}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-red-600 text-right whitespace-nowrap">
                        {formatMoney(d.valor)}
                      </td>
                      <td className="px-6 py-3">{acoes(d)}</td>
                    </tr>
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

      <DespesaFormModal
        isOpen={modal.open}
        despesa={modal.despesa}
        contas={contas}
        podeRetirada={podeRetirada}
        onClose={() => setModal({ open: false, despesa: null })}
        onSaved={reload}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        title="Excluir despesa"
        confirmLabel="Excluir"
        message={
          toDelete &&
          `Excluir "${toDelete.nome}" de ${formatMoney(toDelete.valor)}?`
        }
      />
    </DashboardLayout>
  );
}

function DespesaFormModal({
  isOpen,
  despesa,
  contas,
  podeRetirada,
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const ativas = contas.filter((c) => c.ativa && !c.sistema);
    setForm({
      nome: despesa?.nome || "",
      valor: despesa?.valor ?? "",
      tipo: despesa?.tipo || "compra",
      data: despesa ? toYmd(despesa.data) : todayYmd(),
      conta:
        despesa?.conta?._id ||
        despesa?.conta ||
        (ativas.length === 1 ? ativas[0]._id : ""),
      desc: despesa?.desc || "",
    });
  }, [isOpen, despesa, contas]);

  async function submit(e) {
    e.preventDefault();
    if (!form.conta) {
      toast("Selecione a conta de onde saiu o dinheiro", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, valor: Number(form.valor) };
      if (despesa)
        await api("/api/despesa", {
          method: "PUT",
          body: { id: despesa._id, ...body },
        });
      else await api("/api/despesa", { method: "POST", body });
      toast(despesa ? "Despesa atualizada!" : "Despesa criada!");
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={despesa ? "Editar Despesa" : "Nova Despesa"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome" htmlFor="nomeD" className="sm:col-span-2">
            <input
              id="nomeD"
              required
              className={inputClass}
              value={form.nome || ""}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Field>
          <Field label="Valor" htmlFor="valorD">
            <input
              id="valorD"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              required
              className={inputClass}
              value={form.valor ?? ""}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select
              value={form.tipo}
              onChange={(v) => setForm({ ...form, tipo: v })}
              options={Object.entries(TIPOS)
                .filter(([value]) => value !== "retirada" || podeRetirada)
                .map(([value, t]) => ({ value, label: t.label }))}
            />
          </Field>
          <Field label="Data" htmlFor="dataD">
            <DatePicker
              id="dataD"
              value={form.data}
              onChange={(v) => setForm({ ...form, data: v })}
            />
          </Field>
          <Field label="Saiu da conta">
            <ContaSelect
              contas={contas.filter((c) => c.ativa || c._id === form.conta)}
              value={form.conta}
              onChange={(v) => setForm({ ...form, conta: v })}
            />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="descD">
          <textarea
            id="descD"
            rows={2}
            className={inputClass}
            value={form.desc || ""}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={despesa ? "Salvar" : "Criar"}
        />
      </form>
    </Modal>
  );
}
