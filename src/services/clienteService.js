import Cliente, { normalizeName } from "../models/cliente.js";
import Carro from "../models/carro.js";
import Servico from "../models/servico.js";
import { badRequest, escapeRegex, notFound, toObjectId } from "../libs/api.js";
import { round2 } from "../libs/money.js";

/**
 * Resolve cliente e carro de um payload de serviço:
 * - clienteId ou clienteNome (busca pelo nome normalizado ou cria)
 * - carroId ou carroModelo (+ carroPlaca) (busca no cliente ou cria)
 */
export async function resolveClienteECarro(data) {
  let cliente = null;
  if (data.clienteId) {
    cliente = await Cliente.findById(toObjectId(data.clienteId, "Cliente"));
    if (!cliente) throw badRequest("Cliente não encontrado");
  } else if (data.clienteNome?.trim()) {
    const nomeNormalizado = normalizeName(data.clienteNome);
    cliente =
      (await Cliente.findOne({ nomeNormalizado })) ||
      (await Cliente.create({
        nome: data.clienteNome.trim(),
        telefone: data.clienteTelefone?.trim() || undefined,
      }));
  } else {
    throw badRequest("Informe o cliente");
  }

  let carro = null;
  if (data.carroId) {
    carro = await Carro.findById(toObjectId(data.carroId, "Veículo"));
    if (!carro) throw badRequest("Veículo não encontrado");
    if (String(carro.cliente) !== String(cliente._id)) {
      throw badRequest("O veículo selecionado não pertence a este cliente");
    }
  } else if (data.carroModelo?.trim()) {
    const placa = data.carroPlaca?.trim().toUpperCase() || undefined;
    const modeloNormalizado = normalizeName(data.carroModelo);
    carro =
      (placa && (await Carro.findOne({ cliente: cliente._id, placa }))) ||
      (await Carro.findOne({
        cliente: cliente._id,
        modeloNormalizado,
        ...(placa ? { $or: [{ placa: null }, { placa: "" }, { placa }] } : {}),
      })) ||
      (await Carro.create({
        cliente: cliente._id,
        modelo: data.carroModelo.trim(),
        placa,
      }));
    if (placa && !carro.placa) {
      carro.placa = placa;
      await carro.save();
    }
  } else {
    throw badRequest("Informe o veículo");
  }

  return { cliente, carro };
}

// Estatísticas de serviços por cliente/carro
function statsPipeline(field) {
  return [
    { $match: { [field]: { $ne: null } } },
    {
      $group: {
        _id: `$${field}`,
        servicos: { $sum: 1 },
        valorTotal: {
          $sum: {
            $ifNull: ["$valorTotal", { $ifNull: ["$valorPersonalizado", 0] }],
          },
        },
        ultimoServico: { $max: "$data" },
        pendentes: { $sum: { $cond: ["$pago", 0, 1] } },
      },
    },
  ];
}

export async function listClientes({ q, page, limit, skip }) {
  const match = {};
  if (q?.trim()) {
    const rx = new RegExp(escapeRegex(normalizeName(q)), "i");
    // Também busca pela placa/modelo dos carros
    const carros = await Carro.find(
      {
        $or: [
          { modeloNormalizado: rx },
          { placa: new RegExp(escapeRegex(q.trim()), "i") },
        ],
      },
      { cliente: 1 },
    ).lean();
    match.$or = [
      { nomeNormalizado: rx },
      { telefone: new RegExp(escapeRegex(q.trim()), "i") },
      { _id: { $in: carros.map((c) => c.cliente) } },
    ];
  }

  const [clientes, total, totalGeral] = await Promise.all([
    Cliente.find(match).sort({ nome: 1 }).skip(skip).limit(limit).lean(),
    Cliente.countDocuments(match),
    Cliente.countDocuments({}),
  ]);

  const ids = clientes.map((c) => c._id);
  const [stats, carros] = await Promise.all([
    Servico.aggregate([
      { $match: { clienteRef: { $in: ids } } },
      ...statsPipeline("clienteRef"),
    ]),
    Carro.find({ cliente: { $in: ids } })
      .sort({ modelo: 1 })
      .lean(),
  ]);
  const statsById = new Map(stats.map((s) => [String(s._id), s]));

  const data = clientes.map((c) => {
    const s = statsById.get(String(c._id));
    return {
      ...c,
      carros: carros.filter((car) => String(car.cliente) === String(c._id)),
      servicos: s?.servicos || 0,
      valorTotal: round2(s?.valorTotal || 0),
      ultimoServico: s?.ultimoServico || null,
      pendentes: s?.pendentes || 0,
    };
  });

  const [geral] = await Servico.aggregate([
    { $match: { clienteRef: { $ne: null } } },
    {
      $group: {
        _id: null,
        servicos: { $sum: 1 },
        valorTotal: {
          $sum: {
            $ifNull: ["$valorTotal", { $ifNull: ["$valorPersonalizado", 0] }],
          },
        },
      },
    },
  ]);
  const totalCarros = await Carro.countDocuments({});

  return {
    data,
    total,
    stats: {
      clientes: totalGeral,
      carros: totalCarros,
      servicos: geral?.servicos || 0,
      ticketMedioCliente: totalGeral
        ? round2((geral?.valorTotal || 0) / totalGeral)
        : 0,
    },
  };
}

