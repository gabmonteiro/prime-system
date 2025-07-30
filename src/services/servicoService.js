import Servico from "../models/servico";

export async function createServico(data) {
  return await Servico.create(data);
}

export async function getServicos() {
  return await Servico.find().populate("tipoServico");
}

export async function getServicoById(id) {
  return await Servico.findById(id).populate("tipoServico");
}

export async function updateServico(id, data) {
  return await Servico.findByIdAndUpdate(id, data, { new: true }).populate(
    "tipoServico",
  );
}

export async function deleteServico(id) {
  return await Servico.findByIdAndDelete(id);
}

export async function getServicosPaginated(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Servico.find()
      .populate("tipoServico")
      .sort({ data: -1 })
      .skip(skip)
      .limit(limit),
    Servico.countDocuments(),
  ]);
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
