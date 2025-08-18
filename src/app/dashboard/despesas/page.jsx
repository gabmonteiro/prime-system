"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import DashboardLayout from "../DashboardLayout";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import CustomSelect from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  TagIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

export default function DespesasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [despesas, setDespesas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    valor: "",
    desc: "",
    tipo: "gasto",
    data: "",
  });
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // ADICIONADO
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
      fetchData(currentPage, itemsPerPage);
    }
  }, [user, currentPage, itemsPerPage]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToastState({ show: true, message, type });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  async function fetchData(page = 1, limit = 10) {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/despesa?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // CORRIGIDO: Adaptando para a nova estrutura da resposta
      console.log("API Response:", result); // Para debug
      
      // A nova estrutura retorna: { data, pagination: { total, page, totalPages, ... }, sortInfo }
      setDespesas(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
      setCurrentPage(result.pagination?.page || page);
      
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
      setDespesas([]);
      showToast("Erro ao carregar despesas", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // CORRIGIDO: Cálculos baseados apenas nas despesas da página atual
  // Para ter os totais corretos, você precisaria fazer uma chamada separada para buscar todas as despesas
  // ou a API deveria retornar os totais calculados
  const soma = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  const gastos = despesas.filter((d) => d.tipo === "gasto");
  const compras = despesas.filter((d) => d.tipo === "compra");
  const somaGastos = gastos.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  const somaCompras = compras.reduce(
    (acc, d) => acc + (Number(d.valor) || 0),
    0,
  );

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
        await fetch("/api/despesa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        showToast("Despesa atualizada com sucesso!", "success");
      } else {
        await fetch("/api/despesa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Despesa criada com sucesso!", "success");
      }

      closeModal();
      fetchData(currentPage, itemsPerPage); // CORRIGIDO: Passar parâmetros corretos
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      showToast("Erro ao salvar despesa", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(despesa) {
    setForm({
      nome: despesa.nome || "",
      valor: despesa.valor || "",
      desc: despesa.desc || "",
      tipo: despesa.tipo || "gasto",
      data: despesa.data
        ? new Date(despesa.data).toISOString().slice(0, 10)
        : "",
    });
    setEditId(despesa._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
      try {
        await fetch("/api/despesa", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id,
            // Adicionar informações do usuário para auditoria
            userId: user?._id || "system",
            userName: user?.name || "Sistema",
          }),
        });
        // CORRIGIDO: Recarregar dados após exclusão
        fetchData(currentPage, itemsPerPage);
        showToast("Despesa excluída com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao excluir despesa:", error);
        showToast("Erro ao excluir despesa", "error");
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
    setForm({ nome: "", valor: "", desc: "", tipo: "gasto", data: localDate });
    setEditId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm({ nome: "", valor: "", desc: "", tipo: "gasto", data: "" });
    setEditId(null);
  }

  // CORRIGIDO: Removido currentDespesas desnecessário
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Função para obter o mês fiscal (17 a 16)
  function getFiscalMonth(dateStr) {
    const d = new Date(dateStr);
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();
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

  // As despesas vêm ordenadas da API: primeiro por data da despesa, depois por data de criação
  const sortedDespesas = despesas;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Controle de Despesas
                  </h1>
                  <p className="text-gray-600">
                    Gerencie gastos e compras da empresa
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Despesa
              </button>
            </div>
          </div>

          {/* Stats Cards - NOTA: Estes valores são apenas da página atual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total da Página
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
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Gastos ({gastos.length})
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    R${" "}
                    {somaGastos.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCartIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Compras ({compras.length})
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    R${" "}
                    {somaCompras.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
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
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Carregando despesas...</span>
                </div>
              </div>
            ) : despesas.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma despesa encontrada
                </h3>
                <p className="text-gray-600">
                  Comece registrando a primeira despesa da empresa.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {sortedDespesas.map((despesa, idx) => {
                      const prev = sortedDespesas[idx - 1];
                      const currFiscalMonth = getFiscalMonth(despesa.data);
                      const prevFiscalMonth = prev ? getFiscalMonth(prev.data) : null;
                      const showDivider = idx === 0 || currFiscalMonth !== prevFiscalMonth;
                      return (
                        <React.Fragment key={despesa._id}>
                          {showDivider && (
                            <div className="my-4 flex items-center">
                              <div className="flex-1 border-t border-gray-300"></div>
                              <span className="mx-4 text-xs font-semibold text-gray-500">
                                {new Date(`${currFiscalMonth}-17`).toLocaleDateString("pt-BR", {
                                  year: "numeric",
                                  month: "long",
                                })}
                              </span>
                              <div className="flex-1 border-t border-gray-300"></div>
                            </div>
                          )}
                          <div
                            className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2 rounded-full ${
                                    despesa.tipo === "gasto"
                                      ? "bg-red-100"
                                      : "bg-orange-100"
                                  }`}
                                >
                                  {despesa.tipo === "gasto" ? (
                                    <ArrowTrendingDownIcon
                                      className={`h-4 w-4 ${
                                        despesa.tipo === "gasto"
                                          ? "text-red-600"
                                          : "text-orange-600"
                                      }`}
                                    />
                                  ) : (
                                    <ShoppingCartIcon className="h-4 w-4 text-orange-600" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {despesa.nome}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {despesa.desc}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-sm font-medium ${
                                    despesa.tipo === "gasto"
                                      ? "text-red-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  R${" "}
                                  {Number(despesa.valor).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(despesa.data).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(despesa)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(despesa._id)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Despesa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedDespesas.map((despesa, idx) => {
                        const prev = sortedDespesas[idx - 1];
                        const currFiscalMonth = getFiscalMonth(despesa.data);
                        const prevFiscalMonth = prev ? getFiscalMonth(prev.data) : null;
                        const showDivider = idx === 0 || currFiscalMonth !== prevFiscalMonth;
                        return (
                          <React.Fragment key={despesa._id}>
                            {showDivider && (
                              <tr>
                                <td colSpan={5} className="py-2">
                                  <div className="flex items-center">
                                    <div className="flex-1 border-t border-gray-300"></div>
                                    <span className="mx-4 text-xs font-semibold text-gray-500">
                                      {new Date(`${currFiscalMonth}-17`).toLocaleDateString("pt-BR", {
                                        year: "numeric",
                                        month: "long",
                                      })}
                                    </span>
                                    <div className="flex-1 border-t border-gray-300"></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                      despesa.tipo === "gasto"
                                        ? "bg-red-100"
                                        : "bg-orange-100"
                                    }`}
                                  >
                                    {despesa.tipo === "gasto" ? (
                                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                                    ) : (
                                      <ShoppingCartIcon className="h-6 w-6 text-orange-600" />
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {despesa.nome}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {despesa.desc}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    despesa.tipo === "gasto"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  <TagIcon className="h-3 w-3 mr-1" />
                                  {despesa.tipo === "gasto" ? "Gasto" : "Compra"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className={`text-sm font-medium ${
                                    despesa.tipo === "gasto"
                                      ? "text-red-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  R${" "}
                                  {Number(despesa.valor).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(despesa.data).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(despesa)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                    title="Editar despesa"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(despesa._id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                    title="Excluir despesa"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* CORRIGIDO: Paginação com dados corretos */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      totalItems={totalItems}
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
          title={editId ? "Editar Despesa" : "Nova Despesa"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  placeholder="Ex: Combustível"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="tipo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tipo
                </label>
                <CustomSelect
                  id="tipo"
                  value={form.tipo}
                  onChange={(val) => handleFormChange({ target: { name: "tipo", value: val } })}
                  options={[
                    { value: "gasto", label: "Gasto" },
                    { value: "compra", label: "Compra" },
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Data
                </label>
                <DatePicker
                  id="data"
                  value={form.data}
                  onChange={(val) => handleFormChange({ target: { name: "data", value: val } })}
                  className=""
                  required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Detalhes da despesa..."
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
                  `${editId ? "Atualizar" : "Criar"} Despesa`
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}