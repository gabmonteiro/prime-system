import AuditLog from "../models/auditLog.js";

export class AuditService {
  /**
   * Cria um log de auditoria
   */
  static async createLog(auditData) {
    try {
      console.log("AuditService.createLog - Iniciando criação de log");
      console.log("Dados recebidos:", auditData);

      const {
        userId,
        userName,
        action,
        model,
        documentId,
        previousData = null,
        newData = null,
        changedFields = [],
        ipAddress = null,
        userAgent = null,
        status = "SUCCESS",
        errorMessage = null,
        metadata = {},
      } = auditData;

      console.log("Dados extraídos:", {
        userId,
        userName,
        action,
        model,
        documentId,
      });

      // Converter dados para estruturas planas/JSON-safe antes de sanitizar
      const plainPreviousData = this.makeJsonSafe(previousData);
      const plainNewData = this.makeJsonSafe(newData);

      // Sanitizar dados sensíveis
      const sanitizedPreviousData = plainPreviousData
        ? this.sanitizeSensitiveData(plainPreviousData)
        : null;
      const sanitizedNewData = plainNewData
        ? this.sanitizeSensitiveData(plainNewData)
        : null;

      console.log("Dados sanitizados prontos para salvar");

      const auditLog = new AuditLog({
        userId,
        userName,
        action,
        model,
        documentId,
        previousData: sanitizedPreviousData,
        newData: sanitizedNewData,
        changedFields,
        ipAddress,
        userAgent,
        status,
        errorMessage,
        metadata,
      });

      console.log("Instância AuditLog criada:", {
        userId: auditLog.userId,
        model: auditLog.model,
        action: auditLog.action,
        documentId: auditLog.documentId,
      });

      // Validar manualmente antes de salvar
      const validationError = auditLog.validateSync();
      if (validationError) {
        console.error("Erro de validação:", validationError);
        console.error("Detalhes da validação:", validationError.errors);
        throw validationError;
      }

      const result = await auditLog.save();
      console.log("Log salvo com sucesso:", { id: result._id });

      return result;
    } catch (error) {
      console.error("Erro ao criar log de auditoria:", error);
      console.error("Stack trace:", error.stack);
      // Não falhar a operação principal por erro de auditoria
      return null;
    }
  }

  /**
   * Converte dados (incl. Mongoose Documents) em estruturas JSON-safe
   */
  static makeJsonSafe(value) {
    if (value == null) return value;

    // Mongoose Document
    if (typeof value === "object" && typeof value.toObject === "function") {
      return value.toObject({
        depopulate: true,
        getters: false,
        virtuals: false,
      });
    }

    // Tenta serialização JSON para simplificar estruturas e remover metadados
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  /**
   * Sanitiza dados sensíveis (seguro contra ciclos)
   */
  static sanitizeSensitiveData(data, visited = new WeakSet()) {
    if (data == null) return data;

    // Primitivos
    if (typeof data !== "object") return data;

    // Evita loops
    if (visited.has(data)) return "[Circular]";
    visited.add(data);

    // Tipos especiais
    if (data instanceof Date) return data.toISOString();
    // ObjectId (duck typing)
    if (
      data &&
      (data._bsontype === "ObjectId" ||
        (typeof data.equals === "function" &&
          typeof data.toString === "function"))
    ) {
      return data.toString();
    }

    // Arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeSensitiveData(item, visited));
    }

    // Objetos planos
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
    ];
    const result = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key)) {
        result[key] = "[REDACTED]";
        continue;
      }
      result[key] = this.sanitizeSensitiveData(value, visited);
    }

    return result;
  }

  /**
   * Busca logs de auditoria com paginação e filtros
   */
  static async getAuditLogs(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros de consulta
      const query = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.model) query.model = filters.model;
      if (filters.status) query.status = filters.status;
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate)
          query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }

      // Executar consultas em paralelo
      const [data, total] = await Promise.all([
        AuditLog.find(query)
          // .populate("userId", "name email") // removido: userId pode ser string
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query),
      ]);

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
      };
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      throw error;
    }
  }

  /**
   * Busca logs por ID
   */
  static async getAuditLogById(id) {
    try {
      return await AuditLog.findById(id).lean();
    } catch (error) {
      console.error("Erro ao buscar log por ID:", error);
      throw error;
    }
  }

  /**
   * Busca logs por documento
   */
  static async getAuditLogsByDocument(model, documentId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        AuditLog.find({ model, documentId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments({ model, documentId }),
      ]);

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
      };
    } catch (error) {
      console.error("Erro ao buscar logs por documento:", error);
      throw error;
    }
  }

  /**
   * Busca logs por usuário
   */
  static async getAuditLogsByUser(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        AuditLog.find({ userId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments({ userId }),
      ]);

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
      };
    } catch (error) {
      console.error("Erro ao buscar logs de usuário:", error);
      throw error;
    }
  }

  /**
   * Compara dois objetos e retorna campos alterados
   */
  static getChangedFields(oldData, newData) {
    if (!oldData || !newData) return [];

    const changedFields = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      if (key === "updatedAt" || key === "__v") return; // Ignorar campos automáticos

      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push({
          field: key,
          oldValue,
          newValue,
        });
      }
    });

    return changedFields;
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  static async cleanupOldLogs(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return result;
    } catch (error) {
      console.error("Erro ao limpar logs antigos:", error);
      throw error;
    }
  }
}
