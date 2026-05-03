import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/hooks/use-cart";
import { useSeo } from "@/hooks/use-seo";
import { TrustBadgesRow } from "@/components/trust-badges-row";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { useListProducts } from "@workspace/api-client-react";

interface CartProps {
  items: CartItem[];
  total: number;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

function getItemGradient(name: string): string {
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

export default function Cart({ items, total, onRemove, onUpdateQuantity }: CartProps) {
  useSeo({
    title: items.length > 0 ? `Your Cart (${items.length}) — AIPT` : "Your Cart — AIPT",
    description: "Review your AI subscription order. Pay securely in BDT via bKash, Nagad, Rocket, Upay, or bank transfer.",
    type: "website",
  });

  const { data: allProducts } = useListProducts({ is_active: true });
  const itemIds = new Set(items.map(i => i.productId));
  const suggestions = (allProducts ?? [])
    .filter(p => !itemIds.has(p.id) && p.is_featured)
    .slice(0, 3);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div
          className="inline-flex items-center justify-center h-28 w-28 rounded-lg mb-8 shadow-lg"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.07))",
            border: "1px solid hsl(var(--primary) / 0.15)",
          }}
        >
          <ShoppingCart className="h-12 w-12 text-primary/50" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 text-lg">Discover premium AI tools at student-friendly prices</p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-10 h-12 font-bold shadow-md" data-testid="btn-browse-products">
            Browse Products <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        {suggestions.length > 0 && (
          <div className="mt-16 text-left">
            <h3 className="font-bold text-xl mb-5 text-center flex items-center justify-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              <Sparkles className="h-5 w-5 text-primary" /> Customer favourites
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestions.map(p => {
                const grad = getProductGradient(p.name);
                return (
                  <Link key={p.id} href={`/products/${p.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                      <ProductLogoBanner
                        name={p.name}
                        imageUrl={p.image_url}
                        gradient={grad}
                        size="card"
                        isFeatured={p.is_featured ?? false}
                        savingsPct={p.original_price_bdt ? Math.round((1 - p.price_bdt / p.original_price_bdt) * 100) : 0}
                      />
                      <CardContent className="p-4">
                        <div className="font-bold text-sm line-clamp-1 mb-1">{p.name}</div>
                        <div className="font-black text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                          ৳{p.price_bdt.toLocaleString("en-BD")}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Your Cart</h1>
        <span className="text-muted-foreground text-sm">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="md:col-span-2 space-y-4">
          {items.map(item => {
            const gradient = getItemGradient(item.name);
            const initial = item.name.charAt(0).toUpperCase();
            return (
              <Card key={item.productId} data-testid={`card-cart-item-${item.productId}`} className="overflow-hidden">
                <CardContent className="p-0 flex items-stretch">
                  <div className={`w-12 md:w-14 bg-gradient-to-b ${gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg md:text-xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{initial}</span>
                  </div>

                  <div className="flex-1 p-3 md:hidden">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <Link href={`/products/${item.productId}`}>
                          <div className="font-semibold truncate text-sm hover:text-primary cursor-pointer">{item.name}</div>
                        </Link>
                        <div className="text-xs text-muted-foreground">{item.duration_days || 30} days access</div>
                        <div className="text-primary font-bold text-sm mt-0.5">৳{item.price_bdt} each</div>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-1"
                        onClick={() => onRemove(item.productId)}
                        data-testid={`btn-remove-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-lg touch-manipulation"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          data-testid={`btn-decrease-${item.productId}`}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-base" data-testid={`text-quantity-${item.productId}`}>
                          {item.quantity}
                        </span>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-lg touch-manipulation"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          data-testid={`btn-increase-${item.productId}`}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="font-black text-lg text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                        ৳{(item.price_bdt * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-1 p-4 items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <div className="font-semibold truncate hover:text-primary cursor-pointer">{item.name}</div>
                      </Link>
                      <div className="text-sm text-muted-foreground">{item.duration_days || 30} days access</div>
                      <div className="text-primary font-bold text-base mt-0.5">৳{item.price_bdt} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        data-testid={`btn-decrease-${item.productId}`}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-base" data-testid={`text-quantity-${item.productId}`}>
                        {item.quantity}
                      </span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        data-testid={`btn-increase-${item.productId}`}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right min-w-20 shrink-0">
                      <div className="font-black text-lg text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                        ৳{(item.price_bdt * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => onRemove(item.productId)}
                      data-testid={`btn-remove-${item.productId}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Link href="/products">
            <Button variant="ghost" className="text-primary w-full mt-2" data-testid="btn-continue-shopping">
              ← Continue Shopping
            </Button>
          </Link>

          {/* Trust badges */}
          <div className="pt-4">
            <TrustBadgesRow />
          </div>

          {/* Suggested products */}
          {suggestions.length > 0 && (
            <div className="pt-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                <Sparkles className="h-4 w-4 text-primary" /> You may also like
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestions.map(p => {
                  const grad = getProductGradient(p.name);
                  return (
                    <Link key={p.id} href={`/products/${p.id}`}>
                      <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer" data-testid={`suggested-${p.id}`}>
                        <ProductLogoBanner
                          name={p.name}
                          imageUrl={p.image_url}
                          gradient={grad}
                          size="card"
                          isFeatured={p.is_featured ?? false}
                          savingsPct={p.original_price_bdt ? Math.round((1 - p.price_bdt / p.original_price_bdt) * 100) : 0}
                        />
                        <CardContent className="p-3">
                          <div className="font-bold text-sm line-clamp-1 mb-0.5">{p.name}</div>
                          <div className="font-black text-primary text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
                            ৳{p.price_bdt.toLocaleString("en-BD")}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <Card className="md:sticky md:top-6" style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.08)" }}>
            <CardContent className="p-6">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate flex-1 mr-2">
                      {item.name} ×{item.quantity}
                    </span>
                    <span className="font-medium shrink-0">৳{(item.price_bdt * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />

              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>
              <Separator className="my-3" />

              <div className="flex justify-between font-black text-xl mb-2">
                <span>Total</span>
                <span className="text-primary" data-testid="text-cart-total">৳{total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Delivered within 1 hour of payment confirmation</p>

              <Link href="/checkout">
                <Button className="w-full h-12 font-bold rounded-lg shadow-md" data-testid="btn-checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                🔒 Secure checkout · bKash · Nagad · Bank
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
