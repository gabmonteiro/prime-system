import { AuditService } from "../../../services/auditService.js";
import connectDB from "../../../libs/db.js";
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
    if (!checkPermission(user, "auditoria", "read")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const model = searchParams.get("model");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters = {};
    if (model) filters.model = model;
    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditService.getAuditLogs(filters, page, limit);
    return Response.json(logs);
  } catch (error) {
    console.error("Error in GET /api/audit:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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
    if (!checkPermission(user, "auditoria", "create")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const logData = await request.json();

    // Validar campos obrigatórios
    if (!logData.action || !logData.model || !logData.documentId) {
      return Response.json(
        {
          error: "Campos obrigatórios: action, model, documentId",
        },
        { status: 400 },
      );
    }

    const log = await AuditService.createLog({
      ...logData,
      userId: user._id,
      userName: user.name,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "N/A",
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return Response.json(log, { status: 201 });
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
      message: `Logs mais antigos que ${daysToKeep} dias foram removidos`,
    });
  } catch (error) {
    console.error("Error in DELETE /api/audit:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
