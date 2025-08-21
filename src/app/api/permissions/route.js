import {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
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
      const permission = await getPermissionById(id);
      if (!permission) {
        return Response.json({ error: "Permissão não encontrada" }, { status: 404 });
      }
      return Response.json(permission);
    }
    
    const permissions = await getAllPermissions();
    return Response.json(permissions);
  } catch (error) {
    console.error("Error in GET /api/permissions:", error);
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
    const { userId, userName, ...permissionData } = data;
    
    const permission = await createPermission(permissionData);
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: adminCheck.user._id,
        userName: adminCheck.user.name,
        action: "CREATE",
        model: "Permission",
        documentId: permission._id,
        newData: permission,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "create_permission" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(permission, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/permissions:", error);
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
      return Response.json({ error: "ID da permissão é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getPermissionById(id);
    const permission = await updatePermission(id, data);
    
    if (!permission) {
      return Response.json({ error: "Permissão não encontrada" }, { status: 404 });
    }
    
    // Log de auditoria
    try {
      const changedFields = AuditService.getChangedFields(previousData, permission);
      await AuditService.createLog({
        userId: adminCheck.user._id,
        userName: adminCheck.user.name,
        action: "UPDATE",
        model: "Permission",
        documentId: id,
        previousData,
        newData: permission,
        changedFields,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "update_permission" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json(permission);
  } catch (error) {
    console.error("Error in PUT /api/permissions:", error);
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
      return Response.json({ error: "ID da permissão é obrigatório" }, { status: 400 });
    }
    
    const previousData = await getPermissionById(id);
    const result = await deletePermission(id);
    
    if (!result) {
      return Response.json({ error: "Permissão não encontrada" }, { status: 404 });
    }
    
    // Log de auditoria
    try {
      await AuditService.createLog({
        userId: adminCheck.user._id,
        userName: adminCheck.user.name,
        action: "DELETE",
        model: "Permission",
        documentId: id,
        previousData,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A",
        userAgent: request.headers.get("user-agent") || "N/A",
        metadata: { operation: "delete_permission" },
      });
    } catch (auditError) {
      console.error("Erro ao criar log de auditoria:", auditError);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/permissions:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
