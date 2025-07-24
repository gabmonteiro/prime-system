import {
  createDespesa,
  getDespesas,
  getDespesaById,
  updateDespesa,
  deleteDespesa,
} from "../../../services/despesaService";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const despesa = await getDespesaById(id);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(despesa);
  }
  const despesas = await getDespesas();
  return Response.json(despesas);
}

export async function POST(request) {
  const data = await request.json();
  const despesa = await createDespesa(data);
  return Response.json(despesa);
}

export async function PUT(request) {
  const { id, ...data } = await request.json();
  const despesa = await updateDespesa(id, data);
  if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(despesa);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const despesa = await deleteDespesa(id);
  if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ success: true });
}
