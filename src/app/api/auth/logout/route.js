import { SESSION_COOKIE } from "../../../../libs/session.js";

export async function POST() {
  const response = Response.json({ success: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0`,
  );
  response.headers.append("Set-Cookie", "user=; Path=/; Max-Age=0");
  return response;
}
