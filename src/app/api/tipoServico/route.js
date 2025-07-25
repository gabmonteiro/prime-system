import {
  createTipoServico,
  getTipoServicos,
  getTipoServicoById,
  updateTipoServico,
  deleteTipoServico,
} from "../../../services/tipoServicoService";
import connectDB from "../../../libs/db";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const tipoServico = await getTipoServicoById(id);
      if (!tipoServico)
        return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(tipoServico);
    }
    const tipoServicos = await getTipoServicos();
    // Garantir que sempre retorna um array
    const result = Array.isArray(tipoServicos) ? tipoServicos : [];
    return Response.json(result);
  } catch (error) {
    console.error("Error in GET /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const tipoServico = await createTipoServico(data);
    return Response.json(tipoServico);
  } catch (error) {
    console.error("Error in POST /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...data } = await request.json();
    const tipoServico = await updateTipoServico(id, data);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(tipoServico);
  } catch (error) {
    console.error("Error in PUT /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    const tipoServico = await deleteTipoServico(id);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
