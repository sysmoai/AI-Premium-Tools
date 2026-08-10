import { createHmac, timingSafeEqual } from "node:crypto";

export interface AdminAuthEnv {
  SESSION_SECRET?: string;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function hasAdminAuthConfig(env: AdminAuthEnv): boolean {
  return Boolean(env.SESSION_SECRET?.trim());
}

export function isAdminRequest(request: Request, env: AdminAuthEnv): boolean {
  const secret = env.SESSION_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  const token = match?.[1]?.trim();
  if (!token) return false;

  const expected = createHmac("sha256", secret).update("aipt:admin:v1").digest("hex");
  return safeEqual(token, expected);
}

export function requireAdmin(request: Request, env: AdminAuthEnv): Response | null {
  if (!hasAdminAuthConfig(env)) return json({ error: "Admin authentication unavailable" }, 503);
  if (!isAdminRequest(request, env)) return json({ error: "Unauthorized" }, 401);
  return null;
}
