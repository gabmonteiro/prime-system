import mongoose from "mongoose";
import "./tipoServico.js";

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
  tipoServico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TipoServico",
    required: true,
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
      type: String,
      enum: ["Gabriel", "Samuel", "Davi"],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ServicoSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Servico ||
  mongoose.model("Servico", ServicoSchema);
