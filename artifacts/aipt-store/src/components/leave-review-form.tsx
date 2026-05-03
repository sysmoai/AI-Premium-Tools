import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  orderId: number;
  customerPhone?: string;
  customerName?: string;
  productId: number;
  productName: string;
}

export function LeaveReviewForm({ orderId, customerPhone, customerName, productId, productName }: Props) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(customerName ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createReview = useCreateReview();

  function submit() {
    if (rating < 1) {
      toast({ title: "Pick a star rating", description: "Tap 1–5 stars to rate this product." });
      return;
    }
    if (body.trim().length < 10) {
      toast({ title: "Write a few words", description: "Reviews need at least 10 characters." });
      return;
    }
    if (name.trim().length < 1) {
      toast({ title: "Add your name", description: "Tell other shoppers who's reviewing." });
      return;
    }
    createReview.mutate(
      {
        data: {
          product_id: productId,
          order_id: orderId,
          customer_phone: customerPhone,
          customer_name: name.trim(),
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({
            title: "Thanks for your review!",
            description: "We'll publish it within 24 hours after a quick check.",
          });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Please try again in a moment.";
          toast({ title: "Couldn't submit review", description: msg });
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 p-5 text-left flex items-start gap-3" data-testid={`review-submitted-${productId}`}>
        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">Review submitted for {productName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            We review every submission to keep ratings honest. Yours will appear on the product page within a day.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-5 text-left" data-testid={`leave-review-${productId}`}>
      <div className="font-semibold mb-1 text-sm">Rate {productName}</div>
      <div className="text-xs text-muted-foreground mb-3">
        Help other Bangladesh shoppers — your honest review takes a minute.
      </div>
      <div className="flex items-center gap-1 mb-3" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            data-testid={`star-${productId}-${n}`}
            className="p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                n <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (e.g., Rakib H.)"
          maxLength={120}
          data-testid={`input-review-name-${productId}`}
        />
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Headline (optional, e.g., Working perfectly)"
          maxLength={160}
          data-testid={`input-review-title-${productId}`}
        />
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience — activation speed, support, any issues."
          rows={3}
          maxLength={2000}
          data-testid={`input-review-body-${productId}`}
        />
      </div>
      <Button
        onClick={submit}
        disabled={createReview.isPending}
        className="mt-3 w-full"
        data-testid={`btn-submit-review-${productId}`}
      >
        {createReview.isPending ? "Submitting…" : "Submit review"}
      </Button>
      <div className="text-[11px] text-muted-foreground mt-2 text-center">
        Reviews are moderated within 24 hours. We never edit content beyond removing spam or abuse.
      </div>
    </div>
  );
}
