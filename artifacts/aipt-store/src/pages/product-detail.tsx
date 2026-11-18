import { useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Check, ShoppingCart, MessageCircle, ShieldCheck, PackageCheck, Lock, Star, Share2, Truck, HelpCircle, Wallet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useGetProduct, getGetProductQueryKey, useListProducts, getListProductsQueryKey, useListProductReviews, getListProductReviewsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL } from "@/config/site";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { ProductMediaGallery } from "@/components/product-media-gallery";
import { CustomerReviews } from "@/components/customer-reviews";
import { WHATSAPP_URL } from "@/config/contact";

interface ProductDetailProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
}

const TRUST_BADGES = [
  { Icon: ShieldCheck, title: "Seller clarity", desc: "AIPT is the seller/support contact" },
  { Icon: PackageCheck, title: "Digital fulfilment", desc: "Handled after payment confirmation" },
  { Icon: MessageCircle, title: "Order support", desc: "Use your order ID for help" },
  { Icon: Lock, title: "BDT checkout", desc: "bKash · Nagad · Bank" },
];

function getFaqItems(productName: string, durationDays: number) {
  return [
    {
      q: `How is ${productName} fulfilled?`,
      a: `This is a digital order. After payment confirmation, AIPT coordinates fulfilment using the phone/WhatsApp contact on the order. Timing varies by product, availability, payment verification, and order status.`,
    },
    {
      q: "Which payment methods are available at checkout?",
      a: "Current checkout methods are bKash, Nagad, and Bank Transfer. Orders are recorded in BDT.",
    },
    {
      q: `Who is the seller of this ${productName} listing?`,
      a: `AIPT — AI Premium Tools is the seller/support entity for this storefront listing. The ${productName} product/service name and any related trademarks belong to their respective provider. A listing does not itself imply provider affiliation, endorsement, or authorization.`,
    },
    {
      q: "What if I have a fulfilment or access problem?",
      a: "Contact AIPT with your order ID and payment reference. The available resolution depends on the verified order facts and the current Digital Delivery and Refund & Replacement policies.",
    },
    {
      q: "Can I share or transfer the provider account?",
      a: "Account, seat, credential, device, and transfer rules are set by the relevant provider and the exact fulfilment model. Do not share credentials unless the provider and purchased product explicitly allow it.",
    },
    {
      q: `How long is this catalog entry listed for?`,
      a: `The current catalog shows ${durationDays} days for this listing. Provider features, usage limits, and eligibility can change, so review the current product details before ordering.`,
    },
  ];
}

