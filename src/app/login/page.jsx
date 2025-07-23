

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login, error, loading, user } = useAuth();

  // Redireciona automaticamente após login bem-sucedido
  useEffect(() => {
    console.log('user no useEffect:', user);
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(email, password);
    console.log('Resultado login:', result);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Login</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm text-center">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
        <input
          type="email"
          className="w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-1">Senha</label>
        <input
          type="password"
          className="w-full px-4 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded font-semibold text-white bg-blue-600 hover:bg-blue-700 transition ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
