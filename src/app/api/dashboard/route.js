import connectDB from "../../../libs/db.js";
import Servico from "../../../models/servico.js";
import Despesa from "../../../models/despesa.js";
import FuturaCompra from "../../../models/futuraCompra.js";
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
    
    // Verificar permissão de leitura do dashboard
    if (!checkPermission(user, "dashboard", "read")) {
      return Response.json({ error: "Acesso negado. Permissão insuficiente." }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    
    // Calcular datas baseadas no período
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Buscar dados com base nas permissões do usuário
    const dashboardData = {};
    
    // Serviços
    if (checkPermission(user, "servicos", "read")) {
      const servicos = await Servico.find({
        data: { $gte: startDate }
      }).populate('tipoServico').populate('participantes', 'name email').lean();
      
      // Filtrar e corrigir dados corrompidos
      const servicosCorrigidos = servicos.map(servico => {
        // Garantir que participantes seja sempre um array válido
        let participantes = [];
        if (servico.participantes && Array.isArray(servico.participantes)) {
          participantes = servico.participantes.filter(p => 
            p && typeof p === 'object' && p._id && p.name
          );
        }
        
        return {
          ...servico,
          participantes: participantes
        };
      });
      
      const totalServicos = servicosCorrigidos.length;
      const servicosValue = servicosCorrigidos.reduce((total, servico) => {
        const valor = servico.valorPersonalizado || servico.tipoServico?.valor || 0;
        return total + Number(valor);
      }, 0);
      
      dashboardData.servicos = servicosCorrigidos;
      dashboardData.servicosStats = {
        total: totalServicos,
        valor: servicosValue
      };
    }
    
    // Despesas
    if (checkPermission(user, "despesas", "read")) {
      const despesas = await Despesa.find({
        data: { $gte: startDate }
      }).lean();
      
      const totalDespesas = despesas.length;
      const despesasValue = despesas.reduce((total, despesa) => {
        return total + Number(despesa.valor || 0);
      }, 0);
      
      dashboardData.despesas = despesas;
      dashboardData.despesasStats = {
        total: totalDespesas,
        valor: despesasValue
      };
    }
    
    // Lista de compras
    if (checkPermission(user, "lista-compras", "read")) {
      const compras = await FuturaCompra.find({
        createdAt: { $gte: startDate }
      }).lean();
      
      const totalCompras = compras.length;
      const comprasValue = compras.reduce((total, compra) => {
        return total + Number(compra.valor || 0);
      }, 0);
      
      dashboardData.compras = compras;
      dashboardData.comprasStats = {
        total: totalCompras,
        valor: comprasValue
      };
    }
    
    // Calcular lucro se o usuário tiver acesso a serviços e despesas
    if (checkPermission(user, "servicos", "read") && checkPermission(user, "despesas", "read")) {
      const servicosValor = dashboardData.servicosStats?.valor || 0;
      const despesasValor = dashboardData.despesasStats?.valor || 0;
      dashboardData.lucro = servicosValor - despesasValor;
      
      // Calcular saldo total da carteira (histórico completo)
      const servicosTotal = await Servico.find({})
        .populate('tipoServico')
        .lean();
      const despesasTotal = await Despesa.find({}).lean();
      
      const servicosValorTotal = servicosTotal.reduce((total, servico) => {
        const valor = servico.valorPersonalizado || (servico.tipoServico ? servico.tipoServico.valor : 0);
        return total + Number(valor || 0);
      }, 0);
      
      const despesasValorTotal = despesasTotal.reduce((total, despesa) => {
        return total + Number(despesa.valor || 0);
      }, 0);
      
      dashboardData.carteira = servicosValorTotal - despesasValorTotal;
      dashboardData.carteiraStats = {
        servicosTotal: servicosTotal.length,
        despesasTotal: despesasTotal.length,
        servicosValor: servicosValorTotal,
        despesasValor: despesasValorTotal
      };
      
      // Debug: log dos valores para verificar
      console.log('🔍 Debug Carteira:', {
        servicosTotal: servicosTotal.length,
        despesasTotal: despesasTotal.length,
        servicosValor: servicosValorTotal,
        despesasValor: despesasValorTotal,
        carteira: dashboardData.carteira
      });
      
      // Log detalhado dos primeiros serviços para debug
      if (servicosTotal.length > 0) {
        console.log('📋 Primeiros 3 serviços:', servicosTotal.slice(0, 3).map(s => ({
          id: s._id,
          cliente: s.cliente,
          valorPersonalizado: s.valorPersonalizado,
          tipoServico: s.tipoServico ? { id: s.tipoServico._id, valor: s.tipoServico.valor } : null,
          valorCalculado: s.valorPersonalizado || (s.tipoServico ? s.tipoServico.valor : 0)
        })));
      }
    }
    
    return Response.json(dashboardData);
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
