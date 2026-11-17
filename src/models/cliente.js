import mongoose from "mongoose";

export function normalizeName(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const ClienteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    // Nome normalizado (sem acento, minúsculo) para busca e para evitar duplicados
    nomeNormalizado: { type: String, index: true },
    telefone: { type: String, trim: true },
    obs: { type: String, trim: true },
  },
  { timestamps: true },
);

ClienteSchema.pre("validate", function (next) {
  this.nomeNormalizado = normalizeName(this.nome);
  next();
});

export default mongoose.models.Cliente ||
  mongoose.model("Cliente", ClienteSchema);
