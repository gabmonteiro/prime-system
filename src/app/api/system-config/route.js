import {
  getConfig,
  setConfig,
  getAllConfigs,
  initializeDefaultConfigs
} from "../../../services/systemConfigService.js";
import connectDB from "../../../libs/db.js";
import { AuditService } from "../../../services/auditService.js";
import { checkPermission } from "../../../services/permissionService.js";
import { UserService } from "../../../services/userService.js";

// Função para obter usuário atual baseado no cookie de autenticação
async function getCurrentUser(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    
    if (!cookieHeader) {
      return null;
    }
    
    // Extrair o userId do cookie 'user'
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const userId = cookies.user;
    
    if (!userId) {
      return null;
    }
    
    // Buscar usuário no banco
    const user = await UserService.getUserById(userId);
    return user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de leitura
    if (!checkPermission(user, "configuracoes", "read")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de atualização
    if (!checkPermission(user, "configuracoes", "update")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const { key, value, description } = await request.json();
    
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
    
    // Buscar dados anteriores para auditoria
    const previousValue = await getConfig(key);
    
    const config = await setConfig(key, value, description);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "UPDATE",
        model: "SystemConfig",
        documentId: config._id,
        previousData: { key, value: previousValue },
        newData: { key, value: config.value },
        changedFields: previousValue !== config.value ? ["value"] : [],
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de gerenciamento
    if (!checkPermission(user, "configuracoes", "manage")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
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

