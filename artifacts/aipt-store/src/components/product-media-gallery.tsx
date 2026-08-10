import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductLogoBanner } from "@/components/product-logo-banner";
import { getProductMedia, type ProductMediaItem } from "@/lib/product-media-api";

interface ProductMediaGalleryProps {
  productId: number;
  name: string;
  imageUrl?: string | null;
  gradient: string;
  isFeatured: boolean;
  savingsPct: number;
}

export function ProductMediaGallery({
  productId,
  name,
  imageUrl,
  gradient,
  isFeatured,
  savingsPct,
}: ProductMediaGalleryProps) {
  const [media, setMedia] = useState<ProductMediaItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProductMedia(productId)
      .then((items) => {
        if (cancelled) return;
        const visible = items.filter((item) => item.asset_type === "image" || item.asset_type === "video");
        setMedia(visible);
        const preferred = visible.find((item) => item.is_primary) ?? visible[0];
        setActiveId(preferred?.media_asset_id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setMedia([]);
          setActiveId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const active = useMemo(
    () => media.find((item) => item.media_asset_id === activeId) ?? media[0] ?? null,
    [media, activeId],
  );

  if (!active) {
    return (
      <ProductLogoBanner
        name={name}
        imageUrl={imageUrl}
        gradient={gradient}
        size="detail"
        isFeatured={isFeatured}
        savingsPct={savingsPct}
        className="mb-6 shadow-2xl rounded-2xl"
      />
    );
  }

  return (
    <div className="mb-6" data-testid="product-media-gallery">
      <div className="relative rounded-2xl border bg-muted overflow-hidden shadow-2xl aspect-[4/3] flex items-center justify-center">
        {active.asset_type === "video" ? (
          <video
            key={active.url}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
            aria-label={`${name} product video`}
          />
        ) : (
          <img
            key={active.url}
            src={active.url}
            alt={active.alt_text || `${name} product image`}
            className="w-full h-full object-contain"
            fetchPriority={active.is_primary ? "high" : "auto"}
          />
        )}

        <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
          {isFeatured && <Badge className="bg-amber-500 text-white border-0">Featured</Badge>}
          {savingsPct > 0 && <Badge className="bg-green-600 text-white border-0">Save {savingsPct}%</Badge>}
        </div>
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" role="list" aria-label={`${name} media thumbnails`}>
          {media.map((item) => {
            const selected = item.media_asset_id === active.media_asset_id;
            return (
              <button
                key={item.media_asset_id}
                type="button"
                onClick={() => setActiveId(item.media_asset_id)}
                className={`relative h-20 w-24 shrink-0 rounded-lg overflow-hidden border-2 bg-muted transition-colors ${selected ? "border-primary" : "border-transparent hover:border-border"}`}
                aria-label={`View ${item.asset_type === "video" ? "video" : "image"}: ${item.alt_text || item.original_filename || name}`}
                aria-pressed={selected}
                role="listitem"
              >
                {item.asset_type === "video" ? (
                  <>
                    <video src={item.url} muted preload="metadata" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="h-5 w-5 fill-white text-white" /></span>
                  </>
                ) : (
                  <img src={item.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
