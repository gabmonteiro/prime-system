"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export default function ServicosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [servicos, setServicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    cliente: "",
    nomeCarro: "",
    tipoServico: "",
    valorPersonalizado: "",
    data: "",
    participantes: [],
    pago: false,
  });
  const [tipos, setTipos] = useState([]);
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
  const [pendingPago, setPendingPago] = useState(null);
  const [showConfirmPago, setShowConfirmPago] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData(currentPage, itemsPerPage);
      fetchTipos();
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
      const response = await fetch(`/api/servico?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // CORRIGIDO: Adaptando para a nova estrutura da resposta
      console.log("API Response:", result); // Para debug
      
      // A nova estrutura retorna: { data, pagination: { total, page, totalPages, ... }, sortInfo }
      setServicos(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
      setCurrentPage(result.pagination?.page || page);
      
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServicos([]);
      showToast("Erro ao carregar serviços", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTipos() {
    try {
      const response = await fetch("/api/tipoServico");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const tiposArray = Array.isArray(data) ? data : [];
      setTipos(tiposArray);
    } catch (error) {
      console.error("Erro ao carregar tipos de serviço:", error);
      setTipos([]);
      showToast("Erro ao carregar tipos de serviço", "error");
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
  }

  function handleParticipanteChange(participante, isChecked) {
    const newParticipantes = isChecked
      ? [...form.participantes, participante]
      : form.participantes.filter((p) => p !== participante);
    setForm({ ...form, participantes: newParticipantes });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      let dataCorreta = form.data;
      if (form.data && typeof form.data === "string" && form.data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = form.data.split("-").map(Number);
        dataCorreta = new Date(ano, mes - 1, dia);
      }

      const payload = {
        ...form,
        data: dataCorreta,
        valorPersonalizado: form.valorPersonalizado
          ? Number(form.valorPersonalizado)
          : null,
      };

      if (editId) {
        await fetch("/api/servico", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        showToast("Serviço atualizado com sucesso!", "success");
      } else {
        await fetch("/api/servico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Serviço criado com sucesso!", "success");
      }

      closeModal();
      fetchData(currentPage, itemsPerPage);
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      showToast("Erro ao salvar serviço", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(servico) {
    setForm({
      cliente: servico.cliente || "",
      nomeCarro: servico.nomeCarro || "",
      tipoServico:
        typeof servico.tipoServico === "object"
          ? servico.tipoServico?._id
          : servico.tipoServico || "",
      valorPersonalizado: servico.valorPersonalizado || "",
      data: servico.data
        ? new Date(servico.data).toISOString().slice(0, 10)
        : "",
      participantes: Array.isArray(servico.participantes)
        ? servico.participantes
        : [],
      pago: typeof servico.pago === "boolean" ? servico.pago : false,
    });
    setEditId(servico._id);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await fetch("/api/servico", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        // CORRIGIDO: Recarregar dados após exclusão
        fetchData(currentPage, itemsPerPage);
        showToast("Serviço excluído com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        showToast("Erro ao excluir serviço", "error");
      }
    }
  }

  async function handleTogglePago(servico) {
    try {
      await fetch("/api/servico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: servico._id, pago: !servico.pago }),
      });
      setServicos((prev) =>
        prev.map((s) =>
          s._id === servico._id ? { ...s, pago: !servico.pago } : s
        )
      );
      showToast(
        `Serviço marcado como ${!servico.pago ? "pago" : "não pago"}!`,
        "success"
      );
    } catch (error) {
      console.error("Erro ao atualizar status de pagamento:", error);
      showToast("Erro ao atualizar status de pagamento", "error");
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
      cliente: "",
      nomeCarro: "",
      tipoServico: "",
      valorPersonalizado: "",
      data: localDate,
      participantes: [],
      pago: false,
    });
    setEditId(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm({
      cliente: "",
      nomeCarro: "",
      tipoServico: "",
      valorPersonalizado: "",
      data: "",
      participantes: [],
      pago: false,
    });
    setEditId(null);
  }

  // CORRIGIDO: Removido currentServicos desnecessário
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UserIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // CORRIGIDO: Os serviços já vêm ordenados da API, não precisa reordenar
  const sortedServicos = servicos;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Toast Notification */}
        {toastState.show && (
          <div
            className={`fixed top-4 right-4 z-[99999] max-w-sm w-full sm:right-4 sm:left-auto sm:translate-x-0 left-1/2 -translate-x-1/2 ${
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
                    Gerenciar Serviços
                  </h1>
                  <p className="text-gray-600">
                    Controle todos os serviços prestados
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={openModal}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Novo Serviço
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Carregando serviços...</span>
                </div>
              </div>
            ) : servicos.length === 0 ? (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum serviço encontrado
                </h3>
                <p className="text-gray-600">
                  Comece registrando o primeiro serviço realizado.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {sortedServicos.map((servico, idx) => {
                      const prev = sortedServicos[idx - 1];
                      const currFiscalMonth = getFiscalMonth(servico.data);
                      const prevFiscalMonth = prev ? getFiscalMonth(prev.data) : null;
                      const showDivider = idx === 0 || currFiscalMonth !== prevFiscalMonth;
                      return (
                        <React.Fragment key={servico._id}>
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
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {servico.cliente}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {servico.nomeCarro}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {typeof servico.tipoServico === "object"
                                      ? servico.tipoServico?.nome
                                      : servico.tipoServico}
                                  </p>
                                  <p className="text-sm font-medium text-green-600 mt-1">
                                    R${" "}
                                    {(
                                      servico.valorPersonalizado ||
                                      servico.tipoServico?.valor ||
                                      0
                                    ).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                    {servico.valorPersonalizado && (
                                      <span className="text-xs text-blue-600 ml-1">
                                        (personalizado)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(servico.data).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                                {servico.participantes &&
                                  servico.participantes.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {servico.participantes.join(", ")}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(servico)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(servico._id)}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Excluir
                              </button>
                            </div>
                            <p className="text-xs mt-1 flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingPago(servico);
                                  setShowConfirmPago(true);
                                }}
                                className={`relative inline-flex h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${
                                  servico.pago ? "bg-green-500" : "bg-gray-300"
                                }`}
                                aria-pressed={servico.pago}
                                tabIndex={0}
                                title={servico.pago ? "Marcar como não pago" : "Marcar como pago"}
                              >
                                <span
                                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                                    servico.pago ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                                <span className="sr-only">Toggle pago</span>
                              </button>
                              <span className={`ml-3 text-xs font-semibold ${servico.pago ? "text-green-700" : "text-red-700"}`}>
                                {servico.pago ? "Pago" : "Não Pago"}
                              </span>
                            </p>
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
                          Cliente / Veículo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Serviço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participantes
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedServicos.map((servico, idx) => {
                        const prev = sortedServicos[idx - 1];
                        const currFiscalMonth = getFiscalMonth(servico.data);
                        const prevFiscalMonth = prev ? getFiscalMonth(prev.data) : null;
                        const showDivider = idx === 0 || currFiscalMonth !== prevFiscalMonth;
                        return (
                          <React.Fragment key={servico._id}>
                            {showDivider && (
                              <tr>
                                <td colSpan={7} className="py-2">
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
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {servico.cliente}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {servico.nomeCarro}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {typeof servico.tipoServico === "object"
                                    ? servico.tipoServico?.nome
                                    : servico.tipoServico}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  R${" "}
                                  {(
                                    servico.valorPersonalizado ||
                                    servico.tipoServico?.valor ||
                                    0
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                  {servico.valorPersonalizado && (
                                    <span className="ml-1 text-xs text-blue-600">
                                      (personalizado)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(servico.data).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {servico.participantes &&
                                servico.participantes.length > 0 ? (
                                  <div className="flex items-center">
                                    <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-900">
                                      {servico.participantes.join(", ")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(servico)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                    title="Editar serviço"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(servico._id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                    title="Excluir serviço"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingPago(servico);
                                    setShowConfirmPago(true);
                                  }}
                                  className={`relative inline-flex h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${
                                    servico.pago ? "bg-green-500" : "bg-gray-300"
                                  }`}
                                  aria-pressed={servico.pago}
                                  tabIndex={0}
                                  title={servico.pago ? "Marcar como não pago" : "Marcar como pago"}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                                      servico.pago ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                  <span className="sr-only">Toggle pago</span>
                                </button>
                                <span className={`ml-3 text-xs font-semibold ${servico.pago ? "text-green-700" : "text-red-700"}`}>
                                  {servico.pago ? "Pago" : "Não Pago"}
                                </span>
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

        {/* Serviço Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editId ? "Editar Serviço" : "Novo Serviço"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="cliente"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cliente
                </label>
                <input
                  type="text"
                  id="cliente"
                  name="cliente"
                  value={form.cliente}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label
                  htmlFor="nomeCarro"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Veículo
                </label>
                <input
                  type="text"
                  id="nomeCarro"
                  name="nomeCarro"
                  value={form.nomeCarro}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Modelo do veículo"
                />
              </div>

              <div>
                <label
                  htmlFor="tipoServico"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tipo de Serviço
                </label>
                <select
                  id="tipoServico"
                  name="tipoServico"
                  value={form.tipoServico}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {Array.isArray(tipos) && tipos.map((tipo) => (
                    <option key={tipo._id} value={tipo._id}>
                      {tipo.nome} - R$ {tipo.valor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="valorPersonalizado"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Valor Personalizado (opcional)
                </label>
                <input
                  type="number"
                  id="valorPersonalizado"
                  name="valorPersonalizado"
                  value={form.valorPersonalizado}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Deixe vazio para usar valor padrão"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se preenchido, sobrescreverá o valor padrão do tipo de serviço
                </p>
              </div>

              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Data do Serviço
                </label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={form.data}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="pago"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pago?
                </label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pago: !form.pago })}
                  className={`relative inline-flex h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${
                    form.pago ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-pressed={form.pago}
                  tabIndex={0}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                      form.pago ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  <span className="sr-only">Toggle pago</span>
                </button>
                <span className={`ml-3 text-sm font-medium ${form.pago ? "text-green-600" : "text-red-600"}`}>
                  {form.pago ? "Pago" : "Não Pago"}
                </span>
              </div>
            </div>

            {/* Participantes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Participantes do Serviço
              </label>

              <div className="space-y-3">
                {["Gabriel", "Samuel", "Davi"].map((nome) => (
                  <label key={nome} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.participantes.includes(nome)}
                      onChange={(e) =>
                        handleParticipanteChange(nome, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{nome}</span>
                  </label>
                ))}
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
                  `${editId ? "Atualizar" : "Criar"} Serviço`
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Confirmar Pagamento Modal */}
        {showConfirmPago && pendingPago && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">
                Confirmar alteração de status
              </h2>
              <p className="mb-4 text-gray-700">
                Tem certeza que deseja marcar este serviço como{" "}
                <span className={pendingPago.pago ? "text-red-600" : "text-green-600"}>
                  {pendingPago.pago ? "Não Pago" : "Pago"}
                </span>
                ?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowConfirmPago(false);
                    setPendingPago(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmPago(false);
                    await handleTogglePago(pendingPago);
                    setPendingPago(null);
                  }}
                  className={`px-4 py-2 rounded ${pendingPago.pago ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}