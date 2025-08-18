import Despesa from "../models/despesa";

export async function createDespesa(data) {
  return await Despesa.create(data);
}

export async function getDespesas() {
  return await Despesa.find()
    .sort({ data: -1, createdAt: -1 }); // Ordenação: data da despesa, depois data de criação
}

export async function getDespesaById(id) {
  return await Despesa.findById(id);
}

export async function updateDespesa(id, data) {
  return await Despesa.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteDespesa(id) {
  return await Despesa.findByIdAndDelete(id);
}

export async function getDespesasPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    // Configurar a ordenação composta: primeiro por data da despesa, depois por data de criação
    const sortConfig = {
      data: -1, // Data da despesa em ordem decrescente (mais recente primeiro)
      createdAt: -1, // Data de criação em ordem decrescente (mais recente primeiro)
    };
    
    // Executar as consultas em paralelo para melhor performance
    const [data, total] = await Promise.all([
      Despesa.find()
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(), // Adiciona .lean() para melhor performance
      Despesa.countDocuments(),
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
    console.error("Error in getDespesasPaginated:", error);
    throw error;
  }
}