import { createHmac, timingSafeEqual } from "node:crypto";

interface Env {
  MEDIA: R2Bucket;
  SESSION_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

function isAdmin(request: Request, env: Env): boolean {
  const secret = env.SESSION_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  const token = match?.[1]?.trim();
  if (!token) return false;
  const expected = createHmac("sha256", secret).update("aipt:admin:v1").digest("hex");
  return safeEqual(token, expected);
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);
const MAX_BYTES = 25 * 1024 * 1024;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SESSION_SECRET?.trim()) return json({ error: "Admin authentication unavailable" }, 503);
  if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);

  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return json({ error: "file is required" }, 400);
  if (!ALLOWED.has(value.type)) return json({ error: "Unsupported media type" }, 415);
  if (value.size <= 0 || value.size > MAX_BYTES) return json({ error: "File must be 25 MB or smaller" }, 413);

  const ext = value.name.includes(".") ? value.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext || "bin"}`;
  await env.MEDIA.put(key, value.stream(), {
    httpMetadata: { contentType: value.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: value.name.slice(0, 200) },
  });

  return json({ key, url: `/media/${key}`, contentType: value.type, size: value.size }, 201);
};
