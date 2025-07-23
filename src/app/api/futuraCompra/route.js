import { createFuturaCompra, getFuturaCompras, getFuturaCompraById, updateFuturaCompra, deleteFuturaCompra } from '../../../services/futuraCompraService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const futura = await getFuturaCompraById(id);
    if (!futura) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(futura);
  }
  const futuras = await getFuturaCompras();
  return Response.json(futuras);
}

export async function POST(request) {
  const data = await request.json();
  const futura = await createFuturaCompra(data);
  return Response.json(futura);
}

export async function PUT(request) {
  const { id, ...data } = await request.json();
  const futura = await updateFuturaCompra(id, data);
  if (!futura) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(futura);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const futura = await deleteFuturaCompra(id);
  if (!futura) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
