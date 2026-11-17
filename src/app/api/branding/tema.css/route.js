import connectDB from "../../../../libs/db.js";
import { getTema } from "../../../../services/brandingService.js";
import { DEFAULT_TEMA, temaCss } from "../../../../libs/theme.js";

// CSS com as variáveis da cor de destaque, carregado no <head> de todas as páginas.
export async function GET(request) {
  let tema = DEFAULT_TEMA;
  try {
    await connectDB();
    tema = await getTema();
  } catch {
    // Sem banco: segue com o azul padrão
  }
  const css = temaCss(tema);
  const etag = `"${Buffer.from(css).toString("base64").slice(-24)}"`;
  const headers = {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": "no-cache",
    ETag: etag,
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(css, { headers });
}
