import User from "../models/user.js";
import connectDB from "../libs/db.js";

// Middleware para verificar autenticação (compatível com o sistema existente)
export async function verifyAuth(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    
    if (!cookieHeader) {
      return null;
    }
    
    // Extrair o userId do cookie 'user'
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const userId = cookies.user;
    
    if (!userId) {
      return null;
    }
    
    await connectDB();
    
    const user = await User.findById(userId).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    return user;
  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return null;
  }
}

// Middleware para verificar permissões específicas
export function requirePermission(resource, action) {
  return async function(request) {
    try {
      const user = await verifyAuth(request);
      
      if (!user) {
        return {
          error: "Não autenticado",
          status: 401
        };
      }
      
      if (!user.isActive) {
        return {
          error: "Usuário inativo",
          status: 403
        };
      }
      
      const hasPermission = await user.hasPermission(resource, action);
      
      if (!hasPermission) {
        return {
          error: `Permissão negada: ${action} em ${resource}`,
          status: 403
        };
      }
      
      return {
        user,
        hasPermission: true
      };
    } catch (error) {
      console.error("Erro na verificação de permissão:", error);
      return {
        error: "Erro interno do servidor",
        status: 500
      };
    }
  };
}

// Middleware para verificar se é admin
export async function requireAdmin(request) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return {
        error: "Não autenticado",
        status: 401
      };
    }
    
    if (!user.isAdmin) {
      return {
        error: "Acesso negado: apenas administradores",
        status: 403
      };
    }
    
    return {
      user,
      isAdmin: true
    };
  } catch (error) {
    console.error("Erro na verificação de admin:", error);
    return {
      error: "Erro interno do servidor",
      status: 500
    };
  }
}

// Helper para aplicar middleware em rotas
export function withPermission(resource, action, handler) {
  return async function(request, context) {
    const permissionCheck = await requirePermission(resource, action)(request);
    
    if (permissionCheck.error) {
      return Response.json(
        { error: permissionCheck.error }, 
        { status: permissionCheck.status }
      );
    }
    
    // Adicionar usuário ao contexto da request
    request.user = permissionCheck.user;
    
    return handler(request, context);
  };
}

// Helper para aplicar middleware de admin em rotas
export function withAdmin(handler) {
  return async function(request, context) {
    const adminCheck = await requireAdmin(request);
    
    if (adminCheck.error) {
      return Response.json(
        { error: adminCheck.error }, 
        { status: adminCheck.status }
      );
    }
    
    // Adicionar usuário ao contexto da request
    request.user = adminCheck.user;
    
    return handler(request, context);
  };
}
