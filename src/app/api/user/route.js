import { UserService } from "../../../services/userService.js";
import connectDB from "../../../libs/db.js";

export async function GET(request) {
  try {
    // Garantir conexão com o banco
    await connectDB();
    
    const users = await UserService.getAllUsers();
    return Response.json(users);
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

    const user = await UserService.createUser(userData);
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
    const { id, ...userData } = await request.json();

    if (!id) {
      return Response.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 },
      );
    }

    const user = await UserService.updateUser(id, userData);
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

    const result = await UserService.deleteUser(id);
    return Response.json(result);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return Response.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
