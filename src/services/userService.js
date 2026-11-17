import bcrypt from "bcryptjs";
import User from "../models/user.js";
import {
  ROLES,
  getFormattedPermissions,
  getRolePermissions,
} from "../libs/permissions.js";
import {
  badRequest,
  forbidden,
  notFound,
  searchRegex,
  toObjectId,
} from "../libs/api.js";

const SALT_ROUNDS = 10;

/** Formato público do usuário (sem senha) com permissões. */
export function toPublicUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return {
    ...obj,
    isAdmin: obj.role === "admin",
    permissions: getFormattedPermissions(obj.role),
    permissionsList: getRolePermissions(obj.role),
  };
}

export async function listUsers({ q, role, status }) {
  const filter = {};
  const rx = searchRegex(q);
  if (rx) filter.$or = [{ name: rx }, { email: rx }];
  if (role && ROLES.includes(role)) filter.role = role;
  if (status === "ativo") filter.isActive = { $ne: false };
  if (status === "inativo") filter.isActive = false;
  const users = await User.find(filter, { password: 0 })
    .sort({ name: 1 })
    .lean();
  return users.map(toPublicUser);
}

export async function listUsersForSelection() {
  return User.find({}, { _id: 1, name: 1, role: 1, isActive: 1 })
    .sort({ name: 1 })
    .lean();
}

export async function getUserById(id) {
  const user = await User.findById(toObjectId(id), { password: 0 }).lean();
  if (!user) throw notFound("Usuário não encontrado");
  return toPublicUser(user);
}

function validate(data, { isNew }) {
  if (isNew || data.name !== undefined) {
    if (!data.name?.trim()) throw badRequest("Nome é obrigatório");
  }
  if (isNew || data.email !== undefined) {
    if (!data.email?.includes("@")) throw badRequest("Email inválido");
  }
  if (isNew || data.password) {
    if (!data.password || data.password.length < 6) {
      throw badRequest("A senha deve ter pelo menos 6 caracteres");
    }
  }
  if (isNew || data.role !== undefined) {
    if (!ROLES.includes(data.role)) throw badRequest("Perfil inválido");
  }
}

/**
 * Regras de hierarquia:
 * - Só admin cria/edita/exclui admins ou atribui o perfil admin.
 * - Ninguém altera o próprio perfil, nem se desativa/exclui.
 */
function assertCanManage(actor, target, data = {}) {
  const actorIsAdmin = actor.role === "admin";
  if (!actorIsAdmin && (target?.role === "admin" || data.role === "admin")) {
    throw forbidden("Apenas administradores podem gerenciar administradores");
  }
  if (target && String(target._id) === String(actor._id)) {
    if (data.role !== undefined && data.role !== target.role) {
      throw badRequest("Você não pode alterar o seu próprio perfil");
    }
    if (data.isActive === false) {
      throw badRequest("Você não pode desativar o seu próprio usuário");
    }
  }
}

export async function createUser(actor, data) {
  validate(data, { isNew: true });
  assertCanManage(actor, null, data);
  const email = data.email.toLowerCase().trim();
  if (await User.exists({ email })) throw badRequest("Email já está em uso");
  const user = await User.create({
    name: data.name.trim(),
    email,
    role: data.role,
    isActive: data.isActive !== false,
    password: await bcrypt.hash(data.password, SALT_ROUNDS),
  });
  return toPublicUser(user);
}

export async function updateUser(actor, id, data) {
  const user = await User.findById(toObjectId(id));
  if (!user) throw notFound("Usuário não encontrado");
  const previous = toPublicUser(user);
  validate(data, { isNew: false });
  assertCanManage(actor, user, data);

  if (data.name !== undefined) user.name = data.name.trim();
  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();
    if (email !== user.email && (await User.exists({ email }))) {
      throw badRequest("Email já está em uso");
    }
    user.email = email;
  }
  if (data.role !== undefined) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = Boolean(data.isActive);
  if (data.password) {
    user.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }
  await user.save();
  return { previous, user: toPublicUser(user) };
}

export async function deleteUser(actor, id) {
  const user = await User.findById(toObjectId(id));
  if (!user) throw notFound("Usuário não encontrado");
  if (String(user._id) === String(actor._id)) {
    throw badRequest("Não é possível excluir o próprio usuário");
  }
  assertCanManage(actor, user);
  await User.deleteOne({ _id: user._id });
  return toPublicUser(user);
}

export async function validateCredentials(email, password) {
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  });
  // Compara mesmo sem usuário para não vazar por tempo de resposta
  const hash =
    user?.password ||
    "$2b$10$CwTycUXWue0Thq9StjUM0uJ8a3Xv1m0Yw6m5xSxWZ0Gk3a8eQ6pW2";
  const ok = await bcrypt.compare(String(password), hash);
  if (!user || !ok || user.isActive === false) return null;
  return toPublicUser(user);
}
