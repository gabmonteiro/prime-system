import connectDB from "../../../libs/db.js";
import { UserService } from "../../../services/userService.js";
import { AuditService } from "../../../services/auditService.js";
import { checkPermission } from "../../../services/permissionService.js";

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const forSelection = searchParams.get("forSelection");

    console.log("🔍 Debug GET /api/user:", {
      id,
      forSelection,
      hasForSelection: forSelection === "true",
      userId: user._id,
      userRole: user.role,
    });

    // Se for para seleção (formulários), permitir acesso sem verificar permissão específica
    if (forSelection === "true" || forSelection === true) {
      console.log("✅ Acesso permitido para seleção");
      if (id) {
        // Buscar usuário específico para seleção
        const userData = await UserService.getUserById(id);
        if (!userData) {
          return Response.json(
            { error: "Usuário não encontrado" },
            { status: 404 },
          );
        }
        return Response.json(userData);
      }

      // Listar todos os usuários para seleção (apenas dados básicos)
      const users = await UserService.getUsersForSelection();
      console.log("📋 Usuários para seleção:", users.length);
      return Response.json(users);
    }

    console.log("🔒 Verificando permissão de leitura de usuários");
    // Verificar permissão de leitura para operações normais
    if (!checkPermission(user, "usuarios", "read")) {
      console.log("❌ Permissão negada para leitura de usuários");
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    if (id) {
      const user = await UserService.getUserById(id);
      if (!user) {
        return Response.json(
          { error: "Usuário não encontrado" },
          { status: 404 },
        );
      }
      return Response.json(user);
    }

    const users = await UserService.getAllUsers();
    return Response.json(users);
  } catch (error) {
    console.error("Error in GET /api/user:", error);
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
    if (!checkPermission(user, "usuarios", "create")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const data = await request.json();

    // Validar campos obrigatórios
    if (!data.name || !data.email || !data.password || !data.role) {
      return Response.json(
        {
          error: "Campos obrigatórios: name, email, password, role",
        },
        { status: 400 },
      );
    }

    // Validar role
    const validRoles = ["admin", "gerente", "funcionario", "visualizador"];
    if (!validRoles.includes(data.role)) {
      return Response.json(
        {
          error:
            "Role inválida. Valores permitidos: admin, gerente, funcionario, visualizador",
        },
        { status: 400 },
      );
    }

    const newUser = await UserService.createUser(data);

    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "CREATE",
        model: "User",
        documentId: newUser._id,
        newData: { ...newUser, password: "[HIDDEN]" },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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
    if (!checkPermission(user, "usuarios", "update")) {
      return Response.json(
        { error: "Acesso negado. Permissão insuficiente." },
        { status: 403 },
      );
    }

    const { id, ...data } = await request.json();

    console.log("🔍 Debug PUT /api/user:", {
      id,
      data,
      hasPassword: !!data.password,
      passwordLength: data.password?.length,
    });

    if (!id) {
      return Response.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 },
      );
    }

    // Validar role se fornecida
    if (data.role) {
      const validRoles = ["admin", "gerente", "funcionario", "visualizador"];
      if (!validRoles.includes(data.role)) {
        return Response.json(
          {
            error:
              "Role inválida. Valores permitidos: admin, gerente, funcionario, visualizador",
          },
          { status: 400 },
        );
      }
    }

    // Buscar dados anteriores para auditoria
    const previousData = await UserService.getUserById(id);

    const updatedUser = await UserService.updateUser(id, data);

    if (!updatedUser) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    try {
      const changedFields = AuditService.getChangedFields(
        previousData,
        updatedUser,
      );
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "UPDATE",
        model: "User",
        documentId: id,
        previousData: { ...previousData, password: "[HIDDEN]" },
        newData: { ...updatedUser, password: "[HIDDEN]" },
        changedFields,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }

    return Response.json(updatedUser);
  } catch (error) {
    console.error("Error in PUT /api/user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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
    if (!checkPermission(user, "usuarios", "delete")) {
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
        { error: "ID do usuário é obrigatório" },
        { status: 400 },
      );
    }

    // Não permitir que o usuário se delete
    if (id === user._id.toString()) {
      return Response.json(
        { error: "Não é possível excluir o próprio usuário" },
        { status: 400 },
      );
    }

    // Buscar dados antes da exclusão para auditoria
    const previousData = await UserService.getUserById(id);

    const result = await UserService.deleteUser(id);

    if (!result) {
      return Response.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: user._id,
        userName: user.name,
        action: "DELETE",
        model: "User",
        documentId: id,
        previousData: { ...previousData, password: "[HIDDEN]" },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
