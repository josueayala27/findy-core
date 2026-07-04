import { sign, verify } from "hono/jwt";

const EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AuthTokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

export function signAuthToken(payload: { sub: string; email: string }): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  return sign({ ...payload, exp }, process.env.JWT_SECRET!);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  return (await verify(token, process.env.JWT_SECRET!, "HS256")) as AuthTokenPayload;
}
