'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../DashboardLayout';
import Modal from '../../../components/ui/Modal';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function UsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', isAdmin: false });
  const [editId, setEditId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, [modalOpen]);

  function fetchData() {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error('Erro ao buscar usuários:', err));
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    
    const url = '/api/user';
    const method = editId ? 'PUT' : 'POST';
    const body = editId ? { id: editId, ...payload } : payload;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        closeModal();
        fetchData();
      } else {
        const error = await response.text();
        alert('Erro ao salvar usuário: ' + error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar usuário');
    }
  }

  function handleEdit(usuario) {
    setForm({
      nome: usuario.nome || '',
      email: usuario.email || '',
      senha: '', // Não carregar senha existente
      isAdmin: usuario.isAdmin || false,
    });
    setEditId(usuario._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await fetch('/api/user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário');
      }
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditId(null);
    setForm({ nome: '', email: '', senha: '', isAdmin: false });
    setShowPassword(false);
  }

  const admins = usuarios.filter(u => u.isAdmin);
  const regularUsers = usuarios.filter(u => !u.isAdmin);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
            <p className="text-gray-600">Gerencie usuários do sistema e suas permissões</p>
          </div>
          
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
          >
            <PlusIcon style={{ width: "16px", height: "16px" }} />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Usuários</h3>
                <p className="text-2xl font-bold text-blue-600">{usuarios.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="text-blue-600" style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span>usuários registrados</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Administradores</h3>
                <p className="text-2xl font-bold text-green-600">{admins.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="text-green-600" style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span>com privilégios administrativos</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Usuários Regulares</h3>
                <p className="text-2xl font-bold text-purple-600">{regularUsers.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserIcon className="text-purple-600" style={{ width: "20px", height: "20px" }} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span>usuários padrão</span>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Usuários</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {usuarios.length === 0 ? (
              <div className="p-8 text-center">
                <UserGroupIcon className="text-gray-400 mx-auto mb-4" style={{ width: "32px", height: "32px" }} />
                <p className="text-gray-500 text-lg font-medium">Nenhum usuário cadastrado</p>
                <p className="text-gray-400 text-sm">Clique em "Novo Usuário" para começar</p>
              </div>
            ) : (
              usuarios.map(u => (
                <div key={u._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="text-blue-600" style={{ width: "20px", height: "20px" }} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900">{u.nome}</h4>
                          {u.isAdmin && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                              <ShieldCheckIcon className="w-3 h-3" />
                              <span>Admin</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <EnvelopeIcon className="text-gray-400" style={{ width: "16px", height: "16px" }} />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon style={{ width: "16px", height: "16px" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
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
          title={editId ? 'Editar Usuário' : 'Novo Usuário'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleFormChange}
                placeholder="Ex: João Silva"
                required
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="joao@exemplo.com"
                required
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha {editId && <span className="text-gray-500 font-normal">(deixe vazio para manter atual)</span>}
              </label>
              <div className="relative">
                <input
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={form.senha}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  required={!editId}
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="text-gray-400" style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <EyeIcon className="text-gray-400" style={{ width: "16px", height: "16px" }} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isAdmin"
                checked={form.isAdmin}
                onChange={handleFormChange}
                className="text-blue-600 bg-gray-50 border-gray-300 rounded focus:ring-blue-500" style={{ width: "16px", height: "16px" }}
              />
              <label className="text-sm font-medium text-gray-700">
                Conceder privilégios de administrador
              </label>
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
                {editId ? 'Atualizar' : 'Criar'} Usuário
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
