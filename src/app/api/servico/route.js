import {
  createServico,
  getServicos,
  getServicoById,
  updateServico,
  deleteServico,
  getServicosPaginated, // novo import
} from "../../../services/servicoService";
import connectDB from "../../../libs/db";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const servico = await getServicoById(id);
      if (!servico) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(servico);
    }
    
    // Paginação com ordenação
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt"; // campo padrão para ordenação
    const sortOrder = searchParams.get("sortOrder") || "desc"; // ordem padrão: mais recente primeiro
    
    const result = await getServicosPaginated(page, limit, sortBy, sortOrder);
    return Response.json(result);
  } catch (error) {
    console.error("Error in GET /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const servico = await createServico(data);
    return Response.json(servico);
  } catch (error) {
    console.error("Error in POST /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...data } = await request.json();
    const servico = await updateServico(id, data);
    if (!servico) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(servico);
  } catch (error) {
    console.error("Error in PUT /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    const servico = await deleteServico(id);
    if (!servico) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}