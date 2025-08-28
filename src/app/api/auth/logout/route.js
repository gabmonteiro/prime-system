export async function POST(request) {
  try {
    // Aqui você pode implementar lógica de logout no servidor se necessário
    // Por exemplo, invalidar tokens, limpar sessões, etc.

    return Response.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("Erro no logout:", error);
    return Response.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
