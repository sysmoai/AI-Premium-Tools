import { requireAdmin } from "../../lib/admin-auth";

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  SESSION_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const MAX_BYTES = 25 * 1024 * 1024;

function sanitizeText(value: FormDataEntryValue | null, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/<[^>]*>/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return json({ error: "file is required" }, 400);
  if (!ALLOWED.has(value.type)) return json({ error: "Unsupported media type" }, 415);
  if (value.size <= 0 || value.size > MAX_BYTES) {
    return json({ error: "File must be 25 MB or smaller" }, 413);
  }

  const altText = sanitizeText(form.get("alt_text"), 300);
  const caption = sanitizeText(form.get("caption"), 1000);
  const assetType = value.type.startsWith("video/") ? "video" : "image";
  const ext = value.name.includes(".")
    ? value.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  const now = new Date();
  const datePath = now.toISOString().slice(0, 10).replace(/-/g, "/");
  const key = `library/${datePath}/${crypto.randomUUID()}.${ext || "bin"}`;

  await env.MEDIA.put(key, value.stream(), {
    httpMetadata: {
      contentType: value.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: { originalName: value.name.slice(0, 200) },
  });

  try {
    const result = await env.DB.prepare(
      `INSERT INTO media_assets
       (r2_key, asset_type, mime_type, original_filename, size_bytes, alt_text, caption, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    )
      .bind(
        key,
        assetType,
        value.type,
        value.name.slice(0, 200),
        value.size,
        altText,
        caption,
        now.getTime(),
        now.getTime(),
      )
      .run();

    return json(
      {
        id: result.meta.last_row_id,
        key,
        url: `/media/${key}`,
        asset_type: assetType,
        mime_type: value.type,
        original_filename: value.name.slice(0, 200),
        size_bytes: value.size,
        alt_text: altText,
        caption,
        status: "active",
        created_at: now.toISOString(),
      },
      201,
    );
  } catch (error) {
    await env.MEDIA.delete(key).catch(() => undefined);
    console.error("Failed to persist media metadata", error);
    return json({ error: "Could not save media metadata" }, 500);
  }
};
