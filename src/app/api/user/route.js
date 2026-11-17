import { route, audit, badRequest } from "../../../libs/api.js";
import { hasPermission } from "../../../libs/permissions.js";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  listUsersForSelection,
  updateUser,
} from "../../../services/userService.js";

// Qualquer usuário logado pode listar nomes (para escolher participantes);
// a listagem completa exige usuarios:read.
export const GET = route(null, async ({ user, searchParams }) => {
  if (searchParams.get("forSelection") === "true") {
    return listUsersForSelection();
  }
  if (!hasPermission(user, "usuarios", "read")) {
    return Response.json(
      { error: "Acesso negado. Permissão insuficiente." },
      { status: 403 },
    );
  }
  const id = searchParams.get("id");
  if (id) return getUserById(id);
  return listUsers({
    q: searchParams.get("q"),
    role: searchParams.get("role"),
    status: searchParams.get("status"),
  });
});

export const POST = route(
  "usuarios:create",
  async ({ request, user, body }) => {
    const created = await createUser(user, await body());
    await audit(request, user, {
      action: "CREATE",
      model: "User",
      documentId: created._id,
      newData: created,
    });
    return Response.json(created, { status: 201 });
  },
);

export const PUT = route("usuarios:update", async ({ request, user, body }) => {
  const { id, ...data } = await body();
  if (!id) throw badRequest("ID do usuário é obrigatório");
  const { previous, user: updated } = await updateUser(user, id, data);
  await audit(request, user, {
    action: "UPDATE",
    model: "User",
    documentId: id,
    previousData: previous,
    newData: updated,
  });
  return updated;
});

export const DELETE = route(
  "usuarios:delete",
  async ({ request, user, body }) => {
    const { id } = await body();
    if (!id) throw badRequest("ID do usuário é obrigatório");
    const deleted = await deleteUser(user, id);
    await audit(request, user, {
      action: "DELETE",
      model: "User",
      documentId: id,
      previousData: deleted,
    });
    return { success: true };
  },
);
