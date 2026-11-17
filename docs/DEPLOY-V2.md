# Plano de deploy da v2 em produção

> Rascunho, para revisar juntos depois dos testes locais.

## O que muda no banco

A migração (`scripts/migrate-v2.mjs`) só **adiciona** campos. Ela não apaga nem renomeia nada e é
**idempotente**: pode rodar várias vezes.

| Coleção | O que acontece |
|---|---|
| `contas` (nova) | Cria **Dinheiro físico** e **Banco** |
| `servicos` | Ganham `valorTotal` e `parcelas` (os pagos viram recebimento na data do serviço, na conta indicada pela anotação). **Nome do cliente e do carro ficam exatamente como estão** |
| `despesas` | Ganham `conta`; "Retirada de dinheiro" vira tipo `retirada`, com a divisão por sócio; valores arredondados aos centavos |
| `clientes`, `carros` | **Começam vazias.** O cadastro passa a ser usado pelos operadores a partir da v2 |
| `roles` | Não é mais usada e pode ser removida depois |

### Regras tiradas dos dados reais da v1 (dump de 16/11/2026)

- **Forma de pagamento anotada com emoji** no nome do cliente/carro:
  💵/💸 = dinheiro físico · 💳 = cartão (banco) · "pix" = banco · sem anotação = banco.
  Pagamento dividido ("200💸80pix", "💵30 👾20 pix") vira 2 recebimentos, um em cada conta.
- **Despesas** com "dinheiro"/💵/💸 saem do Dinheiro físico; as demais saem do Banco.
- **Retiradas** saíam das duas contas, sem registro de quanto de cada uma. Todas são lançadas em uma conta
  (`--retiradas=banco` por padrão) e a diferença se corrige depois com uma transferência.

### Serviços antigos na v2

- Aparecem com o nome em texto (sem link para cadastro). A busca por cliente/carro funciona normalmente.
- Editar um serviço antigo **não cria cadastro**. O vínculo só acontece se o operador escolher um cliente no formulário.
- Em "Melhores clientes", no dashboard, os nomes antigos são agrupados ignorando emojis e acentos
  ("Vava" e "Vava 💸" contam juntos), e o genérico "Cliente" fica de fora.

### Resultado no ensaio com o dump de produção

- 802 serviços e 107 despesas migrados; nenhum nome alterado
- Recebimentos: Dinheiro físico R$ 3.530,00 · Banco R$ 42.769,14
- Saldo total R$ 2.905,32: **igual** à Carteira da v1
- A divisão entre sócios de ago/set reproduz exatamente as retiradas feitas na v1

> O saldo **por conta** calculado pelo histórico não é real (não havia anotação antes de set/2025 e os
> depósitos do caixa não eram registrados). Depois do deploy, corrija com uma **transferência** entre as
> contas, ou em Contas → Editar → "Saldo real hoje". Outra opção é passar `--saldo-dinheiro` / `--saldo-banco` na migração.

## 1. Ensaio (já feito com o dump de 16/11)

```bash
docker cp dump/prime-system <container-mongo>:/tmp/prime-dump
docker exec <container-mongo> mongorestore --dir=/tmp/prime-dump --db=prime-prod-test
MONGODB_URI=mongodb://localhost:27017/prime-prod-test node scripts/migrate-v2.mjs --dry-run
```

## 2. Preparar produção

1. Criar a variável **`SESSION_SECRET`** no ambiente de prod (ex: Vercel → Settings → Environment Variables):
   `openssl rand -base64 48`
2. Backup completo: snapshot do Atlas ou `mongodump`.

## 3. Janela de deploy (~10 min, avisar os sócios)

1. Pedir para ninguém lançar nada durante a janela.
2. Fazer o merge da branch `v2` e deploy.
3. Rodar a migração apontando para prod (primeiro com `--dry-run`, depois sem):
   ```bash
   MONGODB_URI="<prod>" node scripts/migrate-v2.mjs
   ```
4. Rodar **mais uma vez**. Se algo foi lançado pela v1 durante o deploy, essa segunda execução pega.
5. Testar: login, dashboard, criar e pagar um serviço de teste e excluí-lo.

> Todos vão precisar fazer login de novo: a sessão agora é um cookie assinado e o cookie antigo é descartado.

## 4. Depois do deploy

1. **Contas:** acertar os saldos com uma transferência entre Dinheiro físico e Banco (ou Editar → "Saldo real hoje").
2. **Operadores:** a partir de agora, todo serviço novo usa o cadastro de cliente e veículo.
3. Opcional, depois de algumas semanas: remover a coleção `roles`.

## Rollback

- Como a migração só adiciona campos, o código da v1 continua lendo o banco migrado. Para voltar, basta
  redeployar o commit `7bacebd` (o login antigo volta a funcionar).
  A única ressalva: na v1 não dá para editar uma despesa do tipo `retirada`.
- Se for preciso voltar o banco exatamente ao estado anterior: `mongorestore --drop` do backup do passo 2.
  Nesse caso perde-se o que foi lançado depois.
