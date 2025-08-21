import Permission from "../models/permission.js";
import Role from "../models/role.js";

// === PERMISSION SERVICES ===

export async function getAllPermissions() {
  return await Permission.find().sort({ resource: 1, action: 1 });
}

export async function getPermissionById(id) {
  return await Permission.findById(id);
}

export async function createPermission(data) {
  return await Permission.create(data);
}

export async function updatePermission(id, data) {
  return await Permission.findByIdAndUpdate(id, data, { new: true });
}

export async function deletePermission(id) {
  return await Permission.findByIdAndDelete(id);
}

// === ROLE SERVICES ===

export async function getAllRoles() {
  return await Role.find().populate('permissions').sort({ name: 1 });
}

export async function getRoleById(id) {
  return await Role.findById(id).populate('permissions');
}

export async function createRole(data) {
  return await Role.create(data);
}

export async function updateRole(id, data) {
  return await Role.findByIdAndUpdate(id, data, { new: true }).populate('permissions');
}

export async function deleteRole(id) {
  const role = await Role.findById(id);
  if (role?.isSystem) {
    throw new Error("Não é possível excluir roles do sistema");
  }
  return await Role.findByIdAndDelete(id);
}

// === INITIALIZATION SERVICES ===

// Permissões padrão do sistema
const DEFAULT_PERMISSIONS = [
  // Serviços
  { name: "servicos:read", description: "Visualizar serviços", resource: "servicos", action: "read" },
  { name: "servicos:create", description: "Criar serviços", resource: "servicos", action: "create" },
  { name: "servicos:update", description: "Editar serviços", resource: "servicos", action: "update" },
  { name: "servicos:delete", description: "Excluir serviços", resource: "servicos", action: "delete" },
  { name: "servicos:manage", description: "Gerenciar serviços (todas as ações)", resource: "servicos", action: "manage" },
  
  // Despesas
  { name: "despesas:read", description: "Visualizar despesas", resource: "despesas", action: "read" },
  { name: "despesas:create", description: "Criar despesas", resource: "despesas", action: "create" },
  { name: "despesas:update", description: "Editar despesas", resource: "despesas", action: "update" },
  { name: "despesas:delete", description: "Excluir despesas", resource: "despesas", action: "delete" },
  { name: "despesas:manage", description: "Gerenciar despesas (todas as ações)", resource: "despesas", action: "manage" },
  
  // Tipos de Serviços
  { name: "tipos-servicos:read", description: "Visualizar tipos de serviços", resource: "tipos-servicos", action: "read" },
  { name: "tipos-servicos:create", description: "Criar tipos de serviços", resource: "tipos-servicos", action: "create" },
  { name: "tipos-servicos:update", description: "Editar tipos de serviços", resource: "tipos-servicos", action: "update" },
  { name: "tipos-servicos:delete", description: "Excluir tipos de serviços", resource: "tipos-servicos", action: "delete" },
  { name: "tipos-servicos:manage", description: "Gerenciar tipos de serviços (todas as ações)", resource: "tipos-servicos", action: "manage" },
  
  // Usuários
  { name: "usuarios:read", description: "Visualizar usuários", resource: "usuarios", action: "read" },
  { name: "usuarios:create", description: "Criar usuários", resource: "usuarios", action: "create" },
  { name: "usuarios:update", description: "Editar usuários", resource: "usuarios", action: "update" },
  { name: "usuarios:delete", description: "Excluir usuários", resource: "usuarios", action: "delete" },
  { name: "usuarios:manage", description: "Gerenciar usuários (todas as ações)", resource: "usuarios", action: "manage" },
  
  // Lista de Compras
  { name: "lista-compras:read", description: "Visualizar lista de compras", resource: "lista-compras", action: "read" },
  { name: "lista-compras:create", description: "Criar itens na lista de compras", resource: "lista-compras", action: "create" },
  { name: "lista-compras:update", description: "Editar itens da lista de compras", resource: "lista-compras", action: "update" },
  { name: "lista-compras:delete", description: "Excluir itens da lista de compras", resource: "lista-compras", action: "delete" },
  { name: "lista-compras:manage", description: "Gerenciar lista de compras (todas as ações)", resource: "lista-compras", action: "manage" },
  
  // Dashboard
  { name: "dashboard:read", description: "Visualizar dashboard", resource: "dashboard", action: "read" },
  
  // Auditoria
  { name: "auditoria:read", description: "Visualizar logs de auditoria", resource: "auditoria", action: "read" },
  
  // Configurações
  { name: "configuracoes:read", description: "Visualizar configurações", resource: "configuracoes", action: "read" },
  { name: "configuracoes:update", description: "Editar configurações", resource: "configuracoes", action: "update" },
  { name: "configuracoes:manage", description: "Gerenciar configurações (todas as ações)", resource: "configuracoes", action: "manage" },
];

// Roles padrão do sistema
const DEFAULT_ROLES = [
  {
    name: "Administrador",
    description: "Acesso completo ao sistema",
    isSystem: true,
    permissions: [] // Será preenchido com todas as permissões
  },
  {
    name: "Gerente",
    description: "Acesso a relatórios e configurações básicas",
    isSystem: true,
    permissions: [
      "servicos:manage", "despesas:manage", "tipos-servicos:manage",
      "lista-compras:manage", "dashboard:read", "configuracoes:read"
    ]
  },
  {
    name: "Funcionário",
    description: "Acesso básico para operações do dia a dia",
    isSystem: true,
    permissions: [
      "servicos:read", "servicos:create", "servicos:update",
      "despesas:read", "despesas:create", "despesas:update",
      "lista-compras:read", "lista-compras:create", "lista-compras:update",
      "dashboard:read"
    ]
  },
  {
    name: "Visualizador",
    description: "Apenas visualização de dados",
    isSystem: true,
    permissions: [
      "servicos:read", "despesas:read", "tipos-servicos:read",
      "lista-compras:read", "dashboard:read"
    ]
  }
];

// Inicializar permissões e roles padrão
export async function initializePermissionsAndRoles() {
  try {
    console.log("🔧 Inicializando permissões e roles...");
    
    // Criar permissões
    const createdPermissions = new Map();
    
    for (const permissionData of DEFAULT_PERMISSIONS) {
      let permission = await Permission.findOne({ name: permissionData.name });
      if (!permission) {
        permission = await Permission.create(permissionData);
        console.log(`✅ Permissão criada: ${permission.name}`);
      }
      createdPermissions.set(permission.name, permission._id);
    }
    
    // Criar roles
    for (const roleData of DEFAULT_ROLES) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        // Mapear nomes de permissões para IDs
        const permissionIds = [];
        
        if (roleData.name === "Administrador") {
          // Admin tem todas as permissões
          permissionIds.push(...Array.from(createdPermissions.values()));
        } else {
          // Outras roles têm permissões específicas
          for (const permissionName of roleData.permissions) {
            const permissionId = createdPermissions.get(permissionName);
            if (permissionId) {
              permissionIds.push(permissionId);
            }
          }
        }
        
        role = await Role.create({
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
          permissions: permissionIds
        });
        
        console.log(`✅ Role criada: ${role.name} com ${permissionIds.length} permissões`);
      }
    }
    
    console.log("🎉 Permissões e roles inicializadas com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao inicializar permissões e roles:", error);
    throw error;
  }
}
