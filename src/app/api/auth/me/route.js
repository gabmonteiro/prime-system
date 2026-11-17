import { route } from "../../../../libs/api.js";
import { toPublicUser } from "../../../../services/userService.js";

export const GET = route(null, async ({ user }) => toPublicUser(user));
