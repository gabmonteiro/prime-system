import {
  createDespesa,
  getDespesas,
  getDespesaById,
  updateDespesa,
  deleteDespesa,
} from "../../../services/despesaService";
import connectDB from "../../../libs/db";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const despesa = await getDespesaById(id);
      if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(despesa);
    }
    const despesas = await getDespesas();
    return Response.json(despesas);
  } catch (error) {
    console.error("Error in GET /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const despesa = await createDespesa(data);
    return Response.json(despesa);
  } catch (error) {
    console.error("Error in POST /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...data } = await request.json();
    const despesa = await updateDespesa(id, data);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(despesa);
  } catch (error) {
    console.error("Error in PUT /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    const despesa = await deleteDespesa(id);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
