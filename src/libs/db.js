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
  try {
    // Se já tem conexão ativa e saudável, retorna ela
    if (cached.conn && cached.conn.connection.readyState === 1) {
      return cached.conn;
    }

    // Se a conexão está em estado ruim, limpa o cache
    if (cached.conn && cached.conn.connection.readyState !== 1) {
      console.warn(
        "⚠️ Limpando conexão inativa. ReadyState:",
        cached.conn.connection.readyState,
      );
      cached.conn = null;
      cached.promise = null;
    }

    // Se não há promise pendente, cria uma nova
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Aumentado para 10s
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        family: 4,
        retryWrites: true,
        retryReads: true,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
      };

      console.log("🔄 Conectando ao MongoDB...");

      cached.promise = mongoose
        .connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log("✅ MongoDB conectado com sucesso!");
          console.log(
            `📊 Estado da conexão: ${mongoose.connection.readyState}`,
          );
          console.log(`🏠 Host: ${mongoose.connection.host}`);
          console.log(`🗃️  Database: ${mongoose.connection.name}`);
          return mongoose;
        })
        .catch((error) => {
          console.error("❌ Erro ao conectar ao MongoDB:", error);
          cached.promise = null;
          throw new Error(`Falha na conexão MongoDB: ${error.message}`);
        });
    }

    // Aguarda a conexão
    cached.conn = await cached.promise;

    // Verificação final do estado da conexão
    if (!cached.conn || cached.conn.connection.readyState !== 1) {
      console.error("❌ Conexão MongoDB inválida após conectar");
      cached.conn = null;
      cached.promise = null;
      throw new Error("Conexão MongoDB inativa após tentativa de conexão");
    }

    return cached.conn;
  } catch (error) {
    console.error("❌ Erro crítico na conexão MongoDB:", error);
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

// Adicionar listeners para monitorar a conexão
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose conectado ao MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Erro na conexão Mongoose:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose desconectado do MongoDB");
  // Limpar cache quando desconectar
  if (cached) {
    cached.conn = null;
    cached.promise = null;
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("🛑 Conexão MongoDB fechada devido ao término da aplicação");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao fechar conexão MongoDB:", error);
    process.exit(1);
  }
});

export default connectDB;
