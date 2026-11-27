interface Env {
  MEDIA: R2Bucket;
}

interface ByteRange {
  offset: number;
  length: number;
}

const PRIVATE_BACKUP_PREFIX = "_aipt-backups/";

function parseRange(header: string, size: number): ByteRange | null {
  if (!header.startsWith("bytes=")) return null;
  const spec = header.slice(6).trim();
  if (!spec || spec.includes(",")) return null;

  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match) return null;

  const startText = match[1];
  const endText = match[2];

  if (!startText && !endText) return null;

  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }

  const start = Number(startText);
  if (!Number.isInteger(start) || start < 0 || start >= size) return null;

  const end = endText ? Number(endText) : size - 1;
  if (!Number.isInteger(end) || end < start) return null;

  const boundedEnd = Math.min(end, size - 1);
  return { offset: start, length: boundedEnd - start + 1 };
}

function baseHeaders(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  headers.set("accept-ranges", "bytes");
  return headers;
}

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const raw = params.key;
  const key = Array.isArray(raw) ? raw.join("/") : String(raw ?? "");
  if (!key || key.startsWith(PRIVATE_BACKUP_PREFIX)) return notFound();

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    const object = await env.MEDIA.get(key);
    if (!object) return notFound();

    const headers = baseHeaders(object);
    headers.set("content-length", String(object.size));
    return new Response(object.body, { status: 200, headers });
  }

  const metadata = await env.MEDIA.head(key);
  if (!metadata) return notFound();

  const range = parseRange(rangeHeader, metadata.size);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: {
        "content-range": `bytes */${metadata.size}`,
        "accept-ranges": "bytes",
        "cache-control": "no-store",
      },
    });
  }

  const object = await env.MEDIA.get(key, { range });
  if (!object) return notFound();

  const headers = baseHeaders(object);
  headers.set("content-length", String(range.length));
  headers.set(
    "content-range",
    `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`,
  );

  return new Response(object.body, { status: 206, headers });
};
