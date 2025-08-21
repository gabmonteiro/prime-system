import mongoose from "mongoose";
import "./tipoServico.js";
import "./user.js";

const ServicoSchema = new mongoose.Schema({
  cliente: {
    type: String,
    required: true,
    trim: true,
  },
  nomeCarro: {
    type: String,
    required: true,
    trim: true,
  },
  semTipo: {
    type: Boolean,
    default: false,
  },
  tipoServico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TipoServico",
  },
  valorPersonalizado: {
    type: Number,
    default: null,
  },
  data: {
    type: Date,
    required: true,
  },
  participantes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  pago: {
    type: Boolean,
    default: false,
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

// Middleware simples para atualizar updatedAt
ServicoSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Forçar recriação do modelo para evitar problemas de cache
if (mongoose.models.Servico) {
  delete mongoose.models.Servico;
}

export default mongoose.model("Servico", ServicoSchema);
