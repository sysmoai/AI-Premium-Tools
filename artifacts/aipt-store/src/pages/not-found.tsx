import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Compass, Home, ShoppingBag, MessageCircle, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";
import { useListProducts } from "@workspace/api-client-react";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { WHATSAPP_URL } from "@/config/contact";

export default function NotFound() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: products } = useListProducts({ is_active: true });
  const trending = (products ?? [])
    .slice()
    .sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0))
    .slice(0, 4);

  useSeo({
    title: "Page Not Found — AIPT",
    description: "The page you're looking for doesn't exist. Browse our AI subscription store instead.",
    type: "website",
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-16">
      <div className="text-center max-w-lg mx-auto">
        <div
          className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"
          style={{
            background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))",
            boxShadow: "0 10px 40px hsl(262 83% 58% / 0.35)",
          }}
        >
          <Compass className="h-10 w-10" />
        </div>

        <div
          className="text-7xl font-black mb-2"
          style={{
            fontFamily: "Outfit, sans-serif",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
          Page not found
        </h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved. Search for an AI tool below or jump to a popular page.
        </p>

        <form onSubmit={submitSearch} className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11"
            placeholder="Search for ChatGPT, Claude, Midjourney…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-testid="input-404-search"
          />
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link href="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="btn-404-home">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="btn-404-products">
              <ShoppingBag className="h-4 w-4" /> Browse Tools
            </Button>
          </Link>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          data-testid="link-404-whatsapp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Need help finding something? Chat on WhatsApp
        </a>
      </div>

      {trending.length > 0 && (
        <div className="mt-14">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 justify-center" style={{ fontFamily: "Outfit, sans-serif" }}>
            <TrendingUp className="h-5 w-5 text-primary" /> Trending right now
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {trending.map(p => {
              const grad = getProductGradient(p.name);
              return (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer" data-testid={`trending-${p.id}`}>
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
