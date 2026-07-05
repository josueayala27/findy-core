import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
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

/**
 * Server-to-server endpoint: upsert a frontend user into findy-core's DB and
 * return a signed JWT. Protected by SYNC_SECRET, not by the user JWT.
 *
 * This lets the frontend bridge any auth provider (Google, credentials…)
 * without requiring a shared JWT_SECRET between the two services.
 */
const syncUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).default("User"),
  lastName: z.string().default(""),
});

export const authRoute = new Hono()
  .post("/sync-user", zValidator("json", syncUserSchema), async (c) => {
    const syncSecret = process.env.SYNC_SECRET;
    if (!syncSecret) {
      return c.json({ error: "SYNC_SECRET not configured" }, 500);
    }

    const authHeader = c.req.header("Authorization");
    if (authHeader !== `Bearer ${syncSecret}`) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const { id, email, firstName, lastName } = c.req.valid("json");
    const db = getDb();

    // Look up by id first, then by email (handles re-registrations)
    let [existing] = await db
      .select()
      .from(users)
      .where(or(eq(users.id, id), eq(users.email, email)))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(users)
        .values({ id, email, firstName, lastName, authProvider: "external" })
        .returning();
      existing = created;
    }

    const token = await signAuthToken({ sub: existing.id, email: existing.email });
    return c.json({ token });
  })
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
