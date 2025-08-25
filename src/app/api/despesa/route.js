import {
  createDespesa,
  getDespesas,
  getDespesaById,
  updateDespesa,
  deleteDespesa,
  getDespesasPaginated, // novo import
} from "../../../services/despesaService.js";
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
    if (!checkPermission(user, "despesas", "read")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de criação
    if (!checkPermission(user, "despesas", "create")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...despesaData } = data;
    
    const despesa = await createDespesa(despesaData);
    
    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de atualização
    if (!checkPermission(user, "despesas", "update")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const { id, userId, userName, ...data } = await request.json();
    
    // Buscar dados anteriores para auditoria
    const previousData = await getDespesaById(id);
    
    const despesa = await updateDespesa(id, data);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, despesa);
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de exclusão
    if (!checkPermission(user, "despesas", "delete")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    // Tentar obter ID do corpo da requisição primeiro
    let id;
    try {
      const body = await request.json();
      id = body.id;
    } catch (e) {
      // Se não conseguir ler o corpo, tentar como parâmetro de query
      const { searchParams } = new URL(request.url);
      id = searchParams.get("id");
    }
    
    if (!id) {
      return Response.json({ error: "ID da despesa é obrigatório" }, { status: 400 });
    }
    
    // Buscar dados antes da exclusão para auditoria
    const previousData = await getDespesaById(id);
    
    const despesa = await deleteDespesa(id);
    if (!despesa) return Response.json({ error: "Not found" }, { status: 404 });
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "DELETE",
        model: "Despesa",
        documentId: id,
        previousData,
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