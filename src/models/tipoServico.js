import mongoose from 'mongoose';

const TipoServicoSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

TipoServicoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.TipoServico || mongoose.model('TipoServico', TipoServicoSchema);
