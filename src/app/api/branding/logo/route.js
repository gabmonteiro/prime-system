import connectDB from "../../../../libs/db.js";
import { route, audit, errorResponse } from "../../../../libs/api.js";
import {
  getLogo,
  removeLogo,
  setLogo,
} from "../../../../services/brandingService.js";

// Público: imagem da logo (404 se não houver)
export async function GET(request) {
  try {
    await connectDB();
    const logo = await getLogo();
    if (!logo) return new Response(null, { status: 404 });
    const etag = `"${logo.versao}"`;
    const headers = {
      "Content-Type": logo.mime,
      "Cache-Control": "public, max-age=0, must-revalidate",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    };
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(Buffer.from(logo.data, "base64"), { headers });
  } catch (error) {
    return errorResponse(error);
  }
}

// Enviar logo: { dataUrl: "data:image/png;base64,..." }
export const PUT = route(
  "configuracoes:update",
  async ({ request, user, body }) => {
    const { dataUrl } = await body();
    const meta = await setLogo(dataUrl);
    await audit(request, user, {
      action: "UPDATE",
      model: "SystemConfig",
      documentId: "logo",
      newData: { key: "logo", ...meta },
    });
    return meta;
  },
);

export const DELETE = route(
  "configuracoes:update",
  async ({ request, user }) => {
    await removeLogo();
    await audit(request, user, {
      action: "DELETE",
      model: "SystemConfig",
      documentId: "logo",
      previousData: { key: "logo" },
    });
    return { success: true };
  },
);
