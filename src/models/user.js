// src/models/User.js
import mongoose from "mongoose";
import "./role.js";

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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  }],
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
UserSchema.methods.hasPermission = async function(resource, action) {
  // Admin sempre tem todas as permissões
  if (this.isAdmin) {
    return true;
  }

  // Carregar roles com permissões
  await this.populate({
    path: 'roles',
    populate: {
      path: 'permissions'
    }
  });

  // Verificar se alguma role tem a permissão
  for (const role of this.roles) {
    for (const permission of role.permissions) {
      if (permission.resource === resource && 
          (permission.action === action || permission.action === 'manage')) {
        return true;
      }
    }
  }

  return false;
};

// Método para obter todas as permissões do usuário
UserSchema.methods.getAllPermissions = async function() {
  if (this.isAdmin) {
    // Admin tem todas as permissões
    const Permission = mongoose.model('Permission');
    return await Permission.find({});
  }

  await this.populate({
    path: 'roles',
    populate: {
      path: 'permissions'
    }
  });

  const permissions = new Set();
  this.roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.add(permission._id.toString());
    });
  });

  return Array.from(permissions);
};

// Evita re-compilação do modelo durante hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
