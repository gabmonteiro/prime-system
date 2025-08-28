import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  permissions: [
    {
      type: String,
      enum: [
        // Serviços
        "servicos:read",
        "servicos:create",
        "servicos:update",
        "servicos:delete",
        "servicos:manage",
        // Despesas
        "despesas:read",
        "despesas:create",
        "despesas:update",
        "despesas:delete",
        "despesas:manage",
        // Tipos de Serviços
        "tipos-servicos:read",
        "tipos-servicos:create",
        "tipos-servicos:update",
        "tipos-servicos:delete",
        "tipos-servicos:manage",
        // Usuários
        "usuarios:read",
        "usuarios:create",
        "usuarios:update",
        "usuarios:delete",
        "usuarios:manage",
        // Lista de Compras
        "lista-compras:read",
        "lista-compras:create",
        "lista-compras:update",
        "lista-compras:delete",
        "lista-compras:manage",
        // Dashboard
        "dashboard:read",
        // Auditoria
        "auditoria:read",
        // Configurações
        "configuracoes:read",
        "configuracoes:update",
        "configuracoes:manage",
      ],
    },
  ],
  isSystem: {
    type: Boolean,
    default: false, // Roles do sistema não podem ser excluídas
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para atualizar updatedAt
RoleSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Evita re-compilação do modelo durante hot reload
if (mongoose.models.Role) {
  delete mongoose.models.Role;
}

export default mongoose.model("Role", RoleSchema);
