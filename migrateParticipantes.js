// Script de migração para converter participantes de strings para referências de usuários
import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/user.js";
import Servico from "./src/models/servico.js";

// Configurar dotenv para usar .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI não definida no .env.local");
  process.exit(1);
}

async function migrateParticipantes() {
  try {
    console.log("🔄 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB conectado com sucesso!");

    // Buscar todos os usuários
    const usuarios = await User.find({}, "_id name");
    console.log(`📋 Usuários encontrados: ${usuarios.length}`);

    // Mapear nomes antigos para IDs de usuários
    const nomeToIdMap = {};
    usuarios.forEach(usuario => {
      nomeToIdMap[usuario.name] = usuario._id;
    });

    console.log("🗺️ Mapeamento de nomes para IDs:", nomeToIdMap);

    // Buscar todos os serviços
    const servicos = await Servico.find({});
    console.log(`🔧 Serviços encontrados: ${servicos.length}`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const servico of servicos) {
      if (Array.isArray(servico.participantes) && servico.participantes.length > 0) {
        let needsUpdate = false;
        const novosParticipantes = [];

        for (const participante of servico.participantes) {
          if (typeof participante === 'string') {
            // É uma string antiga, precisa converter
            const userId = nomeToIdMap[participante];
            if (userId) {
              novosParticipantes.push(userId);
              needsUpdate = true;
              console.log(`  ✅ Convertendo "${participante}" para ${userId}`);
            } else {
              console.log(`  ⚠️ Usuário "${participante}" não encontrado, mantendo como string`);
              novosParticipantes.push(participante);
            }
          } else {
            // Já é um ObjectId, manter como está
            novosParticipantes.push(participante);
          }
        }

        if (needsUpdate) {
          await Servico.findByIdAndUpdate(servico._id, {
            participantes: novosParticipantes
          });
          updatedCount++;
          console.log(`  🔄 Serviço ${servico._id} atualizado`);
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log("\n📊 Resumo da migração:");
    console.log(`  ✅ Serviços atualizados: ${updatedCount}`);
    console.log(`  ⏭️ Serviços ignorados: ${skippedCount}`);
    console.log(`  📝 Total processado: ${servicos.length}`);

    console.log("\n🎉 Migração concluída com sucesso!");

  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão MongoDB fechada");
    process.exit(0);
  }
}

// Executar migração
migrateParticipantes();
