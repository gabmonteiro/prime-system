import connectDB from "../../../libs/db.js";
import Servico from "../../../models/servico.js";
import Despesa from "../../../models/despesa.js";
import { checkPermission } from "../../../services/permissionService.js";
import { UserService } from "../../../services/userService.js";

// Função para obter usuário atual baseado no cookie de autenticação
async function getCurrentUser(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    
    if (!cookieHeader) {
      return null;
    }
    
    // Extrair o userId do cookie 'user'
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const userId = cookies.user;
    
    if (!userId) {
      return null;
    }
    
    // Buscar usuário no banco
    const user = await UserService.getUserById(userId);
    return user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    // Verificar autenticação
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    // Verificar permissão de leitura de serviços e despesas
    if (!checkPermission(user, "servicos", "read") || !checkPermission(user, "despesas", "read")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    // Buscar todos os serviços (histórico completo)
    const servicos = await Servico.find({})
      .populate('tipoServico')
      .lean();
    
    // Buscar todas as despesas (histórico completo)
    const despesas = await Despesa.find({}).lean();
    
    // Calcular valores totais
    const servicosValor = servicos.reduce((total, servico) => {
      const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
      return total + Number(valor);
    }, 0);
    
    const despesasValor = despesas.reduce((total, despesa) => {
      return total + Number(despesa.valor || 0);
    }, 0);
    
    const saldoCarteira = servicosValor - despesasValor;
    
    const carteiraData = {
      saldo: saldoCarteira,
      receitas: {
        total: servicos.length,
        valor: servicosValor
      },
      despesas: {
        total: despesas.length,
        valor: despesasValor
      },
      resumo: {
        servicos: servicos.map(s => ({
          id: s._id,
          cliente: s.cliente,
          valor: s.valorPersonalizado || s.tipoServico?.valor || 0,
          data: s.data,
          tipoServico: s.tipoServico?.nome || 'N/A'
        })),
        despesas: despesas.map(d => ({
          id: d._id,
          nome: d.nome,
          valor: d.valor,
          data: d.data,
          tipo: d.tipo
        }))
      }
    };
    
    return Response.json(carteiraData);
    
  } catch (error) {
    console.error("Error in GET /api/carteira:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
