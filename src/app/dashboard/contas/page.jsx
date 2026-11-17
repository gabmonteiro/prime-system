"use client";
import { useCallback, useEffect, useState } from "react";
import {
  BuildingLibraryIcon,
  BanknotesIcon,
  CreditCardIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../DashboardLayout";
import { useAuth } from "../../../context/authContext";
import PageHeader from "../../../components/ui/PageHeader";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import Pagination from "../../../components/ui/Pagination";
import Badge from "../../../components/ui/Badge";
import Field, { inputClass, Toggle } from "../../../components/ui/Field";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { LoadingState, EmptyState } from "../../../components/ui/States";
import { useToast } from "../../../components/ui/Toast";
import { FormButtons } from "../../../components/clientes/ClienteFormModal";
import useApiList from "../../../hooks/useApiList";
import { api } from "../../../libs/fetcher";
import { formatMoney } from "../../../libs/money";
import { formatDate, todayYmd } from "../../../libs/dates";

const TIPO_ICON = {
  dinheiro: BanknotesIcon,
  banco: BuildingLibraryIcon,
  outro: CreditCardIcon,
};
const TIPO_LABEL = {
  dinheiro: "Dinheiro físico",
  banco: "Conta bancária",
  outro: "Outro",
};

export default function ContasPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [contas, setContas] = useState(null);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [contaModal, setContaModal] = useState({ open: false, conta: null });
  const [transfModal, setTransfModal] = useState(false);
  const [extrato, setExtrato] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [transfPage, setTransfPage] = useState(1);
  const transfs = useApiList("/api/transferencias", {
    page: transfPage,
    limit: 10,
  });

  const loadContas = useCallback(async () => {
    try {
      const res = await api("/api/contas");
      setContas(res.data);
      setSaldoTotal(res.saldoTotal);
    } catch (err) {
      toast(err.message, "error");
    }
  }, [toast]);

  useEffect(() => {
    loadContas();
  }, [loadContas]);

  const reloadAll = () => {
    loadContas();
    transfs.reload();
  };

  async function confirmDelete() {
    try {
      if (toDelete.tipo === "conta") {
        await api("/api/contas", {
          method: "DELETE",
          body: { id: toDelete.item._id },
        });
        toast("Conta excluída");
      } else {
        await api("/api/transferencias", {
          method: "DELETE",
          body: { id: toDelete.item._id },
        });
        toast("Transferência excluída");
      }
      setToDelete(null);
      reloadAll();
    } catch (err) {
      toast(err.message, "error");
      setToDelete(null);
    }
  }

  const contaSistema = contas?.find((c) => c.sistema && c.saldo !== 0);

  return (
    <DashboardLayout permission="contas:read">
      <PageHeader
        icon={BuildingLibraryIcon}
        color="green"
        title="Contas"
        subtitle="Onde o dinheiro está: saldos, extratos e transferências"
      >
        {hasPermission("contas", "create") && (
          <>
            <button
              onClick={() => setTransfModal(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              <ArrowsRightLeftIcon className="h-5 w-5 mr-2" /> Transferir
            </button>
            <button
              onClick={() => setContaModal({ open: true, conta: null })}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" /> Nova Conta
            </button>
          </>
        )}
      </PageHeader>

      {!contas ? (
        <LoadingState />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo total</p>
              <p
                className={`text-2xl sm:text-3xl font-bold ${saldoTotal >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatMoney(saldoTotal)}
              </p>
            </div>
            <BanknotesIcon className="h-10 w-10 text-green-200" />
          </div>

          {contaSistema && (
            <div className="mb-4 sm:mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              <div>
                A conta <b>{contaSistema.nome}</b> guarda{" "}
                {formatMoney(contaSistema.saldo)} de registros antigos (v1) sem
                conta definida. Use <b>Transferir</b> para mover esse valor para
                as contas reais (ex: Dinheiro físico, Banco) conforme o que
                vocês têm hoje.
              </div>
            </div>
          )}

          {contas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm">
              <EmptyState
                icon={BuildingLibraryIcon}
                title="Nenhuma conta"
                text="Cadastre as contas onde o dinheiro entra, ex: Dinheiro físico e Banco."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 mb-6">
              {contas.map((c) => {
                const Icon = TIPO_ICON[c.tipo] || CreditCardIcon;
                return (
                  <div
                    key={c._id}
                    className={`bg-white rounded-lg shadow-md border p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow ${c.ativa ? "border-gray-200" : "border-dashed border-gray-300 opacity-70"}`}
                    onClick={() => setExtrato(c)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {c.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {TIPO_LABEL[c.tipo]}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!c.ativa && <Badge>inativa</Badge>}
                        {c.sistema && <Badge color="yellow">v1</Badge>}
                        {hasPermission("contas", "update") && (
                          <button
                            onClick={() =>
                              setContaModal({ open: true, conta: c })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission("contas", "delete") && !c.sistema && (
                          <button
                            onClick={() =>
                              setToDelete({ tipo: "conta", item: c })
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p
                      className={`mt-4 text-2xl font-bold ${c.saldo >= 0 ? "text-gray-900" : "text-red-600"}`}
                    >
                      {formatMoney(c.saldo)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="text-green-700">
                        +{formatMoney(c.entradas + c.transfIn)} entradas
                      </span>
                      <span className="text-red-700">
                        −{formatMoney(c.saidas + c.transfOut)} saídas
                      </span>
                      {c.saldoInicial !== 0 && (
                        <span>inicial {formatMoney(c.saldoInicial)}</span>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-blue-600">Ver extrato →</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Transferências */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:px-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ArrowsRightLeftIcon className="h-5 w-5 text-gray-400" />{" "}
                Transferências
              </h2>
            </div>
            {transfs.data.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">
                Nenhuma transferência.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {transfs.data.map((t) => (
                    <li
                      key={t._id}
                      className="px-4 sm:px-6 py-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {t.contaOrigem?.nome} → {t.contaDestino?.nome}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {formatDate(t.data)}
                          {t.desc && ` · ${t.desc}`}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 whitespace-nowrap">
                        {formatMoney(t.valor)}
                      </span>
                      {hasPermission("contas", "delete") && (
                        <button
                          onClick={() =>
                            setToDelete({ tipo: "transf", item: t })
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {transfs.pagination.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t">
                    <Pagination
                      currentPage={transfs.pagination.page}
                      totalPages={transfs.pagination.totalPages}
                      onPageChange={setTransfPage}
                      itemsPerPage={transfs.pagination.limit}
                      totalItems={transfs.pagination.total}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <ContaFormModal
        isOpen={contaModal.open}
        conta={contaModal.conta}
        onClose={() => setContaModal({ open: false, conta: null })}
        onSaved={reloadAll}
      />
      <TransferenciaModal
        isOpen={transfModal}
        contas={contas || []}
        onClose={() => setTransfModal(false)}
        onSaved={reloadAll}
      />
      <ExtratoModal conta={extrato} onClose={() => setExtrato(null)} />
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        confirmLabel="Excluir"
        title={
          toDelete?.tipo === "conta" ? "Excluir conta" : "Excluir transferência"
        }
        message={
          toDelete?.tipo === "conta"
            ? `Excluir a conta ${toDelete.item.nome}? Só é possível se ela não tiver movimentações (senão, desative).`
            : toDelete &&
              `Excluir a transferência de ${formatMoney(toDelete.item.valor)} (${toDelete.item.contaOrigem?.nome} → ${toDelete.item.contaDestino?.nome})?`
        }
      />
    </DashboardLayout>
  );
}

function ContaFormModal({ isOpen, conta, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nome: "",
    tipo: "banco",
    saldoInicial: "",
    ativa: true,
    desc: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        nome: conta?.nome || "",
        tipo: conta?.tipo || "banco",
        saldoInicial: conta?.saldoInicial ?? "",
        saldoReal: "",
        ativa: conta?.ativa ?? true,
        desc: conta?.desc || "",
      });
    }
  }, [isOpen, conta]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { saldoReal, ...rest } = form;
      let saldoInicial = Number(form.saldoInicial) || 0;
      // "Saldo real hoje": calcula o saldo inicial para a conta bater com a realidade
      if (conta && saldoReal !== "" && !isNaN(Number(saldoReal))) {
        const movimentos = conta.saldo - (conta.saldoInicial || 0);
        saldoInicial = Math.round((Number(saldoReal) - movimentos) * 100) / 100;
      }
      const body = { ...rest, saldoInicial };
      if (conta)
        await api("/api/contas", {
          method: "PUT",
          body: { id: conta._id, ...body },
        });
      else await api("/api/contas", { method: "POST", body });
      toast(conta ? "Conta atualizada!" : "Conta criada!");
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
      title={conta ? "Editar Conta" : "Nova Conta"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome" htmlFor="nomeConta">
          <input
            id="nomeConta"
            className={inputClass}
            required
            value={form.nome}
            placeholder="Ex: Banco"
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={form.tipo}
            onChange={(v) => setForm({ ...form, tipo: v })}
            options={Object.entries(TIPO_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Field>
        <Field
          label="Saldo inicial"
          htmlFor="saldoInicial"
          hint="Quanto havia na conta antes de começar a registrar no sistema"
        >
          <input
            id="saldoInicial"
            type="number"
            step="0.01"
            inputMode="decimal"
            className={inputClass}
            value={form.saldoInicial}
            placeholder="0,00"
            onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })}
            disabled={form.saldoReal !== "" && form.saldoReal !== undefined}
          />
        </Field>
        {conta && (
          <Field
            label="Saldo real hoje (opcional)"
            htmlFor="saldoReal"
            hint={`Saldo calculado agora: ${formatMoney(conta.saldo)}. Informe quanto há de fato na conta e o saldo inicial é ajustado para bater.`}
          >
            <input
              id="saldoReal"
              type="number"
              step="0.01"
              inputMode="decimal"
              className={inputClass}
              value={form.saldoReal}
              placeholder="Ex: 1500,00"
              onChange={(e) => setForm({ ...form, saldoReal: e.target.value })}
            />
          </Field>
        )}
        {conta && (
          <Toggle
            checked={form.ativa}
            onChange={(v) => setForm({ ...form, ativa: v })}
            labelOn="Ativa"
            labelOff="Inativa (não aparece para novos lançamentos)"
          />
        )}
        <FormButtons
          onCancel={onClose}
          saving={saving}
          label={conta ? "Salvar" : "Criar"}
        />
      </form>
    </Modal>
  );
}

function TransferenciaModal({ isOpen, contas, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    contaOrigem: "",
    contaDestino: "",
    valor: "",
    data: todayYmd(),
    desc: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen)
      setForm({
        contaOrigem: "",
        contaDestino: "",
        valor: "",
        data: todayYmd(),
        desc: "",
      });
  }, [isOpen]);

  const options = contas
    .filter((c) => c.ativa)
    .map((c) => ({
      value: c._id,
      label: `${c.nome} (${formatMoney(c.saldo)})`,
    }));

  async function submit(e) {
    e.preventDefault();
    if (!form.contaOrigem || !form.contaDestino) {
      toast("Selecione as duas contas", "error");
      return;
    }
    setSaving(true);
    try {
      await api("/api/transferencias", {
        method: "POST",
        body: { ...form, valor: Number(form.valor) },
      });
      toast("Transferência registrada!");
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferir entre contas">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="De">
            <Select
              value={form.contaOrigem}
              onChange={(v) => setForm({ ...form, contaOrigem: v })}
              placeholder="Conta de origem"
              options={options}
            />
          </Field>
          <Field label="Para">
            <Select
              value={form.contaDestino}
              onChange={(v) => setForm({ ...form, contaDestino: v })}
              placeholder="Conta de destino"
              options={options.filter((o) => o.value !== form.contaOrigem)}
            />
          </Field>
          <Field label="Valor" htmlFor="valorT">
            <input
              id="valorT"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              className={inputClass}
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </Field>
          <Field label="Data" htmlFor="dataT">
            <DatePicker
              id="dataT"
              value={form.data}
              onChange={(v) => setForm({ ...form, data: v })}
            />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="descT">
          <input
            id="descT"
            className={inputClass}
            value={form.desc}
            placeholder="Ex: depósito do dinheiro do caixa"
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </Field>
        <FormButtons onCancel={onClose} saving={saving} label="Transferir" />
      </form>
    </Modal>
  );
}

function ExtratoModal({ conta, onClose }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [conta]);
  const { data, pagination, loading } = useApiList(
    conta ? `/api/contas/${conta._id}/extrato` : "",
    { page, limit: 15 },
    { enabled: !!conta },
  );
  if (!conta) return null;
  return (
    <Modal isOpen onClose={onClose} title={`Extrato · ${conta.nome}`} size="lg">
      <p className="text-sm text-gray-600 mb-4">
        Saldo atual: <b className="text-gray-900">{formatMoney(conta.saldo)}</b>
        {conta.saldoInicial !== 0 &&
          ` (saldo inicial ${formatMoney(conta.saldoInicial)})`}
      </p>
      {loading && data.length === 0 ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Sem movimentações.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border rounded-lg">
          {data.map((m) => (
            <li key={m._id} className="px-3 py-2.5 flex items-center gap-3">
              {m.valor >= 0 ? (
                <ArrowDownCircleIcon className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <ArrowUpCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{m.descricao}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(m.data)} ·{" "}
                  {
                    {
                      recebimento: "Recebimento",
                      despesa: "Despesa",
                      retirada: "Retirada",
                      transferencia: "Transferência",
                    }[m.tipo]
                  }
                </p>
              </div>
              <span
                className={`text-sm font-semibold whitespace-nowrap ${m.valor >= 0 ? "text-green-700" : "text-red-600"}`}
              >
                {m.valor >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(m.valor))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
          />
        </div>
      )}
    </Modal>
  );
}
