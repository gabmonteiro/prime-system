'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import DashboardLayout from '../DashboardLayout';
import { useRouter } from 'next/navigation';
import Modal from '../../../components/ui/Modal';
import { 
  PlusIcon, 
  ShoppingCartIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ListaComprasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const [compras, setCompras] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', desc: '', urgencia: 'medio' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch('/api/futuraCompra')
      .then(res => res.json())
      .then(data => setCompras(data));
  }, [modalOpen]);

  const soma = compras.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      valor: form.valor ? Number(form.valor) : undefined,
    };
    if (editId) {
      await fetch('/api/futuraCompra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload })
      });
    } else {
      await fetch('/api/futuraCompra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setModalOpen(false);
    setForm({ nome: '', valor: '', desc: '', urgencia: 'medio' });
    setEditId(null);
  }

  function handleEdit(compra) {
    setForm({
      nome: compra.nome || '',
      valor: compra.valor || '',
      desc: compra.desc || '',
      urgencia: compra.urgencia || 'medio',
    });
    setEditId(compra._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      await fetch('/api/futuraCompra', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setCompras(compras.filter(c => c._id !== id));
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case 'alto': return 'bg-red-100 text-red-800 border-red-200';
      case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixo': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgenciaIcon = (urgencia) => {
    switch (urgencia) {
      case 'alto': return <ExclamationTriangleIcon style={{ width: "16px", height: "16px" }} />;
      case 'medio': return <ClockIcon style={{ width: "16px", height: "16px" }} />;
      case 'baixo': return <CheckCircleIcon style={{ width: "16px", height: "16px" }} />;
      default: return <ClockIcon style={{ width: "16px", height: "16px" }} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista de Compras</h1>
            <p className="text-gray-600">Gerencie seus itens de compra e planejamento</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon style={{ width: "20px", height: "20px" }} />
            Nova Compra
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCartIcon className="text-blue-600" style={{ width: "20px", height: "20px" }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold text-gray-900">{compras.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg" style={{ width: "20px", height: "20px" }}>R$</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {soma.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="text-red-600" style={{ width: "20px", height: "20px" }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {compras.filter(c => c.urgencia === 'alto').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Itens da Lista</h2>
          </div>

          {compras.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="text-gray-400" style={{ width: "32px", height: "32px" }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item na lista</h3>
              <p className="text-gray-600 mb-4">Comece adicionando itens à sua lista de compras</p>
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary"
              >
                Adicionar Primeiro Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {compras.map((compra) => (
                <div
                  key={compra._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{compra.nome}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgenciaColor(compra.urgencia)}`}>
                        {getUrgenciaIcon(compra.urgencia)}
                        {compra.urgencia}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {compra.valor !== undefined && compra.valor !== '' && (
                        <span className="font-medium">
                          R$ {Number(compra.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {compra.desc && (
                        <span>{compra.desc}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(compra)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar item"
                    >
                      <PencilIcon style={{ width: "16px", height: "16px" }} />
                    </button>
                    <button
                      onClick={() => handleDelete(compra._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir item"
                    >
                      <TrashIcon style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditId(null);
            setForm({ nome: '', valor: '', desc: '', urgencia: 'medio' });
          }}
          title={editId ? 'Editar Item' : 'Novo Item'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Item *
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleFormChange}
                placeholder="Ex: Arroz, Feijão, etc."
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Estimado
              </label>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleFormChange}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="desc"
                value={form.desc}
                onChange={handleFormChange}
                placeholder="Observações adicionais..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgência *
              </label>
              <select
                name="urgencia"
                value={form.urgencia}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="baixo">Baixa</option>
                <option value="medio">Média</option>
                <option value="alto">Alta</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditId(null);
                  setForm({ nome: '', valor: '', desc: '', urgencia: 'medio' });
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                {editId ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
