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
