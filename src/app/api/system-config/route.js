import { 
  getConfig, 
  setConfig, 
  getAllConfigs,
  initializeDefaultConfigs 
} from "../../../services/systemConfigService";
import connectDB from "../../../libs/db";
import { AuditService } from "../../../services/auditService";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    if (key) {
      const value = await getConfig(key);
      return Response.json({ key, value });
    }
    
    // Retornar todas as configurações
    const configs = await getAllConfigs();
    return Response.json(configs);
  } catch (error) {
    console.error("Error in GET /api/system-config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { key, value, description, userId, userName } = await request.json();
    
    if (!key || value === undefined) {
      return Response.json({ 
        error: "Chave e valor são obrigatórios" 
      }, { status: 400 });
    }
    
    // Validar valor para mês fiscal
    if (key === "fiscalMonthStart") {
      const day = parseInt(value);
      if (isNaN(day) || day < 1 || day > 31) {
        return Response.json({ 
          error: "Dia do mês fiscal deve ser entre 1 e 31" 
        }, { status: 400 });
      }
    }
    
    const config = await setConfig(key, value, description);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "SystemConfig",
        documentId: config._id,
        newData: config,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_system_config", key, value },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(config);
  } catch (error) {
    console.error("Error in POST /api/system-config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { key, value, description, userId, userName } = await request.json();
    
    if (!key || value === undefined) {
      return Response.json({ 
        error: "Chave e valor são obrigatórios" 
      }, { status: 400 });
    }
    
    // Validar valor para mês fiscal
    if (key === "fiscalMonthStart") {
      const day = parseInt(value);
      if (isNaN(day) || day < 1 || day > 31) {
        return Response.json({ 
          error: "Dia do mês fiscal deve ser entre 1 e 31" 
        }, { status: 400 });
      }
    }
    
    const config = await setConfig(key, value, description);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "SystemConfig",
        documentId: config._id,
        newData: config,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_system_config", key, value },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(config);
  } catch (error) {
    console.error("Error in PUT /api/system-config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Endpoint para inicializar configurações padrão
export async function PATCH(request) {
  try {
    await connectDB();
    const { action } = await request.json();
    
    if (action === "initialize") {
      await initializeDefaultConfigs();
      return Response.json({ message: "Configurações padrão inicializadas" });
    }
    
    return Response.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Error in PATCH /api/system-config:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
