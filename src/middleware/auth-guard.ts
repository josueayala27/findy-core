import { createMiddleware } from "hono/factory";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/jwt";

export const authGuard = createMiddleware<{ Variables: { user: AuthTokenPayload } }>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const payload = await verifyAuthToken(token);
    c.set("user", payload);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
