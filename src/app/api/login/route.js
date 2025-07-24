import LoginService from "../../../services/loginService.js";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await LoginService.authenticate(email, password);
    if (!user) {
      return new Response(
        JSON.stringify({ message: "Credenciais inválidas" }),
        { status: 401 },
      );
    }
    // Define cookie de autenticação simples (user id)
    const response = new Response(JSON.stringify(user), { status: 200 });
    response.headers.append(
      "Set-Cookie",
      `user=${user._id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    );
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ message: "Erro interno" }), {
      status: 500,
    });
  }
}
