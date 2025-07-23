'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import DashboardLayout from '../DashboardLayout';
import Modal from '../../../components/ui/Modal';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  TagIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function DespesasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [despesas, setDespesas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', desc: '', tipo: 'gasto', data: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [modalOpen]);

  function fetchData() {
    fetch('/api/despesa')
      .then(res => res.json())
      .then(data => setDespesas(data));
  }

  const soma = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  const gastos = despesas.filter(d => d.tipo === 'gasto');
  const compras = despesas.filter(d => d.tipo === 'compra');
  const somaGastos = gastos.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  const somaCompras = compras.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      valor: form.valor ? Number(form.valor) : undefined,
      data: form.data ? new Date(form.data) : undefined,
    };
    
    const url = '/api/despesa';
    const method = editId ? 'PUT' : 'POST';
    const body = editId ? { id: editId, ...payload } : payload;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    closeModal();
    fetchData();
  }

  function handleEdit(despesa) {
    setForm({
      nome: despesa.nome || '',
      valor: despesa.valor || '',
      desc: despesa.desc || '',
      tipo: despesa.tipo || 'gasto',
      data: despesa.data ? new Date(despesa.data).toISOString().slice(0, 10) : '',
    });
    setEditId(despesa._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      await fetch('/api/despesa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchData();
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditId(null);
    setForm({ nome: '', valor: '', desc: '', tipo: 'gasto', data: '' });
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Despesas</h1>
            <p className="text-gray-600">Controle seus gastos e compras mensais</p>
          </div>
          
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
          >
            <PlusIcon style={{ width: "16px", height: "16px" }} />
            <span>Nova Despesa</span>
          </button>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card-stats shadow-soft animate-slideInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Total de Despesas</p>
                <p className="text-financial text-metric text-negative">
                  R$ {Math.abs(soma).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shadow-soft">
                <CurrencyDollarIcon className="heroicon-lg text-red-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-red-100">
              <span className="text-sm text-gray-600">{despesas.length} registros</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Total
              </span>
            </div>
          </div>

          <div className="card-stats shadow-soft animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Gastos Gerais</p>
                <p className="text-financial text-metric text-negative">
                  R$ {Math.abs(somaGastos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-soft">
                <ArrowTrendingDownIcon className="heroicon-lg text-orange-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-orange-100">
              <span className="text-sm text-gray-600">{gastos.length} gastos</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Gastos
              </span>
            </div>
          </div>

          <div className="card-stats shadow-soft animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Compras</p>
                <p className="text-financial text-metric text-negative">
                  R$ {Math.abs(somaCompras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shadow-soft">
                <ShoppingCartIcon className="heroicon-lg text-purple-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-purple-100">
              <span className="text-sm text-gray-600">{compras.length} compras</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Compras
              </span>
            </div>
          </div>
        </div>

        // ...existing code...

        {/* Expenses List */}
        <div className="card-enhanced shadow-medium animate-slideInUp" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Lista de Despesas</h3>
            <span className="text-sm text-gray-500">{despesas.length} total</span>
          </div>
          
          <div className="space-y-4">
            {despesas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="heroicon-lg text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Nenhuma despesa cadastrada</p>
                <p className="text-gray-400 text-sm">Clique em "Nova Despesa" para começar</p>
              </div>
            ) : (
              despesas.map(d => (
                <div key={d._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{d.nome}</h4>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          d.tipo === 'gasto' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {d.tipo === 'gasto' ? 'Gasto' : 'Compra'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <CalendarDaysIcon className="text-gray-400" style={{ width: "16px", height: "16px" }} />
                          <span className="text-gray-600">
                            Data: <span className="font-medium text-gray-900">
                              {d.data ? new Date(d.data).toLocaleDateString('pt-BR') : 'N/A'}
                            </span>
                          </span>
                        </div>
                        
                        {d.desc && (
                          <div className="flex items-center space-x-2">
                            <TagIcon className="text-gray-400" style={{ width: "16px", height: "16px" }} />
                            <span className="text-gray-600">
                              <span className="font-medium text-gray-900">{d.desc}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {d.valor && (
                        <div className="mt-3">
                          <span className="text-2xl font-bold text-red-600">
                            -R$ {Math.abs(Number(d.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(d)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon style={{ width: "16px", height: "16px" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(d._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editId ? 'Editar Despesa' : 'Nova Despesa'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome da Despesa
              </label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleFormChange}
                placeholder="Ex: Gasolina, Material de escritório..."
                required
                className="input-field"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <input
                  name="valor"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={handleFormChange}
                  placeholder="0,00"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleFormChange}
                  required
                  className="input-field"
                >
                  <option value="gasto">Gasto</option>
                  <option value="compra">Compra</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data
              </label>
              <input
                name="data"
                type="date"
                value={form.data}
                onChange={handleFormChange}
                required
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="desc"
                value={form.desc}
                onChange={handleFormChange}
                placeholder="Detalhes adicionais (opcional)"
                rows="3"
                className="input-field resize-none"
              />
            </div>
            
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {editId ? 'Atualizar' : 'Salvar'} Despesa
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
