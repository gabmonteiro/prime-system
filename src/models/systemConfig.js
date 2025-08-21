import mongoose from "mongoose";

const SystemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    trim: true,
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
SystemConfigSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Evita re-compilação do modelo durante hot reload
if (mongoose.models.SystemConfig) {
  delete mongoose.models.SystemConfig;
}

export default mongoose.model("SystemConfig", SystemConfigSchema);
