import { createTipoServico, getTipoServicos, getTipoServicoById, updateTipoServico, deleteTipoServico } from '../../../services/tipoServicoService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const tipoServico = await getTipoServicoById(id);
    if (!tipoServico) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(tipoServico);
  }
  const tipoServicos = await getTipoServicos();
  return Response.json(tipoServicos);
}

export async function POST(request) {
  const data = await request.json();
  const tipoServico = await createTipoServico(data);
  return Response.json(tipoServico);
}

export async function PUT(request) {
  const { id, ...data } = await request.json();
  const tipoServico = await updateTipoServico(id, data);
  if (!tipoServico) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(tipoServico);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const tipoServico = await deleteTipoServico(id);
  if (!tipoServico) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
