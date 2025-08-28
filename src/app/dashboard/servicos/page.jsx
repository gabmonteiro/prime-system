"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Modal from "../../../components/ui/Modal";
import CustomSelect from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import Pagination from "../../../components/ui/Pagination";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
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
    semTipo: false,
    tipoServico: "",
    valorPersonalizado: "",
    data: "",
    participantes: [],
    pago: false,
  });
  const [tipos, setTipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [toastState, setToastState] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [pendingPago, setPendingPago] = useState(null);
  const [showConfirmPago, setShowConfirmPago] = useState(false);
  const [fiscalMonthStart, setFiscalMonthStart] = useState(17);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData(currentPage, itemsPerPage);
      fetchTipos();
      fetchUsuarios();
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
      const [response, configResponse] = await Promise.all([
        fetch(`/api/servico?page=${page}&limit=${limit}`),
        fetch("/api/system-config"),
      ]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const configData = await configResponse.json();

      setServicos(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
      setCurrentPage(result.pagination?.page || page);
      setFiscalMonthStart(configData.fiscalMonthStart || 17);
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

  async function fetchUsuarios() {
    try {
      const response = await fetch("/api/user?forSelection=true");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const usuariosArray = Array.isArray(data) ? data : [];
      setUsuarios(usuariosArray);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsuarios([]);
      showToast("Erro ao carregar usuários", "error");
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "semTipo") {
      // Se marcar "sem tipo", limpa o tipo de serviço e torna valor personalizado obrigatório
      setForm({
        ...form,
        [name]: checked,
        tipoServico: checked ? "" : form.tipoServico,
        valorPersonalizado: checked
          ? form.valorPersonalizado || ""
          : form.valorPersonalizado,
      });
    } else {
      setForm({
        ...form,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  }

  function handleParticipanteChange(participanteId, isChecked) {
    const newParticipantes = isChecked
      ? [...form.participantes, participanteId]
      : form.participantes.filter((p) => p !== participanteId);
    setForm({ ...form, participantes: newParticipantes });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações específicas para o campo semTipo
      if (form.semTipo && !form.valorPersonalizado) {
        showToast(
          "Valor personalizado é obrigatório quando não há tipo de serviço",
          "error",
        );
        setIsLoading(false);
        return;
      }

      if (!form.semTipo && !form.tipoServico) {
        showToast(
          "Tipo de serviço é obrigatório quando não é marcado como 'sem tipo'",
          "error",
        );
        setIsLoading(false);
        return;
      }

      let dataCorreta = form.data;
      if (
        form.data &&
        typeof form.data === "string" &&
        form.data.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const [ano, mes, dia] = form.data.split("-").map(Number);
        dataCorreta = new Date(ano, mes - 1, dia);
      }

      // Preparar payload baseado no campo semTipo
      let payload;
      if (form.semTipo) {
        // Se sem tipo, não enviar tipoServico
        payload = {
          cliente: form.cliente,
          nomeCarro: form.nomeCarro,
          semTipo: true,
          valorPersonalizado: Number(form.valorPersonalizado),
          data: dataCorreta,
          participantes: form.participantes,
          pago: form.pago,
          userId: user?._id || "system",
          userName: user?.name || "Sistema",
        };
      } else {
        // Se com tipo, enviar tipoServico
        payload = {
          cliente: form.cliente,
          nomeCarro: form.nomeCarro,
          semTipo: false,
          tipoServico: form.tipoServico,
          valorPersonalizado: form.valorPersonalizado
            ? Number(form.valorPersonalizado)
            : null,
          data: dataCorreta,
          participantes: form.participantes,
          pago: form.pago,
          userId: user?._id || "system",
          userName: user?.name || "Sistema",
        };
      }

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
      semTipo: servico.semTipo || false,
      tipoServico:
        typeof servico.tipoServico === "object"
          ? servico.tipoServico?._id
          : servico.tipoServico || "",
      valorPersonalizado: servico.valorPersonalizado || "",
      data: servico.data
        ? new Date(servico.data).toISOString().slice(0, 10)
        : "",
      participantes: Array.isArray(servico.participantes)
        ? servico.participantes.map((p) => (typeof p === "object" ? p._id : p))
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
          body: JSON.stringify({
            id,
            userId: user?._id || "system",
            userName: user?.name || "Sistema",
          }),
        });
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
        body: JSON.stringify({
          id: servico._id,
          pago: !servico.pago,
          userId: user?._id || "system",
          userName: user?.name || "Sistema",
        }),
      });
      setServicos((prev) =>
        prev.map((s) =>
          s._id === servico._id ? { ...s, pago: !servico.pago } : s,
        ),
      );
      showToast(
        `Serviço marcado como ${!servico.pago ? "pago" : "não pago"}!`,
        "success",
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
      semTipo: false,
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
      semTipo: false,
      tipoServico: "",
      valorPersonalizado: "",
      data: "",
      participantes: [],
      pago: false,
    });
    setEditId(null);
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  function getFiscalMonth(dateStr) {
    const d = new Date(dateStr);
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    // Mês fiscal configurável
    if (day < fiscalMonthStart) {
      if (month === 1) {
        month = 12;
        year--;
      } else {
        month--;
      }
    }
    return `${year}-${month.toString().padStart(2, "0")}`;
  }

  const currentFiscalMonth = getFiscalMonth(new Date().toISOString());

  const fiscalMonthServicos = servicos.filter((servico) => {
    const servicoMonth = getFiscalMonth(servico.data);
    return servicoMonth === currentFiscalMonth;
  });

  const totalFiscalMonth = fiscalMonthServicos.reduce((total, servico) => {
    const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
    return total + valor;
  }, 0);

  const totalGeral = servicos.reduce((total, servico) => {
    const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
    return total + valor;
  }, 0);

  if (loading) {
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
                  <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
                  <p className="text-gray-600">
                    Gerencie todos os serviços realizados
                  </p>
                </div>
              </div>
              {user.role !== "visualizador" && (
                <button
                  onClick={openModal}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Novo Serviço
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total de Serviços
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {servicos.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Geral
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${" "}
                    {totalGeral.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Mês Fiscal Atual
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R${" "}
                    {totalFiscalMonth.toLocaleString("pt-BR", {
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
                  Comece criando seu primeiro serviço.
                </p>
                {user.role !== "visualizador" && (
                  <div className="mt-6">
                    <button
                      onClick={openModal}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Novo Serviço
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {servicos.map((servico, idx) => {
                      const prev = servicos[idx - 1];
                      const currFiscalMonth = getFiscalMonth(servico.data);
                      const prevFiscalMonth = prev
                        ? getFiscalMonth(prev.data)
                        : null;
                      const showDivider =
                        idx === 0 || currFiscalMonth !== prevFiscalMonth;
                      return (
                        <React.Fragment key={servico._id}>
                          {showDivider && (
                            <div className="my-4 flex items-center">
                              <div className="flex-1 border-t border-gray-300"></div>
                              <span className="mx-4 text-xs font-semibold text-gray-500">
                                {new Date(
                                  `${currFiscalMonth}-17`,
                                ).toLocaleDateString("pt-BR", {
                                  year: "numeric",
                                  month: "long",
                                })}
                              </span>
                              <div className="flex-1 border-t border-gray-300"></div>
                            </div>
                          )}
                          <div
                            key={servico._id}
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
                                    {servico.semTipo
                                      ? "Sem tipo específico"
                                      : servico.tipoServico?.nome || "N/A"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {servico.participantes &&
                                    servico.participantes.length > 0
                                      ? servico.participantes
                                          .map((p) =>
                                            typeof p === "object" ? p.name : p,
                                          )
                                          .join(", ")
                                      : "Sem participantes"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  R${" "}
                                  {(
                                    servico.valorPersonalizado ||
                                    servico.tipoServico?.valor ||
                                    0
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                                <span
                                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    servico.pago
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {servico.pago ? "Pago" : "Não Pago"}
                                </span>
                              </div>
                            </div>
                            {user.role !== "visualizador" && (
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
                            )}
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
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Veículo
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participantes
                        </th>
                        {user.role !== "visualizador" && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        )}
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {servicos.map((servico, idx) => {
                        const prev = servicos[idx - 1];
                        const currFiscalMonth = getFiscalMonth(servico.data);
                        const prevFiscalMonth = prev
                          ? getFiscalMonth(prev.data)
                          : null;
                        const showDivider =
                          idx === 0 || currFiscalMonth !== prevFiscalMonth;
                        return (
                          <React.Fragment key={servico._id}>
                            {showDivider && (
                              <tr>
                                <td colSpan={8} className="py-2">
                                  <div className="flex items-center">
                                    <div className="flex-1 border-t border-gray-300"></div>
                                    <span className="mx-4 text-xs font-semibold text-gray-500">
                                      {new Date(
                                        `${currFiscalMonth}-17`,
                                      ).toLocaleDateString("pt-BR", {
                                        year: "numeric",
                                        month: "long",
                                      })}
                                    </span>
                                    <div className="flex-1 border-t border-gray-300"></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr key={servico._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <UserIcon className="h-6 w-6 text-blue-600" />
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
                                  {servico.nomeCarro}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {servico.semTipo ? (
                                    <span className="text-orange-600 font-medium">
                                      Sem tipo específico
                                    </span>
                                  ) : (
                                    servico.tipoServico?.nome || "N/A"
                                  )}
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
                                  {servico.semTipo && (
                                    <span className="ml-1 text-xs text-orange-600">
                                      (sem tipo)
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
                                      {servico.participantes
                                        .map((p) =>
                                          typeof p === "object" ? p.name : p,
                                        )
                                        .join(", ")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    -
                                  </span>
                                )}
                              </td>
                              {user.role !== "visualizador" ? (
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
                              ) : null}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingPago(servico);
                                    setShowConfirmPago(true);
                                  }}
                                  className={`relative inline-flex h-6 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 focus:outline-none ${
                                    servico.pago
                                      ? "bg-green-500"
                                      : "bg-gray-300"
                                  }`}
                                  aria-pressed={servico.pago}
                                  tabIndex={0}
                                  title={
                                    servico.pago
                                      ? "Marcar como não pago"
                                      : "Marcar como pago"
                                  }
                                >
                                  <span
                                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                                      servico.pago
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                  <span className="sr-only">Toggle pago</span>
                                </button>
                                <span
                                  className={`ml-3 text-xs font-semibold ${servico.pago ? "text-green-700" : "text-red-700"}`}
                                >
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

                {/* Paginação */}
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
                  htmlFor="semTipo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sem Tipo de Serviço?
                </label>
                <input
                  type="checkbox"
                  id="semTipo"
                  name="semTipo"
                  checked={form.semTipo}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Se marcado, o valor será personalizado.
                </span>
              </div>

              <div>
                <label
                  htmlFor="tipoServico"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tipo de Serviço (se aplicável)
                </label>
                <CustomSelect
                  id="tipoServico"
                  value={form.tipoServico}
                  onChange={(val) =>
                    handleFormChange({
                      target: { name: "tipoServico", value: val },
                    })
                  }
                  options={[
                    { value: "", label: "Selecione o tipo" },
                    ...(Array.isArray(tipos)
                      ? tipos.map((t) => ({
                          value: t._id,
                          label: `${t.nome} - R$ ${t.valor}`,
                        }))
                      : []),
                  ]}
                  className=""
                  disabled={form.semTipo}
                />
              </div>

              <div>
                <label
                  htmlFor="valorPersonalizado"
                  className={`block text-sm font-medium mb-2 ${
                    form.semTipo ? "text-red-700" : "text-gray-700"
                  }`}
                >
                  Valor Personalizado{" "}
                  {form.semTipo ? "(obrigatório)" : "(opcional)"}
                </label>
                <input
                  type="number"
                  id="valorPersonalizado"
                  name="valorPersonalizado"
                  value={form.valorPersonalizado}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required={form.semTipo}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    form.semTipo
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder={
                    form.semTipo
                      ? "Valor obrigatório"
                      : "Deixe vazio para usar valor padrão"
                  }
                />
                <p
                  className={`text-xs mt-1 ${
                    form.semTipo ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {form.semTipo
                    ? "Valor obrigatório quando não há tipo de serviço"
                    : "Se preenchido, sobrescreverá o valor padrão do tipo de serviço"}
                </p>
              </div>

              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Data do Serviço
                </label>
                <DatePicker
                  id="data"
                  value={form.data}
                  onChange={(val) =>
                    handleFormChange({ target: { name: "data", value: val } })
                  }
                  className=""
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
                <span
                  className={`ml-3 text-sm font-medium ${form.pago ? "text-green-600" : "text-red-600"}`}
                >
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
                {usuarios.map((usuario) => (
                  <label key={usuario._id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.participantes.includes(usuario._id)}
                      onChange={(e) =>
                        handleParticipanteChange(usuario._id, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {usuario.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Salvando...
                  </span>
                ) : (
                  `${editId ? "Salvar" : "Criar"} Serviço`
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
                <span
                  className={
                    pendingPago.pago ? "text-red-600" : "text-green-600"
                  }
                >
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
