import {
  createDespesa,
  getDespesas,
  getDespesaById,
  updateDespesa,
  deleteDespesa,
  getDespesasPaginated, // novo import
} from "../../../services/despesaService";
import connectDB from "../../../libs/db";
import { AuditService } from "../../../services/auditService";

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
    
    // Paginação com ordenação fixa
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    const result = await getDespesasPaginated(page, limit);
    return Response.json(result);
  } catch (error) {
    console.error("Error in GET /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...despesaData } = data;
    
    const despesa = await createDespesa(despesaData);
    
    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "CREATE",
        model: "Despesa",
        documentId: despesa._id,
        newData: despesa,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_despesa" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(despesa);
  } catch (error) {
    console.error("Error in POST /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, userId, userName, ...data } = await request.json();
    
    // Buscar dados anteriores para auditoria
    const previousData = await getDespesaById(id);
    
    const despesa = await updateDespesa(id, data);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, despesa);
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "Despesa",
        documentId: id,
        previousData,
        newData: despesa,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_despesa" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(despesa);
  } catch (error) {
    console.error("Error in PUT /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id, userId, userName } = await request.json();
    
    // Buscar dados antes da exclusão para auditoria
    const previousData = await getDespesaById(id);
    
    const despesa = await deleteDespesa(id);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "DELETE",
        model: "Despesa",
        documentId: id,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_despesa" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/despesa:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}