import TipoServico from "../models/tipoServico";

export async function createTipoServico(data) {
  return await TipoServico.create(data);
}

export async function getTipoServicos() {
  return await TipoServico.find();
}

export async function getTipoServicoById(id) {
  return await TipoServico.findById(id);
}

export async function updateTipoServico(id, data) {
  return await TipoServico.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteTipoServico(id) {
  return await TipoServico.findByIdAndDelete(id);
}
