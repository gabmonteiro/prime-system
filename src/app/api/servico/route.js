import {
  createServico,
  getServicos,
  getServicoById,
  updateServico,
  deleteServico,
  getServicosPaginated, // novo import
} from "../../../services/servicoService";
import connectDB from "../../../libs/db";
import { AuditService } from "../../../services/auditService";

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
    
    // Paginação com ordenação fixa
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    const result = await getServicosPaginated(page, limit);
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
    
    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...servicoData } = data;
    
    console.log("POST /api/servico - Dados recebidos:", { userId, userName, servicoData });
    
    // Limpar campos baseado no campo semTipo
    if (servicoData.semTipo) {
      // Se sem tipo, remover tipoServico e garantir valorPersonalizado
      delete servicoData.tipoServico;
      if (!servicoData.valorPersonalizado) {
        return Response.json({ 
          error: "Valor personalizado é obrigatório quando não há tipo de serviço" 
        }, { status: 400 });
      }
    } else {
      // Se com tipo, garantir tipoServico
      if (!servicoData.tipoServico) {
        return Response.json({ 
          error: "Tipo de serviço é obrigatório quando não é marcado como 'sem tipo'" 
        }, { status: 400 });
      }
    }
    
    const servico = await createServico(servicoData);
    
    console.log("Serviço criado com sucesso:", servico._id);
    
    // Log de auditoria para criação
    try {
      console.log("Tentando criar log de auditoria...");
      const auditData = {
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "CREATE",
        model: "Servico",
        documentId: servico._id,
        newData: servico,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_servico" },
      };
      
      console.log("Dados de auditoria:", auditData);
      
      const auditResult = await AuditService.createLog(auditData);
      console.log("Log de auditoria criado:", auditResult);
      
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(servico);
  } catch (error) {
    console.error("Error in POST /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, userId, userName, ...data } = await request.json();
    
    // Buscar dados anteriores para auditoria
    const previousData = await getServicoById(id);
    
    // Limpar campos baseado no campo semTipo
    if (data.semTipo) {
      // Se sem tipo, remover tipoServico e garantir valorPersonalizado
      delete data.tipoServico;
      if (!data.valorPersonalizado) {
        return Response.json({ 
          error: "Valor personalizado é obrigatório quando não há tipo de serviço" 
        }, { status: 400 });
      }
    } else {
      // Se com tipo, garantir tipoServico
      if (!data.tipoServico) {
        return Response.json({ 
          error: "Tipo de serviço é obrigatório quando não é marcado como 'sem tipo'" 
        }, { status: 400 });
      }
    }
    
    const servico = await updateServico(id, data);
    if (!servico) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, servico);
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "Servico",
        documentId: id,
        previousData,
        newData: servico,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_servico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(servico);
  } catch (error) {
    console.error("Error in PUT /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id, userId, userName } = await request.json();
    
    // Buscar dados antes da exclusão para auditoria
    const previousData = await getServicoById(id);
    
    const servico = await deleteServico(id);
    if (!servico) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "DELETE",
        model: "Servico",
        documentId: id,
        previousData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_servico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}