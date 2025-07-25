import connectDB from "../../../../libs/db";
import User from "../../../../models/user";

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return Response.json(
        { valid: false, error: "Dados insuficientes" },
        { status: 400 }
      );
    }

    // Verificar se o usuário ainda existe e está ativo
    const user = await User.findById(userId);
    
    if (!user || user.email !== email) {
      return Response.json(
        { valid: false, error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    return Response.json({ 
      valid: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return Response.json(
      { valid: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
