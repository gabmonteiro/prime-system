import Servico from "../models/servico";

// Função auxiliar para corrigir dados corrompidos
function corrigirParticipantes(servico) {
  if (!servico.participantes || !Array.isArray(servico.participantes)) {
    return { ...servico, participantes: [] };
  }
  
  const participantesCorrigidos = servico.participantes.filter(p => 
    p && typeof p === 'object' && p._id && p.name
  );
  
  return { ...servico, participantes: participantesCorrigidos };
}

export async function createServico(data) {
  return await Servico.create(data);
}

export async function getServicos() {
  const servicos = await Servico.find()
    .populate("tipoServico")
    .populate("participantes", "name email")
    .sort({ data: -1, createdAt: -1 }); // Mesma ordenação: data do serviço, depois data de criação
  
  // Corrigir dados corrompidos
  return servicos.map(corrigirParticipantes);
}

export async function getServicoById(id) {
  const servico = await Servico.findById(id)
    .populate("tipoServico")
    .populate("participantes", "name email");
  
  return servico ? corrigirParticipantes(servico) : null;
}

export async function updateServico(id, data) {
  const servico = await Servico.findByIdAndUpdate(id, data, { new: true })
    .populate("tipoServico")
    .populate("participantes", "name email");
  
  return servico ? corrigirParticipantes(servico) : null;
}

export async function deleteServico(id) {
  return await Servico.findByIdAndDelete(id);
}

export async function getServicosPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    // Configurar a ordenação composta: primeiro por data do serviço, depois por data de criação
    const sortConfig = {
      data: -1, // Data do serviço em ordem decrescente (mais recente primeiro)
      createdAt: -1, // Data de criação em ordem decrescente (mais recente primeiro)
    };
    
    // Executar as consultas em paralelo para melhor performance
    const [data, total] = await Promise.all([
      Servico.find()
        .populate("tipoServico")
        .populate("participantes", "name email")
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(), // Adiciona .lean() para melhor performance
      Servico.countDocuments(),
    ]);
    
    // Corrigir dados corrompidos
    const dataCorrigida = data.map(corrigirParticipantes);
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      data: dataCorrigida,
      pagination: {
        total,
        page,
        totalPages,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      sortInfo: {
        sortBy: "data,createdAt",
        sortOrder: "desc,desc",
      },
    };
  } catch (error) {
    console.error("Error in getServicosPaginated:", error);
    throw error;
  }
}