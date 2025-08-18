"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Pagination from "../../../components/ui/Pagination";
import CustomSelect from "../../../components/ui/Select";
import DatePicker from "../../../components/ui/DatePicker";
import Modal from "../../../components/ui/Modal";
import {
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  PlusIcon,
  PencilIcon,
  TagIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function AuditoriaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    model: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [toastState, setToastState] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !user.isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchData(currentPage, itemsPerPage);
    }
  }, [user, currentPage, itemsPerPage, filters]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToastState({ show: true, message, type });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  async function fetchData(page = 1, limit = 20) {
    try {
      setIsLoading(true);
      
      // Construir query string com filtros
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filters.action) queryParams.append("action", filters.action);
      if (filters.model) queryParams.append("model", filters.model);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      
      const response = await fetch(`/api/audit?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setAuditLogs(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
      setCurrentPage(result.pagination?.page || page);
      
    } catch (error) {
      console.error("Erro ao carregar logs de auditoria:", error);
      setAuditLogs([]);
      showToast("Erro ao carregar logs de auditoria", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(name, value) {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset para primeira página ao filtrar
  }

  function clearFilters() {
    setFilters({
      action: "",
      model: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    setCurrentPage(page);
  }

  function viewLogDetails(log) {
    setSelectedLog(log);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedLog(null);
  }

  function getActionIcon(action) {
    switch (action) {
      case "CREATE":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "UPDATE":
        return <EyeIcon className="h-5 w-5 text-blue-600" />;
      case "DELETE":
        return <TrashIcon className="h-5 w-5 text-red-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  }

  function getActionColor(action) {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case "SUCCESS":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }

  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function truncateText(text, maxLength = 50) {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Verificar se usuário é admin
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
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
                onClick={() => setToastState((prev) => ({ ...prev, show: false }))}
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
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Logs de Auditoria
                  </h1>
                  <p className="text-gray-600">
                    Monitoramento completo de todas as ações do sistema
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Última atualização: {new Date().toLocaleTimeString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ação
                </label>
                <CustomSelect
                  value={filters.action}
                  onChange={(val) => handleFilterChange("action", val)}
                  options={[
                    { value: "", label: "Todas as ações" },
                    { value: "CREATE", label: "Criação" },
                    { value: "UPDATE", label: "Atualização" },
                    { value: "DELETE", label: "Exclusão" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <CustomSelect
                  value={filters.model}
                  onChange={(val) => handleFilterChange("model", val)}
                  options={[
                    { value: "", label: "Todos os modelos" },
                    { value: "User", label: "Usuários" },
                    { value: "Servico", label: "Serviços" },
                    { value: "Despesa", label: "Despesas" },
                    { value: "FuturaCompra", label: "Futuras Compras" },
                    { value: "TipoServico", label: "Tipos de Serviço" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <CustomSelect
                  value={filters.status}
                  onChange={(val) => handleFilterChange("status", val)}
                  options={[
                    { value: "", label: "Todos os status" },
                    { value: "SUCCESS", label: "Sucesso" },
                    { value: "FAILED", label: "Falha" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <DatePicker
                  value={filters.startDate}
                  onChange={(val) => handleFilterChange("startDate", val)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <DatePicker
                  value={filters.endDate}
                  onChange={(val) => handleFilterChange("endDate", val)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Carregando logs de auditoria...</span>
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum log encontrado
                </h3>
                <p className="text-gray-600">
                  Tente ajustar os filtros ou aguarde novas ações no sistema.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="p-4 space-y-4">
                    {auditLogs.map((log) => (
                      <div
                        key={log._id}
                        className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              {getActionIcon(log.action)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                  {getStatusIcon(log.status)}
                                  <span className="ml-1">{log.status}</span>
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900">
                                {log.model} - {log.userName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {truncateText(log.metadata?.operation || "Operação")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-3 w-3" />
                            <span>{log.userName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ComputerDesktopIcon className="h-3 w-3" />
                            <span>{log.ipAddress || "N/A"}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => viewLogDetails(log)}
                          className="w-full inline-flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </button>
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
                          Ação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modelo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                  {getActionIcon(log.action)}
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                  {log.action}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {log.metadata?.operation || "Operação"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {log.userName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {log.userId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.model}</div>
                            <div className="text-sm text-gray-500">
                              ID: {log.documentId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {getStatusIcon(log.status)}
                              <span className="ml-1">{log.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-1" />
                              {log.ipAddress || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewLogDetails(log)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                              title="Ver detalhes do log"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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

        {/* Modal de Detalhes */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={`Detalhes do Log de Auditoria - ${selectedLog?.action || ''}`}
        >
          {selectedLog && (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Cabeçalho com Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedLog.action === "CREATE" && (
                      <div className="p-2 bg-green-100 rounded-full">
                        <PlusIcon className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    {selectedLog.action === "UPDATE" && (
                      <div className="p-2 bg-blue-100 rounded-full">
                        <PencilIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    {selectedLog.action === "DELETE" && (
                      <div className="p-2 bg-red-100 rounded-full">
                        <TrashIcon className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedLog.action === "CREATE" && "Criação de Registro"}
                        {selectedLog.action === "UPDATE" && "Atualização de Registro"}
                        {selectedLog.action === "DELETE" && "Exclusão de Registro"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedLog.model} • {formatTimestamp(selectedLog.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedLog.status === "SUCCESS" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedLog.status}
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">Usuário</label>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {selectedLog.userName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    ID: {selectedLog.userId}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ComputerDesktopIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">Modelo</label>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {selectedLog.model}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    Doc ID: {selectedLog.documentId}
                  </div>
                </div>
              </div>

              {/* Resumo da Operação */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-semibold text-blue-900">Resumo da Operação</h4>
                </div>
                <div className="text-sm text-blue-800">
                  {selectedLog.action === "CREATE" && (
                    <div className="flex items-center">
                      <span className="text-lg mr-2">✅</span>
                      <p><strong>{selectedLog.userName}</strong> criou um novo registro de <strong>{selectedLog.model}</strong></p>
                    </div>
                  )}
                  {selectedLog.action === "UPDATE" && (
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🔄</span>
                      <p><strong>{selectedLog.userName}</strong> atualizou um registro de <strong>{selectedLog.model}</strong></p>
                    </div>
                  )}
                  {selectedLog.action === "DELETE" && (
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🗑️</span>
                      <p><strong>{selectedLog.userName}</strong> excluiu um registro de <strong>{selectedLog.model}</strong></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Rede */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">Endereço IP</label>
                  </div>
                  <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                    {selectedLog.ipAddress || "N/A"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ComputerDesktopIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">User Agent</label>
                  </div>
                  <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {truncateText(selectedLog.userAgent, 80)}
                  </div>
                </div>
              </div>

              {/* Dados Anteriores */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Dados Anteriores
                    {selectedLog.action === "CREATE" && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Não aplicável para criação)</span>
                    )}
                  </label>
                </div>
                {selectedLog.previousData ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.previousData, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-500 italic">
                    {selectedLog.action === "CREATE" 
                      ? "Nenhum dado anterior (operação de criação)"
                      : "Nenhum dado anterior disponível"
                    }
                  </div>
                )}
              </div>

              {/* Dados Novos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <PlusIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Dados Novos
                    {selectedLog.action === "DELETE" && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Não aplicável para exclusão)</span>
                    )}
                  </label>
                </div>
                {selectedLog.newData ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.newData, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-500 italic">
                    {selectedLog.action === "DELETE" 
                      ? "Nenhum dado novo (operação de exclusão)"
                      : "Nenhum dado novo disponível"
                    }
                  </div>
                )}
              </div>

              {/* Campos Alterados */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <PencilIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Campos Alterados
                    {selectedLog.action === "CREATE" && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Todos os campos são novos)</span>
                    )}
                    {selectedLog.action === "DELETE" && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Não aplicável para exclusão)</span>
                    )}
                  </label>
                </div>
                {selectedLog.changedFields && selectedLog.changedFields.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLog.changedFields.map((field, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-900 mb-2 px-2 py-1 bg-blue-50 rounded border-l-4 border-l-blue-400">
                          {field.field}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-gray-500 font-medium">Valor Anterior:</span>
                            <div className="bg-gray-50 p-2 rounded border mt-1">
                              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(field.oldValue)}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 font-medium">Novo Valor:</span>
                            <div className="bg-green-50 p-2 rounded border mt-1">
                              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(field.newValue)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-500 italic">
                    {selectedLog.action === "CREATE" 
                      ? "Todos os campos são novos (operação de criação)"
                      : selectedLog.action === "DELETE"
                      ? "Nenhum campo alterado (operação de exclusão)"
                      : "Nenhum campo foi alterado nesta operação"
                    }
                  </div>
                )}
              </div>

              {/* Metadados */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <TagIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">Metadados</label>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Mensagem de Erro */}
              {selectedLog.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                    <label className="text-sm font-medium text-red-900">Mensagem de Erro</label>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Botão Fechar */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
