// Migração de dados v1 -> v2 do Prime System.
//
//   node scripts/migrate-v2.mjs --dry-run      # simula e mostra o relatório (não grava nada)
//   node scripts/migrate-v2.mjs                # aplica
//
// Opções:
//   --retiradas=banco|dinheiro   conta onde lançar as retiradas antigas (padrão: banco).
//                                Na v1 elas saíam das duas; corrija depois com uma transferência.
//   --saldo-dinheiro=1234.56     saldo REAL de hoje no dinheiro físico (calibra o saldo inicial)
//   --saldo-banco=1234.56        saldo REAL de hoje no banco (calibra o saldo inicial)
//   --conta-dinheiro="Dinheiro físico"  --conta-banco="Banco"   nomes das contas
//
// MONGODB_URI vem do ambiente ou do .env.local.
//
// É IDEMPOTENTE: só mexe no que ainda não foi migrado (serviço sem parcelas, despesa sem conta).
// Nada é apagado nem renomeado.
//
// Regras (definidas a partir dos dados reais da v1):
//  - Serviços antigos ficam como estão: nome do cliente e do carro em texto, SEM criar
//    cadastro de cliente/veículo (o cadastro começa a ser usado a partir da v2).
//  - Na v1, a forma de pagamento era anotada com emoji no nome do cliente/carro:
//      💵 ou 💸  => dinheiro físico          (repetições não têm significado de valor)
//      💳        => cartão (cai no banco)
//      "pix"     => banco
//      "200💸80pix" / "💵30 👾20 pix" => pagamento dividido (2 recebimentos)
//    Sem anotação => banco.
//  - Despesas com "dinheiro"/💵/💸 no nome/descrição => dinheiro físico; demais => banco.
//    "Retirada de dinheiro" vira tipo `retirada` (conta definida por --retiradas).
//  - Valores com lixo de ponto flutuante são arredondados para centavos.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
import mongoose from "mongoose";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);
const DRY = Boolean(args["dry-run"]);
const RETIRADAS = args.retiradas === "dinheiro" ? "dinheiro" : "banco";
const NOME_DINHEIRO = args["conta-dinheiro"] || "Dinheiro físico";
const NOME_BANCO = args["conta-banco"] || "Banco";
const SALDO_REAL = {
  dinheiro:
    args["saldo-dinheiro"] != null ? Number(args["saldo-dinheiro"]) : null,
  banco: args["saldo-banco"] != null ? Number(args["saldo-banco"]) : null,
};
const ObjectId = mongoose.Types.ObjectId;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

// ---------------------------------------------------------------------------
// Leitura da anotação de pagamento
// ---------------------------------------------------------------------------
const RX_CASH = /[\u{1F4B5}\u{1F4B8}]/u; // 💵 💸
const RX_CARD = /\u{1F4B3}/u; // 💳
// Valor só conta quando está COLADO no emoji e não faz parte de uma palavra:
// "200💸" e "💵30" são valores; "Cg 160 💵" e "I30💵" não.
const RX_VALOR_ANTES = /(?<![\p{L}\d])(\d+(?:[.,]\d+)?)[\u{1F4B5}\u{1F4B8}]/u;
const RX_VALOR_DEPOIS = /[\u{1F4B5}\u{1F4B8}](\d+(?:[.,]\d+)?)/u;

/** Retorna [{ conta: "dinheiro"|"banco", valor, origem }]. */
function lerPagamento(texto, total) {
  const t = String(texto || "");
  if (!RX_CASH.test(t)) {
    const origem = RX_CARD.test(t)
      ? "cartao"
      : /pix/i.test(t)
        ? "pix"
        : "padrao";
    return [{ conta: "banco", valor: total, origem }];
  }
  const m = t.match(RX_VALOR_ANTES) || t.match(RX_VALOR_DEPOIS);
  const emDinheiro = m ? round2(Number(m[1].replace(",", "."))) : total;
  if (emDinheiro > 0 && emDinheiro < total) {
    return [
      { conta: "dinheiro", valor: emDinheiro, origem: "dividido" },
      { conta: "banco", valor: round2(total - emDinheiro), origem: "dividido" },
    ];
  }
  return [{ conta: "dinheiro", valor: total, origem: "emoji" }];
}

