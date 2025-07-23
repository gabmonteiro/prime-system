import mongoose from 'mongoose';

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
  tipo: {
    type: String,
    enum: ['compra', 'gasto'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

DespesaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Despesa || mongoose.model('Despesa', DespesaSchema);
