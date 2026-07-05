/**
 * Tests for POST /auth/sync-user — the server-to-server endpoint that bridges
 * NextAuth users into findy-core's DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { authRoute } from "../routes/auth.route";

const SYNC_SECRET = "test-sync-secret-value";
const JWT_SECRET = "test-jwt-secret";
const USER_ID = "d4e5f6a7-b8c9-4012-8345-6789abcdef01";

// ── DB mock (must be hoisted above imports) ────────────────────────────────
const mockSelectResult: unknown[] = [];
const mockInsertResult: unknown[] = [];

vi.mock("../db/client", () => {
  return {
    getDb: () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(mockSelectResult),
          }),
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve(mockInsertResult),
        }),
      }),
    }),
  };
});

// ── Set env vars at module level ────────────────────────────────────────────
vi.stubEnv("JWT_SECRET", JWT_SECRET);
vi.stubEnv("SYNC_SECRET", SYNC_SECRET);

// ── Helpers ────────────────────────────────────────────────────────────────

const app = new Hono();
app.route("/auth", authRoute);

function makeRequest(body: Record<string, unknown>, secret: string | null = SYNC_SECRET) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret !== null) headers.Authorization = `Bearer ${secret}`;
  return app.request("/auth/sync-user", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  id: USER_ID,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
};

const DB_USER = {
  id: USER_ID,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  authProvider: "external",
  passwordHash: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  image: null,
  supabaseUserId: null,
};

beforeEach(() => {
  // Reset mock results
  mockSelectResult.length = 0;
  mockInsertResult.length = 0;
});

// ── Auth guard (runs before Zod validation) ────────────────────────────────

describe("POST /auth/sync-user — auth checks", () => {
  it("returns 403 when Authorization header is missing", async () => {
    const res = await makeRequest(VALID_BODY, null);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 when SYNC_SECRET does not match", async () => {
    const res = await makeRequest(VALID_BODY, "wrong-secret");
    expect(res.status).toBe(403);
  });

  it("returns 403 even when body is invalid (auth runs first)", async () => {
    const res = await makeRequest({ id: "not-a-uuid" }, "wrong-secret");
    expect(res.status).toBe(403);
  });
});

// ── Input validation ────────────────────────────────────────────────────────

describe("POST /auth/sync-user — validation", () => {
  it("returns 400 when id is not a UUID", async () => {
    const res = await makeRequest({ ...VALID_BODY, id: "not-a-uuid" });
    expect(res.status).toBe(400);
  });

  it("accepts empty email (derives placeholder)", async () => {
    mockSelectResult.push({
      ...DB_USER,
      email: `${USER_ID}@external.findy.place`,
    });
    const res = await makeRequest({ ...VALID_BODY, email: "" });
    expect(res.status).toBe(200);
  });
});

// ── New user creation ────────────────────────────────────────────────────────

describe("POST /auth/sync-user — new user", () => {
  it("creates a user and returns a JWT", async () => {
    // select finds nothing, insert returns the new user
    mockInsertResult.push(DB_USER);

    const res = await makeRequest(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe("string");
    expect(body.token.split(".")).toHaveLength(3);
  });

  it("token payload has correct sub and email", async () => {
    mockInsertResult.push(DB_USER);

    const res = await makeRequest(VALID_BODY);
    const { token } = await res.json();
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

    expect(payload.sub).toBe(DB_USER.id);
    expect(payload.email).toBe(DB_USER.email);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("token has 7-day expiry", async () => {
    mockInsertResult.push(DB_USER);
    const before = Math.floor(Date.now() / 1000);
    const res = await makeRequest(VALID_BODY);
    const { token } = await res.json();
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    expect(payload.exp).toBeGreaterThanOrEqual(before + 60 * 60 * 24 * 7 - 1);
  });
});

// ── Existing user ────────────────────────────────────────────────────────────

describe("POST /auth/sync-user — existing user", () => {
  it("returns a JWT without inserting when user is found", async () => {
    mockSelectResult.push(DB_USER);

    const res = await makeRequest(VALID_BODY);
    expect(res.status).toBe(200);
    const { token } = await res.json();
    expect(token.split(".")).toHaveLength(3);
  });

  it("token sub matches the existing user id", async () => {
    mockSelectResult.push(DB_USER);

    const res = await makeRequest(VALID_BODY);
    const { token } = await res.json();
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    expect(payload.sub).toBe(DB_USER.id);
  });
});

// ── Email edge cases ─────────────────────────────────────────────────────────

describe("POST /auth/sync-user — email fallback", () => {
  it("uses derived email when email is missing @", async () => {
    const expectedEmail = `${USER_ID}@external.findy.place`;
    mockInsertResult.push({ ...DB_USER, email: expectedEmail });

    const res = await makeRequest({ ...VALID_BODY, email: "notanemail" });
    expect(res.status).toBe(200);
    const { token } = await res.json();
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    expect(payload.email).toBe(expectedEmail);
  });
});

// ── Token usable by authGuard ────────────────────────────────────────────────

describe("POST /auth/sync-user — token integration", () => {
  it("returned token is accepted by authGuard", async () => {
    mockSelectResult.push(DB_USER);

    const syncRes = await makeRequest(VALID_BODY);
    const { token } = await syncRes.json();

    const { authGuard } = await import("../middleware/auth-guard");
    const testApp = new Hono<{ Variables: { user: { sub: string } } }>();
    testApp.get("/me", authGuard, (c) => c.json({ user: c.get("user") }));

    const meRes = await testApp.request("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.sub).toBe(DB_USER.id);
  });
});
