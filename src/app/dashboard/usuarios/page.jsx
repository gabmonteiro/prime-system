"use client";
import { useEffect, useState } from "react";
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import StatCard from "../../../components/ui/StatCard";
import FilterBar, { SearchInput } from "../../../components/ui/FilterBar";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";
import Badge from "../../../components/ui/Badge";
import Field, { inputClass, Toggle } from "../../../components/ui/Field";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import { FormButtons } from "../../../components/clientes/ClienteFormModal";
import useApiList, { useFilters } from "../../../hooks/useApiList";
import { api } from "../../../libs/fetcher";
import {
  ROLES,
  ROLE_LABELS,
  getFormattedPermissions,
} from "../../../libs/permissions";

const ROLE_COLOR = {
  admin: "red",
  gerente: "purple",
  funcionario: "blue",
  visualizador: "gray",
};

export default function UsuariosPage() {
  const { user, isAdmin, hasPermission } = useAuth();
  const toast = useToast();
  const { filters, setFilter, clear, activeCount } = useFilters({
    q: "",
    role: "",
    status: "",
  });
  const { data, loading, reload } = useApiList("/api/user", filters);
  const [modal, setModal] = useState({ open: false, usuario: null });
  const [toDelete, setToDelete] = useState(null);

  const ativos = data.filter((u) => u.isActive !== false).length;
  const canManage = (u) => isAdmin || u.role !== "admin";

  async function confirmDelete() {
    try {
      await api("/api/user", { method: "DELETE", body: { id: toDelete._id } });
      toast("Usuário excluído!");
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
      setToDelete(null);
    }
  }

  return (
    <DashboardLayout permission="usuarios:read">
      <PageHeader
        icon={UserGroupIcon}
        color="indigo"
        title="Usuários"
        subtitle="Quem acessa o sistema e o que pode fazer"
      >
        {hasPermission("usuarios", "create") && (
          <button
            onClick={() => setModal({ open: true, usuario: null })}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" /> Novo Usuário
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={UserGroupIcon}
          color="indigo"
          label="Usuários"
          value={data.length}
        />
        <StatCard
          icon={CheckCircleIcon}
          color="green"
          label="Ativos"
          value={ativos}
        />
        <StatCard
          icon={NoSymbolIcon}
          color="gray"
          label="Inativos"
          value={data.length - ativos}
        />
        <StatCard
          icon={ShieldCheckIcon}
          color="red"
          label="Administradores"
          value={data.filter((u) => u.role === "admin").length}
        />
      </div>

      <FilterBar onClear={clear} activeCount={activeCount}>
        <SearchInput
          value={filters.q}
          onChange={(v) => setFilter("q", v)}
          placeholder="Nome ou email"
        />
        <Select
          value={filters.role}
          onChange={(v) => setFilter("role", v)}
          options={[
            { value: "", label: "Todos os perfis" },
            ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
          ]}
        />
        <Select
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "", label: "Ativos e inativos" },
            { value: "ativo", label: "Ativos" },
            { value: "inativo", label: "Inativos" },
          ]}
        />
      </FilterBar>

      <div className="bg-white rounded-lg shadow-sm">
        {loading && data.length === 0 ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState icon={UserGroupIcon} title="Nenhum usuário encontrado" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.map((u) => (
              <li
                key={u._id}
                className={`px-4 sm:px-6 py-3 flex items-center gap-3 ${u.isActive === false ? "opacity-60" : ""}`}
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-semibold">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{u.name}</span>
                    {String(u._id) === String(user?._id) && (
                      <span className="text-xs text-gray-500">(você)</span>
                    )}
                    <Badge color={ROLE_COLOR[u.role]}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                    {u.isActive === false && <Badge>inativo</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="flex shrink-0">
                  {hasPermission("usuarios", "update") && canManage(u) && (
                    <button
                      onClick={() => setModal({ open: true, usuario: u })}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission("usuarios", "delete") &&
                    canManage(u) &&
                    String(u._id) !== String(user?._id) && (
                      <button
                        onClick={() => setToDelete(u)}
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

      <UsuarioModal
        isOpen={modal.open}
        usuario={modal.usuario}
        isAdmin={isAdmin}
        self={user}
        onClose={() => setModal({ open: false, usuario: null })}
        onSaved={reload}
      />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        title="Excluir usuário"
        confirmLabel="Excluir"
        message={
          toDelete &&
          `Excluir ${toDelete.name}? Para manter o histórico nos serviços, prefira desativar o usuário.`
        }
      />
    </DashboardLayout>
  );
}

function UsuarioModal({ isOpen, usuario, isAdmin, self, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const isSelf = usuario && String(usuario._id) === String(self?._id);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: usuario?.name || "",
        email: usuario?.email || "",
        password: "",
        role: usuario?.role || "funcionario",
        isActive: usuario?.isActive !== false,
      });
    }
  }, [isOpen, usuario]);

  const roles = ROLES.filter((r) => isAdmin || r !== "admin");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (usuario && !body.password) delete body.password;
      if (usuario)
        await api("/api/user", {
          method: "PUT",
          body: { id: usuario._id, ...body },
        });
      else await api("/api/user", { method: "POST", body });
      toast(usuario ? "Usuário atualizado!" : "Usuário criado!");
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
      title={usuario ? "Editar Usuário" : "Novo Usuário"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome" htmlFor="nameU">
          <input
            id="nameU"
            required
            className={inputClass}
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Email" htmlFor="emailU">
          <input
            id="emailU"
            type="email"
            required
            className={inputClass}
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field
          label={usuario ? "Nova senha (deixe vazio para manter)" : "Senha"}
          htmlFor="passU"
        >
          <input
            id="passU"
            type="password"
            minLength={6}
            required={!usuario}
            autoComplete="new-password"
            className={inputClass}
            value={form.password || ""}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field
          label="Perfil"
          hint={
            isSelf ? "Você não pode alterar o seu próprio perfil" : undefined
          }
        >
          <Select
            value={form.role}
            disabled={isSelf}
            onChange={(v) => setForm({ ...form, role: v })}
            options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
        </Field>
        {form.role && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 max-h-32 overflow-auto">
            {getFormattedPermissions(form.role)
              .map((p) => p.description)
              .join(" · ")}
          </div>
        )}
        {usuario && !isSelf && (
          <Toggle
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
            labelOn="Ativo"
            labelOff="Inativo (não consegue entrar)"
          />
        )}
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={usuario ? "Salvar" : "Criar"}
        />
      </form>
    </Modal>
  );
}
