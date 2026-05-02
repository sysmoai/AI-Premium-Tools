import { useState } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

interface ProductsProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
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
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>All AI Tools</h1>
        <p className="text-muted-foreground">29+ premium AI tools at student-friendly prices</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={selectedCategory === undefined ? "default" : "outline"}
            size="sm"
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
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`btn-filter-${cat.id}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-xl font-semibold">No products found</p>
          <p className="mt-2">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map(product => (
            <Card key={product.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300" data-testid={`card-product-${product.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-2 mb-3">
                  {product.is_featured && <Badge className="bg-primary/10 text-primary border-0 text-xs shrink-0">Featured</Badge>}
                  {product.original_price_bdt && (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs shrink-0">
                      Save {Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)}%
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-2">{product.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{product.description}</p>
                <div className="space-y-1 mb-5">
                  {product.features?.slice(0, 3).map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {product.original_price_bdt && (
                      <div className="text-xs text-muted-foreground line-through">৳{product.original_price_bdt}</div>
                    )}
                    <div className="text-2xl font-black text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>৳{product.price_bdt}</div>
                    <div className="text-xs text-muted-foreground">{product.duration_days || 30} days</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" size="sm" data-testid={`btn-details-${product.id}`}>Details</Button>
                    </Link>
                    <Button size="sm" onClick={() => onAddToCart({ productId: product.id, name: product.name, price_bdt: product.price_bdt, image_url: product.image_url ?? undefined, duration_days: product.duration_days ?? undefined })} data-testid={`btn-add-cart-${product.id}`}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
