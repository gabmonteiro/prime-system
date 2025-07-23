// Script para seed do banco de dados

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserService } from './src/services/userService.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não definida no .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // ...apenas seed de serviços e despesas...

    // Models
    const Servico = (await import('./src/models/servico.js')).default;
    const TipoServico = (await import('./src/models/tipoServico.js')).default;
    const Despesa = (await import('./src/models/despesa.js')).default;

    // Seed tipos de serviço
    const tipos = [
      { nome: 'Troca de óleo', valor: 120 },
      { nome: 'Revisão', valor: 250 },
      { nome: 'Alinhamento', valor: 80 },
      { nome: 'Lavagem', valor: 60 },
      { nome: 'Funilaria', valor: 400 }
    ];
    const tiposDocs = await TipoServico.insertMany(tipos);

    // Seed serviços aleatórios
    const participantes = ['Gabriel', 'Davi', 'Samuel'];
    const clientes = ['João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Carla'];
    const carros = ['Civic', 'Corolla', 'Onix', 'HB20', 'Gol', 'Fiesta'];
    const servicosSeed = [];
    for (let i = 0; i < 25; i++) {
      const tipo = tiposDocs[Math.floor(Math.random() * tiposDocs.length)];
      const data = new Date();
      data.setMonth(data.getMonth() - Math.floor(Math.random() * 3));
      data.setDate(17 + Math.floor(Math.random() * 10));
      servicosSeed.push({
        cliente: clientes[Math.floor(Math.random() * clientes.length)],
        nomeCarro: carros[Math.floor(Math.random() * carros.length)],
        tipoServico: tipo._id,
        data,
        participantes: participantes.filter(() => Math.random() > 0.5)
      });
    }
    await Servico.insertMany(servicosSeed);
    console.log('25 serviços criados');

    // Seed despesas aleatórias
    const tiposDespesa = ['compra', 'gasto'];
    const despesasSeed = [];
    for (let i = 0; i < 25; i++) {
      const data = new Date();
      data.setMonth(data.getMonth() - Math.floor(Math.random() * 3));
      data.setDate(17 + Math.floor(Math.random() * 10));
      despesasSeed.push({
        nome: `Despesa ${i + 1}`,
        valor: Math.floor(Math.random() * 400) + 50,
        tipo: tiposDespesa[Math.floor(Math.random() * tiposDespesa.length)],
        data
      });
    }
    await Despesa.insertMany(despesasSeed);
    console.log('25 despesas criadas');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fazer seed:', err);
    process.exit(1);
  }
}

main();