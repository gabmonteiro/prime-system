import FuturaCompra from '../models/futuraCompra';

export async function createFuturaCompra(data) {
  return await FuturaCompra.create(data);
}

export async function getFuturaCompras() {
  return await FuturaCompra.find();
}

export async function getFuturaCompraById(id) {
  return await FuturaCompra.findById(id);
}

export async function updateFuturaCompra(id, data) {
  return await FuturaCompra.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteFuturaCompra(id) {
  return await FuturaCompra.findByIdAndDelete(id);
}
