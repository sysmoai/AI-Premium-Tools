import type { MediaAsset } from "@/lib/admin-media-api";

export interface ProductMediaItem extends MediaAsset {
  relation_id: number;
  product_id: number;
  media_asset_id: number;
  role: "logo" | "primary" | "gallery" | "thumbnail" | "hero" | "video" | "poster" | "documentation";
  sort_order: number;
  is_primary: boolean;
}

interface ProductMediaResponse {
  items: ProductMediaItem[];
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

export async function getProductMedia(productId: number): Promise<ProductMediaItem[]> {
  const response = await fetch(`/api/products/${productId}/media`);
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json() as ProductMediaResponse;
  return body.items;
}

export async function saveProductMedia(
  productId: number,
  items: Array<Pick<ProductMediaItem, "media_asset_id" | "role" | "sort_order" | "is_primary">>,
): Promise<ProductMediaItem[]> {
  const token = adminToken();
  const response = await fetch(`/api/products/${productId}/media`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json() as ProductMediaResponse;
  return body.items;
}
