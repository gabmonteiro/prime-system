import mongoose from "mongoose";

const DespesaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  desc: {
    type: String,
    trim: true,
  },
  data: {
    type: Date,
    required: true,
  },
  // compra/gasto = despesas operacionais (entram no lucro)
  // retirada = dinheiro retirado pelos sócios (sai da conta, mas não é custo)
  tipo: {
    type: String,
    enum: ["compra", "gasto", "retirada"],
    required: true,
  },
  // Conta de onde o dinheiro saiu (v2). Registros antigos recebem a conta na migração.
  conta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conta",
    default: null,
  },
  // Para retiradas: quanto ficou para cada sócio
  distribuicao: [
    {
      _id: false,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      nome: String,
      valor: Number,
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

DespesaSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Despesa ||
  mongoose.model("Despesa", DespesaSchema);
