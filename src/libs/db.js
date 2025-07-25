import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// src/libs/db.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Por favor, defina a variável MONGODB_URI no arquivo .env.local",
  );
}

/**
 * Global é usado aqui para manter uma conexão cached através de hot reloads
 * no desenvolvimento. Isso previne conexões duplicadas durante o desenvolvimento.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Se já tem conexão ativa, retorna ela
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  // Se há uma promise pendente, aguarda ela
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
    };

    console.log("🔄 Conectando ao MongoDB...");
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB conectado com sucesso!");
      console.log(`📊 Estado da conexão: ${mongoose.connection.readyState}`);
      console.log(`🏠 Host: ${mongoose.connection.host}`);
      console.log(`🗃️  Database: ${mongoose.connection.name}`);
      return mongoose;
    }).catch((error) => {
      console.error("❌ Erro ao conectar ao MongoDB:", error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ Falha na conexão MongoDB:", e);
    throw e;
  }

  // Verificar se a conexão está realmente ativa
  if (cached.conn.connection.readyState !== 1) {
    console.warn("⚠️ Conexão MongoDB não está ativa. ReadyState:", cached.conn.connection.readyState);
    cached.conn = null;
    cached.promise = null;
    throw new Error("Conexão MongoDB inativa");
  }

  return cached.conn;
}

// Adicionar listeners para monitorar a conexão
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erro na conexão Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado do MongoDB');
  // Limpar cache quando desconectar
  if (cached) {
    cached.conn = null;
    cached.promise = null;
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 Conexão MongoDB fechada devido ao término da aplicação');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fechar conexão MongoDB:', error);
    process.exit(1);
  }
});

export default connectDB;
