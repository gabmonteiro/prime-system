"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para validar se o token ainda é válido
  const validateStoredUser = (storedUser) => {
    try {
      const userData = JSON.parse(storedUser);
      
      // Verificar se tem os campos obrigatórios
      if (!userData._id || !userData.email) {
        return null;
      }

      // Verificar se tem timestamp de login (para expiração)
      if (userData.loginTimestamp) {
        const loginTime = new Date(userData.loginTimestamp);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Expirar sessão após 24 horas
        if (hoursDiff > 24) {
          localStorage.removeItem("user");
          return null;
        }
      }

      return userData;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  };

  // Verificar autenticação no servidor
  const verifyAuthOnServer = async (userData) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData._id, email: userData.email }),
      });

      if (!response.ok) {
        throw new Error("Token inválido");
      }

      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      return false;
    }
  };

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        
        if (storedUser) {
          const userData = validateStoredUser(storedUser);
          
          if (userData) {
            // Verificar no servidor se o usuário ainda é válido
            const isValid = await verifyAuthOnServer(userData);
            
            if (isValid) {
              setUser(userData);
            } else {
              localStorage.removeItem("user");
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validações básicas
      if (!email || !password) {
        setError("Email e senha são obrigatórios");
        return false;
      }

      if (!email.includes("@")) {
        setError("Email inválido");
        return false;
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data && !data.message) {
        // Adicionar timestamp de login para controle de expiração
        const userWithTimestamp = {
          ...data,
          loginTimestamp: new Date().toISOString()
        };

        setUser(userWithTimestamp);
        localStorage.setItem("user", JSON.stringify(userWithTimestamp));
        
        // Limpar dados de lembrar login se existir
        localStorage.removeItem("prime-login");
        
        return true;
      } else {
        const errorMessage = data.message || data.error || "Usuário ou senha inválidos";
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      console.error("Erro durante login:", err);
      setError("Erro de conexão. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem("user");
    localStorage.removeItem("prime-login");
    
    // Opcional: notificar o servidor sobre logout
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }).catch(() => {
      // Ignorar erros de logout no servidor
    });
  };

  // Função para refresh do token/dados do usuário
  const refreshUser = async () => {
    if (!user) return false;

    try {
      const isValid = await verifyAuthOnServer(user);
      
      if (!isValid) {
        logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao renovar usuário:", error);
      logout();
      return false;
    }
  };

  // Auto-refresh a cada 30 minutos se o usuário estiver logado
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      await refreshUser();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
