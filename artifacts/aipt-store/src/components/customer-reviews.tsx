import { useMemo, useState } from "react";
import { Star, CheckCircle2, ChevronDown, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useListProductReviews } from "@workspace/api-client-react";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function CustomerReviews({ productId, productName }: { productId: number; productName: string }) {
  const [showAll, setShowAll] = useState(false);
  const { data: reviews, isLoading } = useListProductReviews(productId);

  const sorted = useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews]);

  const totalReviews = sorted.length;
  const avgRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = sorted.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / totalReviews) * 10) / 10;
  }, [sorted, totalReviews]);

  const dist = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    sorted.forEach(r => {
      const i = Math.max(1, Math.min(5, r.rating)) - 1;
      buckets[i] += 1;
    });
    return buckets;
  }, [sorted]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-6">Loading reviews…</div>;
  }

  if (totalReviews === 0) {
    return (
      <div className="rounded-2xl border bg-muted/20 p-8 text-center" data-testid="reviews-empty">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
          <MessageSquareHeart className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-lg mb-1">No reviews yet for {productName}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Be the first to share your experience after your order is delivered. Verified buyers can leave a review from their order confirmation page.
        </p>
        <p className="text-xs text-muted-foreground">
          We only show real reviews from real customers — no auto-generated ratings.
        </p>
      </div>
    );
  }

  const visible = showAll ? sorted : sorted.slice(0, 4);

  return (
    <div data-testid="reviews-list">
      {/* Summary */}
      <div className="grid sm:grid-cols-[auto_1fr] gap-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-black" data-testid="text-avg-rating">{avgRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 my-1" aria-label={`${avgRating} out of 5`}>
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} aria-hidden="true" className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <div className="text-xs text-muted-foreground" data-testid="text-total-reviews">{totalReviews} review{totalReviews === 1 ? "" : "s"}</div>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = dist[stars - 1];
            const pct = totalReviews ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-muted-foreground">{stars}★</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="mb-5" />

      <ul className="space-y-5">
        {visible.map(r => (
          <li key={r.id} className="text-sm" data-testid={`review-${r.id}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{r.customer_name}</span>
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" /> Verified buyer
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{formatDate(r.created_at)}</span>
            </div>
            <div className="flex items-center gap-0.5 mb-1.5" aria-label={`${r.rating} out of 5`}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} aria-hidden="true" className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            {r.title && <div className="font-semibold mb-0.5">{r.title}</div>}
            <p className="text-muted-foreground leading-relaxed">{r.body}</p>
          </li>
        ))}
      </ul>

      {sorted.length > 4 && (
        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => setShowAll(s => !s)}
          data-testid="btn-toggle-reviews"
        >
          {showAll ? "Show less" : `Show all ${sorted.length} reviews`} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </Button>
      )}
    </div>
  );
}
