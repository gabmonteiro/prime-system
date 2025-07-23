'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../DashboardLayout';
import { 
  PlusIcon, 
  WrenchScrewdriverIcon, 
  UserIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-enhanced shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeInScale">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Modal</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="heroicon-md text-gray-600" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ServicosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipoOpen, setModalTipoOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] });
  const [tipos, setTipos] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetch('/api/servico')
      .then(res => res.json())
      .then(data => setServicos(data));
    fetch('/api/tipoServico')
      .then(res => res.json())
      .then(data => setTipos(data));
  }, [modalOpen, modalTipoOpen]);

  function handleFormChange(e) {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm({ ...form, [name]: values });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      participantes: form.participantes,
      data: form.data ? new Date(form.data) : undefined,
    };
    if (editId) {
      await fetch('/api/servico', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...payload })
      });
    } else {
      await fetch('/api/servico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setModalOpen(false);
    setForm({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] });
    setEditId(null);
  }
  function handleEdit(servico) {
    setForm({
      cliente: servico.cliente || '',
      nomeCarro: servico.nomeCarro || '',
      tipoServico: servico.tipoServico?._id || servico.tipoServico || '',
      data: servico.data ? new Date(servico.data).toISOString().slice(0, 10) : '',
      participantes: Array.isArray(servico.participantes) ? servico.participantes : [],
    });
    setEditId(servico._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      await fetch('/api/servico', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setServicos(servicos.filter(s => s._id !== id));
    }
  }

  async function handleTipoSubmit(e) {
    e.preventDefault();
    const nome = e.target.nome.value;
    const valor = Number(e.target.valor.value);
    const desc = e.target.desc.value;
    await fetch('/api/tipoServico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, valor, desc })
    });
    setModalTipoOpen(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UserIcon className="heroicon-lg text-blue-600" />
          </div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-2 text-gray-800 mb-2">Gerenciar Serviços</h1>
            <p className="text-gray-600">Controle todos os serviços realizados</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setModalOpen(true)} 
              className="btn-primary flex items-center gap-2 shadow-soft"
            >
              <PlusIcon className="heroicon-md" />
              Novo Serviço
            </button>
            <button 
              onClick={() => setModalTipoOpen(true)} 
              className="btn-secondary flex items-center gap-2"
            >
              <WrenchScrewdriverIcon className="heroicon-md" />
              Novo Tipo
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card-stats shadow-soft animate-slideInUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Serviços</p>
              <p className="text-financial text-metric text-positive">
                R$ {servicos.reduce((acc, s) => acc + (s.tipoServico?.valor ? Number(s.tipoServico.valor) : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-soft">
              <CurrencyDollarIcon className="heroicon-lg text-blue-600" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-blue-100 mt-4">
            <span className="text-sm text-gray-600">{servicos.length} serviços cadastrados</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Ativo
            </span>
          </div>
        </div>

        {/* Services List */}
        <div className="card-enhanced shadow-medium animate-slideInUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Lista de Serviços</h3>
            <span className="text-sm text-gray-500">{servicos.length} total</span>
          </div>
          
          <div className="space-y-4">
            {servicos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WrenchScrewdriverIcon className="heroicon-lg text-gray-400" />
                </div>
                <p className="text-gray-500">Nenhum serviço cadastrado</p>
                <p className="text-sm text-gray-400 mt-1">Clique em "Novo Serviço" para começar</p>
              </div>
            ) : (
              servicos.map(s => (
                <div key={s._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-soft transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="heroicon-md text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{s.cliente}</h4>
                        <p className="text-sm text-gray-600">{s.nomeCarro}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <WrenchScrewdriverIcon className="heroicon-sm text-gray-400" />
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">{s.tipoServico?.nome || s.tipoServico}</span>
                      </div>
                      
                      {s.tipoServico?.valor !== undefined && (
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="heroicon-sm text-gray-400" />
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium text-positive">
                            R$ {Number(s.tipoServico.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="heroicon-sm text-gray-400" />
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium">{s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '-'}</span>
                      </div>
                    </div>
                    
                    {Array.isArray(s.participantes) && s.participantes.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Participantes:</span>
                        <div className="flex gap-1">
                          {s.participantes.map((participante, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {participante}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleEdit(s)} 
                      className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center hover:bg-yellow-200 transition-colors"
                      title="Editar serviço"
                    >
                      <PencilIcon className="heroicon-sm text-yellow-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(s._id)} 
                      className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                      title="Excluir serviço"
                    >
                      <TrashIcon className="heroicon-sm text-red-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Modal Novo/Editar Serviço */}
        <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] }); }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {editId ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <p className="text-sm text-gray-600">
              {editId ? 'Atualize as informações do serviço' : 'Preencha os dados do novo serviço'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <input 
                name="cliente" 
                value={form.cliente} 
                onChange={handleFormChange} 
                placeholder="Nome do cliente" 
                required 
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Carro</label>
              <input 
                name="nomeCarro" 
                value={form.nomeCarro} 
                onChange={handleFormChange} 
                placeholder="Modelo do veículo" 
                required 
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
              <select 
                name="tipoServico" 
                value={form.tipoServico} 
                onChange={handleFormChange} 
                required 
                className="input-field"
              >
                <option value="">Selecione o tipo de serviço</option>
                {tipos.map(t => (
                  <option key={t._id} value={t._id}>{t.nome} - R$ {Number(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data do Serviço</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-3">Participantes</label>
              <div className="grid grid-cols-1 gap-2">
                {['Gabriel', 'Davi', 'Samuel'].map(p => (
                  <label key={p} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="participantes"
                      value={p}
                      checked={form.participantes.includes(p)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm(f => ({ ...f, participantes: [...f.participantes, p] }));
                        } else {
                          setForm(f => ({ ...f, participantes: f.participantes.filter(x => x !== p) }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <UserIcon className="heroicon-sm text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => { setModalOpen(false); setEditId(null); setForm({ cliente: '', nomeCarro: '', tipoServico: '', data: '', participantes: [] }); }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                {editId ? 'Atualizar' : 'Criar'} Serviço
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Novo Tipo de Serviço */}
        <Modal open={modalTipoOpen} onClose={() => setModalTipoOpen(false)}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Novo Tipo de Serviço</h3>
            <p className="text-sm text-gray-600">Cadastre um novo tipo de serviço e seu valor</p>
          </div>
          
          <form onSubmit={handleTipoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Serviço</label>
              <input 
                name="nome" 
                placeholder="Ex: Lavagem Completa" 
                required 
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
              <input 
                name="valor" 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                required 
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (opcional)</label>
              <textarea 
                name="desc" 
                placeholder="Detalhes sobre o serviço..." 
                rows="3"
                className="input-field resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setModalTipoOpen(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Criar Tipo
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
