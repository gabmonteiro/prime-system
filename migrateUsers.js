import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

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

// Schema temporário para usuários existentes
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
  role: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model("User", UserSchema);

// Função para migrar usuários
async function migrateUsers() {
  try {
    console.log("🔄 Iniciando migração de usuários...");
    
    // Buscar todos os usuários
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuários para migrar`);
    
    for (const user of users) {
      console.log(`\n👤 Migrando usuário: ${user.name} (${user.email})`);
      console.log(`   Estado atual: isAdmin=${user.isAdmin}, role=${user.role}`);
      
      let newRole;
      
      // Determinar novo role baseado no isAdmin
      if (user.isAdmin === true) {
        newRole = "admin";
        console.log(`   ✅ Usuário admin -> role: "admin"`);
      } else {
        // Para usuários não-admin, definir como "funcionario" (pode ser alterado depois)
        newRole = "funcionario";
        console.log(`   👷 Usuário comum -> role: "funcionario"`);
      }
      
      // Atualizar usuário
      const updateData = {
        role: newRole,
        updatedAt: new Date()
      };
      
      // Remover campo isAdmin (opcional, mas recomendado)
      updateData.$unset = { isAdmin: 1 };
      
      await User.findByIdAndUpdate(user._id, updateData);
      
      console.log(`   ✅ Usuário migrado com sucesso!`);
    }
    
    console.log("\n🎉 Migração concluída com sucesso!");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   • Usuários com isAdmin=true -> role='admin'");
    console.log("   • Usuários com isAdmin=false -> role='funcionario'");
    console.log("   • Campo isAdmin removido");
    console.log("\n💡 Dica: Você pode alterar os roles dos usuários 'funcionario' para 'gerente' ou 'visualizador' conforme necessário.");
    
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar migração
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export { migrateUsers };
