import { Hono } from "hono";
import type { AuthTokenPayload } from "../lib/jwt";
import { authGuard } from "../middleware/auth-guard";

export const meRoute = new Hono<{ Variables: { user: AuthTokenPayload } }>().get("/", authGuard, (c) => {
  const user = c.get("user");
  return c.json({ id: user.sub, email: user.email });
});
