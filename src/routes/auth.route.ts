import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import { signAuthToken } from "../lib/jwt";

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRoute = new Hono()
  .post("/signup", zValidator("json", signupSchema), async (c) => {
    const { firstName, lastName, email, password } = c.req.valid("json");
    const db = getDb();

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({ firstName, lastName, email, passwordHash }).returning();

    const token = await signAuthToken({ sub: user.id, email: user.email });
    return c.json({ token }, 201);
  })
  .post("/login", zValidator("json", credentialsSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const db = getDb();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const token = await signAuthToken({ sub: user.id, email: user.email });
    return c.json({ token });
  });
