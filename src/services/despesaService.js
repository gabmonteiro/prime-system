import Despesa from "../models/despesa";

export async function createDespesa(data) {
  return await Despesa.create(data);
}

export async function getDespesas() {
  return await Despesa.find();
}

export async function getDespesaById(id) {
  return await Despesa.findById(id);
}

export async function updateDespesa(id, data) {
  return await Despesa.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteDespesa(id) {
  return await Despesa.findByIdAndDelete(id);
}

export async function getDespesasPaginated(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Despesa.find()
      .sort({ data: -1 })
      .skip(skip)
      .limit(limit),
    Despesa.countDocuments(),
  ]);
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
