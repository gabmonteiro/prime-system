import {
  createTipoServico,
  getTipoServicos,
  getTipoServicoById,
  updateTipoServico,
  deleteTipoServico,
} from "../../../services/tipoServicoService";
import connectDB from "../../../libs/db";
import { AuditService } from "../../../services/auditService";

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
    
    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...tipoServicoData } = data;
    
    const tipoServico = await createTipoServico(tipoServicoData);
    
    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "CREATE",
        model: "TipoServico",
        documentId: tipoServico._id,
        newData: tipoServico,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_tipoServico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(tipoServico);
  } catch (error) {
    console.error("Error in POST /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, userId, userName, ...data } = await request.json();
    
    // Buscar dados anteriores para auditoria
    const previousData = await getTipoServicoById(id);
    
    const tipoServico = await updateTipoServico(id, data);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, tipoServico);
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "TipoServico",
        documentId: id,
        previousData,
        newData: tipoServico,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_tipoServico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(tipoServico);
  } catch (error) {
    console.error("Error in PUT /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id, userId, userName } = await request.json();
    
    // Buscar dados antes da exclusão para auditoria
    const previousData = await getTipoServicoById(id);
    
    const tipoServico = await deleteTipoServico(id);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "DELETE",
        model: "TipoServico",
        documentId: id,
        previousData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_tipoServico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tipoServico:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
