import Servico from "../models/servico";

export async function createServico(data) {
  return await Servico.create(data);
}

export async function getServicos() {
  return await Servico.find().populate("tipoServico");
}

export async function getServicoById(id) {
  return await Servico.findById(id).populate("tipoServico");
}

export async function updateServico(id, data) {
  return await Servico.findByIdAndUpdate(id, data, { new: true }).populate(
    "tipoServico",
  );
}

export async function deleteServico(id) {
  return await Servico.findByIdAndDelete(id);
}

export async function getServicosPaginated(page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc") {
  try {
    const skip = (page - 1) * limit;
    
    // Configurar a ordenação
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;
    
    // Executar as consultas em paralelo para melhor performance
    const [data, total] = await Promise.all([
      Servico.find()
        .populate("tipoServico")
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
        sortBy,
        sortOrder,
      },
    };
  } catch (error) {
    console.error("Error in getServicosPaginated:", error);
    throw error;
  }
}