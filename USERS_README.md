# 🚀 Scripts para Gerenciar Usuários - Prime System

Este documento explica como usar os scripts para corrigir e gerenciar usuários no sistema.

## 📋 Problema Identificado

Os usuários existentes no banco de dados têm a estrutura antiga:
- `isAdmin: true/false` (campo antigo)
- `role: "user"` (valor inválido)

O novo sistema de permissões espera:
- `role: "admin" | "gerente" | "funcionario" | "visualizador"`
- Sem o campo `isAdmin`

## 🛠️ Scripts Disponíveis

### 1. Corrigir Usuários Existentes
```bash
npm run fix:users
```

**O que faz:**
- Converte usuários com `isAdmin: true` para `role: "admin"`
- Converte usuários com `isAdmin: false` para `role: "funcionario"`
- Remove o campo `isAdmin` obsoleto
- Atualiza o campo `updatedAt`

### 2. Criar Usuário Administrador
```bash
npm run create:admin
```

**O que faz:**
- Cria um usuário administrador com credenciais padrão
- Email: `admin@prime.com`
- Senha: `admin123`
- Role: `admin`

### 3. Listar Todos os Usuários
```bash
npm run list:users
```

**O que faz:**
- Mostra todos os usuários no banco
- Exibe ID, nome, email, role e status

### 4. Atualizar Role de um Usuário
```bash
npm run update:user <email> <role>
```

**Exemplos:**
```bash
npm run update:user user@example.com admin
npm run update:user user@example.com gerente
npm run update:user user@example.com funcionario
npm run update:user user@example.com visualizador
```

## 🔄 Processo de Correção

### Passo 1: Corrigir Usuários Existentes
```bash
npm run fix:users
```

### Passo 2: Verificar Resultado
```bash
npm run list:users
```

### Passo 3: Ajustar Roles Conforme Necessário
```bash
# Exemplo: tornar um usuário gerente
npm run update:user gabrieldealmeidamonteiro@gmail.com gerente

# Exemplo: tornar um usuário visualizador
npm run update:user samuelmonteiro646@gmail.com visualizador
```

## 🎯 Roles e Permissões

### Admin
- **Acesso total** a todas as funcionalidades
- Pode gerenciar usuários, configurações e auditoria
- Todas as permissões de CRUD em todos os recursos

### Gerente
- **Gerenciamento** de serviços, despesas, tipos de serviço e lista de compras
- Pode criar, editar e visualizar dados
- Acesso limitado a usuários (apenas leitura, criação e edição)
- Não pode acessar configurações do sistema ou auditoria

### Funcionário
- **Operações básicas** de CRUD em serviços, despesas e lista de compras
- Pode criar, editar e visualizar dados
- Acesso apenas de leitura a tipos de serviço
- Não pode gerenciar usuários ou configurações

### Visualizador
- **Apenas leitura** de dados
- Pode visualizar serviços, despesas, tipos de serviço e lista de compras
- Acesso ao dashboard
- Não pode criar, editar ou excluir dados

## ⚠️ Importante

1. **Execute primeiro** `npm run fix:users` para corrigir a estrutura básica
2. **Faça backup** do banco antes de executar os scripts
3. **Teste o login** após as correções
4. **Ajuste os roles** conforme a necessidade da sua equipe

## 🚨 Solução de Problemas

### Erro: "Cast to ObjectId failed for value 'Davi'"
**Sintomas:**
- Dashboard não carrega
- Erro 500 na API
- Mensagem: "Cast to ObjectId failed for value 'Davi' (type string)"

**Causa:**
- Campo `participantes` em serviços contém strings em vez de ObjectIds
- Dados corrompidos no banco de dados

**Solução:**
```bash
# 1. Corrigir dados corrompidos
npm run fix:corrupted

# 2. Verificar se foi corrigido
npm run list:corrupted

# 3. Testar o dashboard novamente
```

### Erro: "Cannot read properties of undefined (reading 'forEach')"
**Sintomas:**
- Dashboard não carrega
- Erro no console do navegador
- Mensagem: "Cannot read properties of undefined (reading 'forEach')"

**Causa:**
- Arrays `servicos`, `despesas` ou `usuarios` são `undefined`
- Problemas na API do dashboard

**Solução:**
```bash
# 1. Corrigir dados corrompidos primeiro
npm run fix:corrupted

# 2. Corrigir usuários
npm run fix:users

# 3. Verificar se as APIs estão funcionando
npm run list:users
```

### Erro de Validação de Senha
Se aparecer erro "Senha é obrigatória", significa que o usuário não tem senha válida. Neste caso:
1. Use o script de criação de admin para criar um novo usuário
2. Ou atualize a senha manualmente no banco

### Usuário Não Encontrado
Se o email não for encontrado:
1. Verifique se o email está correto
2. Use `npm run list:users` para ver todos os usuários
3. Verifique se há espaços extras no email

### Problemas de Conexão
Se houver problemas de conexão com o MongoDB:
1. Verifique se o arquivo `.env.local` está configurado
2. Verifique se a string de conexão está correta
3. Verifique se o MongoDB está rodando

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro no terminal
2. Confirme se o MongoDB está acessível
3. Verifique se as variáveis de ambiente estão corretas
4. Execute `npm run list:users` para verificar o estado atual dos usuários
