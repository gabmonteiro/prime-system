"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import DashboardLayout from "../DashboardLayout";
import Pagination from "../../../components/ui/Pagination";
import { useRouter } from "next/navigation";
import Modal from "../../../components/ui/Modal";
import CustomSelect from "../../../components/ui/Select";
import {
  PlusIcon,
  ShoppingCartIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function ListaComprasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [compras, setCompras] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    valor: "",
    desc: "",
    urgencia: "medio",
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
      const response = await fetch("/api/futuraCompra");
      const data = await response.json();
      // Ordenar por data de criação (mais recente primeiro)
      const sortedData = (data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setCompras(sortedData);
    } catch (error) {
      console.error("Erro ao carregar lista de compras:", error);
      showToast("Erro ao carregar lista de compras", "error");
    } finally {
      setIsLoading(false);
    }
  }

  const soma = compras.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
  const comprasUrgentes = compras.filter((c) => c.urgencia === "alto");
  const comprasMedium = compras.filter((c) => c.urgencia === "medio");
  const comprasBaixas = compras.filter((c) => c.urgencia === "baixo");

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
      };

      if (editId) {
        await fetch("/api/futuraCompra", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        showToast("Item atualizado com sucesso!", "success");
      } else {
        await fetch("/api/futuraCompra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Item adicionado com sucesso!", "success");
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      showToast("Erro ao salvar item", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(compra) {
    setForm({
      nome: compra.nome || "",
      valor: compra.valor || "",
      desc: compra.desc || "",
      urgencia: compra.urgencia || "medio",
    });
    setEditId(compra._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      try {
        await fetch("/api/futuraCompra", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        setCompras(compras.filter((c) => c._id !== id));
        showToast("Item excluído com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao excluir item:", error);
        showToast("Erro ao excluir item", "error");
      }
    }
  }

  function openModal() {
    const today = new Date();
    const localDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    )
      .toISOString()
      .slice(0, 10);
    setForm({
      nome: "",
      valor: "",
      desc: "",
      urgencia: "medio",
      data: localDate,
    });
    setEditId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm({ nome: "", valor: "", desc: "", urgencia: "medio" });
    setEditId(null);
  }

  // Paginação
  const totalPages = Math.ceil(compras.length / itemsPerPage);
  const currentCompras = compras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getUrgenciaIcon = (urgencia) => {
    switch (urgencia) {
      case "alto":
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case "medio":
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case "baixo":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case "alto":
        return "bg-red-100 text-red-800";
      case "medio":
        return "bg-yellow-100 text-yellow-800";
      case "baixo":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgenciaLabel = (urgencia) => {
    switch (urgencia) {
      case "alto":
        return "Urgente";
      case "medio":
        return "Média";
      case "baixo":
        return "Baixa";
      default:
        return "Não definida";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Lista de Compras
                  </h1>
                  <p className="text-gray-600">
                    Organize suas futuras aquisições
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Item
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Estimado
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${" "}
                    {soma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {comprasUrgentes.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Médias</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {comprasMedium.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Baixas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {comprasBaixas.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">
                    Carregando lista de compras...
                  </span>
                </div>
              </div>
            ) : compras.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Lista vazia
                </h3>
                <p className="text-gray-600">
                  Adicione o primeiro item à sua lista de compras.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {currentCompras.map((compra) => (
                      <div
                        key={compra._id}
                        className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <ShoppingCartIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {compra.nome}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {compra.desc}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              R${" "}
                              {Number(compra.valor).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getUrgenciaColor(compra.urgencia)}`}
                            >
                              {getUrgenciaIcon(compra.urgencia)}
                              <span className="ml-1">
                                {getUrgenciaLabel(compra.urgencia)}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(compra)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(compra._id)}
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
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Estimado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Urgência
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentCompras.map((compra) => (
                        <tr key={compra._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {compra.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {compra.desc}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              R${" "}
                              {Number(compra.valor).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgenciaColor(compra.urgencia)}`}
                            >
                              {getUrgenciaIcon(compra.urgencia)}
                              <span className="ml-1">
                                {getUrgenciaLabel(compra.urgencia)}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(compra)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Editar item"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(compra._id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                title="Excluir item"
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
                {compras.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={compras.length}
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
          title={editId ? "Editar Item" : "Novo Item"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome do Item
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Ex: Novo computador"
                />
              </div>

              <div>
                <label
                  htmlFor="valor"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  id="valor"
                  name="valor"
                  value={form.valor}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="urgencia"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Urgência
                </label>
                <CustomSelect
                  id="urgencia"
                  value={form.urgencia}
                  onChange={(val) => handleFormChange({ target: { name: "urgencia", value: val } })}
                  options={[
                    { value: "baixo", label: "Baixa - Pode aguardar" },
                    { value: "medio", label: "Média - Planejado para breve" },
                    { value: "alto", label: "Urgente - Necessário agora" },
                  ]}
                />
              </div>
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
                value={form.desc}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Detalhes do item, especificações, onde comprar..."
              />
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
                  `${editId ? "Atualizar" : "Adicionar"} Item`
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
