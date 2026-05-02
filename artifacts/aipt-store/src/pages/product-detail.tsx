import { useParams, Link } from "wouter";
import { ArrowLeft, Check, ShoppingCart, CreditCard, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
}

function getProductGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-amber-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % gradients.length;
  return gradients[hash];
}

const HOW_IT_WORKS = [
  { step: "1", icon: <CreditCard className="h-5 w-5" />, title: "Pay", desc: "Send payment via bKash, Nagad, or bank transfer" },
  { step: "2", icon: <Check className="h-5 w-5" />, title: "Confirm", desc: "We verify your transaction within 30 minutes" },
  { step: "3", icon: <Zap className="h-5 w-5" />, title: "Access", desc: "Receive your AI tool credentials via WhatsApp" },
];

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(Number(id)) },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/products"><Button className="mt-6">Back to Products</Button></Link>
      </div>
    );
  }

  function handleAddToCart() {
    onAddToCart({
      productId: product!.id,
      name: product!.name,
      price_bdt: product!.price_bdt,
      image_url: product!.image_url ?? undefined,
      duration_days: product!.duration_days ?? undefined,
    });
    toast({ title: "Added to cart", description: `${product!.name} has been added to your cart.` });
  }

  const savings = product.original_price_bdt
    ? Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)
    : 0;
  const savingsAmt = product.original_price_bdt
    ? product.original_price_bdt - product.price_bdt
    : 0;

  const gradient = getProductGradient(product.name);
  const initial = product.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/products">
        <Button variant="ghost" className="mb-8 -ml-2" data-testid="btn-back">
          <ArrowLeft className="h-4 w-4 mr-2" /> All Products
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Left column: Info */}
        <div>
          {/* Tool logo area */}
          <div className={`relative h-40 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-8 overflow-hidden shadow-xl`}>
            <span className="text-9xl font-black text-white/20 select-none absolute" style={{ fontFamily: "Outfit, sans-serif" }}>
              {initial}
            </span>
            <span className="text-7xl font-black text-white relative z-10 drop-shadow-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
              {initial}
            </span>
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {product.is_featured && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  ⭐ Featured
                </span>
              )}
              {savings > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/80 text-white">
                  Save {savings}%
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{product.category_name}</Badge>
            <Badge variant="outline">{product.duration_days || 30} days</Badge>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            {product.name}
          </h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{product.description}</p>

          <div className="mb-10">
            <h3 className="font-semibold mb-4 text-base">What's included:</h3>
            <div className="space-y-3">
              {product.features?.map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-lg p-5" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
            <h3 className="font-bold mb-4 text-base">How it works</h3>
            <div className="flex items-start gap-0">
              {HOW_IT_WORKS.map((step, idx) => (
                <div key={step.step} className="flex-1 flex flex-col items-center text-center relative">
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
                  )}
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white mb-3 relative z-10 shadow-md"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                  >
                    {step.icon}
                  </div>
                  <div className="font-bold text-sm mb-1">{step.title}</div>
                  <div className="text-xs text-muted-foreground leading-snug px-1">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Purchase card */}
        <div>
          <Card className="sticky top-6" style={{ border: "2px solid hsl(var(--primary) / 0.2)", boxShadow: "0 8px 30px hsl(var(--primary) / 0.1)" }}>
            <CardContent className="p-7">
              {/* Price block */}
              <div className="mb-6 pb-5 border-b border-border">
                {product.original_price_bdt && (
                  <div className="text-base text-muted-foreground line-through mb-1">৳{product.original_price_bdt}</div>
                )}
                <div className="text-5xl font-black text-primary mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                  ৳{product.price_bdt}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-muted-foreground text-sm">{product.duration_days || 30}-day access</span>
                  {savingsAmt > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      You save ৳{savingsAmt}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-2.5 mb-7 rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" /> Access delivered within 1 hour
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" /> Pay via bKash, Nagad, or bank transfer
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-green-500 shrink-0" /> WhatsApp support included
                </div>
                {product.stock_count && product.stock_count <= 10 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    ⚠️ Only {product.stock_count} left in stock
                  </div>
                )}
              </div>

              <Button className="w-full h-14 text-base font-bold rounded-lg mb-3 shadow-md" onClick={handleAddToCart} data-testid="btn-add-to-cart">
                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
              </Button>
              <Link href="/checkout">
                <Button variant="outline" className="w-full h-12 rounded-lg" onClick={handleAddToCart} data-testid="btn-buy-now">
                  Buy Now
                </Button>
              </Link>

              <div className="mt-5 text-center text-xs text-muted-foreground">
                🔒 Secure payment · Verified by AIPT
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
