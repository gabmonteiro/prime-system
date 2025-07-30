import connectDB from "../../../libs/db";
import Servico from "../../../models/servico";
import Despesa from "../../../models/despesa";
import FuturaCompra from "../../../models/futuraCompra";
import TipoServico from "../../../models/tipoServico";

export async function GET() {
  try {
    await connectDB();

    // Serviços: só os campos usados no dashboard, apenas pagos
    const servicos = await Servico.find(
      { pago: true },
      {
        data: 1,
        valorPersonalizado: 1,
        tipoServico: 1,
        participantes: 1,
      }
    )
      .populate({
        path: "tipoServico",
        select: "nome valor"
      })
      .lean();

    // Despesas: só os campos usados
    const despesas = await Despesa.find({}, {
      data: 1,
      valor: 1,
      tipo: 1,
      nome: 1,
      desc: 1,
    }).lean();

    // Compras futuras: só os campos usados
    const compras = await FuturaCompra.find({}, {
      valor: 1,
      urgencia: 1,
    }).lean();

    return Response.json({
      servicos,
      despesas,
      compras,
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
