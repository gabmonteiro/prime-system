"use client";
import { useEffect, useState } from "react";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import FilterBar, { SearchInput } from "../../../components/ui/FilterBar";
import Modal from "../../../components/ui/Modal";
import Field, { inputClass } from "../../../components/ui/Field";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import { FormButtons } from "../../../components/clientes/ClienteFormModal";
import useApiList, { useFilters } from "../../../hooks/useApiList";
import { api } from "../../../libs/fetcher";
import { formatMoney } from "../../../libs/money";

export default function TiposServicosPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const { filters, setFilter, clear, activeCount } = useFilters({ q: "" });
  const { data, loading, reload } = useApiList("/api/tipoServico", filters);
  const [modal, setModal] = useState({ open: false, tipo: null });
  const [toDelete, setToDelete] = useState(null);

  const precoMedio = data.length
    ? data.reduce((a, t) => a + t.valor, 0) / data.length
    : 0;
  const maisVendido = [...data].sort((a, b) => b.quantidade - a.quantidade)[0];

  async function confirmDelete() {
    try {
      await api("/api/tipoServico", {
        method: "DELETE",
        body: { id: toDelete._id },
      });
      toast("Tipo excluído!");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
      setToDelete(null);
    }
  }

  return (
    <DashboardLayout permission="tipos-servicos:read">
      <PageHeader
        icon={WrenchScrewdriverIcon}
        title="Tipos de Serviços"
        subtitle="Serviços oferecidos e preços padrão"
      >
        {hasPermission("tipos-servicos", "create") && (
          <button
            onClick={() => setModal({ open: true, tipo: null })}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Novo Tipo
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={WrenchScrewdriverIcon}
          label="Tipos"
          value={data.length}
          loading={loading && !data.length}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          color="green"
          label="Preço médio"
          value={formatMoney(precoMedio)}
          loading={loading && !data.length}
        />
        <StatCard
          icon={TrophyIcon}
          color="yellow"
          label="Mais realizado"
          value={maisVendido?.quantidade ? maisVendido.nome : "—"}
          hint={
            maisVendido?.quantidade ? `${maisVendido.quantidade} serviços` : ""
          }
          loading={loading && !data.length}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Buscar tipo"
          className="sm:col-span-2"
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && data.length === 0 ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState
            icon={WrenchScrewdriverIcon}
            title="Nenhum tipo encontrado"
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.map((t) => (
              <li
                key={t._id}
                className="px-4 sm:px-6 py-3 flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0 hidden sm:block">
                  <WrenchScrewdriverIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{t.nome}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t.quantidade} serviço(s) · {formatMoney(t.faturado)}{" "}
                    faturado
                    {t.desc && ` · ${t.desc}`}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 whitespace-nowrap">
                  {formatMoney(t.valor)}
                </span>
                <div className="flex shrink-0">
                  {hasPermission("tipos-servicos", "update") && (
                    <button
                      onClick={() => setModal({ open: true, tipo: t })}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission("tipos-servicos", "delete") && (
                    <button
                      onClick={() => setToDelete(t)}
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
        )}
      </div>

      <TipoModal
        isOpen={modal.open}
        tipo={modal.tipo}
        onClose={() => setModal({ open: false, tipo: null })}
        onSaved={reload}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        title="Excluir tipo"
        confirmLabel="Excluir"
        message={
          toDelete &&
          (toDelete.quantidade > 0
            ? `"${toDelete.nome}" está em ${toDelete.quantidade} serviço(s) e não pode ser excluído.`
            : `Excluir "${toDelete.nome}"?`)
        }
      />
    </DashboardLayout>
  );
}

function TipoModal({ isOpen, tipo, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (isOpen)
      setForm({
        nome: tipo?.nome || "",
        valor: tipo?.valor ?? "",
        desc: tipo?.desc || "",
      });
  }, [isOpen, tipo]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, valor: Number(form.valor) };
      if (tipo)
        await api("/api/tipoServico", {
          method: "PUT",
          body: { id: tipo._id, ...body },
        });
      else await api("/api/tipoServico", { method: "POST", body });
      toast(tipo ? "Tipo atualizado!" : "Tipo criado!");
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
      title={tipo ? "Editar Tipo" : "Novo Tipo"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome" htmlFor="nomeT">
          <input
            id="nomeT"
            required
            className={inputClass}
            value={form.nome || ""}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </Field>
        <Field
          label="Valor padrão"
          htmlFor="valorTipo"
          hint={
            tipo ? "Mudar o preço não altera serviços já lançados" : undefined
          }
        >
          <input
            id="valorTipo"
            type="number"
            step="0.01"
            min="0"
            required
            inputMode="decimal"
            className={inputClass}
            value={form.valor ?? ""}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </Field>
        <Field label="Descrição" htmlFor="descTipo">
          <textarea
            id="descTipo"
            rows={2}
            className={inputClass}
            value={form.desc || ""}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={tipo ? "Salvar" : "Criar"}
        />
      </form>
    </Modal>
  );
}
