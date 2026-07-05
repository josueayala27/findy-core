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
 * return a signed JWT. Protected by SYNC_SECRET (not the user JWT).
 *
 * This lets the frontend bridge any auth provider (Google, credentials…)
 * without sharing JWT_SECRET between the two services.
 *
 * Returns a JWT with sub = findy-core's user.id (not necessarily the
 * frontend user id if the email was already registered).
 */
const syncUserSchema = z.object({
  id: z.string().uuid(),
  // email may be empty for some OAuth providers; fall back to a derived address
  email: z.string(),
  firstName: z.string().default("User"),
  lastName: z.string().default(""),
});

/** Timing-safe comparison for secrets (avoids string-equality timing attacks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const authRoute = new Hono()
  .post("/sync-user", async (c, next) => {
    // Auth check runs BEFORE body validation so auth errors take priority
    const syncSecret = process.env.SYNC_SECRET;
    if (!syncSecret) {
      return c.json({ error: "SYNC_SECRET not configured" }, 500);
    }
    const authHeader = c.req.header("Authorization") ?? "";
    const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!safeEqual(provided, syncSecret)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  }, zValidator("json", syncUserSchema), async (c) => {
    let { id, email, firstName, lastName } = c.req.valid("json");

    // Ensure a valid email — derive one if the provider did not supply it
    if (!email || !email.includes("@")) {
      email = `${id}@external.findy.place`;
    }

    const db = getDb();

    // Look up by id first, then by email (covers re-registrations / provider changes)
    let [existing] = await db
      .select()
      .from(users)
      .where(or(eq(users.id, id), eq(users.email, email)))
      .limit(1);

    if (!existing) {
      try {
        const [created] = await db
          .insert(users)
          .values({ id, email, firstName, lastName, authProvider: "external" })
          .returning();
        existing = created;
      } catch {
        // Race condition: another request inserted the same user — re-fetch
        const [refetched] = await db
          .select()
          .from(users)
          .where(or(eq(users.id, id), eq(users.email, email)))
          .limit(1);
        if (!refetched) {
          return c.json({ error: "Failed to create user" }, 500);
        }
        existing = refetched;
      }
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
