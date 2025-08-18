"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
  });
  const [toastState, setToastState] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const { user } = useAuth();
  const router = useRouter();

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToastState({ show: true, message, type });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user && !user.isAdmin) {
      router.push("/dashboard");
      return;
    }
    if (user && user.isAdmin) {
      fetchData();
    }
  }, [user, router]);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user");
      const data = await response.json();

      if (response.ok) {
        // Aceita tanto array direto quanto objeto { users: [...] }
        const usersArray = Array.isArray(data) ? data : (data.users || []);
        // Os usuários já vêm ordenados da API por data de criação (mais recente primeiro)
        setUsuarios(usersArray);
      } else {
        throw new Error(data.error || "Erro ao carregar usuários");
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      showToast("Erro ao carregar usuários: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = { 
        ...form,
        // Adicionar informações do usuário para auditoria
        userId: user?._id || "system",
        userName: user?.name || "Sistema",
      };

      const url = "/api/user";
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...payload } : payload;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar requisição");
      }

      closeModal();
      fetchData();
      showToast(
        editId
          ? "Usuário atualizado com sucesso!"
          : "Usuário criado com sucesso!",
        "success",
      );
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      showToast("Erro ao salvar usuário: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(usuario) {
    setForm({
      name: usuario.name || "",
      email: usuario.email || "",
      password: "", // Não carregar senha existente
      isAdmin: usuario.isAdmin || false,
    });
    setEditId(usuario._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const response = await fetch(`/api/user?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Adicionar informações do usuário para auditoria
            userId: user?._id || "system",
            userName: user?.name || "Sistema",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao deletar usuário");
        }

        fetchData();
        showToast("Usuário excluído com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        showToast("Erro ao excluir usuário: " + error.message, "error");
      }
    }
  }

  function openModal() {
    setForm({ name: "", email: "", password: "", isAdmin: false });
    setEditId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm({ name: "", email: "", password: "", isAdmin: false });
    setEditId(null);
  }

  // Paginação
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);
  const currentUsuarios = usuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!user?.isAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Toast Notification */}
        {toastState.show && (
          <div
            className={`fixed top-4 right-4 z-50 max-w-sm w-full sm:right-4 sm:left-auto sm:translate-x-0 left-1/2 -translate-x-1/2 ${
              toastState.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-center">
              <span className="flex-1">{toastState.message}</span>
              <button
                onClick={() =>
                  setToastState((prev) => ({ ...prev, show: false }))
                }
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="w-full mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Gerenciar Usuários
                  </h1>
                  <p className="text-gray-600">
                    Administre usuários do sistema
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Carregando usuários...</span>
                </div>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600">
                  Comece criando o primeiro usuário do sistema.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <div className="p-4 space-y-4">
                    {currentUsuarios.map((usuario) => (
                      <div
                        key={usuario._id}
                        className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {usuario.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {usuario.email}
                              </p>
                            </div>
                          </div>
                          {usuario.isAdmin && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(usuario._id)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentUsuarios.map((usuario) => (
                        <tr key={usuario._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {usuario.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {usuario.isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                Administrador
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <UserIcon className="h-3 w-3 mr-1" />
                                Usuário
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(usuario)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Editar usuário"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(usuario._id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                title="Excluir usuário"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {usuarios.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={usuarios.length}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editId ? "Editar Usuário" : "Novo Usuário"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Digite o email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {editId
                    ? "Nova Senha (deixe em branco para manter a atual)"
                    : "Senha"}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editId}
                  placeholder={
                    editId
                      ? "Deixe em branco para não alterar"
                      : "Digite a senha"
                  }
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={form.isAdmin}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Administrador
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Administradores têm acesso completo ao sistema
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </span>
                ) : (
                  `${editId ? "Atualizar" : "Criar"} Usuário`
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
