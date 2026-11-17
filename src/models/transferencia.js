import mongoose from "mongoose";

const TransferenciaSchema = new mongoose.Schema(
  {
    contaOrigem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conta",
      required: true,
    },
    contaDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conta",
      required: true,
    },
    valor: {
      type: Number,
      required: true,
      min: [0.01, "Valor deve ser maior que zero"],
    },
    data: { type: Date, required: true },
    desc: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.Transferencia ||
  mongoose.model("Transferencia", TransferenciaSchema);
