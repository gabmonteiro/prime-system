"use client";
import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import DatePicker from "../ui/DatePicker";
import Field from "../ui/Field";
import Badge from "../ui/Badge";
import ContaSelect from "./ContaSelect";
import { api } from "../../libs/fetcher";
import { formatMoney } from "../../libs/money";
import { formatDate, todayYmd, toDateOnly } from "../../libs/dates";
import { useToast } from "../ui/Toast";

/** Recebimentos de um serviço: receber parcelas (escolhendo a conta) ou desfazer. */
export default function PagamentoModal({
  isOpen,
  onClose,
  servico,
  contas,
  canEdit,
  onSaved,
}) {
  const toast = useToast();
  const [conta, setConta] = useState("");
  const [data, setData] = useState(todayYmd());
  const [busy, setBusy] = useState(null);
  const [atual, setAtual] = useState(servico);

  useEffect(() => {
    if (!isOpen) return;
    setAtual(servico);
    setData(todayYmd());
    const ativas = contas.filter((c) => c.ativa !== false && !c.sistema);
    setConta((prev) => prev || (ativas.length === 1 ? ativas[0]._id : ""));
  }, [isOpen, servico, contas]);

  if (!atual) return null;
  const parcelas = atual.parcelas || [];
  const abertas = parcelas.filter((p) => !p.pago);
  const recebido = parcelas
    .filter((p) => p.pago)
    .reduce((a, p) => a + p.valor, 0);
  const total = atual.valorTotal ?? parcelas.reduce((a, p) => a + p.valor, 0);
  const hoje = toDateOnly(new Date());

  async function receber(parcelaId) {
    if (!conta) {
      toast("Selecione a conta onde o dinheiro entrou", "error");
      return;
    }
    setBusy(parcelaId || "all");
    try {
      const updated = await api("/api/servico/pagamento", {
        method: "POST",
        body: { id: atual._id, parcelaId, conta, data },
      });
      setAtual(updated);
      onSaved?.(updated);
      toast("Recebimento registrado!");
      if (updated.pago) onClose();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function estornar(parcelaId) {
    if (!window.confirm("Desfazer este recebimento?")) return;
    setBusy(parcelaId);
    try {
      const updated = await api("/api/servico/pagamento", {
        method: "DELETE",
        body: { id: atual._id, parcelaId },
      });
      setAtual(updated);
      onSaved?.(updated);
      toast("Recebimento desfeito");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento do serviço"
      size="md"
    >
      <div className="space-y-5">
        <div>
          <p className="font-medium text-gray-900">
            {atual.cliente} · {atual.nomeCarro}
          </p>
          <p className="text-sm text-gray-600">
            {atual.semTipo ? "Sem tipo" : atual.tipoServico?.nome} ·{" "}
            {formatDate(atual.data)}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                Recebido {formatMoney(recebido)} de {formatMoney(total)}
              </span>
              <span className="font-medium text-gray-900">
                {total ? Math.round((recebido / total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-500 transition-all"
                style={{ width: `${total ? (recebido / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {canEdit && abertas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50">
            <Field label="Entrou na conta" htmlFor="contaReceb">
              <ContaSelect
                id="contaReceb"
                contas={contas}
                value={conta}
                onChange={setConta}
              />
            </Field>
            <Field label="Data do recebimento" htmlFor="dataReceb">
              <DatePicker id="dataReceb" value={data} onChange={setData} />
            </Field>
          </div>
        )}

        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {parcelas.map((p) => {
            const atrasada = !p.pago && new Date(p.vencimento) < hoje;
            return (
              <li key={p._id} className="flex items-center gap-3 p-3">
                {p.pago ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <ClockIcon
                    className={`h-5 w-5 shrink-0 ${atrasada ? "text-red-500" : "text-gray-400"}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {formatMoney(p.valor)}
                    </span>
                    {parcelas.length > 1 && (
                      <span className="text-xs text-gray-500">
                        {p.numero}/{parcelas.length}
                      </span>
                    )}
                    {atrasada && <Badge color="red">atrasada</Badge>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.pago
                      ? `Recebido em ${formatDate(p.dataPagamento)} · ${p.conta?.nome || "conta?"}`
                      : `Vence em ${formatDate(p.vencimento)}`}
                  </div>
                </div>
                {canEdit &&
                  (p.pago ? (
                    <button
                      type="button"
                      onClick={() => estornar(p._id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50"
                      title="Desfazer recebimento"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Desfazer</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => receber(p._id)}
                      disabled={busy}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
                    >
                      {busy === p._id ? "..." : "Receber"}
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Fechar
          </button>
          {canEdit && abertas.length > 1 && (
            <button
              type="button"
              onClick={() => receber(undefined)}
              disabled={busy}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Receber tudo (
              {formatMoney(abertas.reduce((a, p) => a + p.valor, 0))})
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
