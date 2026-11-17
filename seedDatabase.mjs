// Seed do banco de dados.
//
//   npm run seed                 -> cria admin e configuração padrão (banco novo)
//   npm run seed -- --legacy-demo -> também gera dados de exemplo NO FORMATO DA v1
//                                   (para testar a migração v2 localmente)
//
// Usa MONGODB_URI do .env.local.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DEFAULT_ADMIN = {
  name: "Administrador",
  email: "admin@prime.com",
  password: "admin123",
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definido");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed não deve rodar em produção");
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`🌱 Seed em ${db.databaseName}`);

  const users = db.collection("users");
  let admin = await users.findOne({ email: DEFAULT_ADMIN.email });
  if (!admin) {
    const { insertedId } = await users.insertOne({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: await bcrypt.hash(DEFAULT_ADMIN.password, 10),
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    admin = { _id: insertedId };
    console.log(
      `✅ Admin criado: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`,
    );
  } else {
    console.log("ℹ️  Admin já existe");
  }

  await db.collection("systemconfigs").updateOne(
    { key: "fiscalMonthStart" },
    {
      $setOnInsert: {
        key: "fiscalMonthStart",
        value: 17,
        description: "Dia de início do mês fiscal (1-31)",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (process.argv.includes("--legacy-demo")) {
    await legacyDemo(db, admin._id);
  }

  await mongoose.disconnect();
  console.log("🎉 Seed concluído");
}

// ---------------------------------------------------------------------------
// Dados de exemplo no formato da v1 (sem parcelas, sem clienteRef, sem conta)
// ---------------------------------------------------------------------------
async function legacyDemo(db, adminId) {
  if ((await db.collection("servicos").countDocuments()) > 0) {
    console.log("ℹ️  Já existem serviços; dados de demo não foram gerados");
    return;
  }
  console.log("🧪 Gerando dados de demonstração (formato v1)...");
  const now = new Date();
  const hash = await bcrypt.hash("socio123", 10);

  const socios = [
    { name: "Gabriel", email: "gabriel@prime.com" },
    { name: "Murilo", email: "murilo@prime.com" },
  ];
  const socioIds = [adminId];
  for (const s of socios) {
    const exists = await db.collection("users").findOne({ email: s.email });
    if (exists) {
      socioIds.push(exists._id);
      continue;
    }
    const { insertedId } = await db.collection("users").insertOne({
      ...s,
      password: hash,
      role: "gerente",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    socioIds.push(insertedId);
  }

  const tiposData = [
    { nome: "Lavagem Simples", valor: 50 },
    { nome: "Lavagem Completa", valor: 90 },
    { nome: "Polimento", valor: 350 },
    { nome: "Higienização Interna", valor: 250 },
    { nome: "Vitrificação", valor: 1200 },
  ];
  const { insertedIds } = await db
    .collection("tiposervicos")
    .insertMany(
      tiposData.map((t) => ({ ...t, createdAt: now, updatedAt: now })),
    );
  const tipos = tiposData.map((t, i) => ({ ...t, _id: insertedIds[i] }));

  // Nomes com variações de maiúsculas/espaços/acentos, como digitado à mão na v1
  const clientes = [
    ["João Silva", ["Gol", "gol "]],
    ["joao silva", ["Gol"]],
    ["Maria Souza", ["Onix", "HB20"]],
    ["Pedro  Alves", ["Civic"]],
    ["Ana Lima", ["Corolla"]],
    ["Carlos Pereira", ["Hilux", "S10"]],
    ["Fernanda Costa", ["Kicks"]],
  ];

  const rnd = (n) => Math.floor(Math.random() * n);
  const servicos = [];
  for (let i = 0; i < 70; i++) {
    const [cliente, carros] = clientes[rnd(clientes.length)];
    const tipo = tipos[rnd(tipos.length)];
    const diasAtras = rnd(180);
    // v1 gravava a data como meia-noite local (Brasília) => 03:00Z
    const d = new Date(now.getTime() - diasAtras * 864e5);
    const data = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3),
    );
    const semTipo = rnd(10) === 0;
    const participantes = [socioIds[1 + rnd(2)]];
    if (rnd(3) === 0) participantes.push(socioIds[1 + rnd(2)]);
    servicos.push({
      cliente,
      nomeCarro: carros[rnd(carros.length)],
      semTipo,
      tipoServico: semTipo ? null : tipo._id,
      valorPersonalizado: semTipo
        ? 150 + rnd(300)
        : rnd(5) === 0
          ? tipo.valor + 30
          : null,
      data,
      participantes: [...new Set(participantes.map(String))].map(
        (id) => new mongoose.Types.ObjectId(id),
      ),
      pago: diasAtras > 10 ? rnd(8) !== 0 : rnd(2) === 0,
      createdAt: data,
      updatedAt: data,
      __v: 0,
    });
  }
  await db.collection("servicos").insertMany(servicos);

  const despesas = [];
  for (let i = 0; i < 25; i++) {
    const diasAtras = rnd(180);
    const d = new Date(now.getTime() - diasAtras * 864e5);
    despesas.push({
      nome: ["Shampoo automotivo", "Cera", "Energia", "Aluguel", "Microfibras"][
        rnd(5)
      ],
      valor: 30 + rnd(400),
      desc: "",
      data: new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3),
      ),
      tipo: rnd(2) ? "compra" : "gasto",
      createdAt: d,
      updatedAt: d,
    });
  }
  despesas.push({
    nome: "Retirada de dinheiro",
    valor: 1000,
    desc: "Participantes: Gabriel: R$ 600,00 | Murilo: R$ 400,00",
    data: new Date(now.getTime() - 40 * 864e5),
    tipo: "gasto",
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("despesas").insertMany(despesas);

  await db.collection("futuracompras").insertMany([
    {
      nome: "Politriz nova",
      valor: 800,
      urgencia: "medio",
      createdAt: now,
      updatedAt: now,
    },
    {
      nome: "Shampoo 5L",
      valor: 120,
      urgencia: "alto",
      createdAt: now,
      updatedAt: now,
    },
    { nome: "Aspirador", urgencia: "baixo", createdAt: now, updatedAt: now },
  ]);

  console.log(
    `✅ Demo v1: ${servicos.length} serviços, ${despesas.length} despesas, sócios com senha socio123`,
  );
}

main().catch(async (err) => {
  console.error("❌ Erro no seed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
