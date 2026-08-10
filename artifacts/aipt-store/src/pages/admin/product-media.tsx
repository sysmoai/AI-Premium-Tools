import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ImageIcon, Plus, Save, Search, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { listMedia, type MediaAsset } from "@/lib/admin-media-api";
import { getProductMedia, saveProductMedia, type ProductMediaItem } from "@/lib/product-media-api";
import { useGetProduct } from "@workspace/api-client-react";

type EditableMedia = ProductMediaItem;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function libraryToSelection(asset: MediaAsset, productId: number, sortOrder: number): EditableMedia {
  return {
    ...asset,
    relation_id: 0,
    product_id: productId,
    media_asset_id: asset.id,
    role: asset.asset_type === "video" ? "video" : "gallery",
    sort_order: sortOrder,
    is_primary: false,
  };
}

export default function AdminProductMedia() {
  useSeo({ title: "Product Media | AIPT Admin", noindex: true });
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { toast } = useToast();
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<EditableMedia[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: product } = useGetProduct(productId, {
    query: { enabled: Number.isInteger(productId) && productId > 0 },
  });

  async function load() {
    if (!Number.isInteger(productId) || productId <= 0) return;
    setLoading(true);
    try {
      const [allMedia, current] = await Promise.all([
        listMedia(),
        getProductMedia(productId),
      ]);
      setLibrary(allMedia);
      setSelected(current);
    } catch (error) {
      toast({
        title: "Could not load product media",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Product id is the only routing dependency; load intentionally owns its API reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.media_asset_id)), [selected]);
  const available = useMemo(() => {
    const term = search.trim().toLowerCase();
    return library.filter((item) => {
      if (selectedIds.has(item.id)) return false;
      if (!term) return true;
      return [item.original_filename, item.alt_text, item.caption, item.mime_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [library, search, selectedIds]);

  function normalizeOrder(items: EditableMedia[]): EditableMedia[] {
    return items.map((item, index) => ({ ...item, sort_order: index }));
  }

  function addAsset(asset: MediaAsset) {
    setSelected((current) => normalizeOrder([
      ...current,
      libraryToSelection(asset, productId, current.length),
    ]));
  }

  function removeAsset(mediaAssetId: number) {
    setSelected((current) => normalizeOrder(current.filter((item) => item.media_asset_id !== mediaAssetId)));
  }

  function move(mediaAssetId: number, delta: -1 | 1) {
    setSelected((current) => {
      const index = current.findIndex((item) => item.media_asset_id === mediaAssetId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeOrder(next);
    });
  }

  function setPrimary(mediaAssetId: number) {
    setSelected((current) => current.map((item) => ({
      ...item,
      is_primary: item.media_asset_id === mediaAssetId,
      role: item.media_asset_id === mediaAssetId ? "primary" : item.role === "primary" ? "gallery" : item.role,
    })));
  }

  function setRole(mediaAssetId: number, role: ProductMediaItem["role"]) {
    setSelected((current) => current.map((item) =>
      item.media_asset_id === mediaAssetId
        ? { ...item, role, is_primary: role === "primary" ? item.is_primary : false }
        : item,
    ));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveProductMedia(productId, selected.map((item, index) => ({
        media_asset_id: item.media_asset_id,
        role: item.role,
        sort_order: index,
        is_primary: item.is_primary,
      })));
      setSelected(saved);
      toast({ title: "Product media saved", description: `${saved.length} media attachment${saved.length === 1 ? "" : "s"} linked to this product.` });
    } catch (error) {
      toast({
        title: "Could not save product media",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    return <div className="p-8">Invalid product id.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/products">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> Products</Button>
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold truncate">{product?.name || `Product #${productId}`} Media</h1>
              <p className="text-xs text-muted-foreground">Gallery, videos and primary product image</p>
            </div>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving…" : "Save Media"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Attached media</h2>
              <p className="text-sm text-muted-foreground">Order controls how the gallery appears on the product page.</p>
            </div>
            <Badge variant="secondary">{selected.length}/24</Badge>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : selected.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-muted-foreground">No media attached yet. Add images or videos from the library.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {selected.map((item, index) => (
                <Card key={`${item.media_asset_id}:${item.role}`}>
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="h-20 w-24 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {item.asset_type === "video" ? (
                        <video src={item.url} preload="metadata" muted className="h-full w-full object-cover" />
                      ) : (
                        <img src={item.url} alt={item.alt_text || item.original_filename || "Product media"} className="h-full w-full object-contain" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{item.original_filename || item.key}</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatBytes(item.size_bytes)} · {item.mime_type}</div>
                      <div className="flex flex-wrap gap-2 mt-3 items-center">
                        <select
                          value={item.role}
                          onChange={(event) => setRole(item.media_asset_id, event.target.value as ProductMediaItem["role"])}
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                          aria-label="Media role"
                        >
                          {item.asset_type === "video" ? <option value="video">Video</option> : <>
                            <option value="gallery">Gallery</option>
                            <option value="primary">Primary</option>
                            <option value="hero">Hero</option>
                            <option value="thumbnail">Thumbnail</option>
                            <option value="logo">Logo</option>
                          </>}
                        </select>
                        {item.asset_type === "image" && (
                          <Button type="button" size="sm" variant={item.is_primary ? "default" : "outline"} onClick={() => setPrimary(item.media_asset_id)}>
                            {item.is_primary ? <Check className="h-3.5 w-3.5 mr-1" /> : <ImageIcon className="h-3.5 w-3.5 mr-1" />}
                            {item.is_primary ? "Primary" : "Make primary"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(item.media_asset_id, -1)} aria-label="Move media up"><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" disabled={index === selected.length - 1} onClick={() => move(item.media_asset_id, 1)} aria-label="Move media down"><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAsset(item.media_asset_id)} aria-label="Remove media"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xl font-bold">Media library</h2>
              <p className="text-sm text-muted-foreground">Choose existing R2 assets.</p>
            </div>
            <Link href="/admin/media"><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Upload</Button></Link>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search media…" className="pl-9" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {available.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                  {item.asset_type === "video" ? (
                    <div className="relative h-full w-full"><video src={item.url} preload="metadata" muted className="h-full w-full object-cover" /><Video className="absolute right-2 bottom-2 h-5 w-5 text-white drop-shadow" /></div>
                  ) : (
                    <img src={item.url} alt={item.alt_text || item.original_filename || "Media"} loading="lazy" className="h-full w-full object-contain" />
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="text-sm font-medium truncate">{item.original_filename || item.key}</div>
                  <Button type="button" size="sm" className="w-full mt-3" disabled={selected.length >= 24} onClick={() => addAsset(item)}>
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add to product
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!loading && available.length === 0 && (
              <div className="col-span-full border rounded-xl p-8 text-center text-sm text-muted-foreground">No available media matches your search.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
