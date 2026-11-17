"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import DatePicker from "../ui/DatePicker";
import Field, { inputClass, Toggle } from "../ui/Field";
import ClienteCarroPicker from "./ClienteCarroPicker";
import ContaSelect from "./ContaSelect";
import { api } from "../../libs/fetcher";
import { formatMoney, splitAmount } from "../../libs/money";
import {
  addMonthsDateOnly,
  formatDate,
  todayYmd,
  toYmd,
} from "../../libs/dates";
import { useToast } from "../ui/Toast";

function emptyForm() {
  const hoje = todayYmd();
  return {
    clienteId: "",
    clienteNome: "",
    carros: [],
    carroId: "",
    carroModelo: "",
    carroPlaca: "",
    semTipo: false,
    tipoServico: "",
    valorPersonalizado: "",
    data: hoje,
    participantes: [],
    formaPagamento: "avista",
    numParcelas: 2,
    primeiroVencimento: toYmd(addMonthsDateOnly(hoje, 1)),
    jaPago: false,
    contaPagamento: "",
    dataPagamento: hoje,
    obs: "",
  };
}

function fromServico(s) {
  return {
    ...emptyForm(),
    clienteId: s.clienteRef?._id || "",
    clienteNome: s.clienteRef?.nome || s.cliente || "",
    carros: s.carroRef ? [s.carroRef] : [],
    carroId: s.carroRef?._id || "",
    carroModelo: s.carroRef ? "" : s.nomeCarro || "",
    semTipo: Boolean(s.semTipo),
    tipoServico: s.tipoServico?._id || "",
    valorPersonalizado: s.valorPersonalizado ?? "",
    data: toYmd(s.data),
    participantes: (s.participantes || []).map((p) => p._id || p),
    formaPagamento: s.formaPagamento || "avista",
    numParcelas: s.parcelas?.length || 1,
    primeiroVencimento: toYmd(s.parcelas?.[0]?.vencimento || s.data),
    obs: s.obs || "",
    // Serviço da v1: só tem o nome em texto, sem cadastro de cliente/veículo
    legado: !s.clienteRef,
    clienteAlterado: false,
  };
}

