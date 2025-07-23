'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { useRef } from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

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
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function getDayKey(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [servicos, setServicos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [carteira, setCarteira] = useState(0);
  const [meses, setMeses] = useState([]);
  const [dadosServicosDia, setDadosServicosDia] = useState({});
  const [dadosDespesasDia, setDadosDespesasDia] = useState({});
  const [selectedMes, setSelectedMes] = useState('');
  const graficoServicosRef = useRef(null);
  const graficoDespesasRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/servico').then(res => res.json()),
      fetch('/api/despesa').then(res => res.json()),
      fetch('/api/futuraCompra').then(res => res.json())
    ]).then(([serv, desp, comp]) => {
      setServicos(serv);
      setDespesas(desp);
      setCompras(comp);

      // Agrupamento por mês e por dia
      const mesesSet = new Set();
      const servDia = {};
      const despDia = {};
      
      serv.forEach(s => {
        const mesKey = getMonthKey(s.data);
        mesesSet.add(mesKey);
        const diaKey = getDayKey(s.data);
        const valor = s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0;
        servDia[diaKey] = (servDia[diaKey] || 0) + valor;
      });
      
      desp.forEach(d => {
        const mesKey = getMonthKey(d.data);
        mesesSet.add(mesKey);
        const diaKey = getDayKey(d.data);
        const valor = d.valor ? Number(d.valor) : 0;
        despDia[diaKey] = (despDia[diaKey] || 0) + valor;
      });
      
      const mesesArr = Array.from(mesesSet).sort();
      setMeses(mesesArr);
      setSelectedMes(mesesArr.length > 0 ? mesesArr[mesesArr.length - 1] : '');
      setDadosServicosDia(servDia);
      setDadosDespesasDia(despDia);
      
      // Carteira inicial (último mês)
      const totalServ = serv.filter(s => getMonthKey(s.data) === (mesesArr.length > 0 ? mesesArr[mesesArr.length - 1] : '')).reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0);
      const totalDesp = desp.filter(d => getMonthKey(d.data) === (mesesArr.length > 0 ? mesesArr[mesesArr.length - 1] : '')).reduce((acc, d) => acc + (d.valor ? Number(d.valor) : 0), 0);
      setCarteira(totalServ - totalDesp);
    });
  }, []);

  useEffect(() => {
    if (!selectedMes) return;
    
    // Filtra dias do mês selecionado
    const dias = Object.keys(dadosServicosDia)
      .filter(d => d.startsWith(selectedMes + '-'))
      .sort();

    // Gráfico de serviços por dia
    if (graficoServicosRef.current) {
      if (graficoServicosRef.current._chartInstance) {
        graficoServicosRef.current._chartInstance.destroy();
      }
      graficoServicosRef.current._chartInstance = new Chart(graficoServicosRef.current, {
        type: 'bar',
        data: {
          labels: dias,
          datasets: [{
            label: 'Receita Diária',
            data: dias.map(d => dadosServicosDia[d] || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // Gráfico de despesas por dia
    const diasDesp = Object.keys(dadosDespesasDia)
      .filter(d => d.startsWith(selectedMes + '-'))
      .sort();
      
    if (graficoDespesasRef.current) {
      if (graficoDespesasRef.current._chartInstance) {
        graficoDespesasRef.current._chartInstance.destroy();
      }
      graficoDespesasRef.current._chartInstance = new Chart(graficoDespesasRef.current, {
        type: 'bar',
        data: {
          labels: diasDesp,
          datasets: [{
            label: 'Despesas Diárias',
            data: diasDesp.map(d => dadosDespesasDia[d] || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }, [selectedMes, dadosServicosDia, dadosDespesasDia]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas do mês atual
  const servicosMes = servicos.filter(s => getMonthKey(s.data) === selectedMes);
  const despesasMes = despesas.filter(d => getMonthKey(d.data) === selectedMes);
  const totalReceita = servicosMes.reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0);
  const totalDespesas = despesasMes.reduce((acc, d) => acc + (d.valor ? Number(d.valor) : 0), 0);
  const lucroMes = totalReceita - totalDespesas;
  const totalCompras = compras.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Bem-vindo ao painel de controle, {user?.name || 'Usuário'}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3">
              <CalendarIcon className="text-gray-400" style={{ width: "20px", height: "20px" }} />
              <select 
                value={selectedMes} 
                onChange={e => setSelectedMes(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
              >
                {meses.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Receita */}
          <div className="card-stats shadow-soft animate-slideInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Receita Mensal</p>
                <p className="text-financial text-metric text-positive">
                  R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shadow-soft">
                <ArrowTrendingUpIcon className="heroicon-lg text-green-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-green-100">
              <div className="flex items-center text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  +12%
                </span>
                <span className="text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Despesas */}
          <div className="card-stats shadow-soft animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Despesas Mensais</p>
                <p className="text-financial text-metric text-negative">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shadow-soft">
                <ArrowTrendingDownIcon className="heroicon-lg text-red-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-red-100">
              <div className="flex items-center text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  +5%
                </span>
                <span className="text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Lucro */}
          <div className={`card-stats shadow-soft animate-slideInUp ${lucroMes >= 0 ? 'card-positive' : 'card-negative'}`} style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Lucro Mensal</p>
                <p className={`text-financial text-metric ${lucroMes >= 0 ? 'text-positive' : 'text-negative'}`}>
                  R$ {lucroMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`w-12 h-12 ${lucroMes >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-2xl flex items-center justify-center shadow-soft`}>
                <CurrencyDollarIcon className={`heroicon-lg ${lucroMes >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className={`flex items-center justify-between pt-3 border-t ${lucroMes >= 0 ? 'border-blue-100' : 'border-red-100'}`}>
              <div className="flex items-center text-sm">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  lucroMes >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {lucroMes >= 0 ? '+8%' : '-3%'}
                </span>
                <span className="text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          </div>

          {/* Compras Futuras */}
          <div className="card-stats shadow-soft animate-slideInUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Compras Futuras</p>
                <p className="text-financial text-metric text-neutral">
                  R$ {totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shadow-soft">
                <ShoppingCartIcon className="heroicon-lg text-purple-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-purple-100">
              <div className="flex items-center text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {compras.length} itens
                </span>
                <span className="text-gray-500 ml-2">na lista</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Receitas Chart */}
          <div className="card-chart shadow-medium animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Receitas Diárias</h3>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-soft">
                <ChartBarIcon className="heroicon-md text-blue-600" />
              </div>
            </div>
            <div className="h-64">
              <canvas ref={graficoServicosRef} className="w-full h-full"></canvas>
            </div>
          </div>

          {/* Despesas Chart */}
          <div className="card-chart shadow-medium animate-slideInUp" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Despesas Diárias</h3>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shadow-soft">
                <ChartBarIcon className="heroicon-md text-red-600" />
              </div>
            </div>
            <div className="h-64">
              <canvas ref={graficoDespesasRef} className="w-full h-full"></canvas>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de Compras */}
          <div className="card-enhanced shadow-medium animate-slideInUp" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Próximas Compras</h3>
                <p className="text-sm text-gray-600">{compras.length} itens planejados</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-soft">
                <ShoppingCartIcon className="heroicon-md text-purple-600" />
              </div>
            </div>
            <div className="space-y-3">
              {compras.slice(0, 5).map(c => (
                <div key={c._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-soft transition-all duration-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{c.nome}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Urgência:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        c.urgencia === 'alto' ? 'bg-red-100 text-red-800' : 
                        c.urgencia === 'medio' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {c.urgencia}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-financial text-balance">
                      R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {compras.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCartIcon className="heroicon-lg text-gray-400" />
                  </div>
                  <p className="text-gray-500">Nenhuma compra planejada</p>
                </div>
              )}
            </div>
          </div>

          {/* Participantes */}
          <div className="card-enhanced shadow-medium animate-slideInUp" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Distribuição de Serviços</h3>
                <p className="text-sm text-gray-600">{servicosMes.length} serviços este mês</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shadow-soft">
                <UsersIcon className="heroicon-md text-indigo-600" />
              </div>
            </div>
            <div className="space-y-4">
              {(() => {
                const nomes = ['Gabriel', 'Davi', 'Samuel'];
                const totalServicos = servicosMes.length;
                const participacoes = { Gabriel: 0, Davi: 0, Samuel: 0 };
                
                servicosMes.forEach(s => {
                  if (Array.isArray(s.participantes)) {
                    nomes.forEach(n => {
                      if (s.participantes.includes(n)) {
                        participacoes[n] += 1;
                      }
                    });
                  }
                });
                
                return nomes.map((nome, index) => {
                  const count = participacoes[nome];
                  const percentage = totalServicos > 0 ? (count / totalServicos * 100) : 0;
                  const valor = totalServicos > 0 ? (lucroMes * percentage / 100) : 0;
                  const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'];
                  
                  return (
                    <div key={nome} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-soft transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${colors[index].split(' ')[0]} rounded-xl flex items-center justify-center shadow-soft`}>
                          <UsersIcon className={`heroicon-md ${colors[index].split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 mb-1">{nome}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${colors[index].split(' ')[0].replace('100', '500')}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-financial text-balance ${valor >= 0 ? 'text-positive' : 'text-negative'}`}>
                          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">{count} serviços</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
