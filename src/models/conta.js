import mongoose from "mongoose";

// Conta financeira onde o dinheiro entra/sai (ex: Dinheiro físico, Banco).
// Saldo = saldoInicial + recebimentos - despesas + transferências recebidas - enviadas.
const ContaSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    tipo: {
      type: String,
      enum: ["dinheiro", "banco", "outro"],
      default: "banco",
    },
    saldoInicial: { type: Number, default: 0 },
    ativa: { type: Boolean, default: true },
    // Conta criada pela migração v2 para dados antigos sem conta informada
    sistema: { type: Boolean, default: false },
    desc: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.Conta || mongoose.model("Conta", ContaSchema);
