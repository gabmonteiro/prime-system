'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { useRef } from 'react';

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

import DashboardLayout from './DashboardLayout';

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
            label: 'Total Ganho (Serviços)',
            data: dias.map(d => dadosServicosDia[d] || 0),
            backgroundColor: 'rgba(37, 99, 235, 0.7)'
          }]
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
            label: 'Total Gasto (Despesas)',
            data: diasDesp.map(d => dadosDespesasDia[d] || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.7)'
          }]
        }
      });
    }
  }, [selectedMes, dadosServicosDia, dadosDespesasDia]);

  if (!user) {
    return <div className="text-center mt-20 text-lg text-blue-700">Carregando ou não autenticado...</div>;
  }
  return (
    <DashboardLayout>
      <div style={{ padding: 32 }}>
      <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
      <p className="text-lg text-gray-700 mb-6">Bem-vindo ao painel! Aqui você pode gerenciar o sistema.</p>
      <div style={{ marginBottom: 32 }}>
        <h3 className="text-xl font-semibold mb-2">Resumo Financeiro</h3>
        <div className="mb-4">
          <label className="font-semibold mr-2">Selecione o mês:</label>
          <select value={selectedMes} onChange={e => setSelectedMes(e.target.value)} className="px-2 py-1 border rounded">
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
          <div>
            <strong>Carteira do mês:</strong>
            <div style={{ fontSize: 22, color: carteira >= 0 ? '#2563eb' : '#ef4444' }}>
              R$ {(() => {
                // Calcula carteira do mês selecionado
                const totalServ = servicos.filter(s => getMonthKey(s.data) === selectedMes).reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0);
                const totalDesp = despesas.filter(d => getMonthKey(d.data) === selectedMes).reduce((acc, d) => acc + (d.valor ? Number(d.valor) : 0), 0);
                return (totalServ - totalDesp).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div>
            <strong>Futuras Compras:</strong>
            <div style={{ fontSize: 18 }}>
              {compras.length} itens | Soma: R$ {compras.reduce((acc, c) => acc + (Number(c.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#2563eb', fontSize: 18 }}>
              Total Rendimento: R$ {(() => {
                const totalServ = servicos.filter(s => getMonthKey(s.data) === selectedMes).reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0);
                return totalServ.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              })()}
            </div>
            <div style={{ width: 400 }}>
              <canvas ref={graficoServicosRef} width="400" height="200"></canvas>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ef4444', fontSize: 18 }}>
              Total Despesas: - R$ {(() => {
                const totalDesp = despesas.filter(d => getMonthKey(d.data) === selectedMes).reduce((acc, d) => acc + (d.valor ? Number(d.valor) : 0), 0);
                return totalDesp.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              })()}
            </div>
            <div style={{ width: 400 }}>
              <canvas ref={graficoDespesasRef} width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Futuras Compras</h3>
        <ul style={{ background: '#f5f7fa', borderRadius: 8, padding: 16 }}>
          {compras.length === 0 && <li>Nenhum item cadastrado.</li>}
          {compras.map(c => (
            <li key={c._id} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #e0e0e0' }}>
              <strong>{c.nome}</strong>
              {c.valor !== undefined && c.valor !== '' && (
                <> | Valor: R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
              )}
              {c.urgencia && <> | Urgência: {c.urgencia}</>}
              {c.desc && <> | {c.desc}</>}
            </li>
          ))}
        </ul>
      </div>
      {/* Sessão Valores a Receber */}
      <div style={{ marginTop: 32 }}>
        <h3 className="text-xl font-semibold mb-2">Valores a Receber</h3>
        {(() => {
          // Participantes
          const nomes = ['Gabriel', 'Davi', 'Samuel'];
          // Serviços do mês selecionado
          const servicosMes = servicos.filter(s => getMonthKey(s.data) === selectedMes);
          const totalServicos = servicosMes.length;
          // Conta a participação de cada um
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
          // Calcula porcentagem de cada um
          const porcentagens = {};
          nomes.forEach(n => {
            porcentagens[n] = totalServicos > 0 ? (participacoes[n] / totalServicos) : 0;
          });
          // Valor da carteira do mês
          const totalServ = servicosMes.reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0);
          const totalDesp = despesas.filter(d => getMonthKey(d.data) === selectedMes).reduce((acc, d) => acc + (d.valor ? Number(d.valor) : 0), 0);
          const carteiraMes = totalServ - totalDesp;
          return (
            <ul style={{ background: '#f5f7fa', borderRadius: 8, padding: 16 }}>
              {nomes.map(n => (
                <li key={n} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #e0e0e0' }}>
                  <strong>{n}</strong>: {Math.round(porcentagens[n] * 100)}% | R$ {(carteiraMes * porcentagens[n]).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
      </div>
    </DashboardLayout>
  );
}