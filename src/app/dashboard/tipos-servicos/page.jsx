"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function TiposServicosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Estados principais
  const [tiposServicos, setTiposServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    valor: "",
    desc: "",
  });
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [toastState, setToastState] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Verificar autenticação
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Carregar tipos de serviços
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToastState({ show: true, message, type });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tipoServico");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Garantir que data seja sempre um array
      const tiposArray = Array.isArray(data) ? data : [];
      setTiposServicos(tiposArray);
    } catch (error) {
      console.error("Erro ao carregar tipos de serviços:", error);
      setTiposServicos([]); // Garantir que seja sempre um array em caso de erro
      showToast("Erro ao carregar tipos de serviços", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...form,
        valor: form.valor ? Number(form.valor) : 0,
        // Adicionar informações do usuário para auditoria
        userId: user?._id || "system",
        userName: user?.name || "Sistema",
      };

      if (editId) {
        await fetch("/api/tipoServico", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        showToast("Tipo de serviço atualizado com sucesso!", "success");
      } else {
        await fetch("/api/tipoServico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Tipo de serviço criado com sucesso!", "success");
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar tipo de serviço:", error);
      showToast("Erro ao salvar tipo de serviço", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(tipo) {
    setForm({
      nome: tipo.nome || "",
      valor: tipo.valor || "",
      desc: tipo.desc || "",
    });
    setEditId(tipo._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (
      window.confirm("Tem certeza que deseja excluir este tipo de serviço?")
    ) {
      try {
        await fetch("/api/tipoServico", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            // Adicionar informações do usuário para auditoria
            userId: user?._id || "system",
            userName: user?.name || "Sistema",
          }),
        });
        showToast("Tipo de serviço excluído com sucesso!", "success");
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir tipo de serviço:", error);
        showToast("Erro ao excluir tipo de serviço", "error");
      }
    }
  }

  function openModal() {
    setForm({ nome: "", valor: "", desc: "" });
    setEditId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm({ nome: "", valor: "", desc: "" });
    setEditId(null);
  }

  // Paginação
  const totalPages = Math.ceil(tiposServicos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTipos = tiposServicos.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
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
                  <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Tipos de Serviços
                  </h1>
                  <p className="text-gray-600">
                    Configure os tipos de serviços disponíveis no sistema
                  </p>
                </div>
              </div>
              {user.role !== "visualizador" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={openModal}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Tipo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">
                    Carregando tipos de serviços...
                  </span>
                </div>
              </div>
            ) : tiposServicos.length === 0 ? (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum tipo de serviço encontrado
                </h3>
                <p className="text-gray-600">
                  Comece criando o primeiro tipo de serviço.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {Array.isArray(currentTipos) &&
                      currentTipos.map((tipo) => (
                        <div
                          key={tipo._id}
                          className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {tipo.nome}
                                </h3>
                                <p className="text-sm font-medium text-green-600 mt-1">
                                  R${" "}
                                  {tipo.valor.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                                {tipo.desc && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {tipo.desc}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {user.role !== "visualizador" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(tipo)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(tipo._id)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Serviço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        {user.role !== "visualizador" && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(currentTipos) &&
                        currentTipos.map((tipo) => (
                          <tr key={tipo._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {tipo.nome}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-green-600">
                                R${" "}
                                {tipo.valor.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                {tipo.desc || "Sem descrição"}
                              </div>
                            </td>
                            {user.role !== "visualizador" ? (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(tipo)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                    title="Editar tipo de serviço"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(tipo._id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                    title="Excluir tipo de serviço"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={tiposServicos.length}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editId ? "Editar Tipo de Serviço" : "Novo Tipo de Serviço"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome do Tipo
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={form.nome}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Ex: Lavagem Completa"
              />
            </div>

            <div>
              <label
                htmlFor="valor"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Valor (R$)
              </label>
              <input
                type="number"
                id="valor"
                name="valor"
                value={form.valor}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                step="0.01"
                min="0"
                placeholder="0,00"
              />
            </div>

            <div>
              <label
                htmlFor="desc"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descrição
              </label>
              <textarea
                id="desc"
                name="desc"
                rows={3}
                value={form.desc}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição do tipo de serviço..."
              />
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Salvando..." : editId ? "Salvar" : "Criar"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