function normalize(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function parseMoneyBr(text) {
  // "R$ 1.234,567" -> 1234.567 (a v1 às vezes gravava 3 casas)
  const m = String(text).match(/-?\d{1,3}(?:\.\d{3})*,\d+|-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const raw = m[0].includes(",")
    ? m[0].replace(/\./g, "").replace(",", ".")
    : m[0];
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definido");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const now = new Date();
  const log = (...a) => console.log(...a);

  log(
    `\n🚚 Migração v2 em "${db.databaseName}" ${DRY ? "(DRY-RUN: nada será gravado)" : ""}`,
  );
  log(
    `   Retiradas antigas lançadas em: ${RETIRADAS === "banco" ? NOME_BANCO : NOME_DINHEIRO}\n`,
  );

  const servicosCol = db.collection("servicos");
  const despesasCol = db.collection("despesas");
  const contasCol = db.collection("contas");
  const transfCol = db.collection("transferencias");

  const tipos = new Map(
    (await db.collection("tiposervicos").find().toArray()).map((t) => [
      String(t._id),
      t,
    ]),
  );
  const valorV1 = (s) =>
    Number(
      s.valorPersonalizado ||
        (s.tipoServico ? tipos.get(String(s.tipoServico))?.valor : 0) ||
        0,
    );

  // Carteira pela fórmula da v1 (serviços pagos - despesas)
  const todosServicos = await servicosCol.find().toArray();
  const todasDespesas = await despesasCol.find().toArray();
  const carteiraV1 = round2(
    todosServicos.filter((s) => s.pago).reduce((a, s) => a + valorV1(s), 0) -
      todasDespesas.reduce((a, d) => a + (d.valor || 0), 0),
  );
  log(`💰 Saldo da Carteira (fórmula v1): R$ ${carteiraV1.toFixed(2)}`);

  // 1. Contas -------------------------------------------------------------------
  async function garantirConta(nome, tipo) {
    let c = await contasCol.findOne({ nome });
    if (!c) {
      c = {
        _id: new ObjectId(),
        nome,
        tipo,
        saldoInicial: 0,
        ativa: true,
        sistema: false,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      };
      if (!DRY) await contasCol.insertOne(c);
      log(`1. Conta "${nome}" criada`);
    } else {
      log(`1. Conta "${nome}" já existe`);
    }
    return c;
  }
  const contaDinheiro = await garantirConta(NOME_DINHEIRO, "dinheiro");
  const contaBanco = await garantirConta(NOME_BANCO, "banco");
  const contaId = (k) =>
    k === "dinheiro" ? contaDinheiro._id : contaBanco._id;

  // 2. Serviços: valor congelado, parcelas e conta de recebimento ---------------
  const pendentes = todosServicos.filter(
    (s) => !Array.isArray(s.parcelas) || s.parcelas.length === 0,
  );
  const ops = [];
  const rec = { dinheiro: 0, banco: 0 };
  const origens = {
    emoji: 0,
    dividido: 0,
    cartao: 0,
    pix: 0,
    padrao: 0,
    naoPagos: 0,
  };
  const divididos = [];
  for (const s of pendentes) {
    const valorTotal = s.valorTotal ?? round2(valorV1(s));
    const set = { valorTotal, formaPagamento: "avista", pago: s.pago === true };
    if (set.pago) {
      const partes = lerPagamento(`${s.cliente} ${s.nomeCarro}`, valorTotal);
      set.parcelas = partes.map((p, i) => ({
        _id: new ObjectId(),
        numero: i + 1,
        valor: p.valor,
        vencimento: s.data,
        pago: true,
        dataPagamento: s.data,
        conta: contaId(p.conta),
      }));
      partes.forEach((p) => (rec[p.conta] += p.valor));
      origens[partes[0].origem]++;
      if (partes.length > 1) {
        divididos.push(
          `${s.cliente} | ${s.nomeCarro} → ${partes.map((p) => `${p.valor} ${p.conta}`).join(" + ")}`,
        );
      }
    } else {
      set.parcelas = [
        {
          _id: new ObjectId(),
          numero: 1,
          valor: valorTotal,
          vencimento: s.data,
          pago: false,
          dataPagamento: null,
          conta: null,
        },
      ];
      origens.naoPagos++;
    }
    ops.push({ updateOne: { filter: { _id: s._id }, update: { $set: set } } });
  }
  if (!DRY && ops.length) await servicosCol.bulkWrite(ops);
  log(`2. Serviços migrados: ${pendentes.length}`);
  log(
    `   Recebimentos → ${NOME_DINHEIRO}: R$ ${round2(rec.dinheiro).toFixed(2)} | ${NOME_BANCO}: R$ ${round2(rec.banco).toFixed(2)}`,
  );
  log(
    `   dinheiro (emoji): ${origens.emoji} · dividido: ${origens.dividido} · cartão: ${origens.cartao} · pix escrito: ${origens.pix} · sem anotação (banco): ${origens.padrao} · não pagos: ${origens.naoPagos}`,
  );
  divididos.forEach((d) => log(`     ${d}`));

  // 3. Despesas -------------------------------------------------------------------
  const usuarios = await db
    .collection("users")
    .find({}, { projection: { name: 1 } })
    .toArray();
  function acharUsuario(nome) {
    const n = normalize(nome);
    const exato = usuarios.find((u) => normalize(u.name) === n);
    if (exato) return exato._id;
    const mesmoPrimeiroNome = usuarios.filter(
      (u) => normalize(u.name).split(" ")[0] === n.split(" ")[0],
    );
    return mesmoPrimeiroNome.length === 1 ? mesmoPrimeiroNome[0]._id : null;
  }

  const despesas = await despesasCol.find({ conta: { $in: [null] } }).toArray();
  const saida = { dinheiro: 0, banco: 0 };
  let retiradas = 0;
  let arredondadas = 0;
  const despOps = [];
  for (const d of despesas) {
    const set = {};
    const valor = round2(d.valor);
    if (valor !== d.valor) {
      set.valor = valor;
      arredondadas++;
    }
    const ehRetirada =
      d.tipo === "retirada" ||
      /^retirada de dinheiro$/i.test(String(d.nome).trim());
    let k;
    if (ehRetirada) {
      k = RETIRADAS;
      set.tipo = "retirada";
      const distribuicao = [];
      for (const parte of String(d.desc || "")
        .replace(/^Participantes:\s*/i, "")
        .split("|")) {
        const idx = parte.lastIndexOf(":");
        if (idx === -1) continue;
        const nome = parte.slice(0, idx).trim();
        const v = parseMoneyBr(parte.slice(idx + 1));
        if (!nome || v == null || v <= 0) continue;
        distribuicao.push({ user: acharUsuario(nome), nome, valor: round2(v) });
      }
      // Fecha a soma no total (diferença de arredondamento vai para a maior parte)
      const soma = round2(distribuicao.reduce((a, x) => a + x.valor, 0));
      if (distribuicao.length && Math.abs(soma - valor) <= 0.05) {
        const maior = distribuicao.reduce((a, b) =>
          b.valor > a.valor ? b : a,
        );
        maior.valor = round2(maior.valor + (valor - soma));
      }
      set.distribuicao = distribuicao;
      retiradas++;
    } else {
      k = /dinheiro|[\u{1F4B5}\u{1F4B8}]/iu.test(`${d.nome} ${d.desc || ""}`)
        ? "dinheiro"
        : "banco";
    }
    set.conta = contaId(k);
    saida[k] += valor;
    despOps.push({
      updateOne: { filter: { _id: d._id }, update: { $set: set } },
    });
  }
  if (!DRY && despOps.length) await despesasCol.bulkWrite(despOps);
  log(
    `3. Despesas migradas: ${despesas.length} (${retiradas} retiradas, ${arredondadas} valores arredondados)`,
  );
  log(
    `   Saídas → ${NOME_DINHEIRO}: R$ ${round2(saida.dinheiro).toFixed(2)} | ${NOME_BANCO}: R$ ${round2(saida.banco).toFixed(2)}`,
  );

  // 4. Índices ------------------------------------------------------------------
  if (!DRY) {
    await db.collection("clientes").createIndex({ nomeNormalizado: 1 });
    await db.collection("carros").createIndex({ cliente: 1 });
    await servicosCol.createIndex({ clienteRef: 1 });
    await servicosCol.createIndex({ carroRef: 1 });
    await servicosCol.createIndex({ data: -1, createdAt: -1 });
    await servicosCol.createIndex({ "parcelas.dataPagamento": 1 });
  }
  log(`4. Índices ${DRY ? "(seriam criados)" : "criados"}`);

  // 5. Saldos ---------------------------------------------------------------------
  async function soma(col, pipeline) {
    const [r] = await col
      .aggregate([...pipeline, { $group: { _id: null, t: { $sum: "$v" } } }])
      .toArray();
    return r?.t || 0;
  }
  async function movimento(c, k) {
    if (DRY) return round2(rec[k] - saida[k]);
    const id = c._id;
    const entradas = await soma(servicosCol, [
      { $unwind: "$parcelas" },
      { $match: { "parcelas.pago": true, "parcelas.conta": id } },
      { $project: { v: "$parcelas.valor" } },
    ]);
    const saidas = await soma(despesasCol, [
      { $match: { conta: id } },
      { $project: { v: "$valor" } },
    ]);
    const tin = await soma(transfCol, [
      { $match: { contaDestino: id } },
      { $project: { v: "$valor" } },
    ]);
    const tout = await soma(transfCol, [
      { $match: { contaOrigem: id } },
      { $project: { v: "$valor" } },
    ]);
    return round2(entradas - saidas + tin - tout);
  }

  log("\n5. Saldos:");
  let total = 0;
  for (const [c, k] of [
    [contaDinheiro, "dinheiro"],
    [contaBanco, "banco"],
  ]) {
    const mov = await movimento(c, k);
    let inicial = c.saldoInicial || 0;
    if (SALDO_REAL[k] != null && !isNaN(SALDO_REAL[k])) {
      inicial = round2(SALDO_REAL[k] - mov);
      if (!DRY) {
        await contasCol.updateOne(
          { _id: c._id },
          { $set: { saldoInicial: inicial, updatedAt: now } },
        );
      }
      log(
        `   ${c.nome}: saldo real informado → saldo inicial = R$ ${inicial.toFixed(2)}`,
      );
    }
    const saldo = round2(inicial + mov);
    total += saldo;
    log(
      `   ${c.nome.padEnd(16)} movimentos R$ ${mov.toFixed(2).padStart(10)} + inicial R$ ${inicial.toFixed(2).padStart(9)} = R$ ${saldo.toFixed(2)}`,
    );
  }
  log(`   Total: R$ ${round2(total).toFixed(2)}`);
  if (SALDO_REAL.dinheiro == null && SALDO_REAL.banco == null) {
    const ok = Math.abs(round2(total) - carteiraV1) < 0.05;
    log(
      `   ${ok ? "✅ confere com a Carteira da v1" : `⚠️  difere da Carteira da v1 (R$ ${carteiraV1.toFixed(2)})`}`,
    );
  }

  await mongoose.disconnect();
  log(`\n✅ Migração ${DRY ? "simulada" : "aplicada"}.\n`);
}

main().catch(async (err) => {
  console.error("❌ Erro na migração:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
