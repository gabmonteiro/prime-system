import React, { useState, useEffect } from 'react';

// Componente de exemplo mostrando como usar o sistema de permissões
const PermissionExample = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Simular usuário logado (em produção, isso viria do contexto de autenticação)
  useEffect(() => {
    // Exemplo de usuário com role "funcionario"
    const mockUser = {
      _id: "user-123",
      name: "João Silva",
      email: "joao@empresa.com",
      role: "funcionario"
    };
    setUser(mockUser);
  }, []);

  // Função para verificar permissões (simulada)
  const checkPermission = (resource, action) => {
    if (!user) return false;
    
    // Admin sempre tem todas as permissões
    if (user.role === "admin") return true;
    
    // Mapeamento de roles para permissões
    const rolePermissions = {
      gerente: [
        "servicos:manage", "despesas:manage", "tipos-servicos:manage",
        "lista-compras:manage", "dashboard:read", "configuracoes:read",
        "usuarios:read", "usuarios:create", "usuarios:update"
      ],
      funcionario: [
        "servicos:read", "servicos:create", "servicos:update",
        "despesas:read", "despesas:create", "despesas:update",
        "lista-compras:read", "lista-compras:create", "lista-compras:update",
        "dashboard:read", "tipos-servicos:read"
      ],
      visualizador: [
        "servicos:read", "despesas:read", "tipos-servicos:read",
        "lista-compras:read", "dashboard:read"
      ]
    };

    const permissions = rolePermissions[user.role] || [];
    
    // Verificar permissão específica ou permissão de gerenciamento
    return permissions.includes(`${resource}:${action}`) || 
           permissions.includes(`${resource}:manage`);
  };

  // Função para obter permissões formatadas
  const getFormattedPermissions = () => {
    if (!user) return [];
    
    const permissionMap = {
      servicos: {
        read: "Visualizar serviços",
        create: "Criar serviços", 
        update: "Editar serviços",
        delete: "Excluir serviços",
        manage: "Gerenciar serviços (todas as ações)"
      },
      despesas: {
        read: "Visualizar despesas",
        create: "Criar despesas",
        update: "Editar despesas", 
        delete: "Excluir despesas",
        manage: "Gerenciar despesas (todas as ações)"
      },
      "tipos-servicos": {
        read: "Visualizar tipos de serviços",
        create: "Criar tipos de serviços",
        update: "Editar tipos de serviços",
        delete: "Excluir tipos de serviços", 
        manage: "Gerenciar tipos de serviços (todas as ações)"
      },
      usuarios: {
        read: "Visualizar usuários",
        create: "Criar usuários",
        update: "Editar usuários",
        delete: "Excluir usuários",
        manage: "Gerenciar usuários (todas as ações)"
      },
      "lista-compras": {
        read: "Visualizar lista de compras",
        create: "Criar itens na lista de compras",
        update: "Editar itens da lista de compras",
        delete: "Excluir itens da lista de compras",
        manage: "Gerenciar lista de compras (todas as ações)"
      },
      dashboard: {
        read: "Visualizar dashboard"
      },
      auditoria: {
        read: "Visualizar logs de auditoria"
      },
      configuracoes: {
        read: "Visualizar configurações",
        update: "Editar configurações",
        manage: "Gerenciar configurações (todas as ações)"
      }
    };

    const rolePermissions = {
      admin: Object.keys(permissionMap).flatMap(resource => {
        const actions = Object.keys(permissionMap[resource]);
        return actions.map(action => `${resource}:${action}`);
      }),
      gerente: [
        "servicos:manage", "despesas:manage", "tipos-servicos:manage",
        "lista-compras:manage", "dashboard:read", "configuracoes:read",
        "usuarios:read", "usuarios:create", "usuarios:update"
      ],
      funcionario: [
        "servicos:read", "servicos:create", "servicos:update",
        "despesas:read", "despesas:create", "despesas:update",
        "lista-compras:read", "lista-compras:create", "lista-compras:update",
        "dashboard:read", "tipos-servicos:read"
      ],
      visualizador: [
        "servicos:read", "despesas:read", "tipos-servicos:read",
        "lista-compras:read", "dashboard:read"
      ]
    };

    const permissions = rolePermissions[user.role] || [];
    const formatted = [];
    
    permissions.forEach(permission => {
      const [resource, action] = permission.split(':');
      if (permissionMap[resource] && permissionMap[resource][action]) {
        formatted.push({
          key: permission,
          resource,
          action,
          description: permissionMap[resource][action]
        });
      }
    });
    
    return formatted.sort((a, b) => a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action));
  };

  // Atualizar permissões quando usuário mudar
  useEffect(() => {
    if (user) {
      setPermissions(getFormattedPermissions());
    }
  }, [user]);

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sistema de Permissões - Exemplo</h1>
      
      {/* Informações do Usuário */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Usuário Atual</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Nome:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Role:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
              user.role === 'admin' ? 'bg-red-100 text-red-800' :
              user.role === 'gerente' ? 'bg-orange-100 text-orange-800' :
              user.role === 'funcionario' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Teste de Permissões */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Teste de Permissões</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Pode criar serviços?</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              checkPermission("servicos", "create") 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {checkPermission("servicos", "create") ? 'Sim' : 'Não'}
            </span>
          </div>
          <div>
            <strong>Pode excluir serviços?</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              checkPermission("servicos", "delete") 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {checkPermission("servicos", "delete") ? 'Sim' : 'Não'}
            </span>
          </div>
          <div>
            <strong>Pode gerenciar usuários?</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              checkPermission("usuarios", "manage") 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {checkPermission("usuarios", "manage") ? 'Sim' : 'Não'}
            </span>
          </div>
          <div>
            <strong>Pode visualizar auditoria?</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              checkPermission("auditoria", "read") 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {checkPermission("auditoria", "read") ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Permissões */}
      <div className="bg-white border rounded-lg">
        <h2 className="text-xl font-semibold p-4 border-b">Permissões do Usuário</h2>
        <div className="p-4">
          {permissions.length === 0 ? (
            <p className="text-gray-500">Nenhuma permissão encontrada.</p>
          ) : (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-blue-600">{permission.resource}</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="font-medium text-green-600">{permission.action}</span>
                  </div>
                  <span className="text-sm text-gray-600">{permission.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exemplos de Uso no Código */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Como Usar no Código:</h3>
        <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// Verificar permissão antes de mostrar botão
{checkPermission("servicos", "create") && (
  <button className="btn btn-primary">
    Criar Serviço
  </button>
)}

// Verificar permissão antes de executar ação
const handleDelete = () => {
  if (checkPermission("servicos", "delete")) {
    deleteServico(id);
  } else {
    alert("Sem permissão para excluir serviços");
  }
};

// Renderizar condicionalmente baseado em permissões
{checkPermission("usuarios", "manage") ? (
  <UserManagementPanel />
) : (
  <UserViewOnlyPanel />
)}`}
        </pre>
      </div>
    </div>
  );
};

export default PermissionExample;
