# Sistema de Permissões - Prime System

## Visão Geral

O sistema de permissões foi simplificado e agora funciona com **roles predefinidas** em vez de permissões e roles separados. Cada usuário tem uma role específica que determina suas permissões no sistema.

## Roles Disponíveis

### 1. **admin** - Administrador
- **Acesso completo** a todas as funcionalidades do sistema
- Pode gerenciar usuários, configurações e todos os recursos
- **Permissões**: Todas as permissões do sistema

### 2. **gerente** - Gerente
- **Acesso gerencial** com permissões amplas
- Pode gerenciar serviços, despesas, tipos de serviços e lista de compras
- Pode visualizar configurações e usuários
- **Permissões**:
  - `servicos:manage` - Gerenciar serviços (todas as ações)
  - `despesas:manage` - Gerenciar despesas (todas as ações)
  - `tipos-servicos:manage` - Gerenciar tipos de serviços
  - `lista-compras:manage` - Gerenciar lista de compras
  - `dashboard:read` - Visualizar dashboard
  - `configuracoes:read` - Visualizar configurações
  - `usuarios:read` - Visualizar usuários
  - `usuarios:create` - Criar usuários
  - `usuarios:update` - Editar usuários

### 3. **funcionario** - Funcionário
- **Acesso operacional** para operações do dia a dia
- Pode criar, editar e visualizar serviços e despesas
- Pode gerenciar lista de compras
- **Permissões**:
  - `servicos:read` - Visualizar serviços
  - `servicos:create` - Criar serviços
  - `servicos:update` - Editar serviços
  - `despesas:read` - Visualizar despesas
  - `despesas:create` - Criar despesas
  - `despesas:update` - Editar despesas
  - `lista-compras:read` - Visualizar lista de compras
  - `lista-compras:create` - Criar itens na lista
  - `lista-compras:update` - Editar itens da lista
  - `dashboard:read` - Visualizar dashboard
  - `tipos-servicos:read` - Visualizar tipos de serviços

### 4. **visualizador** - Visualizador
- **Acesso apenas de leitura** para consultas
- Pode visualizar dados mas não pode modificá-los
- **Permissões**:
  - `servicos:read` - Visualizar serviços
  - `despesas:read` - Visualizar despesas
  - `tipos-servicos:read` - Visualizar tipos de serviços
  - `lista-compras:read` - Visualizar lista de compras
  - `dashboard:read` - Visualizar dashboard

## Como Funciona

### 1. **Atribuição de Role**
- Cada usuário recebe uma role ao ser criado
- A role determina automaticamente todas as permissões do usuário
- **Não é necessário** configurar permissões individuais

### 2. **Verificação de Permissões**
- O sistema verifica automaticamente se o usuário tem permissão para uma ação
- Usa a função `checkPermission(user, resource, action)` do serviço
- Exemplo: `checkPermission(user, "servicos", "create")`

### 3. **Recursos Disponíveis**
- **servicos** - Gestão de serviços
- **despesas** - Gestão de despesas
- **tipos-servicos** - Gestão de tipos de serviços
- **usuarios** - Gestão de usuários
- **lista-compras** - Gestão de lista de compras
- **dashboard** - Visualização do dashboard
- **auditoria** - Logs de auditoria
- **configuracoes** - Configurações do sistema

### 4. **Ações Disponíveis**
- **read** - Visualizar
- **create** - Criar
- **update** - Editar
- **delete** - Excluir
- **manage** - Gerenciar (todas as ações)

## Implementação no Código

### Verificação de Permissões
```javascript
import { checkPermission } from "../services/permissionService.js";

// Verificar se usuário pode criar um serviço
if (checkPermission(user, "servicos", "create")) {
  // Permitir criação
} else {
  // Negar acesso
}
```

### Middleware de Permissões
```javascript
import { requirePermission } from "../middlewares/permissionMiddleware.js";

// Middleware para verificar permissão de criação de serviços
const createServiceMiddleware = requirePermission("servicos", "create");
```

### Obter Permissões do Usuário
```javascript
import { getUserPermissions, getFormattedPermissions } from "../services/permissionService.js";

// Lista simples de permissões
const permissions = getUserPermissions(user);

// Lista formatada com descrições
const formattedPermissions = getFormattedPermissions(user);
```

## Gestão de Usuários

### Criar Usuário
```javascript
const userData = {
  name: "João Silva",
  email: "joao@empresa.com",
  password: "senha123",
  role: "funcionario" // Role determina permissões automaticamente
};
```

### Atualizar Role
```javascript
// Mudar role de "funcionario" para "gerente"
await UserService.updateUser(userId, { role: "gerente" });
// Permissões são atualizadas automaticamente
```

## Vantagens do Novo Sistema

1. **Simplicidade** - Não há necessidade de gerenciar permissões individuais
2. **Manutenibilidade** - Mudanças nas permissões são feitas no código
3. **Consistência** - Usuários com a mesma role sempre têm as mesmas permissões
4. **Performance** - Não há consultas complexas ao banco para verificar permissões
5. **Segurança** - Permissões são hardcoded, não podem ser manipuladas via interface

## Migração do Sistema Anterior

Se você estava usando o sistema anterior com permissões e roles separados:

1. **Remova** as APIs de permissões (`/api/permissions`)
2. **Remova** as APIs de roles (`/api/roles`)
3. **Atualize** os usuários existentes para usar as novas roles
4. **Execute** o script de seed para criar as roles padrão

## Script de Seed

Execute o script para configurar o sistema:

```bash
node seedDatabase.js
```

Isso criará:
- Todas as roles padrão
- Usuário administrador padrão (admin@prime.com / admin123)

## Personalização

Para adicionar novas permissões ou modificar roles existentes:

1. **Edite** o arquivo `src/services/permissionService.js`
2. **Modifique** o mapeamento de roles para permissões
3. **Atualize** o modelo `Role` se necessário
4. **Reinicie** o sistema

## Exemplo de Uso

```javascript
// Verificar se usuário pode excluir um serviço
const canDeleteService = checkPermission(user, "servicos", "delete");

// Verificar se usuário pode gerenciar despesas (todas as ações)
const canManageExpenses = checkPermission(user, "despesas", "manage");

// Obter todas as permissões do usuário
const userPermissions = getUserPermissions(user);
console.log("Usuário tem permissões:", userPermissions);
```

## Suporte

Para dúvidas ou problemas com o sistema de permissões, consulte:
- Este arquivo de documentação
- Código fonte em `src/services/permissionService.js`
- Modelos em `src/models/`
- Middlewares em `src/middlewares/`
