# 📚 API Documentation - Prime System

Este documento descreve todas as APIs disponíveis no sistema.

## 🔐 Autenticação

Todas as APIs requerem autenticação via cookie `user` que contém o `userId`.

## 📊 Dashboard

### `GET /api/dashboard`

**Descrição:** Obtém dados do dashboard com estatísticas e informações consolidadas.

**Parâmetros de Query:**
- `period` (opcional): Período de filtro
  - `week`: Última semana
  - `month`: Mês atual (padrão)
  - `quarter`: Trimestre atual
  - `year`: Ano atual

**Resposta:**
```json
{
  "servicos": [...],           // Array de serviços do período
  "despesas": [...],           // Array de despesas do período
  "compras": [...],            // Array de compras do período
  "servicosStats": {
    "total": 10,
    "valor": 5000
  },
  "despesasStats": {
    "total": 5,
    "valor": 2000
  },
  "comprasStats": {
    "total": 3,
    "valor": 1500
  },
  "lucro": 3000,               // Lucro do período (serviços - despesas)
  "carteira": 8000,            // Saldo total da carteira (histórico completo)
  "carteiraStats": {
    "servicosTotal": 25,
    "despesasTotal": 12,
    "servicosValor": 15000,
    "despesasValor": 7000
  }
}
```

**Permissões:** `dashboard:read`

## 💰 Carteira

### `GET /api/carteira`

**Descrição:** Obtém o saldo total da carteira e estatísticas completas.

**Resposta:**
```json
{
  "saldo": 8000,
  "receitas": {
    "total": 25,
    "valor": 15000
  },
  "despesas": {
    "total": 12,
    "valor": 7000
  },
  "resumo": {
    "servicos": [...],
    "despesas": [...]
  }
}
```

**Permissões:** `servicos:read` + `despesas:read`

## 🛠️ Serviços

### `GET /api/servico`

**Descrição:** Lista serviços com paginação.

**Parâmetros de Query:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `id`: ID específico do serviço

**Resposta:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Permissões:** `servicos:read`

### `POST /api/servico`

**Descrição:** Cria um novo serviço.

**Body:**
```json
{
  "cliente": "Nome do Cliente",
  "tipoServico": "ID_do_tipo",
  "data": "2025-01-25",
  "participantes": ["ID_usuario1", "ID_usuario2"],
  "valorPersonalizado": 500
}
```

**Permissões:** `servicos:create`

### `PUT /api/servico`

**Descrição:** Atualiza um serviço existente.

**Body:**
```json
{
  "id": "ID_do_servico",
  "cliente": "Novo Nome",
  "valorPersonalizado": 600
}
```

**Permissões:** `servicos:update`

### `DELETE /api/servico`

**Descrição:** Remove um serviço.

**Body:**
```json
{
  "id": "ID_do_servico"
}
```

**Permissões:** `servicos:delete`

## 💸 Despesas

### `GET /api/despesa`

**Descrição:** Lista despesas com paginação.

**Parâmetros de Query:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `id`: ID específico da despesa

**Resposta:** Similar ao serviço

**Permissões:** `despesas:read`

### `POST /api/despesa`

**Descrição:** Cria uma nova despesa.

**Body:**
```json
{
  "nome": "Nome da Despesa",
  "valor": 100,
  "desc": "Descrição opcional",
  "data": "2025-01-25",
  "tipo": "gasto"
}
```

**Permissões:** `despesas:create`

### `PUT /api/despesa`

**Descrição:** Atualiza uma despesa existente.

**Permissões:** `despesas:update`

### `DELETE /api/despesa`

**Descrição:** Remove uma despesa.

**Permissões:** `despesas:delete`

## 🛍️ Lista de Compras

### `GET /api/futuraCompra`

**Descrição:** Lista compras futuras com paginação.

**Permissões:** `lista-compras:read`

### `POST /api/futuraCompra`

**Descrição:** Cria uma nova compra futura.

**Permissões:** `lista-compras:create`

### `PUT /api/futuraCompra`

**Descrição:** Atualiza uma compra futura.

**Permissões:** `lista-compras:update`

### `DELETE /api/futuraCompra`

**Descrição:** Remove uma compra futura.

**Permissões:** `lista-compras:delete`

## 🏷️ Tipos de Serviço

### `GET /api/tipoServico`

**Descrição:** Lista tipos de serviço.

**Permissões:** `tipos-servicos:read`

### `POST /api/tipoServico`

**Descrição:** Cria um novo tipo de serviço.

**Permissões:** `tipos-servicos:create`

### `PUT /api/tipoServico`

**Descrição:** Atualiza um tipo de serviço.

**Permissões:** `tipos-servicos:update`

### `DELETE /api/tipoServico`

**Descrição:** Remove um tipo de serviço.

**Permissões:** `tipos-servicos:delete`

## 👥 Usuários

### `GET /api/user`

**Descrição:** Lista usuários ou obtém usuário específico.

**Parâmetros de Query:**
- `id`: ID específico do usuário

**Permissões:** `usuarios:read`

### `POST /api/user`

**Descrição:** Cria um novo usuário.

**Permissões:** `usuarios:create`

### `PUT /api/user`

**Descrição:** Atualiza um usuário existente.

**Permissões:** `usuarios:update`

### `DELETE /api/user`

**Descrição:** Remove um usuário.

**Permissões:** `usuarios:delete`

## ⚙️ Configurações do Sistema

### `GET /api/system-config`

**Descrição:** Obtém configurações do sistema.

**Parâmetros de Query:**
- `key`: Chave específica da configuração

**Permissões:** `configuracoes:read`

### `POST /api/system-config`

**Descrição:** Atualiza configuração do sistema.

**Permissões:** `configuracoes:update`

### `PUT /api/system-config`

**Descrição:** Cria/atualiza configuração do sistema.

**Permissões:** `configuracoes:manage`

### `PATCH /api/system-config`

**Descrição:** Atualiza parcialmente configuração do sistema.

**Permissões:** `configuracoes:manage`

## 📋 Auditoria

### `GET /api/audit`

**Descrição:** Lista logs de auditoria.

**Permissões:** `auditoria:read`

### `POST /api/audit`

**Descrição:** Cria novo log de auditoria.

**Permissões:** `auditoria:create`

## 🔑 Autenticação

### `POST /api/login`

**Descrição:** Autentica usuário.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

### `GET /api/auth/verify`

**Descrição:** Verifica token de autenticação.

## 📝 Notas Importantes

### **Filtros de Período**
- **Dashboard**: Filtra por período (mês, trimestre, ano)
- **Carteira**: Sempre retorna histórico completo
- **Outras APIs**: Sem filtro de período (todos os dados)

### **Cálculo de Saldo**
- **Lucro**: Receitas - Despesas (do período selecionado)
- **Carteira**: Receitas - Despesas (histórico completo)

### **Paginação**
- Todas as listas principais suportam paginação
- Padrão: 10 itens por página
- Parâmetros: `page` e `limit`

### **Permissões**
- Todas as operações verificam permissões do usuário
- Usuários só veem dados que têm permissão para acessar
- Operações de escrita requerem permissões específicas

### **Auditoria**
- Todas as operações de escrita são registradas
- Logs incluem usuário, ação, dados anteriores e novos
- IP e User-Agent são capturados automaticamente
