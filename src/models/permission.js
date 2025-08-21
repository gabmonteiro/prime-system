import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema({
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
  resource: {
    type: String,
    required: true,
    enum: ["servicos", "despesas", "tipos-servicos", "usuarios", "auditoria", "lista-compras", "dashboard", "configuracoes"],
  },
  action: {
    type: String,
    required: true,
    enum: ["create", "read", "update", "delete", "manage"],
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
PermissionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Evita re-compilação do modelo durante hot reload
if (mongoose.models.Permission) {
  delete mongoose.models.Permission;
}

export default mongoose.model("Permission", PermissionSchema);
