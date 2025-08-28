import { UserService } from "../../../services/userService.js";
import connectDB from "../../../libs/db.js";

export async function POST(req) {
  try {
    // Garantir conexão com o banco
    await connectDB();

    const { email, password } = await req.json();

    // Validações básicas
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email e senha são obrigatórios" }),
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return new Response(JSON.stringify({ message: "Email inválido" }), {
        status: 400,
      });
    }

    const authResult = await UserService.validateCredentials(
      email.toLowerCase().trim(),
      password,
    );

    if (!authResult.isValid) {
      return new Response(
        JSON.stringify({ message: "Credenciais inválidas" }),
        { status: 401 },
      );
    }

    const user = authResult.user;

    // Criar resposta com dados do usuário (sem senha)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin", // Compatibilidade com código existente
      permissions: user.permissions,
      permissionsList: user.permissionsList,
    };

    // Define cookie de autenticação seguro
    const response = new Response(JSON.stringify(userData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    response.headers.append(
      "Set-Cookie",
      `user=${user._id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure=${process.env.NODE_ENV === "production"}`,
    );

    return response;
  } catch (err) {
    console.error("Erro no login:", err);
    return new Response(
      JSON.stringify({
        message: "Erro interno do servidor",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      }),
      { status: 500 },
    );
  }
}
