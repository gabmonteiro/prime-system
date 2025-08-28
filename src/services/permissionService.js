import Role from "../models/role.js";

// === ROLE SERVICES ===

export async function getAllRoles() {
  return await Role.find().sort({ name: 1 });
}

export async function getRoleById(id) {
  return await Role.findById(id);
}

export async function createRole(data) {
  return await Role.create(data);
}

export async function updateRole(id, data) {
  return await Role.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteRole(id) {
  const role = await Role.findById(id);
  if (role?.isSystem) {
    throw new Error("Não é possível excluir roles do sistema");
  }
  return await Role.findByIdAndDelete(id);
}

// === PERMISSION UTILITIES ===

// Mapeamento de permissões por recurso
export const PERMISSION_MAP = {
  servicos: {
    read: "Visualizar serviços",
    create: "Criar serviços",
    update: "Editar serviços",
    delete: "Excluir serviços",
    manage: "Gerenciar serviços (todas as ações)",
  },
  despesas: {
    read: "Visualizar despesas",
    create: "Criar despesas",
    update: "Editar despesas",
    delete: "Excluir despesas",
    manage: "Gerenciar despesas (todas as ações)",
  },
  "tipos-servicos": {
    read: "Visualizar tipos de serviços",
    create: "Criar tipos de serviços",
    update: "Editar tipos de serviços",
    delete: "Excluir tipos de serviços",
    manage: "Gerenciar tipos de serviços (todas as ações)",
  },
  usuarios: {
    read: "Visualizar usuários",
    create: "Criar usuários",
    update: "Editar usuários",
    delete: "Excluir usuários",
    manage: "Gerenciar usuários (todas as ações)",
  },
  "lista-compras": {
    read: "Visualizar lista de compras",
    create: "Criar itens na lista de compras",
    update: "Editar itens da lista de compras",
    delete: "Excluir itens da lista de compras",
    manage: "Gerenciar lista de compras (todas as ações)",
  },
  dashboard: {
    read: "Visualizar dashboard",
  },
  auditoria: {
    read: "Visualizar logs de auditoria",
  },
  configuracoes: {
    read: "Visualizar configurações",
    update: "Editar configurações",
    manage: "Gerenciar configurações (todas as ações)",
  },
};

// Função para verificar se um usuário tem uma permissão específica
export function checkPermission(user, resource, action) {
  if (!user || !user.role) return false;

  // Admin sempre tem todas as permissões
  if (user.role === "admin") return true;

  // Mapeamento de roles para permissões
  const rolePermissions = {
    gerente: [
      "servicos:manage",
      "despesas:manage",
      "tipos-servicos:manage",
      "lista-compras:manage",
      "dashboard:read",
      "configuracoes:read",
      "usuarios:read",
      "usuarios:create",
      "usuarios:update",
      "usuarios:delete",
    ],
    funcionario: [
      "servicos:read",
      "servicos:create",
      "servicos:update",
      "despesas:read",
      "despesas:create",
      "despesas:update",
      "lista-compras:read",
      "lista-compras:create",
      "lista-compras:update",
      "dashboard:read",
      "tipos-servicos:read",
    ],
    visualizador: [
      "servicos:read",
      "despesas:read",
      "tipos-servicos:read",
      "lista-compras:read",
      "dashboard:read",
    ],
  };

  const permissions = rolePermissions[user.role] || [];

  // Verificar permissão específica ou permissão de gerenciamento
  return (
    permissions.includes(`${resource}:${action}`) ||
    permissions.includes(`${resource}:manage`)
  );
}

// Função para obter todas as permissões de um usuário
export function getUserPermissions(user) {
  if (!user || !user.role) return [];

  if (user.role === "admin") {
    // Admin tem todas as permissões
    return Object.keys(PERMISSION_MAP).flatMap((resource) => {
      const actions = Object.keys(PERMISSION_MAP[resource]);
      return actions.map((action) => `${resource}:${action}`);
    });
  }

  const rolePermissions = {
    gerente: [
      "servicos:manage",
      "despesas:manage",
      "tipos-servicos:manage",
      "lista-compras:manage",
      "dashboard:read",
      "configuracoes:read",
      "usuarios:read",
      "usuarios:create",
      "usuarios:update",
      "usuarios:delete",
    ],
    funcionario: [
      "servicos:read",
      "servicos:create",
      "servicos:update",
      "despesas:read",
      "despesas:create",
      "despesas:update",
      "lista-compras:read",
      "lista-compras:create",
      "lista-compras:update",
      "dashboard:read",
      "tipos-servicos:read",
    ],
    visualizador: [
      "servicos:read",
      "despesas:read",
      "tipos-servicos:read",
      "lista-compras:read",
      "dashboard:read",
    ],
  };

  return rolePermissions[user.role] || [];
}

// Função para obter permissões formatadas para exibição
export function getFormattedPermissions(user) {
  const permissions = getUserPermissions(user);
  const formatted = [];

  permissions.forEach((permission) => {
    const [resource, action] = permission.split(":");
    if (PERMISSION_MAP[resource] && PERMISSION_MAP[resource][action]) {
      formatted.push({
        key: permission,
        resource,
        action,
        description: PERMISSION_MAP[resource][action],
      });
    }
  });

  return formatted.sort(
    (a, b) =>
      a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action),
  );
}