/** Busca rápida para o autocomplete do formulário de serviço. */
export async function searchClientes(q, limit = 8) {
  const filter = q?.trim()
    ? { nomeNormalizado: new RegExp(escapeRegex(normalizeName(q)), "i") }
    : {};
  const clientes = await Cliente.find(filter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  const carros = await Carro.find({
    cliente: { $in: clientes.map((c) => c._id) },
  })
    .sort({ modelo: 1 })
    .lean();
  return clientes.map((c) => ({
    ...c,
    carros: carros.filter((car) => String(car.cliente) === String(c._id)),
  }));
}

export async function getClienteDetalhe(id) {
  const _id = toObjectId(id, "Cliente");
  const cliente = await Cliente.findById(_id).lean();
  if (!cliente) throw notFound("Cliente não encontrado");

  const [carros, carroStats, servicos] = await Promise.all([
    Carro.find({ cliente: _id }).sort({ modelo: 1 }).lean(),
    Servico.aggregate([
      { $match: { clienteRef: _id } },
      ...statsPipeline("carroRef"),
    ]),
    Servico.find({ clienteRef: _id })
      .sort({ data: -1, createdAt: -1 })
      .populate([
        { path: "tipoServico", select: "nome valor" },
        { path: "participantes", select: "name" },
        { path: "parcelas.conta", select: "nome" },
        { path: "carroRef", select: "modelo placa" },
      ])
      .lean(),
  ]);

  const statsById = new Map(carroStats.map((s) => [String(s._id), s]));
  const valorTotal = servicos.reduce(
    (acc, s) => acc + (s.valorTotal ?? s.valorPersonalizado ?? 0),
    0,
  );
  const recebido = servicos.reduce(
    (acc, s) =>
      acc + (s.parcelas || []).reduce((a, p) => a + (p.pago ? p.valor : 0), 0),
    0,
  );

  return {
    cliente,
    carros: carros.map((c) => {
      const s = statsById.get(String(c._id));
      return {
        ...c,
        servicos: s?.servicos || 0,
        valorTotal: round2(s?.valorTotal || 0),
        ultimoServico: s?.ultimoServico || null,
      };
    }),
    servicos,
    stats: {
      servicos: servicos.length,
      valorTotal: round2(valorTotal),
      recebido: round2(recebido),
      aReceber: round2(valorTotal - recebido),
      ticketMedio: servicos.length ? round2(valorTotal / servicos.length) : 0,
      primeiroServico: servicos.at(-1)?.data || null,
      ultimoServico: servicos[0]?.data || null,
    },
  };
}

export async function createCliente(data) {
  if (!data.nome?.trim()) throw badRequest("Nome é obrigatório");
  const existente = await Cliente.findOne({
    nomeNormalizado: normalizeName(data.nome),
  });
  if (existente) throw badRequest("Já existe um cliente com este nome");
  return Cliente.create({
    nome: data.nome.trim(),
    telefone: data.telefone?.trim(),
    obs: data.obs?.trim(),
  });
}

export async function updateCliente(id, data) {
  const cliente = await Cliente.findById(toObjectId(id, "Cliente"));
  if (!cliente) throw notFound("Cliente não encontrado");
  const previous = cliente.toObject();
  if (data.nome !== undefined) {
    if (!data.nome.trim()) throw badRequest("Nome é obrigatório");
    const dup = await Cliente.findOne({
      nomeNormalizado: normalizeName(data.nome),
      _id: { $ne: cliente._id },
    });
    if (dup) throw badRequest("Já existe um cliente com este nome");
    cliente.nome = data.nome.trim();
  }
  if (data.telefone !== undefined) cliente.telefone = data.telefone.trim();
  if (data.obs !== undefined) cliente.obs = data.obs.trim();
  await cliente.save();
  // Mantém o nome exibido nos serviços sincronizado
  if (previous.nome !== cliente.nome) {
    await Servico.updateMany(
      { clienteRef: cliente._id },
      { $set: { cliente: cliente.nome } },
    );
  }
  return { previous, cliente: cliente.toObject() };
}

export async function deleteCliente(id) {
  const _id = toObjectId(id, "Cliente");
  const count = await Servico.countDocuments({ clienteRef: _id });
  if (count > 0) {
    throw badRequest(
      `Este cliente tem ${count} serviço(s). Mescle com outro cliente ou exclua os serviços antes.`,
    );
  }
  const cliente = await Cliente.findByIdAndDelete(_id);
  if (!cliente) throw notFound("Cliente não encontrado");
  await Carro.deleteMany({ cliente: _id });
  return cliente;
}

/** Junta o cliente `fromId` dentro de `toId` (carros e serviços são movidos). */
export async function mergeClientes(fromId, toId) {
  const from = await Cliente.findById(toObjectId(fromId, "Cliente de origem"));
  const to = await Cliente.findById(toObjectId(toId, "Cliente de destino"));
  if (!from || !to) throw notFound("Cliente não encontrado");
  if (String(from._id) === String(to._id)) {
    throw badRequest("Selecione clientes diferentes");
  }
  const carros = await Carro.updateMany(
    { cliente: from._id },
    { $set: { cliente: to._id } },
  );
  const servicos = await Servico.updateMany(
    { clienteRef: from._id },
    { $set: { clienteRef: to._id, cliente: to.nome } },
  );
  await Cliente.deleteOne({ _id: from._id });
  return {
    from: from.toObject(),
    to: to.toObject(),
    carrosMovidos: carros.modifiedCount,
    servicosMovidos: servicos.modifiedCount,
  };
}

// ---------------------------------------------------------------------------
// Carros
// ---------------------------------------------------------------------------

export async function createCarro(data) {
  const clienteId = toObjectId(data.cliente, "Cliente");
  if (!(await Cliente.exists({ _id: clienteId }))) {
    throw badRequest("Cliente não encontrado");
  }
  if (!data.modelo?.trim()) throw badRequest("Modelo é obrigatório");
  return Carro.create({
    cliente: clienteId,
    modelo: data.modelo.trim(),
    placa: data.placa?.trim() || undefined,
    cor: data.cor?.trim() || undefined,
    obs: data.obs?.trim() || undefined,
  });
}

export async function updateCarro(id, data) {
  const carro = await Carro.findById(toObjectId(id, "Veículo"));
  if (!carro) throw notFound("Veículo não encontrado");
  const previous = carro.toObject();
  for (const f of ["modelo", "placa", "cor", "obs"]) {
    if (data[f] !== undefined) carro[f] = data[f]?.trim() || undefined;
  }
  if (!carro.modelo) throw badRequest("Modelo é obrigatório");
  await carro.save();
  if (previous.modelo !== carro.modelo) {
    await Servico.updateMany(
      { carroRef: carro._id },
      { $set: { nomeCarro: carro.modelo } },
    );
  }
  return { previous, carro: carro.toObject() };
}

export async function deleteCarro(id) {
  const _id = toObjectId(id, "Veículo");
  const count = await Servico.countDocuments({ carroRef: _id });
  if (count > 0) {
    throw badRequest(
      `Este veículo tem ${count} serviço(s). Mescle com outro veículo antes de excluir.`,
    );
  }
  const carro = await Carro.findByIdAndDelete(_id);
  if (!carro) throw notFound("Veículo não encontrado");
  return carro;
}

/** Junta o carro `fromId` dentro de `toId` (precisam ser do mesmo cliente). */
export async function mergeCarros(fromId, toId) {
  const from = await Carro.findById(toObjectId(fromId, "Veículo de origem"));
  const to = await Carro.findById(toObjectId(toId, "Veículo de destino"));
  if (!from || !to) throw notFound("Veículo não encontrado");
  if (String(from._id) === String(to._id)) {
    throw badRequest("Selecione veículos diferentes");
  }
  if (String(from.cliente) !== String(to.cliente)) {
    throw badRequest("Os veículos precisam ser do mesmo cliente");
  }
  const servicos = await Servico.updateMany(
    { carroRef: from._id },
    { $set: { carroRef: to._id, nomeCarro: to.modelo } },
  );
  if (!to.placa && from.placa) {
    to.placa = from.placa;
    await to.save();
  }
  await Carro.deleteOne({ _id: from._id });
  return {
    from: from.toObject(),
    to: to.toObject(),
    servicosMovidos: servicos.modifiedCount,
  };
}
