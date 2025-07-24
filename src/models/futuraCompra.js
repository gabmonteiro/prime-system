import mongoose from "mongoose";

const FuturaCompraSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  valor: {
    type: Number,
    required: false,
  },
  desc: {
    type: String,
    required: false,
    trim: true,
  },
  urgencia: {
    type: String,
    enum: ["baixo", "medio", "alto"],
    required: true,
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

FuturaCompraSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.FuturaCompra ||
  mongoose.model("FuturaCompra", FuturaCompraSchema);
