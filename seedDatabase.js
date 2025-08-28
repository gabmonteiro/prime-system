// Script para seed do banco de dados

import connectDB from "./src/libs/db.js";
import Role from "./src/models/role.js";
import User from "./src/models/user.js";
import bcrypt from "bcryptjs";

// Roles padrão do sistema
const DEFAULT_ROLES = [
  {
    name: "admin",
    description: "Administrador com acesso completo ao sistema",
    isSystem: true,
    permissions: [
      "servicos:read",
      "servicos:create",
      "servicos:update",
      "servicos:delete",
      "servicos:manage",
      "despesas:read",
      "despesas:create",
      "despesas:update",
      "despesas:delete",
      "despesas:manage",
      "tipos-servicos:read",
      "tipos-servicos:create",
      "tipos-servicos:update",
      "tipos-servicos:delete",
      "tipos-servicos:manage",
      "usuarios:read",
      "usuarios:create",
      "usuarios:update",
      "usuarios:delete",
      "usuarios:manage",
      "lista-compras:read",
      "lista-compras:create",
      "lista-compras:update",
      "lista-compras:delete",
      "lista-compras:manage",
      "dashboard:read",
      "auditoria:read",
      "configuracoes:read",
      "configuracoes:update",
      "configuracoes:manage",
    ],
  },
  {
    name: "gerente",
    description: "Gerente com acesso a relatórios e configurações básicas",
    isSystem: true,
    permissions: [
      "servicos:manage",
      "despesas:manage",
      "tipos-servicos:manage",
      "lista-compras:manage",
      "dashboard:read",
      "configuracoes:read",
      "usuarios:read",
      "usuarios:create",
      "usuarios:update",
    ],
  },
  {
    name: "funcionario",
    description: "Funcionário com acesso básico para operações do dia a dia",
    isSystem: true,
    permissions: [
      "servicos:read",
      "servicos:create",
      "servicos:update",
      "despesas:read",
      "despesas:create",
      "despesas:update",
      "lista-compras:read",
      "lista-compras:create",
      "lista-compras:update",
      "dashboard:read",
      "tipos-servicos:read",
    ],
  },
  {
    name: "visualizador",
    description: "Usuário com acesso apenas para visualização de dados",
    isSystem: true,
    permissions: [
      "servicos:read",
      "despesas:read",
      "tipos-servicos:read",
      "lista-compras:read",
      "dashboard:read",
    ],
  },
];

// Usuário admin padrão
const DEFAULT_ADMIN = {
  name: "Administrador",
  email: "admin@prime.com",
  password: "admin123",
  role: "admin",
  isActive: true,
};

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed do banco de dados...");

    await connectDB();

    // Criar roles padrão
    console.log("📋 Criando roles padrão...");
    for (const roleData of DEFAULT_ROLES) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`✅ Role criada: ${role.name}`);
      } else {
        console.log(`ℹ️  Role já existe: ${role.name}`);
      }
    }

    // Criar usuário admin padrão
    console.log("👤 Criando usuário administrador padrão...");
    let adminUser = await User.findOne({ email: DEFAULT_ADMIN.email });
    if (!adminUser) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        DEFAULT_ADMIN.password,
        saltRounds,
      );

      adminUser = await User.create({
        ...DEFAULT_ADMIN,
        password: hashedPassword,
      });
      console.log(`✅ Usuário admin criado: ${adminUser.email}`);
      console.log(`🔑 Senha padrão: ${DEFAULT_ADMIN.password}`);
    } else {
      console.log(`ℹ️  Usuário admin já existe: ${adminUser.email}`);
    }

    console.log("🎉 Seed do banco de dados concluído com sucesso!");
    console.log("📝 Credenciais do admin:");
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Senha: ${DEFAULT_ADMIN.password}`);
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
