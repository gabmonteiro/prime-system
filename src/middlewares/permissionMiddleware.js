import { checkPermission } from "../services/permissionService.js";

// Middleware para verificar se o usuário tem uma permissão específica
export function requirePermission(resource, action) {
  return async (request) => {
    try {
      // Aqui você deve implementar a lógica para obter o usuário atual
      // Por exemplo, através de um token JWT ou sessão
      const user = await getCurrentUser(request);
      
      if (!user) {
        return { error: "Usuário não autenticado", status: 401 };
      }

      if (!checkPermission(user, resource, action)) {
        return { error: "Acesso negado. Permissão insuficiente.", status: 403 };
      }

      return { user };
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return { error: "Erro interno do servidor", status: 500 };
    }
  };
}

// Middleware para verificar se o usuário é admin
export function requireAdmin() {
  return async (request) => {
    try {
      const user = await getCurrentUser(request);
      
      if (!user) {
        return { error: "Usuário não autenticado", status: 401 };
      }

      if (user.role !== "admin") {
        return { error: "Acesso negado. Apenas administradores.", status: 403 };
      }

      return { user };
    } catch (error) {
      console.error("Erro ao verificar permissão de admin:", error);
      return { error: "Erro interno do servidor", status: 500 };
    }
  };
}

// Middleware para verificar se o usuário tem acesso a um recurso específico
export function requireResourceAccess(resource) {
  return async (request) => {
    try {
      const user = await getCurrentUser(request);
      
      if (!user) {
        return { error: "Usuário não autenticado", status: 401 };
      }

      // Verificar se tem pelo menos permissão de leitura
      if (!checkPermission(user, resource, "read")) {
        return { error: "Acesso negado. Permissão insuficiente.", status: 403 };
      }

      return { user };
    } catch (error) {
      console.error("Erro ao verificar acesso ao recurso:", error);
      return { error: "Erro interno do servidor", status: 500 };
    }
  };
}

// Função auxiliar para obter o usuário atual (implementar conforme sua autenticação)
async function getCurrentUser(request) {
  // TODO: Implementar lógica de autenticação
  // Por exemplo, verificar JWT token, sessão, etc.
  
  // Por enquanto, retornar null para evitar erros
  // Você deve implementar esta função baseada no seu sistema de autenticação
  return null;
}

// Middleware para verificar permissões em operações CRUD
export const requireCRUDPermission = (resource) => ({
  create: requirePermission(resource, "create"),
  read: requirePermission(resource, "read"),
  update: requirePermission(resource, "update"),
  delete: requirePermission(resource, "delete"),
  manage: requirePermission(resource, "manage")
});

// Middleware para verificar se o usuário pode gerenciar um recurso
export function requireManagePermission(resource) {
  return requirePermission(resource, "manage");
}

// Middleware para verificar se o usuário pode criar um recurso
export function requireCreatePermission(resource) {
  return requirePermission(resource, "create");
}

// Middleware para verificar se o usuário pode ler um recurso
export function requireReadPermission(resource) {
  return requirePermission(resource, "read");
}

// Middleware para verificar se o usuário pode atualizar um recurso
export function requireUpdatePermission(resource) {
  return requirePermission(resource, "update");
}

// Middleware para verificar se o usuário pode excluir um recurso
export function requireDeletePermission(resource) {
  return requirePermission(resource, "delete");
}
