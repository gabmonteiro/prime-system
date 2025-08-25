import mongoose from "mongoose";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });

// Conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Conectado ao MongoDB");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

// Schemas para verificar dados
const ServicoSchema = new mongoose.Schema({
  cliente: String,
  tipoServico: mongoose.Schema.Types.Mixed,
  data: String,
  participantes: [mongoose.Schema.Types.Mixed],
  valorPersonalizado: Number,
  createdAt: Date,
  updatedAt: Date
});

const Servico = mongoose.model("Servico", ServicoSchema);

// Função para corrigir dados corrompidos
async function fixCorruptedData() {
  try {
    console.log("🔄 Verificando e corrigindo dados corrompidos...");
    
    // 1. Corrigir serviços com participantes inválidos
    console.log("\n📋 Verificando serviços...");
    const servicos = await Servico.find({});
    console.log(`   Encontrados ${servicos.length} serviços`);
    
    let servicosCorrigidos = 0;
    for (const servico of servicos) {
      let needsUpdate = false;
      const updateData = {};
      
      // Verificar participantes
      if (servico.participantes && Array.isArray(servico.participantes)) {
        const participantesCorrigidos = [];
        
        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            console.log(`   ⚠️  Serviço ${servico._id}: participante inválido "${participante}" (string) - removendo`);
            // Remover participante inválido
            needsUpdate = true;
          } else if (participante && typeof participante === 'object' && participante._id) {
            // Verificar se o ObjectId é válido
            if (mongoose.Types.ObjectId.isValid(participante._id)) {
              participantesCorrigidos.push(participante._id);
            } else {
              console.log(`   ⚠️  Serviço ${servico._id}: ObjectId inválido "${participante._id}" - removendo`);
              needsUpdate = true;
            }
          } else {
            console.log(`   ⚠️  Serviço ${servico._id}: participante inválido ${JSON.stringify(participante)} - removendo`);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          updateData.participantes = participantesCorrigidos;
          updateData.updatedAt = new Date();
        }
      }
      
      // Verificar tipoServico
      if (servico.tipoServico && typeof servico.tipoServico === 'string') {
        console.log(`   ⚠️  Serviço ${servico._id}: tipoServico inválido "${servico.tipoServico}" (string) - removendo`);
        updateData.tipoServico = null;
        needsUpdate = true;
      }
      
      // Aplicar correções se necessário
      if (needsUpdate) {
        await Servico.findByIdAndUpdate(servico._id, updateData);
        servicosCorrigidos++;
        console.log(`   ✅ Serviço ${servico._id} corrigido`);
      }
    }
    
    console.log(`\n📊 Resumo da correção de serviços:`);
    console.log(`   Total de serviços: ${servicos.length}`);
    console.log(`   Serviços corrigidos: ${servicosCorrigidos}`);
    
    // 2. Verificar se há serviços com participantes vazios ou inválidos
    console.log("\n🔍 Verificando serviços com problemas...");
    const servicosComProblemas = await Servico.find({
      $or: [
        { participantes: { $exists: false } },
        { participantes: null },
        { participantes: { $size: 0 } },
        { "participantes.0": { $exists: false } }
      ]
    });
    
    console.log(`   Serviços com problemas de participantes: ${servicosComProblemas.length}`);
    
    if (servicosComProblemas.length > 0) {
      console.log("   💡 Recomendação: Verifique se esses serviços precisam de participantes");
    }
    
    console.log("\n🎉 Verificação e correção concluída!");
    console.log("\n💡 Próximos passos:");
    console.log("   1. Execute 'npm run fix:users' para corrigir usuários");
    console.log("   2. Teste o dashboard novamente");
    console.log("   3. Se ainda houver problemas, verifique os logs");
    
  } catch (error) {
    console.error("❌ Erro durante a correção:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Função para listar serviços com problemas
async function listProblematicServices() {
  try {
    console.log("🔍 Listando serviços com problemas...");
    
    const servicos = await Servico.find({});
    console.log(`\n📋 Total de serviços: ${servicos.length}\n`);
    
    let problemasEncontrados = 0;
    
    for (const servico of servicos) {
      let temProblema = false;
      const problemas = [];
      
      // Verificar participantes
      if (servico.participantes && Array.isArray(servico.participantes)) {
        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            temProblema = true;
            problemas.push(`participante inválido: "${participante}" (string)`);
          } else if (participante && typeof participante === 'object' && participante._id) {
            if (!mongoose.Types.ObjectId.isValid(participante._id)) {
              temProblema = true;
              problemas.push(`ObjectId inválido: "${participante._id}"`);
            }
          }
        }
      }
      
      // Verificar tipoServico
      if (servico.tipoServico && typeof servico.tipoServico === 'string') {
        temProblema = true;
        problemas.push(`tipoServico inválido: "${servico.tipoServico}" (string)`);
      }
      
      if (temProblema) {
        problemasEncontrados++;
        console.log(`${problemasEncontrados}. Serviço ID: ${servico._id}`);
        console.log(`   Cliente: ${servico.cliente}`);
        console.log(`   Data: ${servico.data}`);
        console.log(`   Problemas: ${problemas.join(', ')}`);
        console.log("");
      }
    }
    
    if (problemasEncontrados === 0) {
      console.log("✅ Nenhum problema encontrado nos serviços!");
    } else {
      console.log(`⚠️  Total de serviços com problemas: ${problemasEncontrados}`);
      console.log("💡 Execute 'npm run fix:corrupted' para corrigir automaticamente");
    }
    
  } catch (error) {
    console.error("❌ Erro ao listar serviços:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar baseado nos argumentos da linha de comando
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case "fix":
      await connectDB();
      await fixCorruptedData();
      break;
      
    case "list":
      await connectDB();
      await listProblematicServices();
      break;
      
    default:
      console.log("🔧 Script para corrigir dados corrompidos no Prime System");
      console.log("\n📖 Comandos disponíveis:");
      console.log("   node fixCorruptedData.js fix   - Corrigir dados corrompidos automaticamente");
      console.log("   node fixCorruptedData.js list - Listar serviços com problemas");
      console.log("\n💡 Exemplos:");
      console.log("   node fixCorruptedData.js fix");
      console.log("   node fixCorruptedData.js list");
      console.log("\n🎯 Este script corrige:");
      console.log("   • Participantes inválidos em serviços");
      console.log("   • ObjectIds corrompidos");
      console.log("   • Campos tipoServico inválidos");
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixCorruptedData, listProblematicServices };
