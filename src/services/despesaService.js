import Despesa from "../models/despesa";

export async function createDespesa(data) {
  return await Despesa.create(data);
}

export async function getDespesas() {
  return await Despesa.find();
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

export async function getDespesasPaginated(page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc") {
  try {
    const skip = (page - 1) * limit;
    
    // Configurar a ordenação
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;
    
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
        sortBy,
        sortOrder,
      },
    };
  } catch (error) {
    console.error("Error in getDespesasPaginated:", error);
    throw error;
  }
}