# 🔄 Migração de Participantes - Prime System

Este documento explica como migrar participantes de serviços de strings para ObjectIds de usuários.

## 📋 Problema Identificado

**Antes (estrutura antiga):**
```json
{
  "participantes": ["Gabriel", "Samuel", "Davi"]
}
```

**Depois (estrutura nova):**
```json
{
  "participantes": [
    "6882d6bbd3b196173c6f4380",  // ObjectId do Gabriel
    "6882d6dfd3b196173c6f4384",  // ObjectId do Samuel
    "6882e37aecf787db73a8ddd2"   // ObjectId do Davi
  ]
}
```

## 🎯 Mapeamento de Nomes para ObjectIds

| Nome    | ObjectId                    |
|---------|----------------------------|
| Gabriel | 6882d6bbd3b196173c6f4380 |
| Samuel  | 6882d6dfd3b196173c6f4384 |
| Davi    | 6882e37aecf787db73a8ddd2 |

## 🛠️ Scripts Disponíveis

### 1. Verificar Dados Atuais
```bash
npm run migrate:participantes:check
```
**O que faz:**
- Conta quantos serviços têm participantes em string
- Conta quantos serviços têm participantes em ObjectId
- **NÃO altera dados** - apenas diagnostica

### 2. Fazer Backup
```bash
npm run migrate:participantes:backup
```
**O que faz:**
- Cria backup completo dos dados atuais
- Salva em arquivo JSON com timestamp
- **NÃO altera dados** - apenas faz backup

### 3. Simular Migração
```bash
npm run migrate:participantes:simulate
```
**O que faz:**
- Mostra exatamente o que será alterado
- Conta quantos participantes serão migrados
- **NÃO altera dados** - apenas simula

### 4. Executar Migração Real
```bash
npm run migrate:participantes:migrate
```
**O que faz:**
- Faz backup automático antes de começar
- Converte strings para ObjectIds
- **ALTERA DADOS** - executa a migração real

## 🔄 Processo de Migração Seguro

### Passo 1: Verificar Estado Atual
```bash
npm run migrate:participantes:check
```
**Resultado esperado:**
```
📋 Resumo da verificação:
   • Serviços com participantes em string: X
   • Total de participantes em string: Y
   • Serviços com participantes em ObjectId: Z
   • Total de participantes em ObjectId: W
```

### Passo 2: Fazer Backup
```bash
npm run migrate:participantes:backup
```
**Resultado esperado:**
```
✅ Backup salvo em: backup_participantes_1234567890.json
```

### Passo 3: Simular Migração
```bash
npm run migrate:participantes:simulate
```
**Resultado esperado:**
```
🔄 SIMULAÇÃO de participantes...
📊 Processando X serviços...
   ✅ Serviço ID: "Gabriel" -> ObjectId
   ✅ Serviço ID: "Samuel" -> ObjectId
   ✅ Serviço ID: "Davi" -> ObjectId

📊 Resumo da simulação:
   • Serviços processados: X
   • Participantes migrados: Y
   • Serviços com erros: 0
```

### Passo 4: Executar Migração Real
```bash
npm run migrate:participantes:migrate
```
**O que acontece:**
1. **Confirmação obrigatória** - você deve digitar 'SIM'
2. **Backup automático** é criado
3. **Migração é executada**
4. **Verificação pós-migração** é feita

## ⚠️ IMPORTANTE - SEGURANÇA

### ✅ O que o script FAZ:
- Converte "Gabriel" → ObjectId do Gabriel
- Converte "Samuel" → ObjectId do Samuel  
- Converte "Davi" → ObjectId do Davi
- **Preserva** todos os outros dados
- **Faz backup** antes de alterar

### ❌ O que o script NÃO FAZ:
- **NÃO remove** nenhum serviço
- **NÃO remove** nenhum participante
- **NÃO altera** dados de clientes, valores, datas
- **NÃO perde** informações

### 🛡️ Proteções de Segurança:
1. **Backup automático** antes de qualquer alteração
2. **Confirmação obrigatória** para migração real
3. **Simulação completa** antes da execução
4. **Validação de dados** em cada etapa
5. **Tratamento de erros** para cada serviço

## 🚨 Cenários de Risco

### Cenário 1: Nome Desconhecido
Se encontrar um participante com nome diferente de Gabriel/Samuel/Davi:
```
⚠️  Serviço ID: nome desconhecido "João" - mantendo
```
**Resultado:** O nome "João" permanece como string (não é alterado)

### Cenário 2: Dados Corrompidos
Se encontrar dados inválidos:
```
⚠️  Serviço ID: participante inválido [null] - mantendo
```
**Resultado:** Dados inválidos são preservados (não são alterados)

### Cenário 3: Erro na Migração
Se houver erro ao processar um serviço:
```
❌ Erro ao processar serviço ID: [detalhes do erro]
```
**Resultado:** O erro é registrado, mas a migração continua com outros serviços

## 🔍 Verificação Pós-Migração

Após a migração, o script verifica automaticamente:
```
🔍 Verificando dados após migração...
📋 Resumo pós-migração:
   • Serviços ainda com strings: 0
   • Total de participantes em string: 0
   • Serviços com ObjectIds: X
   • Total de participantes em ObjectId: Y

🎉 Migração concluída com sucesso! Todos os participantes foram convertidos para ObjectIds.
```

## 📞 Suporte e Solução de Problemas

### Se a migração falhar:
1. **Verifique o backup** criado automaticamente
2. **Execute novamente** `npm run migrate:participantes:check`
3. **Verifique logs** para identificar problemas específicos

### Se precisar reverter:
1. **Use o backup** criado automaticamente
2. **Restore manual** dos dados se necessário
3. **Entre em contato** para suporte técnico

### Logs importantes:
- ✅ **Sucesso**: "Gabriel" -> ObjectId
- ⚠️ **Aviso**: nome desconhecido mantido
- ❌ **Erro**: problema específico registrado

## 🎯 Resultado Esperado

**Antes da migração:**
- Dashboard com erro "Cast to ObjectId failed"
- APIs retornando erro 500
- Participantes como strings no banco

**Depois da migração:**
- Dashboard funcionando perfeitamente
- APIs retornando dados corretos
- Participantes como ObjectIds válidos
- Relacionamentos funcionando corretamente

## 💡 Recomendação Final

1. **Execute sempre** na ordem: check → backup → simulate → migrate
2. **Faça backup manual** adicional se necessário
3. **Teste o sistema** após a migração
4. **Mantenha o arquivo de backup** por segurança

---

**⚠️ LEMBRE-SE: Este script altera dados de produção!**
**✅ Sempre faça backup antes de executar!**
**🔍 Teste em ambiente de desenvolvimento primeiro, se possível!**
