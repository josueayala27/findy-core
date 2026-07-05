/**
 * Tests for the authGuard middleware.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Hono } from "hono";
import { sign } from "hono/jwt";

const SECRET = "test-guard-secret";

describe("authGuard", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env, JWT_SECRET: SECRET };
  });

  afterEach(() => {
    process.env = env;
  });

  async function makeApp() {
    const { authGuard } = await import("../middleware/auth-guard");
    const app = new Hono<{ Variables: { user: { sub: string; email: string; exp: number } } }>();
    app.get("/protected", authGuard, (c) => c.json({ user: c.get("user") }));
    return app;
  }

  async function validToken(sub = "user-id", email = "u@test.com") {
    return sign({ sub, email, exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET);
  }

  it("returns 401 when Authorization header is missing", async () => {
    const app = await makeApp();
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header has no Bearer prefix", async () => {
    const app = await makeApp();
    const token = await validToken();
    const res = await app.request("/protected", {
      headers: { Authorization: token },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const app = await makeApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer not.a.real.token" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is signed with wrong secret", async () => {
    const app = await makeApp();
    const token = await sign(
      { sub: "id", email: "e@test.com", exp: Math.floor(Date.now() / 1000) + 3600 },
      "wrong-secret",
    );
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is expired", async () => {
    const app = await makeApp();
    const token = await sign(
      { sub: "id", email: "e@test.com", exp: Math.floor(Date.now() / 1000) - 1 },
      SECRET,
    );
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("grants access with a valid token and exposes user payload", async () => {
    const app = await makeApp();
    const sub = "d4e5f6a7-b8c9-4012-8345-6789abcdef01";
    const email = "valid@test.com";
    const token = await validToken(sub, email);

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.sub).toBe(sub);
    expect(body.user.email).toBe(email);
  });
});
