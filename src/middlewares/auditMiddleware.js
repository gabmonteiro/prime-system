import { AuditService } from "../services/auditService.js";

/**
 * Middleware para capturar informações de auditoria
 */
export function auditMiddleware(req, res, next) {
  // Capturar informações básicas da requisição
  req.auditInfo = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    timestamp: new Date(),
  };

  next();
}

/**
 * Função helper para criar logs de auditoria
 */
export async function createAuditLog(auditData) {
  try {
    await AuditService.createLog(auditData);
  } catch (error) {
    console.error("Erro ao criar log de auditoria:", error);
    // Não falhar a operação principal
  }
}

/**
 * Wrapper para operações de auditoria
 */
export function withAudit(operation, auditConfig) {
  return async (req, res, next) => {
    const originalSend = res.json;
    const originalStatus = res.status;

    let responseData = null;
    let statusCode = 200;

    // Interceptar resposta
    res.json = function (data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.status = function (code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    try {
      // Executar operação original
      await operation(req, res, next);

      // Após a operação, criar log de auditoria
      if (req.user && auditConfig) {
        const auditData = {
          userId: req.user._id || req.user.id,
          userName: req.user.name || req.user.email,
          action: auditConfig.action,
          model: auditConfig.model,
          documentId: auditConfig.getDocumentId
            ? auditConfig.getDocumentId(req, responseData)
            : null,
          previousData: auditConfig.getPreviousData
            ? await auditConfig.getPreviousData(req)
            : null,
          newData: auditConfig.getNewData
            ? auditConfig.getNewData(req, responseData)
            : null,
          changedFields: auditConfig.getChangedFields
            ? auditConfig.getChangedFields(req, responseData)
            : [],
          ipAddress: req.auditInfo?.ipAddress,
          userAgent: req.auditInfo?.userAgent,
          status: statusCode < 400 ? "SUCCESS" : "FAILED",
          errorMessage:
            statusCode >= 400
              ? responseData?.error || "Erro na operação"
              : null,
          metadata: {
            method: req.method,
            url: req.url,
            statusCode,
            ...auditConfig.metadata,
          },
        };

        // Criar log de auditoria de forma assíncrona
        createAuditLog(auditData);
      }
    } catch (error) {
      // Em caso de erro, criar log de auditoria com status FAILED
      if (req.user && auditConfig) {
        const auditData = {
          userId: req.user._id || req.user.id,
          userName: req.user.name || req.user.email,
          action: auditConfig.action,
          model: auditConfig.model,
          documentId: auditConfig.getDocumentId
            ? auditConfig.getDocumentId(req, null)
            : null,
          ipAddress: req.auditInfo?.ipAddress,
          userAgent: req.auditInfo?.userAgent,
          status: "FAILED",
          errorMessage: error.message || "Erro na operação",
          metadata: {
            method: req.method,
            url: req.url,
            error: error.message,
            ...auditConfig.metadata,
          },
        };

        createAuditLog(auditData);
      }

      throw error;
    }
  };
}

/**
 * Configurações de auditoria para diferentes operações
 */
export const auditConfigs = {
  // CREATE operations
  create: {
    action: "CREATE",
    getDocumentId: (req, responseData) => responseData?._id || responseData?.id,
    getNewData: (req, responseData) => responseData,
    metadata: { operation: "create" },
  },

  // UPDATE operations
  update: {
    action: "UPDATE",
    getDocumentId: (req) => req.body?.id || req.params?.id,
    getPreviousData: async (req) => {
      // Implementar busca de dados anteriores se necessário
      return null;
    },
    getNewData: (req) => req.body,
    getChangedFields: (req, responseData) => {
      // Se temos dados anteriores, comparar com novos dados
      return [];
    },
    metadata: { operation: "update" },
  },

  // DELETE operations
  delete: {
    action: "DELETE",
    getDocumentId: (req) => req.body?.id || req.params?.id,
    getPreviousData: async (req) => {
      // Implementar busca de dados anteriores se necessário
      return null;
    },
    metadata: { operation: "delete" },
  },
};

/**
 * Helper para criar configuração de auditoria personalizada
 */
export function createAuditConfig(config) {
  return {
    ...(auditConfigs[config.action] || auditConfigs.create),
    ...config,
  };
}
