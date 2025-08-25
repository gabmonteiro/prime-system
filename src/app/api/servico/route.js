import {
  createServico,
  getServicos,
  getServicoById,
  updateServico,
  deleteServico,
  getServicosPaginated
} from "../../../services/servicoService.js";
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
    if (!checkPermission(user, "servicos", "read")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const servico = await getServicoById(id);
      if (!servico) {
        return Response.json({ error: "Serviço não encontrado" }, { status: 404 });
      }
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de criação
    if (!checkPermission(user, "servicos", "create")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const data = await request.json();
    const { userId, userName, ...servicoData } = data;
    
    const servico = await createServico(servicoData);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "CREATE",
        model: "Servico",
        documentId: servico._id,
        newData: servico,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_servico" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(servico, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/servico:", error);
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
    if (!checkPermission(user, "servicos", "update")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const { id, userId, userName, ...data } = await request.json();
    
    if (!id) {
      return Response.json({ error: "ID do serviço é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getServicoById(id);
    const servico = await updateServico(id, data);
    
    if (!servico) {
      return Response.json({ error: "Serviço não encontrado" }, { status: 404 });
    }
    
    // Log de auditoria
    try {
      const changedFields = AuditService.getChangedFields(previousData, servico);
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
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
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de exclusão
    if (!checkPermission(user, "servicos", "delete")) {
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
      return Response.json({ error: "ID do serviço é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getServicoById(id);
    const result = await deleteServico(id);
    
    if (!result) {
      return Response.json({ error: "Serviço não encontrado" }, { status: 404 });
    }
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
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
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/servico:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}