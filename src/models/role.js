import mongoose from "mongoose";
import "./permission.js";

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
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
  }],
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
