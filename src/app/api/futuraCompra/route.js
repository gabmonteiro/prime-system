import {
  createFuturaCompra,
  getFuturaCompras,
  getFuturaCompraById,
  updateFuturaCompra,
  deleteFuturaCompra,
} from "../../../services/futuraCompraService";
import connectDB from "../../../libs/db";
import { AuditService } from "../../../services/auditService";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const futura = await getFuturaCompraById(id);
      if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(futura);
    }
    const futuras = await getFuturaCompras();
    return Response.json(futuras);
  } catch (error) {
    console.error("Error in GET /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...futuraCompraData } = data;
    
    const futura = await createFuturaCompra(futuraCompraData);
    
    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "CREATE",
        model: "FuturaCompra",
        documentId: futura._id,
        newData: futura,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_futuraCompra" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(futura);
  } catch (error) {
    console.error("Error in POST /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, userId, userName, ...data } = await request.json();
    
    // Buscar dados anteriores para auditoria
    const previousData = await getFuturaCompraById(id);
    
    const futura = await updateFuturaCompra(id, data);
    if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, futura);
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "FuturaCompra",
        documentId: id,
        previousData,
        newData: futura,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_futuraCompra" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(futura);
  } catch (error) {
    console.error("Error in PUT /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id, userId, userName } = await request.json();
    
    // Buscar dados antes da exclusão para auditoria
    const previousData = await getFuturaCompraById(id);
    
    const futura = await deleteFuturaCompra(id);
    if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "DELETE",
        model: "FuturaCompra",
        documentId: id,
        previousData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_futuraCompra" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
