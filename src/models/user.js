// src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Senha é obrigatória"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "gerente", "funcionario", "visualizador"],
    default: "funcionario",
  },
  isActive: {
    type: Boolean,
    default: true,
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
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Método para verificar se o usuário tem uma permissão específica
UserSchema.methods.hasPermission = function(resource, action) {
  // Admin sempre tem todas as permissões
  if (this.role === "admin") {
    return true;
  }

  // Mapeamento de roles para permissões
  const rolePermissions = {
    gerente: [
      "servicos:manage", "despesas:manage", "tipos-servicos:manage",
      "lista-compras:manage", "dashboard:read", "configuracoes:read",
      "usuarios:read", "usuarios:create", "usuarios:update"
    ],
    funcionario: [
      "servicos:read", "servicos:create", "servicos:update",
      "despesas:read", "despesas:create", "despesas:update",
      "lista-compras:read", "lista-compras:create", "lista-compras:update",
      "dashboard:read", "tipos-servicos:read"
    ],
    visualizador: [
      "servicos:read", "despesas:read", "tipos-servicos:read",
      "lista-compras:read", "dashboard:read"
    ]
  };

  const permissions = rolePermissions[this.role] || [];
  
  // Verificar permissão específica ou permissão de gerenciamento
  return permissions.includes(`${resource}:${action}`) || 
         permissions.includes(`${resource}:manage`);
};

// Método para obter todas as permissões do usuário
UserSchema.methods.getAllPermissions = function() {
  if (this.role === "admin") {
    // Admin tem todas as permissões
    return [
      "servicos:read", "servicos:create", "servicos:update", "servicos:delete", "servicos:manage",
      "despesas:read", "despesas:create", "despesas:update", "despesas:delete", "despesas:manage",
      "tipos-servicos:read", "tipos-servicos:create", "tipos-servicos:update", "tipos-servicos:delete", "tipos-servicos:manage",
      "usuarios:read", "usuarios:create", "usuarios:update", "usuarios:delete", "usuarios:manage",
      "lista-compras:read", "lista-compras:create", "lista-compras:update", "lista-compras:delete", "lista-compras:manage",
      "dashboard:read", "auditoria:read", "configuracoes:read", "configuracoes:update", "configuracoes:manage"
    ];
  }

  const rolePermissions = {
    gerente: [
      "servicos:manage", "despesas:manage", "tipos-servicos:manage",
      "lista-compras:manage", "dashboard:read", "configuracoes:read",
      "usuarios:read", "usuarios:create", "usuarios:update"
    ],
    funcionario: [
      "servicos:read", "servicos:create", "servicos:update",
      "despesas:read", "despesas:create", "despesas:update",
      "lista-compras:read", "lista-compras:create", "lista-compras:update",
      "dashboard:read", "tipos-servicos:read"
    ],
    visualizador: [
      "servicos:read", "despesas:read", "tipos-servicos:read",
      "lista-compras:read", "dashboard:read"
    ]
  };

  return rolePermissions[this.role] || [];
};

// Evita re-compilação do modelo durante hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
