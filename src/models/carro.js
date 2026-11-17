import mongoose from "mongoose";
import { normalizeName } from "./cliente.js";

const CarroSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
      index: true,
    },
    modelo: {
      type: String,
      required: [true, "Modelo é obrigatório"],
      trim: true,
    },
    modeloNormalizado: { type: String },
    placa: { type: String, trim: true, uppercase: true },
    cor: { type: String, trim: true },
    obs: { type: String, trim: true },
  },
  { timestamps: true },
);

CarroSchema.pre("validate", function (next) {
  this.modeloNormalizado = normalizeName(this.modelo);
  next();
});

export default mongoose.models.Carro || mongoose.model("Carro", CarroSchema);
