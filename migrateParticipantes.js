// Script de migração para converter participantes de strings para referências de usuários
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

// Schema para serviços
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

// Mapeamento de nomes para ObjectIds
const NOME_PARA_ID = {
  "Gabriel": "6882d6bbd3b196173c6f4380",
  "Samuel": "6882d6dfd3b196173c6f4384", 
  "Davi": "6882e37aecf787db73a8ddd2"
};

// Função para fazer backup dos dados
async function fazerBackup() {
  try {
    console.log("💾 Fazendo backup dos dados...");
    
    const servicos = await Servico.find({});
    const backupData = {
      timestamp: new Date().toISOString(),
      totalServicos: servicos.length,
      servicos: servicos.map(s => ({
        _id: s._id,
        participantes: s.participantes,
        cliente: s.cliente,
        data: s.data
      }))
    };
    
    // Salvar backup em arquivo
    const fs = await import('fs');
    const backupFileName = `backup_participantes_${Date.now()}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup salvo em: ${backupFileName}`);
    return backupFileName;
    
  } catch (error) {
    console.error("❌ Erro ao fazer backup:", error);
    throw error;
  }
}

// Função para verificar dados antes da migração
async function verificarDados() {
  try {
    console.log("🔍 Verificando dados antes da migração...");
    
    const servicos = await Servico.find({});
    console.log(`📊 Total de serviços encontrados: ${servicos.length}`);
    
    let servicosComStrings = 0;
    let totalParticipantesStrings = 0;
    let servicosComObjectIds = 0;
    let totalParticipantesObjectIds = 0;
    
    for (const servico of servicos) {
      if (servico.participantes && Array.isArray(servico.participantes)) {
        let temString = false;
        let temObjectId = false;
        
        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            temString = true;
            totalParticipantesStrings++;
          } else if (participante && typeof participante === 'object' && participante._id) {
            temObjectId = true;
            totalParticipantesObjectIds++;
          }
        }
        
        if (temString) servicosComStrings++;
        if (temObjectId) servicosComObjectIds++;
      }
    }
    
    console.log("\n📋 Resumo da verificação:");
    console.log(`   • Serviços com participantes em string: ${servicosComStrings}`);
    console.log(`   • Total de participantes em string: ${totalParticipantesStrings}`);
    console.log(`   • Serviços com participantes em ObjectId: ${servicosComObjectIds}`);
    console.log(`   • Total de participantes em ObjectId: ${totalParticipantesObjectIds}`);
    
    return {
      servicosComStrings,
      totalParticipantesStrings,
      servicosComObjectIds,
      totalParticipantesObjectIds
    };
    
  } catch (error) {
    console.error("❌ Erro na verificação:", error);
    throw error;
  }
}

