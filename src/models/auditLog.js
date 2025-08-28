import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  // ID do usuário que executou a ação
  userId: {
    type: mongoose.Schema.Types.Mixed, // Aceita ObjectId ou string
    required: true,
  },

  // Nome do usuário que executou a ação
  userName: {
    type: String,
    required: true,
  },

  // Tipo de ação executada
  action: {
    type: String,
    enum: ["CREATE", "UPDATE", "DELETE"],
    required: true,
  },

  // Model/Collection afetada
  model: {
    type: String,
    required: true,
  },

  // ID do documento afetado
  documentId: {
    type: mongoose.Schema.Types.Mixed, // Aceita ObjectId ou string
    required: true,
  },

  // Dados antes da alteração (para UPDATE e DELETE)
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Dados após a alteração (para CREATE e UPDATE)
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Campos alterados (para UPDATE)
  changedFields: [
    {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    },
  ],

  // IP do usuário
  ipAddress: {
    type: String,
    default: null,
  },

  // User Agent do navegador
  userAgent: {
    type: String,
    default: null,
  },

  // Timestamp da ação
  timestamp: {
    type: Date,
    default: Date.now,
  },

  // Status da operação
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS",
  },

  // Mensagem de erro (se houver)
  errorMessage: {
    type: String,
    default: null,
  },

  // Metadados adicionais
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Índices para melhor performance nas consultas
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ model: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// Método para formatar dados sensíveis antes de salvar
AuditLogSchema.methods.sanitizeData = function (data) {
  if (!data) return null;

  const sanitized = { ...data };
  const sensitiveFields = ["password", "token", "secret", "key"];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

// Forçar recompilação do model em hot-reload
if (mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

export default mongoose.model("AuditLog", AuditLogSchema);
