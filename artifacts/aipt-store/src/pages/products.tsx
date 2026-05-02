import { useState } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

interface ProductsProps {
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

export default function Products({ onAddToCart }: ProductsProps) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCatId = params.get("category_id") ? Number(params.get("category_id")) : undefined;

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCatId);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useListProducts({
    is_active: true,
    category_id: selectedCategory,
    search: searchQuery || undefined,
  });
  const { data: categories } = useListCategories();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>All AI Tools</h1>
        <p className="text-muted-foreground">29+ premium AI tools at student-friendly prices</p>
      </div>

      {/* Sticky filter bar */}
      <div
        className="sticky top-16 z-30 bg-background/95 backdrop-blur-md rounded-lg border border-border shadow-sm py-3 px-4 mb-8"
        style={{ boxShadow: "0 2px 16px hsl(var(--primary) / 0.06)" }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 h-10"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <Button
              variant={selectedCategory === undefined ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => setSelectedCategory(undefined)}
              data-testid="btn-filter-all"
            >
              All
            </Button>
            {categories?.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="rounded-full h-8"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`btn-filter-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      {!isLoading && products && products.length > 0 && (
        <p className="text-sm text-muted-foreground mb-5">
          Showing <span className="font-semibold text-foreground">{products.length}</span> tool{products.length !== 1 ? "s" : ""}
          {selectedCategory ? " in this category" : ""}
          {searchQuery ? ` for "${searchQuery}"` : ""}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-24">
          <div
            className="inline-flex items-center justify-center h-24 w-24 rounded-lg mb-6 text-5xl shadow-md"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.08))", border: "1px solid hsl(var(--primary) / 0.15)" }}
          >
            🔍
          </div>
          <p className="text-2xl font-bold mb-2">No tools found</p>
          <p className="text-muted-foreground mb-6">Try a different search or category filter</p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory(undefined); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map(product => {
            const gradient = getProductGradient(product.name);
            const initial = product.name.charAt(0).toUpperCase();
            const savingsPct = product.original_price_bdt
              ? Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)
              : 0;
            return (
              <Card
                key={product.id}
                className="group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                data-testid={`card-product-${product.id}`}
              >
                {/* Top gradient banner with tool initial */}
                <div className={`relative h-20 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                  <span className="text-5xl font-black text-white/25 select-none absolute" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {initial}
                  </span>
                  <span className="text-4xl font-black text-white relative z-10 drop-shadow-md" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {initial}
                  </span>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                        ⭐ Featured
                      </span>
                    )}
                    {savingsPct > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/80 text-white">
                        Save {savingsPct}%
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1.5">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{product.description}</p>
                  <div className="space-y-1 mb-4">
                    {product.features?.slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end justify-between mt-4 pt-3 border-t border-border">
                    <div>
                      {product.original_price_bdt && (
                        <div className="text-xs text-muted-foreground line-through">৳{product.original_price_bdt}</div>
                      )}
                      <div className="text-2xl font-black text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                        ৳{product.price_bdt}
                      </div>
                      <div className="text-xs text-muted-foreground">{product.duration_days || 30} days</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button variant="outline" size="sm" data-testid={`btn-details-${product.id}`}>Details</Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart({ productId: product.id, name: product.name, price_bdt: product.price_bdt, image_url: product.image_url ?? undefined, duration_days: product.duration_days ?? undefined })}
                        data-testid={`btn-add-cart-${product.id}`}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
