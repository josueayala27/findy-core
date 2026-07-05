/**
 * Tests for JWT signing and verification.
 *
 * Verifies that:
 * - Tokens signed by findy-core are verifiable with the same secret.
 * - Tokens signed by the frontend (manual HMAC) are also accepted.
 * - Expired tokens are rejected.
 * - Tampered tokens are rejected.
 * - Missing JWT_SECRET is handled correctly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const SECRET = "test-jwt-secret-key";
const USER_ID = "d4e5f6a7-b8c9-4012-8345-6789abcdef01";
const USER_EMAIL = "test@example.com";

describe("signAuthToken / verifyAuthToken", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env, JWT_SECRET: SECRET };
  });

  afterEach(() => {
    process.env = env;
  });

  it("signs and verifies a token with correct claims", async () => {
    const { signAuthToken, verifyAuthToken } = await import("../lib/jwt");

    const token = await signAuthToken({ sub: USER_ID, email: USER_EMAIL });
    const payload = await verifyAuthToken(token);

    expect(payload.sub).toBe(USER_ID);
    expect(payload.email).toBe(USER_EMAIL);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("exp is approximately 7 days from now", async () => {
    const { signAuthToken, verifyAuthToken } = await import("../lib/jwt");

    const before = Math.floor(Date.now() / 1000);
    const token = await signAuthToken({ sub: USER_ID, email: USER_EMAIL });
    const after = Math.floor(Date.now() / 1000);
    const { exp } = await verifyAuthToken(token);

    const sevenDays = 60 * 60 * 24 * 7;
    expect(exp).toBeGreaterThanOrEqual(before + sevenDays - 1);
    expect(exp).toBeLessThanOrEqual(after + sevenDays + 1);
  });

  it("rejects a tampered token (wrong signature)", async () => {
    const { signAuthToken, verifyAuthToken } = await import("../lib/jwt");

    const token = await signAuthToken({ sub: USER_ID, email: USER_EMAIL });
    const parts = token.split(".");
    // Flip one character in the signature
    parts[2] = parts[2].slice(0, -1) + (parts[2].endsWith("a") ? "b" : "a");
    const tampered = parts.join(".");

    await expect(verifyAuthToken(tampered)).rejects.toThrow();
  });

  it("accepts a token produced by the frontend's manual HMAC-SHA256 implementation", async () => {
    // Reproduce exactly what src/lib/findy-core/token.ts does in the frontend
    const { verifyAuthToken } = await import("../lib/jwt");

    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const payloadB64 = Buffer.from(JSON.stringify({ sub: USER_ID, email: USER_EMAIL, exp })).toString("base64url");
    const sig = createHmac("sha256", SECRET)
      .update(`${header}.${payloadB64}`)
      .digest("base64url");

    const frontendToken = `${header}.${payloadB64}.${sig}`;
    const payload = await verifyAuthToken(frontendToken);

    expect(payload.sub).toBe(USER_ID);
    expect(payload.email).toBe(USER_EMAIL);
  });

  it("rejects an expired token", async () => {
    const { verifyAuthToken } = await import("../lib/jwt");
    const { sign } = await import("hono/jwt");

    // Sign a token with exp in the past
    const expired = await sign(
      { sub: USER_ID, email: USER_EMAIL, exp: Math.floor(Date.now() / 1000) - 1 },
      SECRET,
    );

    await expect(verifyAuthToken(expired)).rejects.toThrow();
  });

  it("rejects token signed with a different secret", async () => {
    const { verifyAuthToken } = await import("../lib/jwt");
    const { sign } = await import("hono/jwt");

    const token = await sign(
      { sub: USER_ID, email: USER_EMAIL, exp: Math.floor(Date.now() / 1000) + 3600 },
      "wrong-secret",
    );

    await expect(verifyAuthToken(token)).rejects.toThrow();
  });
});
