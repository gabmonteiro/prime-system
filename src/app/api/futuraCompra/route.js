import {
  createFuturaCompra,
  getFuturaCompras,
  getFuturaCompraById,
  updateFuturaCompra,
  deleteFuturaCompra,
} from "../../../services/futuraCompraService";
import connectDB from "../../../libs/db";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const futura = await getFuturaCompraById(id);
      if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(futura);
    }
    const futuras = await getFuturaCompras();
    return Response.json(futuras);
  } catch (error) {
    console.error("Error in GET /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const futura = await createFuturaCompra(data);
    return Response.json(futura);
  } catch (error) {
    console.error("Error in POST /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...data } = await request.json();
    const futura = await updateFuturaCompra(id, data);
    if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(futura);
  } catch (error) {
    console.error("Error in PUT /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    const futura = await deleteFuturaCompra(id);
    if (!futura) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/futuraCompra:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
