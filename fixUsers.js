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

// Schema temporário para usuários existentes
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
  role: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model("User", UserSchema);

// Função para corrigir usuários
async function fixUsers() {
  try {
    console.log("🔄 Corrigindo usuários existentes...");
    
    // Buscar todos os usuários
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuários`);
    
    for (const user of users) {
      console.log(`\n👤 Usuário: ${user.name} (${user.email})`);
      console.log(`   Estado atual: isAdmin=${user.isAdmin}, role=${user.role}`);
      
      let newRole;
      let needsUpdate = false;
      
      // Determinar novo role baseado no isAdmin
      if (user.isAdmin === true) {
        if (user.role !== "admin") {
          newRole = "admin";
          needsUpdate = true;
          console.log(`   ✅ Usuário admin -> role: "admin"`);
        }
      } else {
        // Para usuários não-admin, definir como "funcionario" se não estiver correto
        if (user.role !== "funcionario" && user.role !== "gerente" && user.role !== "visualizador") {
          newRole = "funcionario";
          needsUpdate = true;
          console.log(`   👷 Usuário comum -> role: "funcionario"`);
        }
      }
      
      if (needsUpdate) {
        // Atualizar usuário
        const updateData = {
          role: newRole,
          updatedAt: new Date()
        };
        
        // Remover campo isAdmin (opcional, mas recomendado)
        updateData.$unset = { isAdmin: 1 };
        
        await User.findByIdAndUpdate(user._id, updateData);
        console.log(`   ✅ Usuário corrigido com sucesso!`);
      } else {
        console.log(`   ℹ️  Usuário já está correto`);
      }
    }
    
    console.log("\n🎉 Correção concluída com sucesso!");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   • Usuários com isAdmin=true -> role='admin'");
    console.log("   • Usuários com isAdmin=false -> role='funcionario'");
    console.log("   • Campo isAdmin removido");
    console.log("\n💡 Dica: Você pode alterar os roles dos usuários 'funcionario' para 'gerente' ou 'visualizador' conforme necessário.");
    console.log("   Use: npm run update:user <email> <role>");
    
  } catch (error) {
    console.error("❌ Erro durante a correção:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar correção
if (import.meta.url === `file://${process.argv[1]}`) {
  fixUsers();
}

export { fixUsers };
