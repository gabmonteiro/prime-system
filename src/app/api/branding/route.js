import connectDB from "../../../libs/db.js";
import { route, audit, errorResponse } from "../../../libs/api.js";
import { getBranding, setTema } from "../../../services/brandingService.js";

// Público: login e landing também mostram a logo/cor
export async function GET() {
  try {
    await connectDB();
    return Response.json(await getBranding(), {
      headers: { "Cache-Control": "no-cache" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// Trocar a cor de destaque: { preset } ou { cor: "#rrggbb" }
export const PUT = route(
  "configuracoes:update",
  async ({ request, user, body }) => {
    const { previous, tema, config } = await setTema(await body());
    await audit(request, user, {
      action: "UPDATE",
      model: "SystemConfig",
      documentId: config._id,
      previousData: { key: "tema", value: previous },
      newData: { key: "tema", value: tema },
    });
    return { tema };
  },
);
