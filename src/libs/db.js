// src/libs/db.js
import mongoose from "mongoose";

/**
 * Conexão cacheada em `global` para sobreviver a hot reloads em desenvolvimento
 * e ser reaproveitada entre requisições em produção.
 */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Defina a variável MONGODB_URI no arquivo .env.local");
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      })
      .catch((error) => {
        cached.promise = null;
        throw new Error(`Falha na conexão MongoDB: ${error.message}`);
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

mongoose.connection.on("disconnected", () => {
  cached.conn = null;
  cached.promise = null;
});
