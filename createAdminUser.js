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

// Schema do usuário
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Senha é obrigatória"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "gerente", "funcionario", "visualizador"],
    default: "funcionario",
  },
  isActive: {
    type: Boolean,
    default: true,
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

const User = mongoose.model("User", UserSchema);

// Função para criar usuário administrador
async function createAdminUser() {
  try {
    console.log("🔄 Criando usuário administrador...");
    
    // Verificar se já existe um usuário com este email
    const existingUser = await User.findOne({ email: "admin@prime.com" });
    
    if (existingUser) {
      console.log("⚠️  Usuário admin@prime.com já existe!");
      console.log("   ID:", existingUser._id);
      console.log("   Nome:", existingUser.name);
      console.log("   Role:", existingUser.role);
      
      // Perguntar se quer atualizar o role para admin
      console.log("\n💡 Para atualizar o role para 'admin', execute:");
      console.log("   npm run migrate:users");
      
      return;
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);
    
    // Criar usuário administrador
    const adminUser = new User({
      name: "Administrador",
      email: "admin@prime.com",
      password: hashedPassword,
      role: "admin",
      isActive: true
    });
    
    // Salvar no banco
    const savedUser = await adminUser.save();
    
    console.log("✅ Usuário administrador criado com sucesso!");
    console.log("   ID:", savedUser._id);
    console.log("   Nome:", savedUser.name);
    console.log("   Email:", savedUser.email);
    console.log("   Role:", savedUser.role);
    console.log("   Senha: admin123");
    
    console.log("\n🔐 Credenciais de acesso:");
    console.log("   Email: admin@prime.com");
    console.log("   Senha: admin123");
    
    console.log("\n💡 Agora você pode:");
    console.log("   1. Fazer login com essas credenciais");
    console.log("   2. Executar 'npm run migrate:users' para migrar usuários existentes");
    console.log("   3. Acessar todas as funcionalidades do sistema");
    
  } catch (error) {
    console.error("❌ Erro ao criar usuário administrador:", error);
    
    if (error.code === 11000) {
      console.log("\n💡 O email já está em uso. Execute 'npm run migrate:users' para migrar usuários existentes.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Função para listar todos os usuários
async function listUsers() {
  try {
    console.log("📋 Listando todos os usuários...");
    
    const users = await User.find({}, { password: 0 });
    
    if (users.length === 0) {
      console.log("   Nenhum usuário encontrado");
      return;
    }
    
    console.log(`\n👥 Total de usuários: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      console.log(`   Criado: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Função para atualizar role de um usuário específico
async function updateUserRole(email, newRole) {
  try {
    console.log(`🔄 Atualizando role do usuário ${email} para ${newRole}...`);
    
    const validRoles = ["admin", "gerente", "funcionario", "visualizador"];
    if (!validRoles.includes(newRole)) {
      console.error("❌ Role inválido. Use: admin, gerente, funcionario ou visualizador");
      return;
    }
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: newRole, updatedAt: new Date() },
      { new: true }
    );
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      return;
    }
    
    console.log("✅ Usuário atualizado com sucesso!");
    console.log("   Nome:", user.name);
    console.log("   Email:", user.email);
    console.log("   Novo Role:", user.role);
    
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
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
    case "create":
      await connectDB();
      await createAdminUser();
      break;
      
    case "list":
      await connectDB();
      await listUsers();
      break;
      
    case "update":
      if (args.length < 3) {
        console.log("❌ Uso: node createAdminUser.js update <email> <role>");
        console.log("   Exemplo: node createAdminUser.js update user@example.com admin");
        return;
      }
      await connectDB();
      await updateUserRole(args[1], args[2]);
      break;
      
    default:
      console.log("🔧 Script para gerenciar usuários no Prime System");
      console.log("\n📖 Comandos disponíveis:");
      console.log("   node createAdminUser.js create     - Criar usuário administrador");
      console.log("   node createAdminUser.js list       - Listar todos os usuários");
      console.log("   node createAdminUser.js update <email> <role> - Atualizar role de um usuário");
      console.log("\n💡 Exemplos:");
      console.log("   node createAdminUser.js create");
      console.log("   node createAdminUser.js list");
      console.log("   node createAdminUser.js update user@example.com admin");
      console.log("\n🎯 Roles disponíveis: admin, gerente, funcionario, visualizador");
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAdminUser, listUsers, updateUserRole };
