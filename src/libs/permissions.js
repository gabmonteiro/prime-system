// Fonte única de permissões do sistema.
// Usado pelo servidor (rotas de API), pelo cliente (authContext/Sidebar) e pelo seed.
// Não importe nada de servidor (mongoose etc.) aqui: este arquivo também roda no navegador.

export const ROLES = ["admin", "gerente", "funcionario", "visualizador"];

export const ROLE_LABELS = {
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
  visualizador: "Visualizador",
};

export const PERMISSION_MAP = {
  servicos: {
    read: "Visualizar serviços",
    create: "Criar serviços",
    update: "Editar serviços e registrar pagamentos",
    delete: "Excluir serviços",
    manage: "Gerenciar serviços (todas as ações)",
  },
  clientes: {
    read: "Visualizar clientes e veículos",
    create: "Cadastrar clientes e veículos",
    update: "Editar clientes e veículos",
    delete: "Excluir clientes e veículos",
    manage: "Gerenciar clientes (todas as ações)",
  },
  despesas: {
    read: "Visualizar despesas",
    create: "Criar despesas",
    update: "Editar despesas",
    delete: "Excluir despesas",
    manage: "Gerenciar despesas (todas as ações)",
  },
  contas: {
    read: "Visualizar contas e saldos",
    create: "Criar contas e transferências",
    update: "Editar contas",
    delete: "Excluir contas e transferências",
    manage: "Gerenciar contas (todas as ações)",
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

const ALL_PERMISSIONS = Object.entries(PERMISSION_MAP).flatMap(
  ([resource, actions]) =>
    Object.keys(actions).map((action) => `${resource}:${action}`),
);

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  gerente: [
    "servicos:manage",
    "clientes:manage",
    "despesas:manage",
    "contas:manage",
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
    "clientes:read",
    "clientes:create",
    "clientes:update",
    "despesas:read",
    "despesas:create",
    "despesas:update",
    "contas:read",
    "lista-compras:read",
    "lista-compras:create",
    "lista-compras:update",
    "dashboard:read",
    "tipos-servicos:read",
  ],
  visualizador: [
    "servicos:read",
    "clientes:read",
    "despesas:read",
    "contas:read",
    "tipos-servicos:read",
    "lista-compras:read",
    "dashboard:read",
  ],
};

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Verifica se um usuário (ou role) tem a permissão `resource:action`.
 * A permissão `resource:manage` concede todas as ações do recurso.
 */
export function hasPermission(userOrRole, resource, action) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  if (!role) return false;
  if (role === "admin") return true;
  const perms = getRolePermissions(role);
  return (
    perms.includes(`${resource}:${action}`) ||
    perms.includes(`${resource}:manage`)
  );
}

/** Lista formatada para exibição na tela de usuários. */
export function getFormattedPermissions(role) {
  return getRolePermissions(role)
    .map((key) => {
      const [resource, action] = key.split(":");
      const description = PERMISSION_MAP[resource]?.[action];
      return description ? { key, resource, action, description } : null;
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.resource.localeCompare(b.resource) ||
        a.action.localeCompare(b.action),
    );
}
