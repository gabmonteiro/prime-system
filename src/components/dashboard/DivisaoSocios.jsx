"use client";
import { useMemo, useState } from "react";
import { UsersIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatMoney, round2 } from "../../libs/money";
import { formatMonthKey, todayYmd } from "../../libs/dates";
import { api } from "../../libs/fetcher";
import { useToast } from "../ui/Toast";
import Modal from "../ui/Modal";
import Field from "../ui/Field";
import DatePicker from "../ui/DatePicker";
import ContaSelect from "../servicos/ContaSelect";

const BAR = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
];
const ICON = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
];

/**
 * Divisão entre sócios pelo que ENTROU no mês: cada recebimento é dividido
 * igualmente entre os participantes do serviço. O % resultante é aplicado ao
 * valor a distribuir (padrão: saldo total das contas).
 */
export default function DivisaoSocios({
  divisao,
  mes,
  saldoTotal,
  contas,
  canRetirar,
  onRetirada,
}) {
  const toast = useToast();
  const [valorCustom, setValorCustom] = useState("");
  const [modal, setModal] = useState(false);
  const [conta, setConta] = useState("");
  const [data, setData] = useState(todayYmd());
  const [saving, setSaving] = useState(false);

  const valorDistribuir =
    valorCustom !== "" && !isNaN(Number(valorCustom))
      ? Number(valorCustom)
      : saldoTotal;

  const socios = divisao.socios.filter((s) => s.valor > 0);
  const distribuicao = useMemo(() => {
    const comCota = socios.filter((s) => s.percentual > 0);
    if (!comCota.length) return [];
    // arredonda e joga a diferença no último para fechar o total
    const partes = comCota.map((s) => round2(valorDistribuir * s.percentual));
    const diff = round2(valorDistribuir - partes.reduce((a, b) => a + b, 0));
    partes[partes.length - 1] = round2(partes[partes.length - 1] + diff);
    return comCota.map((s, i) => ({
      user: s.id,
      nome: s.nome,
      valor: partes[i],
    }));
  }, [socios, valorDistribuir]);

  async function criarRetirada() {
    if (!conta) {
      toast("Selecione a conta de onde o dinheiro saiu", "error");
      return;
    }
    setSaving(true);
    try {
      await api("/api/despesa", {
        method: "POST",
        body: {
          nome: "Retirada de dinheiro",
          tipo: "retirada",
          valor: round2(valorDistribuir),
          data,
          conta,
          desc: `Divisão de ${formatMonthKey(mes)}: ${distribuicao
            .map((d) => `${d.nome}: ${formatMoney(d.valor)}`)
            .join(" | ")}`,
          distribuicao,
        },
      });
      toast("Retirada registrada!");
      setModal(false);
      setValorCustom("");
      onRetirada?.();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Divisão entre sócios
          </h3>
          <p className="text-sm text-gray-600">
            Pelo que entrou em {formatMonthKey(mes)}:{" "}
            {formatMoney(divisao.total)}
          </p>
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <UsersIcon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2">
        <label
          htmlFor="valor-distribuicao"
          className="text-sm font-medium text-gray-700"
        >
          Valor a distribuir:
        </label>
        <input
          id="valor-distribuicao"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={valorCustom}
          onChange={(e) => setValorCustom(e.target.value)}
          placeholder={`${saldoTotal.toFixed(2)} (saldo atual)`}
          className="px-3 py-1.5 border border-gray-300 rounded-md sm:w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {socios.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Nenhum recebimento com participantes neste mês.
        </p>
      ) : (
        <div className="space-y-4">
          {socios.map((s, i) => {
            const parte = distribuicao.find(
              (d) => String(d.user) === String(s.id),
            );
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ICON[i % ICON.length]}`}
                >
                  <UsersIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {s.nome}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatMoney(parte?.valor || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Gerou {formatMoney(s.valor)}</span>
                    <span>{(s.percentual * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 ${BAR[i % BAR.length]} transition-all duration-500`}
                      style={{ width: `${s.percentual * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {divisao.semParticipantes > 0 && (
            <p className="text-xs text-gray-500">
              {formatMoney(divisao.semParticipantes)} recebidos de serviços sem
              participantes não entram na divisão.
            </p>
          )}
        </div>
      )}

      {canRetirar && distribuicao.length > 0 && valorDistribuir > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Registrar retirada
          </button>
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Registrar retirada"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Será lançada uma despesa do tipo <b>retirada</b> de{" "}
            {formatMoney(valorDistribuir)}:
          </p>
          <ul className="text-sm divide-y divide-gray-100 border rounded-lg">
            {distribuicao.map((d) => (
              <li key={d.user} className="flex justify-between px-3 py-2">
                <span>{d.nome}</span>
                <span className="font-medium">{formatMoney(d.valor)}</span>
              </li>
            ))}
          </ul>
          <Field label="Saiu da conta" htmlFor="conta-retirada">
            <ContaSelect
              id="conta-retirada"
              contas={contas}
              value={conta}
              onChange={setConta}
            />
          </Field>
          <Field label="Data" htmlFor="data-retirada">
            <DatePicker id="data-retirada" value={data} onChange={setData} />
          </Field>
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={criarRetirada}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
