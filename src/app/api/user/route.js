import { UserService } from "../../../services/userService.js";
import connectDB from "../../../libs/db.js";
import { AuditService } from "../../../services/auditService";

export async function GET(request) {
  try {
    // Garantir conexão com o banco
    await connectDB();
    
    const users = await UserService.getAllUsers();
    // Garantir que sempre retorna um array
    const result = Array.isArray(users) ? users : [];
    return Response.json(result);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return Response.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Garantir conexão com o banco
    await connectDB();
    
    const userData = await request.json();

    // Validações básicas
    if (!userData.name || !userData.email || !userData.password) {
      return Response.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Extrair informações do usuário do corpo da requisição
    const { userId, userName, ...createUserData } = userData;

    const user = await UserService.createUser(createUserData);
    
    // Log de auditoria para criação
    try {
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "CREATE",
        model: "User",
        documentId: user._id || user.id,
        newData: user,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { id, userId, userName, ...userData } = await request.json();

    if (!id) {
      return Response.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar dados anteriores para auditoria
    const previousData = await UserService.getUserById(id);
    
    const user = await UserService.updateUser(id, userData);
    
    // Log de auditoria para atualização
    try {
      const changedFields = AuditService.getChangedFields(previousData, user);
      await AuditService.createLog({
        userId: userId || "system",
        userName: userName || "Sistema",
        action: "UPDATE",
        model: "User",
        documentId: id,
        previousData,
        newData: user,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(user);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return Response.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar dados antes da exclusão para auditoria
    const previousData = await UserService.getUserById(id);
    
    const result = await UserService.deleteUser(id);
    
    // Log de auditoria para exclusão
    try {
      await AuditService.createLog({
        userId: "system", // Usuário que executou a exclusão
        userName: "Sistema",
        action: "DELETE",
        model: "User",
        documentId: id,
        previousData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_user" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
      // Não falhar a operação principal
    }
    
    return Response.json(result);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return Response.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
