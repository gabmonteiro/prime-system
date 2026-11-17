"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  TrophyIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "../../context/authContext";
import StatCard from "../../components/ui/StatCard";
import Select from "../../components/ui/Select";
import ChartCanvas from "../../components/ui/ChartCanvas";
import Badge from "../../components/ui/Badge";
import { LoadingState } from "../../components/ui/States";
import DivisaoSocios from "../../components/dashboard/DivisaoSocios";
import { api } from "../../libs/fetcher";
import { formatMoney } from "../../libs/money";
import { brandColor } from "../../libs/theme";
import { formatDate, formatMonthKey, toDateOnly } from "../../libs/dates";

const delta = (atual, anterior) =>
  anterior ? (atual - anterior) / Math.abs(anterior) : null;

const moneyTick = (v) =>
  "R$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [mes, setMes] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankPeriodo, setRankPeriodo] = useState("12m");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/api/dashboard${mes ? `?mes=${mes}` : ""}`));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mes]);

  useEffect(() => {
    load();
  }, [load]);

  const mensalConfig = useMemo(() => {
    if (!data) return null;
    return {
      type: "bar",
      data: {
        labels: data.mensal.map((m) => formatMonthKey(m.mes, true)),
        datasets: [
          {
            type: "line",
            label: "Lucro",
            data: data.mensal.map((m) => m.lucro),
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgb(34, 197, 94)",
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "Receita",
            data: data.mensal.map((m) => m.receita),
            backgroundColor: brandColor(500, 0.85),
            borderRadius: 4,
          },
          {
            label: "Despesas",
            data: data.mensal.map((m) => m.despesas),
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${formatMoney(c.raw)}`,
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: moneyTick } } },
      },
    };
  }, [data]);

  const diarioConfig = useMemo(() => {
    if (!data) return null;
    return {
      type: "line",
      data: {
        labels: data.diario.map((d) => Number(d.dia.slice(8, 10))),
        datasets: [
          {
            label: "Receita",
            data: data.diario.map((d) => d.receita),
            borderColor: brandColor(500),
            backgroundColor: brandColor(500, 0.1),
            fill: true,
            cubicInterpolationMode: "monotone",
          },
          {
            label: "Despesas",
            data: data.diario.map((d) => d.despesas),
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            fill: true,
            cubicInterpolationMode: "monotone",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              title: (items) => formatDate(data.diario[items[0].dataIndex].dia),
              label: (c) => `${c.dataset.label}: ${formatMoney(c.raw)}`,
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: moneyTick } } },
      },
    };
  }, [data]);

  if (!data && loading) {
    return (
      <DashboardLayout permission="dashboard:read">
        <LoadingState text="Carregando dashboard..." />
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout permission="dashboard:read">
        <p className="text-red-600">{error}</p>
      </DashboardLayout>
    );
  }

  const k = data.kpis;
  const p = data.permissoes;
  const ranking = rankPeriodo === "mes" ? data.topTiposMes : data.topTipos12;
  const maxRank = Math.max(1, ...ranking.map((r) => r.quantidade));
  const hoje = toDateOnly(new Date());

  return (
    <DashboardLayout permission="dashboard:read">
      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo de volta, {user?.name}!
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
              <div className="w-56">
                <Select
                  value={data.mes}
                  onChange={setMes}
                  options={data.meses.map((m) => ({
                    value: m,
                    label:
                      formatMonthKey(m) +
                      (m === data.mesAtual ? " (atual)" : ""),
                  }))}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">
              Mês fiscal: {formatDate(data.periodo.inicio)} a{" "}
              {formatDate(data.periodo.fim)}
            </span>
          </div>
        </div>

        {/* KPIs principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-6">
          <StatCard
            icon={ArrowTrendingUpIcon}
            label="Receita recebida"
            value={formatMoney(k.receitaMes)}
            valueClassName="text-blue-600"
            delta={delta(k.receitaMes, k.receitaPrev)}
            hint="vs mês anterior"
          />
          <StatCard
            icon={ArrowTrendingDownIcon}
            color="red"
            label="Despesas"
            value={formatMoney(k.despesasMes)}
            valueClassName="text-red-600"
            delta={delta(k.despesasMes, k.despesasPrev)}
            invertDelta
            hint={
              k.retiradasMes
                ? `+ ${formatMoney(k.retiradasMes)} retiradas`
                : "vs mês anterior"
            }
          />
          <StatCard
            icon={ChartBarIcon}
            color={k.lucroMes >= 0 ? "green" : "red"}
            label="Lucro do mês"
            value={formatMoney(k.lucroMes)}
            valueClassName={k.lucroMes >= 0 ? "text-green-600" : "text-red-600"}
            delta={delta(k.lucroMes, k.lucroPrev)}
            hint="receita − despesas"
          />
          {p.contas ? (
            <Link href="/dashboard/contas" className="block">
              <StatCard
                icon={BanknotesIcon}
                color={data.saldoTotal >= 0 ? "green" : "red"}
                label="Saldo em contas"
                value={formatMoney(data.saldoTotal)}
                valueClassName={
                  data.saldoTotal >= 0 ? "text-green-600" : "text-red-600"
                }
                hint={`${data.contas.length} conta(s)`}
              />
            </Link>
          ) : (
            <StatCard icon={BanknotesIcon} label="Saldo em contas" value="—" />
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <StatCard
            icon={WrenchScrewdriverIcon}
            color="indigo"
            label="Serviços realizados"
            value={k.servicosMes}
            delta={delta(k.servicosMes, k.servicosPrev)}
            hint={`${formatMoney(k.faturadoMes)} faturado`}
          />
          <StatCard
            icon={ReceiptPercentIcon}
            color="purple"
            label="Ticket médio"
            value={formatMoney(k.ticketMedio)}
            delta={delta(k.ticketMedio, k.ticketMedioPrev)}
            hint="por serviço"
          />
          <Link href="/dashboard/servicos" className="block">
            <StatCard
              icon={ClockIcon}
              color="orange"
              label="A receber"
              value={formatMoney(data.aReceber.total)}
              valueClassName="text-orange-600"
              hint={
                data.aReceber.atrasadas
                  ? `${formatMoney(data.aReceber.atrasado)} atrasado (${data.aReceber.atrasadas})`
                  : "Nada atrasado"
              }
            />
          </Link>
          {data.compras ? (
            <Link href="/dashboard/lista-compras" className="block">
              <StatCard
                icon={ShoppingCartIcon}
                color="yellow"
                label="Lista de compras"
                value={formatMoney(data.compras.valorEstimado)}
                hint={`${data.compras.total} itens (${data.compras.urgentes} urgentes)`}
              />
            </Link>
          ) : (
            <StatCard
              icon={ShoppingCartIcon}
              color="yellow"
              label="Lista de compras"
              value="—"
            />
          )}
        </div>

        {/* Evolução 12 meses + contas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Panel
            title="Últimos 12 meses"
            subtitle="Receita recebida, despesas e lucro"
            className="xl:col-span-2"
          >
            <ChartCanvas config={mensalConfig} className="h-72" />
          </Panel>
          <Panel
            title="Saldo por conta"
            icon={BuildingLibraryIcon}
            action={
              p.contas && (
                <Link
                  href="/dashboard/contas"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver contas
                </Link>
              )
            }
          >
            {data.contas.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                Nenhuma conta cadastrada.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.contas.map((c) => (
                  <li
                    key={c._id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {c.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.recebidoMes > 0
                          ? `+${formatMoney(c.recebidoMes)} no mês`
                          : "Sem recebimentos no mês"}
                      </p>
                    </div>
                    <span
                      className={`font-semibold whitespace-nowrap ${c.saldo >= 0 ? "text-gray-900" : "text-red-600"}`}
                    >
                      {formatMoney(c.saldo)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Diário + ranking de serviços */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Panel
            title="Dia a dia do mês"
            subtitle="Recebimentos e despesas por dia"
            className="xl:col-span-2"
          >
            <ChartCanvas config={diarioConfig} className="h-64" />
          </Panel>
          <Panel
            title="Mais realizados"
            icon={TrophyIcon}
            action={
              <div className="flex text-xs rounded-lg border border-gray-200 overflow-hidden">
                {[
                  ["mes", "Mês"],
                  ["12m", "12 meses"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setRankPeriodo(v)}
                    className={`px-2.5 py-1 ${rankPeriodo === v ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            {ranking.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                Nenhum serviço no período.
              </p>
            ) : (
              <ul className="space-y-3">
                {ranking.map((r, i) => (
                  <li key={r.nome}>
                    <div className="flex items-center justify-between text-sm mb-1 gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {i + 1}. {r.nome}
                      </span>
                      <span className="text-gray-600 whitespace-nowrap">
                        {r.quantidade}x · {formatMoney(r.valor)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${(r.quantidade / maxRank) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Divisão + próximos recebimentos */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <DivisaoSocios
            divisao={data.divisao}
            mes={data.mes}
            saldoTotal={data.saldoTotal}
            contas={data.contas.map((c) => ({ ...c, ativa: true }))}
            canRetirar={hasPermission("despesas", "manage")}
            onRetirada={load}
          />
          <Panel
            title="Próximos recebimentos"
            icon={ClockIcon}
            action={
              <Link
                href="/dashboard/servicos"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver serviços
              </Link>
            }
          >
            {data.aReceber.proximas.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                Nada a receber. 🎉
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.aReceber.proximas.map((r) => {
                  const atrasada = new Date(r.vencimento) < hoje;
                  return (
                    <li
                      key={r.parcelaId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {r.cliente}{" "}
                          <span className="text-gray-500 font-normal">
                            · {r.nomeCarro}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {atrasada && (
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500" />
                          )}
                          {atrasada ? "Venceu" : "Vence"} em{" "}
                          {formatDate(r.vencimento)}
                          {r.totalParcelas > 1 &&
                            ` · parcela ${r.numero}/${r.totalParcelas}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900">
                          {formatMoney(r.valor)}
                        </p>
                        {atrasada && <Badge color="red">atrasado</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Top clientes + ações rápidas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <Panel
            title="Melhores clientes"
            subtitle="Últimos 12 meses"
            icon={UserIcon}
            className="xl:col-span-2"
          >
            {data.topClientes.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                Sem dados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {data.topClientes.map((c, i) => (
                  <div
                    key={c.id || c.nome}
                    className="py-2.5 flex items-center justify-between gap-3 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-sm font-semibold text-gray-400">
                        {i + 1}
                      </span>
                      {c.id ? (
                        <Link
                          href={`/dashboard/clientes/${c.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 truncate"
                        >
                          {c.nome}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900 truncate">
                          {c.nome}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {c.quantidade}x ·{" "}
                      <b className="text-gray-900">{formatMoney(c.valor)}</b>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Ações rápidas">
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
              {[
                [
                  "/dashboard/servicos",
                  "Serviços",
                  WrenchScrewdriverIcon,
                  "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  "servicos",
                ],
                [
                  "/dashboard/despesas",
                  "Despesas",
                  CurrencyDollarIcon,
                  "bg-red-50 text-red-700 hover:bg-red-100",
                  "despesas",
                ],
                [
                  "/dashboard/clientes",
                  "Clientes",
                  UserIcon,
                  "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                  "clientes",
                ],
                [
                  "/dashboard/contas",
                  "Contas",
                  BuildingLibraryIcon,
                  "bg-green-50 text-green-700 hover:bg-green-100",
                  "contas",
                ],
              ]
                .filter(([, , , , perm]) => hasPermission(perm, "read"))
                .map(([href, label, Icon, cls]) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={`flex items-center justify-center p-3 sm:p-4 rounded-lg transition-colors ${cls}`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  action,
  className = "",
  children,
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-5 w-5 text-gray-400 shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
