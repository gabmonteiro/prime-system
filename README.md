# Prime System

Gestão da Prime Auto Care: serviços (com parcelamento), clientes e veículos, despesas,
contas, lista de compras, divisão entre sócios e auditoria.

Next.js 16 (App Router) + MongoDB (Mongoose) + Tailwind.

## Rodar local

```bash
cp .env.example .env.local     # preencha MONGODB_URI e SESSION_SECRET
npm install
npm run seed                   # admin@prime.com / admin123
# ou, para dados de exemplo no formato da v1 (testar migração):
npm run seed -- --legacy-demo && npm run migrate
npm run dev
```

## Estrutura

- `src/app/api/*/route.js`: rotas, todas via `route()` de `src/libs/api.js` (sessão + permissão + erros + auditoria)
- `src/services/`: regras de negócio (parcelas, saldos, dashboard...)
- `src/models/`: schemas Mongoose
- `src/libs/permissions.js`: fonte única de perfis e permissões
- `src/libs/dates.js`: datas e mês fiscal
- `src/proxy.js`: exige sessão em `/dashboard` e `/api`
- `scripts/migrate-v2.mjs`: migração de dados v1 → v2 (ver `docs/DEPLOY-V2.md`)