// Função para migrar participantes
async function migrarParticipantes(dryRun = true) {
  try {
    console.log(`🔄 ${dryRun ? 'SIMULAÇÃO' : 'MIGRAÇÃO REAL'} de participantes...`);
    
    const servicos = await Servico.find({});
    console.log(`📊 Processando ${servicos.length} serviços...`);
    
    let servicosProcessados = 0;
    let participantesMigrados = 0;
    let servicosComErros = 0;
    
    for (const servico of servicos) {
      try {
        if (!servico.participantes || !Array.isArray(servico.participantes)) {
          continue; // Pular serviços sem participantes
        }
        
        let needsUpdate = false;
        const participantesNovos = [];
        
        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            // Verificar se é um dos nomes conhecidos
            if (NOME_PARA_ID[participante]) {
              const objectId = new mongoose.Types.ObjectId(NOME_PARA_ID[participante]);
              participantesNovos.push(objectId);
              participantesMigrados++;
              needsUpdate = true;
              
              console.log(`   ✅ Serviço ${servico._id}: "${participante}" -> ${objectId}`);
            } else {
              // Nome desconhecido - manter como está
              console.log(`   ⚠️  Serviço ${servico._id}: nome desconhecido "${participante}" - mantendo`);
              participantesNovos.push(participante);
            }
          } else if (participante && typeof participante === 'object' && participante._id) {
            // Já é um ObjectId válido - manter
            participantesNovos.push(participante._id);
          } else {
            // Dado inválido - manter como está para não perder informação
            console.log(`   ⚠️  Serviço ${servico._id}: participante inválido ${JSON.stringify(participante)} - mantendo`);
            participantesNovos.push(participante);
          }
        }
        
        if (needsUpdate && !dryRun) {
          // Aplicar mudança real
          await Servico.findByIdAndUpdate(servico._id, {
            participantes: participantesNovos,
            updatedAt: new Date()
          });
        }
        
        if (needsUpdate) {
          servicosProcessados++;
        }
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar serviço ${servico._id}:`, error);
        servicosComErros++;
      }
    }
    
    console.log(`\n📊 Resumo da ${dryRun ? 'simulação' : 'migração'}:`);
    console.log(`   • Serviços processados: ${servicosProcessados}`);
    console.log(`   • Participantes migrados: ${participantesMigrados}`);
    console.log(`   • Serviços com erros: ${servicosComErros}`);
    
    if (dryRun) {
      console.log("\n💡 Esta foi uma SIMULAÇÃO. Para aplicar as mudanças, execute:");
      console.log("   npm run migrate:participantes:real");
    }
    
    return {
      servicosProcessados,
      participantesMigrados,
      servicosComErros
    };
    
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  }
}

// Função para verificar dados após migração
async function verificarAposMigracao() {
  try {
    console.log("🔍 Verificando dados após migração...");
    
    const servicos = await Servico.find({});
    let servicosComStrings = 0;
    let totalParticipantesStrings = 0;
    let servicosComObjectIds = 0;
    let totalParticipantesObjectIds = 0;
    
    for (const servico of servicos) {
      if (servico.participantes && Array.isArray(servico.participantes)) {
        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            totalParticipantesStrings++;
          } else if (participante && typeof participante === 'object' && participante._id) {
            totalParticipantesObjectIds++;
          }
        }
        
        if (servico.participantes.some(p => typeof p === 'string')) {
          servicosComStrings++;
        }
        if (servico.participantes.some(p => p && typeof p === 'object' && p._id)) {
          servicosComObjectIds++;
        }
      }
    }
    
    console.log("\n📋 Resumo pós-migração:");
    console.log(`   • Serviços ainda com strings: ${servicosComStrings}`);
    console.log(`   • Total de participantes em string: ${totalParticipantesStrings}`);
    console.log(`   • Serviços com ObjectIds: ${servicosComObjectIds}`);
    console.log(`   • Total de participantes em ObjectId: ${totalParticipantesObjectIds}`);
    
    if (totalParticipantesStrings === 0) {
      console.log("🎉 Migração concluída com sucesso! Todos os participantes foram convertidos para ObjectIds.");
    } else {
      console.log("⚠️  Alguns participantes ainda estão em string. Verifique se há nomes não mapeados.");
    }
    
  } catch (error) {
    console.error("❌ Erro na verificação pós-migração:", error);
    throw error;
  }
}

// Função principal
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case "check":
        await connectDB();
        await verificarDados();
        break;
        
      case "backup":
        await connectDB();
        await fazerBackup();
        break;
        
      case "simulate":
        await connectDB();
        await migrarParticipantes(true); // Dry run
        break;
        
      case "migrate":
        console.log("⚠️  ATENÇÃO: Esta é uma MIGRAÇÃO REAL no banco de produção!");
        console.log("   • Será feito backup automático");
        console.log("   • Dados serão alterados permanentemente");
        console.log("   • Certifique-se de que fez backup manual se necessário");
        
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const resposta = await new Promise((resolve) => {
          rl.question("\n🤔 Confirma que quer continuar? Digite 'SIM' para confirmar: ", resolve);
        });
        
        rl.close();
        
        if (resposta === 'SIM') {
          await connectDB();
          
          // Fazer backup primeiro
          const backupFile = await fazerBackup();
          console.log(`\n💾 Backup salvo em: ${backupFile}`);
          
          // Executar migração
          await migrarParticipantes(false);
          
          // Verificar resultado
          await verificarAposMigracao();
          
          console.log("\n🎉 Migração concluída com sucesso!");
          console.log(`💾 Backup salvo em: ${backupFile}`);
        } else {
          console.log("❌ Migração cancelada pelo usuário");
        }
        break;
        
      default:
        console.log("🔧 Script para migrar participantes de serviços (strings -> ObjectIds)");
        console.log("\n📖 Comandos disponíveis:");
        console.log("   npm run migrate:participantes:check     - Verificar dados antes da migração");
        console.log("   npm run migrate:participantes:backup    - Fazer backup dos dados");
        console.log("   npm run migrate:participantes:simulate  - Simular migração (sem alterar dados)");
        console.log("   npm run migrate:participantes:migrate   - Executar migração real (COM BACKUP)");
        console.log("\n💡 Recomendação:");
        console.log("   1. Execute 'check' para ver o estado atual");
        console.log("   2. Execute 'backup' para segurança");
        console.log("   3. Execute 'simulate' para ver o que será alterado");
        console.log("   4. Execute 'migrate' para aplicar as mudanças");
        console.log("\n⚠️  IMPORTANTE: Este script altera dados de produção!");
        console.log("   Sempre faça backup antes de executar!");
    }
    
  } catch (error) {
    console.error("❌ Erro na execução:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Desconectado do MongoDB");
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verificarDados, fazerBackup, migrarParticipantes, verificarAposMigracao };
