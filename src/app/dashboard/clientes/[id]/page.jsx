"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../DashboardLayout";
import { useAuth } from "../../../../context/authContext";
import StatCard from "../../../../components/ui/StatCard";
import { LoadingState, EmptyState } from "../../../../components/ui/States";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import Modal from "../../../../components/ui/Modal";
import Select from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import ClienteFormModal, {
  CarroFormModal,
} from "../../../../components/clientes/ClienteFormModal";
import ServicoFormModal from "../../../../components/servicos/ServicoFormModal";
import PagamentoModal from "../../../../components/servicos/PagamentoModal";
import StatusPagamento from "../../../../components/servicos/StatusPagamento";
import useLookups from "../../../../hooks/useLookups";
import { api, qs } from "../../../../libs/fetcher";
import { formatMoney } from "../../../../libs/money";
import { formatDate } from "../../../../libs/dates";

export default function ClienteDetalhePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const { tipos, usuarios, contas } = useLookups([
    "tipos",
    "usuarios",
    "contas",
  ]);
  const [detalhe, setDetalhe] = useState(null);
  const [error, setError] = useState(null);
  const [carroFiltro, setCarroFiltro] = useState("");

  const [editCliente, setEditCliente] = useState(false);
  const [carroModal, setCarroModal] = useState({ open: false, carro: null });
  const [servicoModal, setServicoModal] = useState({
    open: false,
    servico: null,
  });
  const [pagamento, setPagamento] = useState(null);
  const [confirm, setConfirm] = useState(null); // { tipo: 'cliente'|'carro', item }
  const [merge, setMerge] = useState(null); // { tipo: 'cliente'|'carro', item }

  const load = useCallback(async () => {
    try {
      setDetalhe(await api(`/api/clientes/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canUpdate = hasPermission("clientes", "update");
  const canDelete = hasPermission("clientes", "delete");

  async function doDelete() {
    try {
      if (confirm.tipo === "cliente") {
        await api("/api/clientes", { method: "DELETE", body: { id } });
        toast("Cliente excluído");
        router.push("/dashboard/clientes");
      } else {
        await api("/api/carros", {
          method: "DELETE",
          body: { id: confirm.item._id },
        });
        toast("Veículo excluído");
        setConfirm(null);
        load();
      }
    } catch (err) {
      toast(err.message, "error");
      setConfirm(null);
    }
  }

  if (error) {
    return (
      <DashboardLayout permission="clientes:read">
        <EmptyState title="Cliente não encontrado" text={error}>
          <Link
            href="/dashboard/clientes"
            className="text-blue-600 hover:underline"
          >
            Voltar para clientes
          </Link>
        </EmptyState>
      </DashboardLayout>
    );
  }
  if (!detalhe) {
    return (
      <DashboardLayout permission="clientes:read">
        <LoadingState />
      </DashboardLayout>
    );
  }

  const { cliente, carros, servicos, stats } = detalhe;
  const lista = carroFiltro
    ? servicos.filter((s) => String(s.carroRef?._id) === carroFiltro)
    : servicos;

  return (
    <DashboardLayout permission="clientes:read">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Clientes
      </Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-2xl text-indigo-700 font-semibold">
                {cliente.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {cliente.nome}
              </h1>
              <div className="text-sm text-gray-600 flex flex-wrap gap-x-4">
                {cliente.telefone && (
                  <a
                    href={`tel:${cliente.telefone}`}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <PhoneIcon className="h-4 w-4" /> {cliente.telefone}
                  </a>
                )}
                {stats.primeiroServico && (
                  <span>Cliente desde {formatDate(stats.primeiroServico)}</span>
                )}
              </div>
              {cliente.obs && (
                <p className="text-sm text-gray-500 mt-1">{cliente.obs}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasPermission("servicos", "create") && (
              <button
                onClick={() => setServicoModal({ open: true, servico: null })}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Serviço
              </button>
            )}
            {canUpdate && (
              <>
                <button
                  onClick={() => setEditCliente(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100"
                >
                  <PencilIcon className="h-4 w-4 mr-1" /> Editar
                </button>
                <button
                  onClick={() => setMerge({ tipo: "cliente", item: cliente })}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  title="Juntar com outro cadastro duplicado"
                >
                  <ArrowsRightLeftIcon className="h-4 w-4 mr-1" /> Mesclar
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirm({ tipo: "cliente", item: cliente })}
                className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <StatCard
          icon={WrenchScrewdriverIcon}
          label="Serviços"
          value={stats.servicos}
          hint={
            stats.ultimoServico
              ? `Último em ${formatDate(stats.ultimoServico)}`
              : ""
          }
        />
        <StatCard
          icon={CurrencyDollarIcon}
          color="purple"
          label="Total gasto"
          value={formatMoney(stats.valorTotal)}
          hint={`Ticket médio ${formatMoney(stats.ticketMedio)}`}
        />
        <StatCard
          icon={CheckCircleIcon}
          color="green"
          label="Pago"
          value={formatMoney(stats.recebido)}
          valueClassName="text-green-600"
        />
        <StatCard
          icon={ClockIcon}
          color="orange"
          label="A receber"
          value={formatMoney(stats.aReceber)}
          valueClassName={
            stats.aReceber > 0 ? "text-orange-600" : "text-gray-900"
          }
        />
      </div>

      {/* Veículos */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gray-400" /> Veículos
          </h2>
          {hasPermission("clientes", "create") && (
            <button
              onClick={() => setCarroModal({ open: true, carro: null })}
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Adicionar
            </button>
          )}
        </div>
        {carros.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum veículo cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {carros.map((c) => {
              const ativo = carroFiltro === String(c._id);
              return (
                <div
                  key={c._id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${ativo ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                  onClick={() => setCarroFiltro(ativo ? "" : String(c._id))}
                  title="Ver histórico deste veículo"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {c.modelo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {[c.placa, c.cor].filter(Boolean).join(" · ") ||
                          "Sem placa"}
                      </p>
                    </div>
                    <div
                      className="flex gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canUpdate && (
                        <>
                          <button
                            onClick={() =>
                              setCarroModal({ open: true, carro: c })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {carros.length > 1 && (
                            <button
                              onClick={() =>
                                setMerge({ tipo: "carro", item: c })
                              }
                              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-full"
                              title="Mesclar com outro veículo"
                            >
                              <ArrowsRightLeftIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                      {canDelete && c.servicos === 0 && (
                        <button
                          onClick={() => setConfirm({ tipo: "carro", item: c })}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-full"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {c.servicos} serviço(s) · {formatMoney(c.valorTotal)}
                    {c.ultimoServico &&
                      ` · último ${formatDate(c.ultimoServico)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 sm:px-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Histórico de serviços
            {carroFiltro && (
              <span className="text-gray-500 font-normal">
                {" "}
                · {carros.find((c) => String(c._id) === carroFiltro)?.modelo}
              </span>
            )}
          </h2>
          {carroFiltro && (
            <button
              onClick={() => setCarroFiltro("")}
              className="text-sm text-blue-600 hover:underline self-start"
            >
              Ver todos os veículos
            </button>
          )}
        </div>
        {lista.length === 0 ? (
          <EmptyState icon={WrenchScrewdriverIcon} title="Nenhum serviço" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {lista.map((s) => (
              <li
                key={s._id}
                className="px-4 sm:px-6 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {s.semTipo
                      ? "Serviço personalizado"
                      : s.tipoServico?.nome || "Tipo removido"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {formatDate(s.data)} · {s.carroRef?.modelo || s.nomeCarro}
                    {s.participantes?.length > 0 &&
                      ` · ${s.participantes.map((p) => p.name).join(", ")}`}
                  </p>
                  {s.obs && (
                    <p className="text-xs text-gray-400 truncate">{s.obs}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {formatMoney(s.valorTotal)}
                  </p>
                  <StatusPagamento servico={s} />
                </div>
                <div className="flex shrink-0">
                  <button
                    onClick={() => setPagamento(s)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                    title="Pagamento"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                  </button>
                  {hasPermission("servicos", "update") && (
                    <button
                      onClick={() =>
                        setServicoModal({ open: true, servico: s })
                      }
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ClienteFormModal
        isOpen={editCliente}
        onClose={() => setEditCliente(false)}
        cliente={cliente}
        onSaved={load}
      />
      <CarroFormModal
        isOpen={carroModal.open}
        onClose={() => setCarroModal({ open: false, carro: null })}
        carro={carroModal.carro}
        clienteId={id}
        onSaved={load}
      />
      <ServicoFormModal
        isOpen={servicoModal.open}
        onClose={() => setServicoModal({ open: false, servico: null })}
        servico={
          servicoModal.servico
            ? {
                ...servicoModal.servico,
                clienteRef: { _id: cliente._id, nome: cliente.nome },
              }
            : null
        }
        defaults={{
          clienteId: cliente._id,
          clienteNome: cliente.nome,
          carros,
          carroId: carroFiltro || (carros.length === 1 ? carros[0]._id : ""),
        }}
        tipos={tipos}
        usuarios={usuarios}
        contas={contas}
        onSaved={load}
      />
      <PagamentoModal
        isOpen={!!pagamento}
        onClose={() => setPagamento(null)}
        servico={pagamento}
        contas={contas}
        canEdit={hasPermission("servicos", "update")}
        onSaved={load}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        danger
        confirmLabel="Excluir"
        title={
          confirm?.tipo === "cliente" ? "Excluir cliente" : "Excluir veículo"
        }
        message={
          confirm?.tipo === "cliente"
            ? stats.servicos > 0
              ? `${cliente.nome} tem ${stats.servicos} serviço(s). Use "Mesclar" para juntar com outro cadastro, ou exclua os serviços antes.`
              : `Excluir ${cliente.nome} e seus veículos?`
            : `Excluir o veículo ${confirm?.item?.modelo}?`
        }
      />
      <MergeModal
        merge={merge}
        cliente={cliente}
        carros={carros}
        onClose={() => setMerge(null)}
        onDone={(destinoId) => {
          setMerge(null);
          if (merge?.tipo === "cliente")
            router.push(`/dashboard/clientes/${destinoId}`);
          else load();
        }}
      />
    </DashboardLayout>
  );
}

/** Junta cadastros duplicados (cliente -> outro cliente, ou carro -> outro carro do mesmo cliente). */
function MergeModal({ merge, cliente, carros, onClose, onDone }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [opcoes, setOpcoes] = useState([]);
  const [destino, setDestino] = useState("");
  const [saving, setSaving] = useState(false);
  const isCliente = merge?.tipo === "cliente";

  useEffect(() => {
    setDestino("");
    setQ("");
  }, [merge]);

  useEffect(() => {
    if (!isCliente) return;
    const t = setTimeout(async () => {
      try {
        const res = await api(`/api/clientes${qs({ search: "true", q })}`);
        setOpcoes(res.filter((c) => c._id !== cliente._id));
      } catch {
        setOpcoes([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, isCliente, cliente._id]);

  if (!merge) return null;

  async function submit() {
    if (!destino) return;
    setSaving(true);
    try {
      await api(isCliente ? "/api/clientes/merge" : "/api/carros/merge", {
        method: "POST",
        body: { fromId: merge.item._id, toId: destino },
      });
      toast("Cadastros mesclados!");
      onDone(destino);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const nomeOrigem = isCliente ? merge.item.nome : merge.item.modelo;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isCliente ? "Mesclar cliente" : "Mesclar veículo"}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Todos os {isCliente ? "veículos e serviços" : "serviços"} de{" "}
          <b>{nomeOrigem}</b> serão movidos para o cadastro escolhido, e{" "}
          <b>{nomeOrigem}</b> será removido. Use para juntar duplicados.
        </p>
        {isCliente ? (
          <>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente de destino"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <ul className="max-h-56 overflow-auto border rounded-lg divide-y">
              {opcoes.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => setDestino(c._id)}
                    className={`w-full text-left px-3 py-2 text-sm ${destino === c._id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                  >
                    {c.nome}
                    {c.carros?.length > 0 && (
                      <span className="text-gray-500">
                        {" "}
                        · {c.carros.map((x) => x.modelo).join(", ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {opcoes.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">
                  Nenhum cliente
                </li>
              )}
            </ul>
          </>
        ) : (
          <Select
            value={destino}
            onChange={setDestino}
            placeholder="Veículo de destino"
            options={carros
              .filter((c) => c._id !== merge.item._id)
              .map((c) => ({
                value: c._id,
                label: `${c.modelo}${c.placa ? ` · ${c.placa}` : ""}`,
              }))}
          />
        )}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!destino || saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Mesclando..." : "Mesclar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