function FaqItems({ productName, durationDays }: { productName: string; durationDays: number }) {
  const items = getFaqItems(productName, durationDays);
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-sm font-semibold" data-testid={`faq-q-${i}`}>{item.q}</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { ids: recentIds, track: trackViewed } = useRecentlyViewed();
  const productId = Number(id);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(productId) },
  });

  const relatedParams = { is_active: true, category_id: product?.category_id };
  const { data: relatedAll } = useListProducts(relatedParams, {
    query: { enabled: !!product?.category_id, queryKey: getListProductsQueryKey(relatedParams) },
  });
  const allProductsParams = { is_active: true };
  const { data: allProducts } = useListProducts(allProductsParams, {
    query: { queryKey: getListProductsQueryKey(allProductsParams) },
  });

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [id]);
  useEffect(() => { if (product?.id) trackViewed(product.id); }, [product?.id, trackViewed]);

  const reviewsProductId = product?.id ?? 0;
  const { data: realReviews } = useListProductReviews(reviewsProductId, {
    query: { enabled: !!product?.id, queryKey: getListProductReviewsQueryKey(reviewsProductId) },
  });
  const reviewCount = realReviews?.length ?? 0;
  const rating = useMemo(() => {
    if (!realReviews?.length) return 0;
    return Math.round((realReviews.reduce((sum, review) => sum + review.rating, 0) / realReviews.length) * 10) / 10;
  }, [realReviews]);

  const ORIGIN = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  const productUrl = product ? `${ORIGIN}/products/${product.id}` : ORIGIN;
  const productImage = product?.image_url || `${ORIGIN}/opengraph.jpg`;
  const durationDaysSeo = product?.duration_days ?? 30;
  const baseDesc = product?.description?.replace(/\s+/g, " ").trim() ?? "";
  const seoTitle = product ? `${product.name} (${durationDaysSeo} days) — ৳${product.price_bdt} | AIPT` : "Product | AIPT";
  const seoDesc = product
    ? `${product.name} is currently listed by AIPT at ৳${product.price_bdt} BDT for ${durationDaysSeo} days. ${baseDesc.slice(0, 150)}`.trim().slice(0, 300)
    : undefined;

  const jsonLd: Array<Record<string, unknown>> | null = product
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": `${productUrl}#product`,
          name: product.name,
          description: baseDesc || `${product.name} digital listing from AIPT.`,
          image: [productImage],
          sku: product.sku || `AIPT-${product.id}`,
          productID: `AIPT-${product.id}`,
          category: product.category_name,
          url: productUrl,
          inLanguage: ["en", "bn"],
          offers: {
            "@type": "Offer",
            "@id": `${productUrl}#offer`,
            url: productUrl,
            priceCurrency: "BDT",
            price: product.price_bdt,
            availability: product.stock_count === undefined || (product.stock_count ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "AIPT — AI Premium Tools", url: ORIGIN },
            eligibleRegion: { "@type": "Country", name: "Bangladesh" },
          },
          ...(reviewCount > 0
            ? {
                aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount, bestRating: 5, worstRating: 1 },
                review: (realReviews ?? []).slice(0, 10).map(r => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: r.customer_name },
                  datePublished: r.created_at,
                  reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                  reviewBody: r.body,
                  ...(r.title ? { name: r.title } : {}),
                })),
              }
            : {}),
          additionalProperty: [
            { "@type": "PropertyValue", name: "Listing duration", value: `${durationDaysSeo} days` },
            { "@type": "PropertyValue", name: "Fulfilment", value: "Digital fulfilment coordinated after payment confirmation" },
            { "@type": "PropertyValue", name: "Current checkout methods", value: "bKash, Nagad, Bank Transfer" },
            { "@type": "PropertyValue", name: "Seller", value: "AIPT — AI Premium Tools" },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "All Tools", item: `${ORIGIN}/products` },
            ...(product.category_name ? [{ "@type": "ListItem", position: 3, name: product.category_name, item: `${ORIGIN}/products?category_id=${product.category_id}` }] : []),
            { "@type": "ListItem", position: product.category_name ? 4 : 3, name: product.name, item: productUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: getFaqItems(product.name, durationDaysSeo).map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
        },
      ]
    : null;

  useSeo({
    title: seoTitle,
    description: seoDesc,
    image: productImage,
    type: "product",
    keywords: product ? `${product.name}, ${product.name} Bangladesh, ${product.name} BDT, AIPT` : undefined,
    canonical: productUrl,
    jsonLd,
  });

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-10"><Skeleton className="h-5 w-64 mb-6" /><div className="grid md:grid-cols-2 gap-10"><Skeleton className="h-80 rounded-2xl" /><div className="space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-32 w-full mt-6" /></div></div></div>;
  }

  if (!product) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="text-5xl mb-4">😕</div><h2 className="text-2xl font-bold">Product not found</h2><Link href="/products"><Button className="mt-6">Back to Products</Button></Link></div>;
  }

  function handleAddToCart() {
    onAddToCart({ productId: product!.id, name: product!.name, price_bdt: product!.price_bdt, image_url: product!.image_url ?? undefined, duration_days: product!.duration_days ?? undefined });
    toast({ title: "Added to cart 🛒", description: `${product!.name} has been added to your cart.` });
  }
  function handleBuyNow() { handleAddToCart(); navigate("/checkout"); }
  function handleShare() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: product!.name, text: product!.description ?? "", url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => toast({ title: "Link copied", description: "Product link copied to clipboard." })).catch(() => {});
  }

  const gradient = getProductGradient(product.name);
  const durationDays = product.duration_days || 30;
  const inStock = product.stock_count === undefined || (product.stock_count ?? 1) > 0;
  const related = (relatedAll ?? []).filter(p => p.id !== product.id).slice(0, 4);
  const recentlyViewedList = recentIds.filter(rid => rid !== product.id).map(rid => (allProducts ?? []).find(p => p.id === rid)).filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, 4);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <Breadcrumb className="mb-6"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/products">All Tools</Link></BreadcrumbLink></BreadcrumbItem>
          {product.category_name && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink asChild><Link href={`/products?category_id=${product.category_id}`}>{product.category_name}</Link></BreadcrumbLink></BreadcrumbItem></>}
          <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage className="line-clamp-1 max-w-[200px]">{product.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
          <div>
            <ProductMediaGallery productId={product.id} name={product.name} imageUrl={product.image_url} gradient={gradient} isFeatured={product.is_featured ?? false} savingsPct={0} />
            <div className="flex flex-wrap gap-2 mb-3">
              {product.category_name && <Badge variant="outline" className="font-medium">{product.category_name}</Badge>}
              <Badge variant="outline" className="font-medium">{durationDays} days</Badge>
              {product.is_featured && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">Featured</Badge>}
              {inStock ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">In Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>{product.name}</h1>

            <div className="flex items-center gap-3 mb-5 text-sm">
              {reviewCount > 0 ? <>
                <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>{[1,2,3,4,5].map(n => <Star key={n} aria-hidden="true" className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}<span className="font-bold ml-1.5" data-testid="text-rating">{rating.toFixed(1)}</span></div>
                <span className="text-muted-foreground">·</span><span className="text-muted-foreground" data-testid="text-review-count">{reviewCount} customer review{reviewCount === 1 ? "" : "s"}</span>
              </> : <span className="text-muted-foreground" data-testid="text-no-reviews">No approved customer reviews yet</span>}
              <button onClick={handleShare} className="hidden sm:inline-flex items-center gap-1 text-primary hover:underline ml-auto" data-testid="btn-share"><Share2 className="h-3.5 w-3.5" /> Share</button>
            </div>

            <p className="text-muted-foreground text-base mb-5 leading-relaxed">{product.description}</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-8 text-sm leading-relaxed">
              <strong>Seller/provider disclosure:</strong> Sold and supported by AIPT — AI Premium Tools. Product/service names and trademarks belong to their respective providers. AIPT does not imply provider affiliation, endorsement, reseller status, or authorized seat rights unless explicitly stated and supported by current evidence.
            </div>

            <Tabs defaultValue="included" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 mb-5">
                <TabsTrigger value="included"><Check className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Included</TabsTrigger>
                <TabsTrigger value="reviews"><Star className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Reviews</TabsTrigger>
                <TabsTrigger value="delivery"><Truck className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Delivery</TabsTrigger>
                <TabsTrigger value="faq"><HelpCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />FAQ</TabsTrigger>
              </TabsList>
              <TabsContent value="included" className="mt-0"><h3 className="font-bold mb-3 text-base">What's included</h3><div className="space-y-2.5">{product.features?.map(f => <div key={f} className="flex items-start gap-3"><div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Check className="h-3 w-3 text-primary" /></div><span className="text-sm">{f}</span></div>)}</div></TabsContent>
              <TabsContent value="reviews" className="mt-0"><CustomerReviews productId={product.id} productName={product.name} /></TabsContent>
              <TabsContent value="delivery" className="mt-0">
                <h3 className="font-bold mb-4 text-base">How digital fulfilment works</h3>
                <ol className="space-y-4">
                  {[
                    { Icon: Wallet, title: "1. Place your order", desc: "Add to cart and use one of the current checkout methods: bKash, Nagad, or Bank Transfer." },
                    { Icon: Check, title: "2. Payment reference is reviewed", desc: "AIPT reviews the submitted order and payment-reference information." },
                    { Icon: PackageCheck, title: "3. Digital fulfilment", desc: `AIPT coordinates ${product.name} fulfilment using the contact information on the order. Timing varies by product and order status.` },
                  ].map(s => <li key={s.title} className="flex items-start gap-3"><div className="h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}><s.Icon className="h-4 w-4" /></div><div><div className="font-semibold text-sm">{s.title}</div><div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div></div></li>)}
                </ol>
                <p className="text-sm text-muted-foreground mt-4">For delayed, incorrect, or access-related orders, use the current Digital Delivery and Refund & Replacement policies and contact AIPT with the order ID.</p>
              </TabsContent>
              <TabsContent value="faq" className="mt-0"><h3 className="font-bold mb-3 text-base">Frequently asked questions</h3><FaqItems productName={product.name} durationDays={durationDays} /></TabsContent>
            </Tabs>
          </div>

          <div>
            <Card className="md:sticky md:top-28" style={{ border: "2px solid hsl(var(--primary) / 0.2)", boxShadow: "0 8px 30px hsl(var(--primary) / 0.1)" }}><CardContent className="p-6 md:p-7">
              <div className="mb-5 pb-5 border-b border-border">
                <div className="text-xs text-muted-foreground mb-1">Current AIPT price</div>
                <div className="text-4xl md:text-5xl font-black text-primary" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-price">৳{product.price_bdt.toLocaleString("en-BD")}</div>
                <div className="text-muted-foreground text-sm mt-2">{durationDays}-day listing</div>
              </div>
              <div className="space-y-2.5 mb-6 rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500 shrink-0" /> Digital fulfilment after payment confirmation</div>
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500 shrink-0" /> Checkout in BDT — bKash, Nagad, Bank</div>
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500 shrink-0" /> AIPT order support with order ID</div>
                {product.stock_count != null && product.stock_count > 0 && product.stock_count <= 10 && <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">⚠️ {product.stock_count} listed in stock</div>}
              </div>
              <Button className="w-full h-14 text-base font-bold rounded-lg mb-3 shadow-md" onClick={handleAddToCart} disabled={!inStock} data-testid="btn-add-to-cart"><ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart</Button>
              <Button variant="outline" className="w-full h-12 rounded-lg mb-3" onClick={handleBuyNow} disabled={!inStock} data-testid="btn-buy-now">Buy Now</Button>
              <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hi AIPT, I'd like to ask about: ${product.name}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-12 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }} data-testid="btn-whatsapp-inquiry"><MessageCircle className="h-4 w-4" /> Ask on WhatsApp</a>
              <div className="mt-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> Server validates current product pricing when an order is created</div>
            </CardContent></Card>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map(b => <div key={b.title} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30"><div className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><b.Icon className="h-5 w-5" /></div><div><div className="font-bold text-sm">{b.title}</div><div className="text-xs text-muted-foreground">{b.desc}</div></div></div>)}
        </div>

        {related.length > 0 && <section className="mt-16">
          <div className="flex items-end justify-between mb-6"><div><h2 className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>You may also like</h2><p className="text-sm text-muted-foreground mt-1">More from {product.category_name}</p></div><Link href={`/products?category_id=${product.category_id}`}><Button variant="ghost" size="sm" className="gap-1">View all <ChevronRight className="h-4 w-4" /></Button></Link></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{related.map(p => { const grad = getProductGradient(p.name); return <Link key={p.id} href={`/products/${p.id}`}><Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"><ProductLogoBanner name={p.name} imageUrl={p.image_url} gradient={grad} size="card" isFeatured={p.is_featured ?? false} savingsPct={0} /><CardContent className="p-4"><div className="font-bold text-sm line-clamp-1 mb-1">{p.name}</div><div className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{p.description}</div><div className="font-black text-primary">৳{p.price_bdt.toLocaleString("en-BD")}</div></CardContent></Card></Link>; })}</div>
        </section>}

        {recentlyViewedList.length > 0 && <section className="mt-16" data-testid="section-pdp-recently-viewed"><h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Recently viewed</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{recentlyViewedList.map(p => { const grad = getProductGradient(p.name); return <Link key={p.id} href={`/products/${p.id}`}><Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"><ProductLogoBanner name={p.name} imageUrl={p.image_url} gradient={grad} size="card" isFeatured={p.is_featured ?? false} savingsPct={0} /><CardContent className="p-4"><div className="font-bold text-sm line-clamp-1 mb-1">{p.name}</div><div className="font-black text-primary">৳{p.price_bdt.toLocaleString("en-BD")}</div></CardContent></Card></Link>; })}</div></section>}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 flex items-center gap-3" style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div className="flex-1 min-w-0"><div className="text-xs text-muted-foreground leading-none">Current price</div><div className="text-xl font-black text-primary leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>৳{product.price_bdt.toLocaleString("en-BD")}</div></div>
        <Button onClick={handleAddToCart} variant="outline" disabled={!inStock} className="h-11" data-testid="mobile-btn-add"><ShoppingCart className="h-4 w-4 mr-1" /> Add</Button>
        <Button onClick={handleBuyNow} disabled={!inStock} className="h-11 px-5 font-bold" data-testid="mobile-btn-buy">Buy Now</Button>
      </div>
    </>
  );
}
