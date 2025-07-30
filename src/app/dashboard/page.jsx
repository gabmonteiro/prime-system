"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { useRouter } from "next/navigation";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { useRef } from "react";
import DashboardLayout from "./DashboardLayout";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  // Virada do mês no dia 17
  if (day < 17) {
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }
  }
  return `${year}-${month.toString().padStart(2, "0")}`;
}

function getDayKey(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [servicos, setServicos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [carteira, setCarteira] = useState(0);
  const [meses, setMeses] = useState([]);
  const [dadosServicosDia, setDadosServicosDia] = useState({});
  const [dadosDespesasDia, setDadosDespesasDia] = useState({});
  const [selectedMes, setSelectedMes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const graficoServicosRef = useRef(null);
  const graficoDespesasRef = useRef(null);

  // Novo estado para valor personalizado da distribuição
  const [valorDistribuicao, setValorDistribuicao] = useState("");
  const [isCriandoDespesa, setIsCriandoDespesa] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dashboard");
      const { servicos, despesas, compras } = await response.json();

      setServicos(servicos || []);
      setDespesas(despesas || []);
      setCompras(compras || []);

      // Agrupamento por mês e por dia
      const mesesSet = new Set();
      const servDia = {};
      const despDia = {};

      servicos.forEach((s) => {
        const mesKey = getMonthKey(s.data);
        mesesSet.add(mesKey);
        const diaKey = getDayKey(s.data);
        const valor = s.valorPersonalizado
          ? Number(s.valorPersonalizado)
          : s.tipoServico?.valor
            ? Number(s.tipoServico.valor)
            : 0;
        servDia[diaKey] = (servDia[diaKey] || 0) + valor;
      });

      despesas.forEach((d) => {
        const mesKey = getMonthKey(d.data);
        mesesSet.add(mesKey);
        const diaKey = getDayKey(d.data);
        const valor = d.valor ? Number(d.valor) : 0;
        despDia[diaKey] = (despDia[diaKey] || 0) + valor;
      });

      const mesesArr = Array.from(mesesSet).sort();
      setMeses(mesesArr);
      setSelectedMes(mesesArr.length > 0 ? mesesArr[mesesArr.length - 1] : "");
      setDadosServicosDia(servDia);
      setDadosDespesasDia(despDia);

      // Carteira: saldo acumulado de todos os meses
      const totalServ = servicos.reduce(
        (acc, s) =>
          acc +
          (s.valorPersonalizado
            ? Number(s.valorPersonalizado)
            : s.tipoServico?.valor
              ? Number(s.tipoServico.valor)
              : 0),
        0,
      );
      const totalDesp = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
      setCarteira(totalServ - totalDesp);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedMes && Object.keys(dadosServicosDia).length > 0) {
      renderCharts();
    }
  }, [selectedMes, dadosServicosDia, dadosDespesasDia]);

  function renderCharts() {
    // Destruir gráficos existentes
    if (graficoServicosRef.current) {
      graficoServicosRef.current.destroy();
    }
    if (graficoDespesasRef.current) {
      graficoDespesasRef.current.destroy();
    }

    // Filtrar dados do mês selecionado
    const startDate = new Date(`${selectedMes}-17`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(16);

    const dias = [];
    const valoresServicos = [];
    const valoresDespesas = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
      dias.push(d.getDate());
      valoresServicos.push(dadosServicosDia[key] || 0);
      valoresDespesas.push(dadosDespesasDia[key] || 0);
    }

    // Gráfico de Serviços
    const ctxServicos = document.getElementById("graficoServicos");
    if (ctxServicos) {
      graficoServicosRef.current = new Chart(ctxServicos, {
        type: "line",
        data: {
          labels: dias,
          datasets: [
            {
              label: "Receita por Dia",
              data: valoresServicos,
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "R$ " + value.toFixed(2);
                },
              },
            },
            x: {
              title: {
                display: true,
                text: "Dia do Mês",
              },
            },
          },
        },
      });
    }

    // Gráfico de Despesas
    const ctxDespesas = document.getElementById("graficoDespesas");
    if (ctxDespesas) {
      graficoDespesasRef.current = new Chart(ctxDespesas, {
        type: "line",
        data: {
          labels: dias,
          datasets: [
            {
              label: "Despesas por Dia",
              data: valoresDespesas,
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "R$ " + value.toFixed(2);
                },
              },
            },
            x: {
              title: {
                display: true,
                text: "Dia do Mês",
              },
            },
          },
        },
      });
    }
  }

  // Calcular estatísticas do mês atual
  const servicosDoMes = servicos.filter(
    (s) => getMonthKey(s.data) === selectedMes,
  );
  const despesasDoMes = despesas.filter(
    (d) => getMonthKey(d.data) === selectedMes,
  );
  const totalReceita = servicosDoMes.reduce(
    (acc, s) =>
      acc +
      (s.valorPersonalizado
        ? Number(s.valorPersonalizado)
        : s.tipoServico?.valor
          ? Number(s.tipoServico.valor)
          : 0),
    0,
  );
  const totalDespesas = despesasDoMes.reduce(
    (acc, d) => acc + (Number(d.valor) || 0),
    0,
  );
  const saldoMes = totalReceita - totalDespesas;

  // Estatísticas de compras futuras
  const comprasUrgentes = compras.filter((c) => c.urgencia === "alta").length;
  const totalEstimadoCompras = compras.reduce(
    (acc, c) => acc + (Number(c.valor) || 0),
    0,
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Função para criar despesa de retirada
  async function criarDespesaRetirada(valoresDistribuidos, valorTotal) {
    setIsCriandoDespesa(true);
    try {
      const nomes = Object.keys(valoresDistribuidos);
      const descricao = nomes
        .map(
          (nome) =>
            `${nome}: R$ ${valoresDistribuidos[nome].toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
        )
        .join(" | ");
      const payload = {
        nome: "Retirada de dinheiro",
        valor: valorTotal,
        desc: `Participantes: ${descricao}`,
        tipo: "gasto",
        data: new Date().toISOString().slice(0, 10),
      };
      const res = await fetch("/api/despesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao criar despesa");
      setToast({ show: true, message: "Despesa de retirada criada!", type: "success" });
      // Atualiza os dados do dashboard após criar a despesa
      await loadDashboardData();
    } catch (e) {
      setToast({ show: true, message: "Erro ao criar despesa de retirada", type: "error" });
    } finally {
      setIsCriandoDespesa(false);
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-[99999] max-w-sm w-full sm:right-4 sm:left-auto sm:translate-x-0 left-1/2 -translate-x-1/2 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-center">
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => setToast({ show: false, message: "", type: "success" })}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Bem-vindo de volta, {user?.name || "Usuário"}!
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Carregando dados...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Carteira */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-lg ${
                        carteira >= 0 ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <BanknotesIcon
                        className={`h-6 w-6 ${
                          carteira >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Saldo da Carteira
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          carteira >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        R${" "}
                        {carteira.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receita do Mês */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Receita do Mês
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        R${" "}
                        {totalReceita.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {servicosDoMes.length} serviços
                      </p>
                    </div>
                  </div>
                </div>

                {/* Despesas do Mês */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Despesas do Mês
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        R${" "}
                        {totalDespesas.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {despesasDoMes.length} itens
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compras Futuras */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Lista de Compras
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        R${" "}
                        {totalEstimadoCompras.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {compras.length} itens ({comprasUrgentes} urgentes)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seletor de Mês */}
              {meses.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Análise Mensal
                    </h2>
                    <div className="flex items-center space-x-3">
                      <label
                        htmlFor="mes-select"
                        className="text-sm font-medium text-gray-700"
                      >
                        Período:
                      </label>
                      <select
                        id="mes-select"
                        value={selectedMes}
                        onChange={(e) => setSelectedMes(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {meses.map((mes) => (
                          <option key={mes} value={mes}>
                            {new Date(`${mes}-17`).toLocaleDateString("pt-BR", {
                              year: "numeric",
                              month: "long",
                            })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resumo do Mês Selecionado */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        R${" "}
                        {totalReceita.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-gray-600">Receita Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        R${" "}
                        {totalDespesas.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        Despesas Total
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          saldoMes >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        R${" "}
                        {saldoMes.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm text-gray-600">Saldo do Mês</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Gráfico de Receitas */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Receitas Diárias
                    </h3>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="h-64">
                    <canvas id="graficoServicos"></canvas>
                  </div>
                </div>

                {/* Gráfico de Despesas */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Despesas Diárias
                    </h3>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="h-64">
                    <canvas id="graficoDespesas"></canvas>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => router.push("/dashboard/servicos")}
                    className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <WrenchScrewdriverIcon className="h-6 w-6 mr-2" />
                    <span className="font-medium">Novo Serviço</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/despesas")}
                    className="flex items-center justify-center p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <CurrencyDollarIcon className="h-6 w-6 mr-2" />
                    <span className="font-medium">Nova Despesa</span>
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/lista-compras")}
                    className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <ShoppingCartIcon className="h-6 w-6 mr-2" />
                    <span className="font-medium">Lista de Compras</span>
                  </button>

                  {user?.isAdmin && (
                    <button
                      onClick={() => router.push("/dashboard/usuarios")}
                      className="flex items-center justify-center p-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <UsersIcon className="h-6 w-6 mr-2" />
                      <span className="font-medium">Usuários</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Participantes */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Distribuição de Serviços
                    </h3>
                    <p className="text-sm text-gray-600">
                      {servicosDoMes.length} serviços este mês
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                {/* Campo para valor personalizado */}
                <div className="mb-6 flex items-center gap-2">
                  <label htmlFor="valor-distribuicao" className="text-sm font-medium text-gray-700">
                    Valor personalizado para simulação:
                  </label>
                  <input
                    id="valor-distribuicao"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorDistribuicao}
                    onChange={e => setValorDistribuicao(e.target.value)}
                    placeholder="Ex: 1000.00"
                    className="px-2 py-1 border border-gray-300 rounded-md w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-xs text-gray-400">(opcional)</span>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const nomes = ["Gabriel", "Davi", "Samuel"];
                    const valoresParticipantes = { Gabriel: 0, Davi: 0, Samuel: 0 };
                    servicosDoMes.forEach((s) => {
                      const participantes = Array.isArray(s.participantes)
                        ? s.participantes
                        : [];
                      if (participantes.length > 0) {
                        const valorServico = s.valorPersonalizado
                          ? Number(s.valorPersonalizado)
                          : s.tipoServico?.valor
                            ? Number(s.tipoServico.valor)
                            : 0;
                        const valorPorParticipante =
                          valorServico / participantes.length;
                        participantes.forEach((nome) => {
                          if (nomes.includes(nome)) {
                            valoresParticipantes[nome] += valorPorParticipante;
                          }
                        });
                      }
                    });
                    const somaValores = Object.values(valoresParticipantes).reduce((acc, v) => acc + v, 0);
                    // Calcula os valores distribuídos para o botão
                    let valorTotal = carteira;
                    if (valorDistribuicao && !isNaN(Number(valorDistribuicao))) {
                      valorTotal = Number(valorDistribuicao);
                    }
                    const valoresDistribuidos = {};
                    nomes.forEach((nome) => {
                      valoresDistribuidos[nome] =
                        somaValores > 0
                          ? valorTotal * (valoresParticipantes[nome] / somaValores)
                          : 0;
                    });
                    // Renderização dos cards
                    return nomes.map((nome, index) => {
                      const valor = somaValores > 0 ? carteira * (valoresParticipantes[nome] / somaValores) : 0;
                      const percentage = somaValores > 0 ? (valoresParticipantes[nome] / somaValores) * 100 : 0;
                      const count = servicosDoMes.filter(
                        (s) => Array.isArray(s.participantes) && s.participantes.includes(nome)
                      ).length;
                      const valorPersonalizadoDistribuicao =
                        somaValores > 0 && valorDistribuicao
                          ? Number(valorDistribuicao) * (valoresParticipantes[nome] / somaValores)
                          : 0;
                      const colors = [
                        "bg-blue-100 text-blue-600",
                        "bg-green-100 text-green-600",
                        "bg-purple-100 text-purple-600",
                      ];
                      const barColor = [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-purple-500",
                      ];
                      return (
                        <div key={nome} className="flex items-center gap-4 py-2">
                          <div className={`w-10 h-10 ${colors[index].split(' ')[0]} rounded-lg flex items-center justify-center`}>
                            <UsersIcon className={`w-5 h-5 ${colors[index].split(' ')[1]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{nome}</span>
                              <span className="text-xs text-gray-500">{count} serviços</span>
                              <span className="text-xs font-semibold text-gray-700">
                                R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {/* Valor personalizado distribuído */}
                            {valorDistribuicao && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Valor personalizado:</span>
                                <span className="text-xs font-semibold text-blue-700">
                                  R$ {valorPersonalizadoDistribuicao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-2 ${barColor[index]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500 w-10 text-right">{Math.round(percentage)}%</span>
                        </div>
                      );
                    });
                  })()}
                </div>
                {/* Botão para criar despesa de retirada */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={isCriandoDespesa}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    onClick={() => {
                      // Recalcula os valores distribuídos para o envio correto
                      const nomes = ["Gabriel", "Davi", "Samuel"];
                      const valoresParticipantes = { Gabriel: 0, Davi: 0, Samuel: 0 };
                      servicosDoMes.forEach((s) => {
                        const participantes = Array.isArray(s.participantes)
                          ? s.participantes
                          : [];
                        if (participantes.length > 0) {
                          const valorServico = s.valorPersonalizado
                            ? Number(s.valorPersonalizado)
                            : s.tipoServico?.valor
                              ? Number(s.tipoServico.valor)
                              : 0;
                          const valorPorParticipante =
                            valorServico / participantes.length;
                          participantes.forEach((nome) => {
                            if (nomes.includes(nome)) {
                              valoresParticipantes[nome] += valorPorParticipante;
                            }
                          });
                        }
                      });
                      const somaValores = Object.values(valoresParticipantes).reduce((acc, v) => acc + v, 0);
                      let valorTotal = carteira;
                      if (valorDistribuicao && !isNaN(Number(valorDistribuicao))) {
                        valorTotal = Number(valorDistribuicao);
                      }
                      const valoresDistribuidos = {};
                      nomes.forEach((nome) => {
                        valoresDistribuidos[nome] =
                          somaValores > 0
                            ? valorTotal * (valoresParticipantes[nome] / somaValores)
                            : 0;
                      });
                      criarDespesaRetirada(valoresDistribuidos, valorTotal);
                    }}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Criar despesa de retirada
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Últimos Serviços */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Últimos Serviços
                  </h3>
                  {servicosDoMes
                    .slice(-5)
                    .reverse()
                    .map((servico, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {servico.cliente}
                            </p>
                            <p className="text-sm text-gray-500">
                              {typeof servico.tipoServico === "object"
                                ? servico.tipoServico?.nome
                                : servico.tipoServico}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            R${" "}
                            {(
                              servico.valorPersonalizado ||
                              servico.tipoServico?.valor ||
                              0
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(servico.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  {servicosDoMes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum serviço neste período
                    </p>
                  )}
                </div>

                {/* Últimas Despesas */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Últimas Despesas
                  </h3>
                  {despesasDoMes
                    .slice(-5)
                    .reverse()
                    .map((despesa, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 rounded-full">
                            <CurrencyDollarIcon className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {despesa.nome}
                            </p>
                            <p className="text-sm text-gray-500">
                              {despesa.desc}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            R${" "}
                            {Number(despesa.valor).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(despesa.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  {despesasDoMes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhuma despesa neste período
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
