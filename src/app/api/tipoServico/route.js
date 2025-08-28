import {
  createTipoServico,
  getTipoServicos,
  getTipoServicoById,
  updateTipoServico,
  deleteTipoServico,
} from "../../../services/tipoServicoService.js";
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
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
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
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Verificar permissão de leitura
    if (!checkPermission(user, "tipos-servicos", "read")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

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
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Verificar permissão de criação
    if (!checkPermission(user, "tipos-servicos", "create")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const data = await request.json();

    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...tipoServicoData } = data;

    const tipoServico = await createTipoServico(tipoServicoData);

    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "CREATE",
        model: "TipoServico",
        documentId: tipoServico._id,
        newData: tipoServico,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
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
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Verificar permissão de atualização
    if (!checkPermission(user, "tipos-servicos", "update")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const { id, userId, userName, ...data } = await request.json();

    // Buscar dados anteriores para auditoria
    const previousData = await getTipoServicoById(id);

    const tipoServico = await updateTipoServico(id, data);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });

    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(
        previousData,
        tipoServico,
      );
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "UPDATE",
        model: "TipoServico",
        documentId: id,
        previousData,
        newData: tipoServico,
        changedFields,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
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
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();

    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Verificar permissão de exclusão
    if (!checkPermission(user, "tipos-servicos", "delete")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
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
      return Response.json(
        { error: "ID do tipo de serviço é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar dados antes da exclusão para auditoria
    const previousData = await getTipoServicoById(id);

    const tipoServico = await deleteTipoServico(id);
    if (!tipoServico)
      return Response.json({ error: "Not found" }, { status: 404 });

    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "DELETE",
        model: "TipoServico",
        documentId: id,
        previousData,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
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
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
