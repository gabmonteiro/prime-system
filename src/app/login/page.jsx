"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authContext";
import { BrandLogo } from "../../context/brandingContext";

import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setIsFormFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const router = useRouter();
  const { login, error, loading, user } = useAuth();

  useEffect(() => {
    // "Lembrar de mim" guarda apenas o email (a v1 guardava a senha: removido)
    try {
      localStorage.removeItem("prime-login");
      localStorage.removeItem("user");
      const savedEmail = localStorage.getItem("prime-email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (rememberMe) localStorage.setItem("prime-email", email);
      else localStorage.removeItem("prime-email");
    } catch {}
    const result = await login(email, password);
    if (result === true) {
      setToast({ type: "success", message: "Login realizado com sucesso!" });
    } else {
      setToast({
        type: "error",
        message:
          typeof result === "string"
            ? result
            : result?.message || "Erro ao fazer login.",
      });
    }
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold animate-fadeInScale ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          style={{ minWidth: "260px", textAlign: "center" }}
        >
          {toast.message}
        </div>
      )}

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10">
        {/* Login Card */}
        <div className="glass-strong rounded-3xl shadow-strong p-8 animate-fadeInScale">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="inline-flex mb-6 animate-slideInDown">
              <BrandLogo size="lg" />
            </div>

            <h1 className="text-3xl font-bold text-gradient-primary mb-2 animate-slideInUp">
              Bem-vindo de volta
            </h1>
            <p
              className="text-gray-600 font-medium animate-slideInUp"
              style={{ animationDelay: "0.1s" }}
            >
              Entre em sua conta para continuar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slideInUp">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon
                  className="text-red-500 mt-0.5 flex-shrink-0"
                  style={{ width: "20px", height: "20px" }}
                />
                <div>
                  <p className="text-red-800 text-sm font-semibold">
                    Erro de autenticação
                  </p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div
              className="space-y-2 animate-slideInUp"
              style={{ animationDelay: "0.2s" }}
            >
              <label className="block text-sm font-semibold text-gray-700">
                Endereço de email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="input-field w-full pl-4 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus-ring-blue text-gray-900 placeholder-gray-400 font-medium transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFormFocused(true)}
                  onBlur={() => setIsFormFocused(false)}
                  required
                  placeholder="exemplo@empresa.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div
              className="space-y-2 animate-slideInUp"
              style={{ animationDelay: "0.3s" }}
            >
              <label className="block text-sm font-semibold text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus-ring-blue text-gray-900 placeholder-gray-400 font-medium transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFormFocused(true)}
                  onBlur={() => setIsFormFocused(false)}
                  required
                  placeholder="••••••••••••"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <LockClosedIcon
                    className="text-gray-400"
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-blue-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon
                      className="text-gray-400"
                      style={{ width: "20px", height: "20px" }}
                    />
                  ) : (
                    <EyeIcon
                      className="text-gray-400"
                      style={{ width: "20px", height: "20px" }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div
              className="flex items-center justify-between animate-slideInUp"
              style={{ animationDelay: "0.4s" }}
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-50 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-600">
                  Lembrar de mim
                </span>
              </label>
              <span className="text-xs text-gray-500">
                Esqueceu a senha? Fale com o administrador.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full py-4 px-6 rounded-xl font-semibold text-white shadow-medium focus-ring-blue transition-all duration-200 animate-slideInUp ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:transform hover:scale-[1.02]"
              }`}
              style={{ animationDelay: "0.5s" }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <ArrowPathIcon
                    className="animate-spin text-white"
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <span>Entrar na conta</span>
                  <ArrowRightIcon
                    className="text-white"
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Security Badge */}
        <div
          className="mt-6 text-center animate-slideInUp"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="inline-flex items-center px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
            <ShieldCheckIcon
              className="text-green-500 mr-3"
              style={{ width: "20px", height: "20px" }}
            />
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-800">
                Conexão Segura
              </div>
              <div className="text-xs text-gray-600">
                Dados protegidos com criptografia
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
