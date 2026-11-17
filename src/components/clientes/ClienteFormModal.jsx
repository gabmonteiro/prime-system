"use client";
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Field, { inputClass } from "../ui/Field";
import { api } from "../../libs/fetcher";
import { useToast } from "../ui/Toast";

export default function ClienteFormModal({
  isOpen,
  onClose,
  cliente,
  onSaved,
}) {
  const toast = useToast();
  const [form, setForm] = useState({ nome: "", telefone: "", obs: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        nome: cliente?.nome || "",
        telefone: cliente?.telefone || "",
        obs: cliente?.obs || "",
      });
    }
  }, [isOpen, cliente]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = cliente
        ? await api("/api/clientes", {
            method: "PUT",
            body: { id: cliente._id, ...form },
          })
        : await api("/api/clientes", { method: "POST", body: form });
      toast(cliente ? "Cliente atualizado!" : "Cliente cadastrado!");
      onSaved?.(saved);
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
      title={cliente ? "Editar Cliente" : "Novo Cliente"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome" htmlFor="nome">
          <input
            id="nome"
            className={inputClass}
            value={form.nome}
            required
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </Field>
        <Field label="Telefone" htmlFor="telefone">
          <input
            id="telefone"
            type="tel"
            className={inputClass}
            value={form.telefone}
            placeholder="(51) 99999-9999"
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </Field>
        <Field label="Observações" htmlFor="obs">
          <textarea
            id="obs"
            rows={3}
            className={inputClass}
            value={form.obs}
            onChange={(e) => setForm({ ...form, obs: e.target.value })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={cliente ? "Salvar" : "Cadastrar"}
        />
      </form>
    </Modal>
  );
}

export function CarroFormModal({ isOpen, onClose, carro, clienteId, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ modelo: "", placa: "", cor: "", obs: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        modelo: carro?.modelo || "",
        placa: carro?.placa || "",
        cor: carro?.cor || "",
        obs: carro?.obs || "",
      });
    }
  }, [isOpen, carro]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = carro
        ? await api("/api/carros", {
            method: "PUT",
            body: { id: carro._id, ...form },
          })
        : await api("/api/carros", {
            method: "POST",
            body: { cliente: clienteId, ...form },
          });
      toast(carro ? "Veículo atualizado!" : "Veículo cadastrado!");
      onSaved?.(saved);
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
      title={carro ? "Editar Veículo" : "Novo Veículo"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Modelo" htmlFor="modelo" className="sm:col-span-2">
            <input
              id="modelo"
              className={inputClass}
              value={form.modelo}
              required
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            />
          </Field>
          <Field label="Placa" htmlFor="placa">
            <input
              id="placa"
              className={inputClass}
              value={form.placa}
              maxLength={8}
              onChange={(e) =>
                setForm({ ...form, placa: e.target.value.toUpperCase() })
              }
            />
          </Field>
          <Field label="Cor" htmlFor="cor">
            <input
              id="cor"
              className={inputClass}
              value={form.cor}
              onChange={(e) => setForm({ ...form, cor: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Observações" htmlFor="obsCarro">
          <textarea
            id="obsCarro"
            rows={2}
            className={inputClass}
            value={form.obs}
            onChange={(e) => setForm({ ...form, obs: e.target.value })}
          />
        </Field>
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={carro ? "Salvar" : "Cadastrar"}
        />
      </form>
    </Modal>
  );
}

export function FormButtons({ onCancel, saving, label = "Salvar" }) {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Salvando..." : label}
      </button>
    </div>
  );
}
