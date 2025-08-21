import Servico from "../models/servico";

export async function createServico(data) {
  return await Servico.create(data);
}

export async function getServicos() {
  return await Servico.find()
    .populate("tipoServico")
    .populate("participantes", "name email")
    .sort({ data: -1, createdAt: -1 }); // Mesma ordenação: data do serviço, depois data de criação
}

export async function getServicoById(id) {
  return await Servico.findById(id)
    .populate("tipoServico")
    .populate("participantes", "name email");
}

export async function updateServico(id, data) {
  return await Servico.findByIdAndUpdate(id, data, { new: true })
    .populate("tipoServico")
    .populate("participantes", "name email");
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
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      data,
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