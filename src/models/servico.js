import mongoose from "mongoose";
import "./tipoServico.js";
import "./user.js";
import "./cliente.js";
import "./carro.js";
import "./conta.js";

// Cada parcela é um recebimento previsto. Serviço à vista = 1 parcela.
// Receita e divisão entre sócios contam pela `dataPagamento` das parcelas pagas.
const ParcelaSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  valor: { type: Number, required: true },
  vencimento: { type: Date, required: true },
  pago: { type: Boolean, default: false },
  dataPagamento: { type: Date, default: null },
  conta: { type: mongoose.Schema.Types.ObjectId, ref: "Conta", default: null },
});

const ServicoSchema = new mongoose.Schema({
  // Nome do cliente/veículo (texto). Mantido por compatibilidade e como "foto" do momento.
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
  // Referências ao cadastro (v2)
  clienteRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    default: null,
    index: true,
  },
  carroRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carro",
    default: null,
    index: true,
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
  // Valor final do serviço (personalizado ou do tipo), congelado na criação/edição
  valorTotal: {
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
  formaPagamento: {
    type: String,
    enum: ["avista", "parcelado"],
    default: "avista",
  },
  parcelas: [ParcelaSchema],
  // true quando todas as parcelas foram recebidas
  pago: {
    type: Boolean,
    default: false,
  },
  obs: {
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

ServicoSchema.index({ data: -1, createdAt: -1 });
ServicoSchema.index({ "parcelas.dataPagamento": 1 });

ServicoSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Servico ||
  mongoose.model("Servico", ServicoSchema);
