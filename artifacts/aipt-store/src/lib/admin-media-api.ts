export interface MediaAsset {
  id: number;
  key: string;
  url: string;
  asset_type: "image" | "video" | "document" | "other";
  mime_type: string;
  original_filename: string | null;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  alt_text: string | null;
  caption: string | null;
  poster_asset_id: number | null;
  status: string;
  usage_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface MediaListResponse {
  items: MediaAsset[];
  limit: number;
  offset: number;
}

function adminToken(): string | null {
  try {
    return localStorage.getItem("aipt_admin_token");
  } catch {
    return null;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string; message?: string };
    return body.error || body.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function authHeaders(): HeadersInit {
  const token = adminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listMedia(options: { type?: "image" | "video"; search?: string } = {}): Promise<MediaAsset[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (options.type) params.set("type", options.type);
  if (options.search?.trim()) params.set("search", options.search.trim());

  const response = await fetch(`/api/media?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json() as MediaListResponse;
  return body.items;
}

export async function uploadMedia(file: File, options: { altText?: string; caption?: string } = {}): Promise<MediaAsset> {
  const form = new FormData();
  form.append("file", file);
  if (options.altText?.trim()) form.append("alt_text", options.altText.trim());
  if (options.caption?.trim()) form.append("caption", options.caption.trim());

  const response = await fetch("/api/media/upload", {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const item = await response.json() as Omit<MediaAsset, "usage_count" | "width" | "height" | "duration_ms" | "poster_asset_id" | "updated_at">;
  return {
    ...item,
    width: null,
    height: null,
    duration_ms: null,
    poster_asset_id: null,
    usage_count: 0,
    updated_at: null,
  };
}
