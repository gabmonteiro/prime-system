import { AuditService } from "../../../services/auditService";
import connectDB from "../../../libs/db";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Verificar se é uma busca por ID específico
    const id = searchParams.get("id");
    if (id) {
      const auditLog = await AuditService.getAuditLogById(id);
      if (!auditLog) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(auditLog);
    }
    
    // Verificar se é uma busca por documento específico
    const model = searchParams.get("model");
    const documentId = searchParams.get("documentId");
    if (model && documentId) {
      const auditLogs = await AuditService.getAuditLogsByDocument(model, documentId);
      return Response.json(auditLogs);
    }
    
    // Verificar se é uma busca por usuário específico
    const userId = searchParams.get("userId");
    if (userId) {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const result = await AuditService.getAuditLogsByUser(userId, page, limit);
      return Response.json(result);
    }
    
    // Busca geral com filtros e paginação
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    // Construir filtros
    const filters = {};
    if (searchParams.get("action")) filters.action = searchParams.get("action");
    if (searchParams.get("model")) filters.model = searchParams.get("model");
    if (searchParams.get("status")) filters.status = searchParams.get("status");
    if (searchParams.get("startDate")) filters.startDate = searchParams.get("startDate");
    if (searchParams.get("endDate")) filters.endDate = searchParams.get("endDate");
    
    const result = await AuditService.getAuditLogs(filters, page, limit);
    return Response.json(result);
  } catch (error) {
    console.error("Error in GET /api/audit:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Teste simples para verificar se o modelo está funcionando
    console.log("POST /api/audit - Dados recebidos:", data);
    
    // Teste básico de criação do modelo
    try {
      console.log("Testando criação do modelo AuditLog...");
      
      // Apenas admins podem criar logs de auditoria manualmente
      // Esta rota é principalmente para testes ou logs externos
      const auditLog = await AuditService.createLog(data);
      
      console.log("Log de auditoria criado:", auditLog);
      
      if (auditLog) {
        return Response.json(auditLog, { status: 201 });
      } else {
        return Response.json({ error: "Falha ao criar log de auditoria" }, { status: 500 });
      }
      
    } catch (auditError) {
      console.error("Erro detalhado na criação do log:", auditError);
      return Response.json({ 
        error: "Erro ao criar log de auditoria", 
        details: auditError.message 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error in POST /api/audit:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get("daysToKeep") || "365", 10);
    
    // Apenas admins podem limpar logs
    const result = await AuditService.cleanupOldLogs(daysToKeep);
    return Response.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Logs mais antigos que ${daysToKeep} dias foram removidos`
    });
  } catch (error) {
    console.error("Error in DELETE /api/audit:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
