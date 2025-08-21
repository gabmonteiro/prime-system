import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../../../services/permissionService.js";
import connectDB from "../../../libs/db.js";
import { AuditService } from "../../../services/auditService.js";
import { requireAdmin } from "../../../middlewares/permissionMiddleware.js";

export async function GET(request) {
  try {
    await connectDB();
    
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      const role = await getRoleById(id);
      if (!role) {
        return Response.json({ error: "Role não encontrada" }, { status: 404 });
      }
      return Response.json(role);
    }
    
    const roles = await getAllRoles();
    return Response.json(roles);
  } catch (error) {
    console.error("Error in GET /api/roles:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const data = await request.json();
    const { userId, userName, ...roleData } = data;
    
    const role = await createRole(roleData);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: adminCheck.user._id,
        userName: adminCheck.user.name,
        action: "CREATE",
        model: "Role",
        documentId: role._id,
        newData: role,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_role" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(role, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/roles:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const { id, userId, userName, ...data } = await request.json();
    
    if (!id) {
      return Response.json({ error: "ID da role é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getRoleById(id);
    const role = await updateRole(id, data);
    
    if (!role) {
      return Response.json({ error: "Role não encontrada" }, { status: 404 });
    }
    
    // Log de auditoria
    try {
      const changedFields = AuditService.getChangedFields(previousData, role);
      await AuditService.createLog({
        userId: adminCheck.user._id,
        userName: adminCheck.user.name,
        action: "UPDATE",
        model: "Role",
        documentId: id,
        previousData,
        newData: role,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_role" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(role);
  } catch (error) {
    console.error("Error in PUT /api/roles:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    // Verificar se é admin
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const { id } = await request.json();
    
    if (!id) {
      return Response.json({ error: "ID da role é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getRoleById(id);
    
    try {
      const result = await deleteRole(id);
      
      if (!result) {
        return Response.json({ error: "Role não encontrada" }, { status: 404 });
      }
      
      // Log de auditoria
      try {
        await AuditService.createLog({
          userId: adminCheck.user._id,
          userName: adminCheck.user.name,
          action: "DELETE",
          model: "Role",
          documentId: id,
          previousData,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
          userAgent: request.headers.get("user-agent") || "N/A",
          metadata: { operation: "delete_role" },
        });
      } catch (auditError) {
        console.error("Erro ao criar log de auditoria:", auditError);
      }
      
      return Response.json({ success: true });
    } catch (deleteError) {
      if (deleteError.message.includes("sistema")) {
        return Response.json({ error: deleteError.message }, { status: 400 });
      }
      throw deleteError;
    }
  } catch (error) {
    console.error("Error in DELETE /api/roles:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
