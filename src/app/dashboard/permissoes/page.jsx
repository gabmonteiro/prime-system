"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "../DashboardLayout";
import Modal from "../../../components/ui/Modal";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

export default function PermissoesPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRoleModalOpen, setUserRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [],
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

    if (!user.isAdmin) {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [user, router]);

  async function fetchData() {
    try {
      setIsLoading(true);
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions"),
        fetch("/api/user"),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsuarios(usersData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showToast("Erro ao carregar dados", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateRole() {
    setSelectedRole(null);
    setForm({
      name: "",
      description: "",
      permissions: [],
    });
    setModalOpen(true);
  }

  function handleEditRole(role) {
    setSelectedRole(role);
    setForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p._id),
    });
    setModalOpen(true);
  }

  async function handleSaveRole() {
    try {
      const url = "/api/roles";
      const method = selectedRole ? "PUT" : "POST";
      const body = selectedRole
        ? { id: selectedRole._id, ...form, userId: user._id, userName: user.name }
        : { ...form, userId: user._id, userName: user.name };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showToast(
          selectedRole ? "Role atualizada com sucesso!" : "Role criada com sucesso!",
          "success"
        );
        setModalOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar role");
      }
    } catch (error) {
      console.error("Erro ao salvar role:", error);
      showToast(error.message || "Erro ao salvar role", "error");
    }
  }

  async function handleDeleteRole(roleId) {
    if (!confirm("Tem certeza que deseja excluir esta role?")) return;

    try {
      const response = await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleId, userId: user._id, userName: user.name }),
      });

      if (response.ok) {
        showToast("Role excluída com sucesso!", "success");
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir role");
      }
    } catch (error) {
      console.error("Erro ao excluir role:", error);
      showToast(error.message || "Erro ao excluir role", "error");
    }
  }

  function handleManageUserRoles(userData) {
    setSelectedUser(userData);
    setUserRoleModalOpen(true);
  }

  async function handleUpdateUserRoles(userId, newRoles) {
    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          roles: newRoles,
          userId: user._id,
          userName: user.name,
        }),
      });

      if (response.ok) {
        showToast("Permissões do usuário atualizadas com sucesso!", "success");
        setUserRoleModalOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar permissões");
      }
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
      showToast(error.message || "Erro ao atualizar permissões", "error");
    }
  }

  function handlePermissionChange(permissionId, checked) {
    setForm(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CogIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Toast Notification */}
      {toastState.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toastState.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toastState.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Permissões</h1>
          <p className="text-gray-600 mt-1">Configure roles e permissões do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("roles")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "roles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Usuários
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Permissões
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === "roles" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Roles do Sistema</h2>
            <button
              onClick={handleCreateRole}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Role
            </button>
          </div>

          <div className="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissões
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
                {roles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {role.permissions.length} permissões
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.isSystem ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                      }`}>
                        {role.isSystem ? "Sistema" : "Personalizada"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Usuários e Permissões</h2>
          <div className="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{userData.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData.isAdmin ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {userData.isAdmin ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {userData.roles?.length || 0} roles
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleManageUserRoles(userData)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <UserGroupIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Permissões do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              permissions.reduce((acc, permission) => {
                if (!acc[permission.resource]) {
                  acc[permission.resource] = [];
                }
                acc[permission.resource].push(permission);
                return acc;
              }, {})
            ).map(([resource, perms]) => (
              <div key={resource} className="bg-white shadow-md border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 capitalize">
                  {resource.replace("-", " ")}
                </h3>
                <div className="space-y-2">
                  {perms.map((permission) => (
                    <div key={permission._id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {permission.action}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        permission.action === "manage" ? "bg-purple-100 text-purple-800" :
                        permission.action === "create" ? "bg-green-100 text-green-800" :
                        permission.action === "read" ? "bg-blue-100 text-blue-800" :
                        permission.action === "update" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {permission.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedRole ? "Editar Role" : "Nova Role"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={selectedRole?.isSystem}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissões
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {Object.entries(
                  permissions.reduce((acc, permission) => {
                    if (!acc[permission.resource]) {
                      acc[permission.resource] = [];
                    }
                    acc[permission.resource].push(permission);
                    return acc;
                  }, {})
                ).map(([resource, perms]) => (
                  <div key={resource} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-800 mb-2 capitalize">
                      {resource.replace("-", " ")}
                    </h4>
                    <div className="space-y-1 pl-4">
                      {perms.map((permission) => (
                        <label key={permission._id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(permission._id)}
                            onChange={(e) => handlePermissionChange(permission._id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {permission.action} - {permission.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedRole ? "Atualizar" : "Criar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* User Role Modal */}
      {userRoleModalOpen && selectedUser && (
        <Modal
          isOpen={userRoleModalOpen}
          onClose={() => setUserRoleModalOpen(false)}
          title={`Gerenciar Roles - ${selectedUser.name}`}
        >
          <UserRoleManager
            user={selectedUser}
            roles={roles}
            onSave={handleUpdateUserRoles}
            onCancel={() => setUserRoleModalOpen(false)}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}

// Componente para gerenciar roles do usuário
function UserRoleManager({ user, roles, onSave, onCancel }) {
  const [selectedRoles, setSelectedRoles] = useState(
    user.roles?.map(role => role._id || role) || []
  );

  function handleRoleChange(roleId, checked) {
    setSelectedRoles(prev =>
      checked
        ? [...prev, roleId]
        : prev.filter(id => id !== roleId)
    );
  }

  function handleSave() {
    onSave(user._id, selectedRoles);
  }

  return (
    <div className="space-y-4">
      <div className="max-h-60 overflow-y-auto">
        {roles.map((role) => (
          <label key={role._id} className="flex items-start p-3 border border-gray-200 rounded-lg mb-2 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role._id)}
              onChange={(e) => handleRoleChange(role._id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">{role.name}</div>
              <div className="text-sm text-gray-500">{role.description}</div>
              <div className="text-xs text-gray-400 mt-1">
                {role.permissions.length} permissões
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}