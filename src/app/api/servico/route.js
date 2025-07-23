import { createServico, getServicos, getServicoById, updateServico, deleteServico } from '../../../services/servicoService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const servico = await getServicoById(id);
    if (!servico) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(servico);
  }
  const servicos = await getServicos();
  return Response.json(servicos);
}

export async function POST(request) {
  const data = await request.json();
  const servico = await createServico(data);
  return Response.json(servico);
}

export async function PUT(request) {
  const { id, ...data } = await request.json();
  const servico = await updateServico(id, data);
  if (!servico) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(servico);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const servico = await deleteServico(id);
  if (!servico) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
