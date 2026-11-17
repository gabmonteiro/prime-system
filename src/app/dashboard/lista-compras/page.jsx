"use client";
import { useEffect, useState } from "react";
import {
  ShoppingCartIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CheckIcon,
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
import { todayYmd } from "../../../libs/dates";

const URG = {
  alto: { label: "Alta", color: "red" },
  medio: { label: "Média", color: "yellow" },
  baixo: { label: "Baixa", color: "green" },
};

export default function ListaComprasPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const { contas } = useLookups(["contas"]);
  const { filters, setFilter, clear, page, setPage, activeCount } = useFilters({
    q: "",
    urgencia: "",
  });
  const { data, stats, pagination, loading, reload } = useApiList(
    "/api/futuraCompra",
    { ...filters, page, limit: 15 },
  );
  const [modal, setModal] = useState({ open: false, item: null });
  const [comprado, setComprado] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  async function confirmDelete() {
    try {
      await api("/api/futuraCompra", {
        method: "DELETE",
        body: { id: toDelete._id },
      });
      toast("Item removido!");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <DashboardLayout permission="lista-compras:read">
      <PageHeader
        icon={ShoppingCartIcon}
        color="purple"
        title="Lista de Compras"
        subtitle="O que precisa ser comprado"
      >
        {hasPermission("lista-compras", "create") && (
          <button
            onClick={() => setModal({ open: true, item: null })}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Novo Item
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={ShoppingCartIcon}
          color="purple"
          label="Itens"
          value={stats?.total ?? 0}
          loading={!stats}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          color="green"
          label="Valor estimado"
          value={formatMoney(stats?.valorEstimado)}
          loading={!stats}
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          color="red"
          label="Urgência alta"
          value={stats?.alto ?? 0}
          loading={!stats}
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          color="yellow"
          label="Média / baixa"
          value={`${stats?.medio ?? 0} / ${stats?.baixo ?? 0}`}
          loading={!stats}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Buscar item"
        />
        <Select
          value={filters.urgencia}
          onChange={(v) => setFilter("urgencia", v)}
          options={[
            { value: "", label: "Todas as urgências" },
            ...Object.entries(URG).map(([value, u]) => ({
              value,
              label: u.label,
            })),
          ]}
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && data.length === 0 ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState
            icon={ShoppingCartIcon}
            title="Nenhum item"
            text={
              activeCount ? "Tente ajustar os filtros." : "A lista está vazia."
            }
          />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <ul className="divide-y divide-gray-100">
              {data.map((c) => (
                <li
                  key={c._id}
                  className="px-4 sm:px-6 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {c.nome}
                      </span>
                      <Badge color={URG[c.urgencia]?.color}>
                        {URG[c.urgencia]?.label}
                      </Badge>
                    </div>
                    {c.desc && (
                      <p className="text-xs text-gray-500 break-words">
                        {c.desc}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {c.valor != null ? formatMoney(c.valor) : "—"}
                  </span>
                  <div className="flex shrink-0">
                    {hasPermission("despesas", "create") &&
                      hasPermission("lista-compras", "delete") && (
                        <button
                          onClick={() => setComprado(c)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                          title="Comprado: lançar despesa"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                    {hasPermission("lista-compras", "update") && (
                      <button
                        onClick={() => setModal({ open: true, item: c })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission("lista-compras", "delete") && (
                      <button
                        onClick={() => setToDelete(c)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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

      <ItemModal
        isOpen={modal.open}
        item={modal.item}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={reload}
      />
      <CompradoModal
        item={comprado}
        contas={contas}
        onClose={() => setComprado(null)}
        onSaved={reload}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        title="Excluir item"
        confirmLabel="Excluir"
        message={toDelete && `Remover "${toDelete.nome}" da lista?`}
      />
    </DashboardLayout>
  );
}

function ItemModal({ isOpen, item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (isOpen)
      setForm({
        nome: item?.nome || "",
        valor: item?.valor ?? "",
        urgencia: item?.urgencia || "medio",
        desc: item?.desc || "",
      });
  }, [isOpen, item]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (item)
        await api("/api/futuraCompra", {
          method: "PUT",
          body: { id: item._id, ...form },
        });
      else await api("/api/futuraCompra", { method: "POST", body: form });
      toast(item ? "Item atualizado!" : "Item adicionado!");
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
      title={item ? "Editar Item" : "Novo Item"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Item" htmlFor="nomeC">
          <input
            id="nomeC"
            required
            className={inputClass}
            value={form.nome || ""}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Valor estimado (opcional)" htmlFor="valorC">
            <input
              id="valorC"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className={inputClass}
              value={form.valor ?? ""}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </Field>
          <Field label="Urgência">
            <Select
              value={form.urgencia}
              onChange={(v) => setForm({ ...form, urgencia: v })}
              options={Object.entries(URG).map(([value, u]) => ({
                value,
                label: u.label,
              }))}
            />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="descC">
          <textarea
            id="descC"
            rows={2}
            className={inputClass}
            value={form.desc || ""}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={item ? "Salvar" : "Adicionar"}
        />
      </form>
    </Modal>
  );
}

/** Marca como comprado: lança uma despesa (compra) e tira o item da lista. */
function CompradoModal({ item, contas, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ valor: "", conta: "", data: todayYmd() });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!item) return;
    const ativas = contas.filter((c) => c.ativa && !c.sistema);
    setForm({
      valor: item.valor ?? "",
      conta: ativas.length === 1 ? ativas[0]._id : "",
      data: todayYmd(),
    });
  }, [item, contas]);
  if (!item) return null;

  async function submit(e) {
    e.preventDefault();
    if (!form.conta) {
      toast("Selecione a conta", "error");
      return;
    }
    setSaving(true);
    try {
      await api("/api/despesa", {
        method: "POST",
        body: {
          nome: item.nome,
          desc: item.desc,
          tipo: "compra",
          valor: Number(form.valor),
          conta: form.conta,
          data: form.data,
        },
      });
      await api("/api/futuraCompra", {
        method: "DELETE",
        body: { id: item._id },
      });
      toast("Despesa lançada e item removido da lista!");
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Comprado: ${item.nome}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Será lançada uma despesa do tipo compra e o item sai da lista.
        </p>
        <Field label="Valor pago" htmlFor="valorPago">
          <input
            id="valorPago"
            type="number"
            step="0.01"
            min="0.01"
            required
            inputMode="decimal"
            className={inputClass}
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </Field>
        <Field label="Saiu da conta">
          <ContaSelect
            contas={contas}
            value={form.conta}
            onChange={(v) => setForm({ ...form, conta: v })}
          />
        </Field>
        <Field label="Data">
          <DatePicker
            value={form.data}
            onChange={(v) => setForm({ ...form, data: v })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label="Lançar despesa"
        />
      </form>
    </Modal>
  );
}