export default function ServicoFormModal({
  isOpen,
  onClose,
  servico,
  tipos,
  usuarios,
  contas,
  onSaved,
  defaults,
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(servico?._id);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      servico ? fromServico(servico) : { ...emptyForm(), ...(defaults || {}) },
    );
    // Carrega todos os veículos do cliente ao editar
    if (servico?.clienteRef?._id) {
      api(`/api/clientes/${servico.clienteRef._id}`)
        .then((d) => setForm((f) => ({ ...f, carros: d.carros })))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, servico]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const tipoSel = tipos.find((t) => t._id === form.tipoServico);
  const valorTotal =
    form.valorPersonalizado !== "" && form.valorPersonalizado != null
      ? Number(form.valorPersonalizado)
      : Number(tipoSel?.valor || 0);

  const pagas = (servico?.parcelas || []).filter((p) => p.pago);
  const previewParcelas = useMemo(() => {
    if (form.formaPagamento !== "parcelado") return [];
    const n = Math.max(2, Number(form.numParcelas) || 2);
    const restante = valorTotal - pagas.reduce((a, p) => a + p.valor, 0);
    const abertas = n - pagas.length;
    if (abertas < 1 || restante <= 0) return [];
    const valores = splitAmount(restante, abertas);
    return valores.map((v, i) => ({
      numero: pagas.length + i + 1,
      valor: v,
      vencimento: addMonthsDateOnly(
        form.primeiroVencimento || form.data,
        pagas.length + i,
      ),
    }));
  }, [
    form.formaPagamento,
    form.numParcelas,
    form.primeiroVencimento,
    form.data,
    valorTotal,
    pagas,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.semTipo && !form.tipoServico) {
      toast("Selecione o tipo de serviço", "error");
      return;
    }
    if (
      form.semTipo &&
      (form.valorPersonalizado === "" || form.valorPersonalizado == null)
    ) {
      toast("Informe o valor do serviço", "error");
      return;
    }
    if (
      !editing &&
      form.formaPagamento === "avista" &&
      form.jaPago &&
      !form.contaPagamento
    ) {
      toast("Selecione a conta onde o dinheiro entrou", "error");
      return;
    }

    // Ao editar, só mexe no cliente/veículo se o operador alterou esses campos.
    // Assim um serviço antigo (só com nome em texto) não ganha cadastro sozinho.
    const enviarCliente = !editing || form.clienteAlterado;
    const payload = {
      ...(enviarCliente
        ? {
            clienteId: form.clienteId || undefined,
            clienteNome: form.clienteId ? undefined : form.clienteNome,
            carroId: form.carroId || undefined,
            carroModelo: form.carroId ? undefined : form.carroModelo,
            carroPlaca: form.carroId ? undefined : form.carroPlaca,
          }
        : {}),
      semTipo: form.semTipo,
      tipoServico: form.semTipo ? null : form.tipoServico,
      valorPersonalizado:
        form.valorPersonalizado === "" ? null : Number(form.valorPersonalizado),
      data: form.data,
      participantes: form.participantes,
      formaPagamento: form.formaPagamento,
      numParcelas:
        form.formaPagamento === "parcelado" ? Number(form.numParcelas) : 1,
      primeiroVencimento:
        form.formaPagamento === "parcelado"
          ? form.primeiroVencimento
          : undefined,
      obs: form.obs,
    };
    if (!editing && form.formaPagamento === "avista" && form.jaPago) {
      payload.pagamento = {
        conta: form.contaPagamento,
        data: form.dataPagamento,
      };
    }

    setSaving(true);
    try {
      const saved = editing
        ? await api("/api/servico", {
            method: "PUT",
            body: { id: servico._id, ...payload },
          })
        : await api("/api/servico", { method: "POST", body: payload });
      toast(editing ? "Serviço atualizado!" : "Serviço criado!");
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
      title={editing ? "Editar Serviço" : "Novo Serviço"}
      size="lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {form.legado && !form.clienteAlterado && (
            <p className="md:col-span-2 -mb-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Serviço antigo, sem cadastro de cliente. Se quiser vincular a um
              cliente cadastrado, é só escolher abaixo; senão o nome fica como
              está.
            </p>
          )}
          <ClienteCarroPicker
            value={form}
            onChange={(v) => set({ ...v, clienteAlterado: true })}
          />

          <Field label="Tipo de Serviço" htmlFor="tipoServico">
            <Select
              id="tipoServico"
              value={form.tipoServico}
              disabled={form.semTipo}
              onChange={(v) => set({ tipoServico: v })}
              placeholder="Selecione o tipo"
              options={tipos.map((t) => ({
                value: t._id,
                label: `${t.nome} - ${formatMoney(t.valor)}`,
              }))}
            />
            <label className="mt-2 flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.semTipo}
                onChange={(e) =>
                  set({
                    semTipo: e.target.checked,
                    tipoServico: e.target.checked ? "" : form.tipoServico,
                  })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2">Sem tipo (valor personalizado)</span>
            </label>
          </Field>

          <Field
            label={`Valor ${form.semTipo ? "(obrigatório)" : "personalizado (opcional)"}`}
            htmlFor="valorPersonalizado"
            hint={
              form.semTipo
                ? undefined
                : tipoSel
                  ? `Vazio = valor do tipo (${formatMoney(tipoSel.valor)})`
                  : "Se preenchido, substitui o valor do tipo"
            }
          >
            <input
              id="valorPersonalizado"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.valorPersonalizado}
              onChange={(e) => set({ valorPersonalizado: e.target.value })}
              className={inputClass}
              required={form.semTipo}
              placeholder="0,00"
            />
          </Field>

          <Field label="Data do Serviço" htmlFor="data">
            <DatePicker
              id="data"
              value={form.data}
              onChange={(v) => set({ data: v })}
              required
            />
          </Field>

          <Field label="Valor total">
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-gray-900">
              {formatMoney(valorTotal)}
            </div>
          </Field>
        </div>

        {/* Pagamento */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Pagamento:
            </span>
            {[
              ["avista", "À vista"],
              ["parcelado", "Parcelado"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  set({
                    formaPagamento: v,
                    numParcelas:
                      v === "parcelado" ? Math.max(2, form.numParcelas) : 1,
                  })
                }
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  form.formaPagamento === v
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
            {pagas.length > 0 && (
              <span className="text-xs text-gray-500">
                {pagas.length} parcela(s) já recebida(s) serão mantidas
              </span>
            )}
          </div>

          {form.formaPagamento === "parcelado" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nº de parcelas" htmlFor="numParcelas">
                  <input
                    id="numParcelas"
                    type="number"
                    min={Math.max(2, pagas.length)}
                    max="48"
                    value={form.numParcelas}
                    onChange={(e) => set({ numParcelas: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="1º vencimento"
                  htmlFor="primeiroVencimento"
                  hint="As demais vencem no mesmo dia dos meses seguintes"
                >
                  <DatePicker
                    id="primeiroVencimento"
                    value={form.primeiroVencimento}
                    onChange={(v) => set({ primeiroVencimento: v })}
                  />
                </Field>
              </div>
              {previewParcelas.length > 0 && (
                <div className="text-sm">
                  <p className="text-gray-600 mb-2">Parcelas a receber:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {previewParcelas.map((p) => (
                      <div
                        key={p.numero}
                        className="px-3 py-2 rounded-lg bg-blue-50 text-blue-900"
                      >
                        <div className="text-xs text-blue-700">
                          {p.numero}ª · {formatDate(p.vencimento)}
                        </div>
                        <div className="font-semibold">
                          {formatMoney(p.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {form.formaPagamento === "avista" && !editing && (
            <div className="space-y-4">
              <Toggle
                checked={form.jaPago}
                onChange={(v) => set({ jaPago: v })}
                labelOn="Já foi pago"
                labelOff="Ainda não foi pago"
              />
              {form.jaPago && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Entrou na conta" htmlFor="contaPagamento">
                    <ContaSelect
                      id="contaPagamento"
                      contas={contas}
                      value={form.contaPagamento}
                      onChange={(v) => set({ contaPagamento: v })}
                    />
                  </Field>
                  <Field label="Data do pagamento" htmlFor="dataPagamento">
                    <DatePicker
                      id="dataPagamento"
                      value={form.dataPagamento}
                      onChange={(v) => set({ dataPagamento: v })}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
          {editing && (
            <p className="text-xs text-gray-500">
              Para registrar ou desfazer recebimentos use o botão de pagamento
              na lista.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Participantes do Serviço
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {usuarios
              .filter(
                (u) =>
                  u.isActive !== false || form.participantes.includes(u._id),
              )
              .map((u) => (
                <label
                  key={u._id}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={form.participantes.includes(u._id)}
                    onChange={(e) =>
                      set({
                        participantes: e.target.checked
                          ? [...form.participantes, u._id]
                          : form.participantes.filter((p) => p !== u._id),
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{u.name}</span>
                </label>
              ))}
          </div>
        </div>

        <Field label="Observações" htmlFor="obs">
          <textarea
            id="obs"
            rows={2}
            value={form.obs}
            onChange={(e) => set({ obs: e.target.value })}
            className={inputClass}
            placeholder="Opcional"
          />
        </Field>

        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Salvando..." : `${editing ? "Salvar" : "Criar"} Serviço`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
