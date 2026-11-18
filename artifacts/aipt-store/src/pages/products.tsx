import { useMemo, useState } from "react";
import { useSearch, Link } from "wouter";
import { Search, SlidersHorizontal, PackageCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL } from "@/config/site";

interface ProductsProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
}

type SortKey = "popular" | "featured" | "price-asc" | "price-desc" | "newest";

const PRICE_RANGES = [
  { label: "Any price", value: "any", max: undefined as number | undefined },
  { label: "Under ৳500", value: "500", max: 500 },
  { label: "Under ৳1,000", value: "1000", max: 1000 },
  { label: "Under ৳2,000", value: "2000", max: 2000 },
  { label: "Under ৳3,000", value: "3000", max: 3000 },
];

export default function Products({ onAddToCart }: ProductsProps) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCatId = params.get("category_id") ? Number(params.get("category_id")) : undefined;
  const initialQuery = params.get("q") ?? "";
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCatId);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [priceRange, setPriceRange] = useState<string>("any");

  const { data: products, isLoading } = useListProducts({ is_active: true, category_id: selectedCategory, search: searchQuery || undefined });
  const { data: categories = [] } = useListCategories();
  const { data: allProducts } = useListProducts({ is_active: true });
  const totalCount = allProducts?.length ?? 0;
  const activeCat = categories.find(c => c.id === selectedCategory);
  const ORIGIN = typeof window !== "undefined" ? window.location.origin : SITE_URL;

  useSeo({
    title: searchQuery ? `Search: ${searchQuery} — AIPT` : activeCat ? `${activeCat.name} — AIPT` : "All AI & Digital Tools — AIPT",
    description: activeCat
      ? `Browse the current ${activeCat.name} listings at AIPT. Prices are shown in BDT and current checkout methods are bKash, Nagad, and Bank Transfer.`
      : `${totalCount || "Current"} active AIPT catalog ${totalCount === 1 ? "entry" : "entries"}. Browse current BDT pricing and product details before ordering.`,
    keywords: "AI tools Bangladesh, digital tool subscriptions BDT, bKash AI, AIPT",
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: activeCat ? `${activeCat.name} — AIPT` : "AIPT product catalog",
        description: activeCat ? `${activeCat.name} listings currently shown by AIPT.` : `${totalCount} active catalog entries currently shown by AIPT.`,
        isPartOf: { "@type": "WebSite", name: "AIPT — AI Premium Tools", url: ORIGIN },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: activeCat ? activeCat.name : "All Tools", item: activeCat ? `${ORIGIN}/products?category_id=${activeCat.id}` : `${ORIGIN}/products` },
        ],
      },
      ...(products?.length ? [{
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${ORIGIN}/products/${p.id}`, name: p.name })),
      }] : []),
    ],
  });

  const maxPrice = PRICE_RANGES.find(r => r.value === priceRange)?.max;
  const sortedFiltered = useMemo(() => {
    if (!products) return [];
    let list = [...products];
    if (maxPrice !== undefined) list = list.filter(p => p.price_bdt <= maxPrice);
    switch (sortBy) {
      case "price-asc": list.sort((a, b) => a.price_bdt - b.price_bdt); break;
      case "price-desc": list.sort((a, b) => b.price_bdt - a.price_bdt); break;
      case "newest": list.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()); break;
      case "featured": list.sort((a, b) => Number(b.is_featured ?? false) - Number(a.is_featured ?? false)); break;
      case "popular":
      default: list.sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0));
    }
    return list;
  }, [products, sortBy, maxPrice]);

  function clearAll() {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setPriceRange("any");
    setSortBy("popular");
  }
  const hasFilters = Boolean(searchQuery) || selectedCategory !== undefined || priceRange !== "any";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>All AI & Digital Tools</h1>
        <p className="text-muted-foreground">{allProducts ? `${totalCount} active catalog ${totalCount === 1 ? "entry" : "entries"}` : "Loading the current catalog…"}</p>
      </div>

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md rounded-lg border border-border shadow-sm py-3 px-4 mb-5" style={{ boxShadow: "0 2px 16px hsl(var(--primary) / 0.06)" }}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-10 h-10" placeholder="Search tools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} data-testid="input-search" /></div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}><SelectTrigger className="w-full md:w-[170px] h-10" data-testid="select-sort"><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="popular">Most ordered</SelectItem><SelectItem value="featured">Featured first</SelectItem><SelectItem value="price-asc">Price: Low to High</SelectItem><SelectItem value="price-desc">Price: High to Low</SelectItem><SelectItem value="newest">Newest</SelectItem></SelectContent></Select>
              <Select value={priceRange} onValueChange={setPriceRange}><SelectTrigger className="w-full md:w-[150px] h-10" data-testid="select-price"><SelectValue placeholder="Price" /></SelectTrigger><SelectContent>{PRICE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <Button variant={selectedCategory === undefined ? "default" : "outline"} size="sm" className="rounded-full h-8" onClick={() => setSelectedCategory(undefined)} data-testid="btn-filter-all">All</Button>
            {categories.map(cat => <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" className="rounded-full h-8" onClick={() => setSelectedCategory(cat.id)} data-testid={`btn-filter-${cat.id}`}>{cat.name}</Button>)}
          </div>
        </div>
      </div>

      {!isLoading && <div className="flex items-center justify-between flex-wrap gap-2 mb-5"><p className="text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">{sortedFiltered.length}</span> tool{sortedFiltered.length !== 1 ? "s" : ""}{selectedCategory ? " in this category" : ""}{searchQuery ? ` for "${searchQuery}"` : ""}{maxPrice ? ` under ৳${maxPrice}` : ""}</p>{hasFilters && <Button variant="ghost" size="sm" onClick={clearAll} data-testid="btn-clear-filters">Clear filters</Button>}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}</div>
      ) : sortedFiltered.length === 0 ? (
        <div className="text-center py-24"><div className="inline-flex items-center justify-center h-24 w-24 rounded-lg mb-6 text-5xl shadow-md" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.08))" }}>🔍</div><p className="text-2xl font-bold mb-2">No tools found</p><p className="text-muted-foreground mb-6">Try a different search, category, or price range</p><Button variant="outline" onClick={clearAll}>Clear filters</Button></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFiltered.map(product => {
            const gradient = getProductGradient(product.name);
            return (
              <Card key={product.id} className="group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col" data-testid={`card-product-${product.id}`}>
                <Link href={`/products/${product.id}`}><div className="cursor-pointer"><ProductLogoBanner name={product.name} imageUrl={product.image_url} gradient={gradient} size="card" isFeatured={product.is_featured ?? false} savingsPct={0} /></div></Link>
                <CardContent className="p-5 flex flex-col flex-1">
                  <Link href={`/products/${product.id}`}><h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1.5 cursor-pointer">{product.name}</h3></Link>
                  <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><PackageCheck className="h-3 w-3" /> Digital fulfilment</span><span className="ml-auto inline-flex items-center gap-1"><Wallet className="h-3 w-3" /> BDT checkout</span></div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{product.description}</p>
                  <div className="space-y-1 mb-4">{product.features?.slice(0, 3).map(f => <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />{f}</div>)}</div>
                  <div className="flex items-end justify-between mt-auto pt-3 border-t border-border">
                    <div><div className="text-xs text-muted-foreground mb-0.5">Current AIPT price</div><div className="text-2xl font-black text-primary leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>৳{product.price_bdt.toLocaleString("en-BD")}</div><div className="text-xs text-muted-foreground">{product.duration_days || 30} days</div></div>
                    <div className="flex gap-2"><Link href={`/products/${product.id}`}><Button variant="outline" size="sm" data-testid={`btn-details-${product.id}`}>Details</Button></Link><Button size="sm" onClick={() => onAddToCart({ productId: product.id, name: product.name, price_bdt: product.price_bdt, image_url: product.image_url ?? undefined, duration_days: product.duration_days ?? undefined })} data-testid={`btn-add-cart-${product.id}`}>Add</Button></div>
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
