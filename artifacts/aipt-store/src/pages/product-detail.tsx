import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  Check,
  ShoppingCart,
  MessageCircle,
  ShieldCheck,
  Clock,
  RefreshCw,
  Lock,
  Star,
  Share2,
  Truck,
  HelpCircle,
  Sparkles,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useGetProduct,
  getGetProductQueryKey,
  useListProducts,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { getProductRating, getProductReviewCount } from "@/hooks/use-product-rating";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { CustomerReviews } from "@/components/customer-reviews";
import { WHATSAPP_URL } from "@/config/contact";

interface ProductDetailProps {
  onAddToCart: (product: {
    productId: number;
    name: string;
    price_bdt: number;
    image_url?: string;
    duration_days?: number;
  }) => void;
}

const TRUST_BADGES = [
  { Icon: ShieldCheck, title: "30-Day Warranty", desc: "Replaced if it fails" },
  { Icon: Clock, title: "1-Hour Activation", desc: "After payment" },
  { Icon: RefreshCw, title: "Easy Replacement", desc: "Free swap in warranty" },
  { Icon: Lock, title: "Secure Payment", desc: "bKash · Nagad · Bank" },
];


function getFaqItems(productName: string, durationDays: number) {
  return [
    {
      q: `How will I receive my ${productName} access?`,
      a: `After we confirm your payment, we send your login credentials directly via WhatsApp. Activation usually completes within 1 hour during 10am–11pm daily.`,
    },
    {
      q: "Which payment methods do you accept?",
      a: "We accept bKash, Nagad, Rocket, Upay, and direct bank transfer. All transactions are processed securely in BDT.",
    },
    {
      q: `Is the ${productName} subscription genuine?`,
      a: "Yes — every account we provide is sourced from official channels. We never use cracked, hacked, or modified accounts. That's why we offer a 30-day replacement warranty.",
    },
    {
      q: "What happens if my account stops working?",
      a: `If your account fails for any reason during the ${durationDays}-day period, simply message us on WhatsApp and we'll replace it free of charge — no questions asked.`,
    },
    {
      q: "Can I share the account with friends?",
      a: "Shared plans are intended for single-user usage from one device at a time. For team/family use, please look at our Personal/Premium tiers which allow multi-device login.",
    },
    {
      q: "Do you offer refunds?",
      a: "Yes — if we're unable to deliver your order within 24 hours, you get a full refund. Once delivered, we offer free replacement instead of refund within the warranty period.",
    },
  ];
}

function FaqItems({ productName, durationDays }: { productName: string; durationDays: number }) {
  const items = getFaqItems(productName, durationDays);
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-sm font-semibold" data-testid={`faq-q-${i}`}>
            {item.q}
          </AccordionTrigger>
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
    query: {
      enabled: !!product?.category_id,
      queryKey: getListProductsQueryKey(relatedParams),
    },
  });

  const allProductsParams = { is_active: true };
  const { data: allProducts } = useListProducts(allProductsParams, {
    query: { queryKey: getListProductsQueryKey(allProductsParams) },
  });

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  // Record this product as recently viewed
  useEffect(() => {
    if (product?.id) trackViewed(product.id);
  }, [product?.id, trackViewed]);

  const rating = useMemo(() => (product ? getProductRating(product.id) : 0), [product]);
  const reviewCount = useMemo(() => (product ? getProductReviewCount(product.id) : 0), [product]);

  // SEO: dynamic title, description, JSON-LD Product schema
  const seoTitle = product ? `${product.name} — Buy in Bangladesh at ৳${product.price_bdt}` : "Product";
  const seoDesc = product
    ? `${product.name} subscription in Bangladesh from AIPT. ${product.description?.slice(0, 130) ?? ""} Pay via bKash, Nagad or bank — activation in 1 hour, 30-day warranty.`
    : undefined;
  const seoKeywords = product
    ? `${product.name}, ${product.name} Bangladesh, ${product.name} BDT, buy ${product.name}, ${product.category_name}, AI tools Bangladesh, AIPT`
    : undefined;
  const jsonLd: Array<Record<string, unknown>> | null = product
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.image_url ? [product.image_url] : undefined,
          sku: `AIPT-${product.id}`,
          category: product.category_name,
          brand: { "@type": "Brand", name: "AIPT" },
          offers: {
            "@type": "Offer",
            url: typeof window !== "undefined" ? window.location.href : undefined,
            priceCurrency: "BDT",
            price: product.price_bdt,
            availability:
              product.stock_count === undefined || (product.stock_count ?? 1) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "AIPT — AI Premium Tools" },
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "All Tools", item: "/products" },
            ...(product.category_name
              ? [{ "@type": "ListItem", position: 3, name: product.category_name, item: `/products?category_id=${product.category_id}` }]
              : []),
            {
              "@type": "ListItem",
              position: product.category_name ? 4 : 3,
              name: product.name,
            },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: getFaqItems(product.name, product.duration_days || 30).map(item => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        },
      ]
    : null;

  useSeo({
    title: seoTitle,
    description: seoDesc,
    image: product?.image_url ?? null,
    type: "product",
    keywords: seoKeywords,
    jsonLd,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Skeleton className="h-5 w-64 mb-6" />
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-32 w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/products">
          <Button className="mt-6">Back to Products</Button>
        </Link>
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
    toast({ title: "Added to cart 🛒", description: `${product!.name} has been added to your cart.` });
  }

  function handleBuyNow() {
    handleAddToCart();
    navigate("/checkout");
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product!.name, text: product!.description ?? "", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Product link copied to clipboard." });
    }
  }

  const savings = product.original_price_bdt
    ? Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)
    : 0;
  const savingsAmt = product.original_price_bdt ? product.original_price_bdt - product.price_bdt : 0;
  const gradient = getProductGradient(product.name);
  const durationDays = product.duration_days || 30;
  const inStock = product.stock_count === undefined || (product.stock_count ?? 1) > 0;

  const related = (relatedAll ?? []).filter(p => p.id !== product.id).slice(0, 4);
  const recentlyViewedList = recentIds
    .filter(rid => rid !== product.id)
    .map(rid => (allProducts ?? []).find(p => p.id === rid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" data-testid="breadcrumb-home">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/products" data-testid="breadcrumb-products">All Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {product.category_name && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/products?category_id=${product.category_id}`} data-testid="breadcrumb-category">
                      {product.category_name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px]" data-testid="breadcrumb-product">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
          {/* LEFT: Hero + content */}
          <div>
            <ProductLogoBanner
              name={product.name}
              imageUrl={product.image_url}
              gradient={gradient}
              size="detail"
              isFeatured={product.is_featured ?? false}
              savingsPct={savings}
              className="mb-6 shadow-2xl rounded-2xl"
            />

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="font-medium">{product.category_name}</Badge>
              <Badge variant="outline" className="font-medium">{durationDays} days access</Badge>
              {product.is_featured && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                  ⭐ Bestseller
                </Badge>
              )}
              {inStock ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5 text-sm">
              <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    aria-hidden="true"
                    className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                  />
                ))}
                <span className="font-bold ml-1.5" data-testid="text-rating">{rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground" data-testid="text-review-count">{reviewCount} verified buyers</span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <button onClick={handleShare} className="hidden sm:inline-flex items-center gap-1 text-primary hover:underline" data-testid="btn-share">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>

            <p className="text-muted-foreground text-base mb-8 leading-relaxed">{product.description}</p>

            {/* Tabs: Overview / Included / Delivery / FAQ */}
            <Tabs defaultValue="included" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto gap-1 mb-5">
                <TabsTrigger value="included" data-testid="tab-included">
                  <Check className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Included
                </TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">
                  <Star className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="delivery" data-testid="tab-delivery">
                  <Truck className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Delivery
                </TabsTrigger>
                <TabsTrigger value="warranty" data-testid="tab-warranty">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Warranty
                </TabsTrigger>
                <TabsTrigger value="faq" data-testid="tab-faq">
                  <HelpCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  FAQ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="included" className="mt-0">
                <h3 className="font-bold mb-3 text-base">What's included</h3>
                <div className="space-y-2.5">
                  {product.features?.map(f => (
                    <div key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <CustomerReviews productId={product.id} productName={product.name} />
              </TabsContent>

              <TabsContent value="delivery" className="mt-0">
                <h3 className="font-bold mb-4 text-base">How delivery works</h3>
                <ol className="space-y-4">
                  {[
                    { Icon: Wallet, title: "1. Place your order", desc: "Add to cart and pay via bKash, Nagad, Rocket, Upay, or bank transfer." },
                    { Icon: Check, title: "2. We confirm payment", desc: "Our team verifies your transaction within 30 minutes (10am–11pm)." },
                    { Icon: Sparkles, title: "3. Receive your access", desc: `Login credentials for ${product.name} are delivered straight to your WhatsApp — usually within 1 hour.` },
                  ].map(s => (
                    <li key={s.title} className="flex items-start gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                      >
                        <s.Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </TabsContent>

              <TabsContent value="warranty" className="mt-0">
                <h3 className="font-bold mb-3 text-base">Warranty & replacement</h3>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>
                    Every order comes with a <strong>30-day warranty</strong>. If your access ever stops working during the
                    warranty window, message us on WhatsApp and we will replace your account free of charge — no questions asked.
                  </p>
                  <p className="text-muted-foreground">
                    We never sell cracked or hacked accounts. Every {product.name} subscription is sourced from official channels,
                    which is why we can stand behind it with a real warranty.
                  </p>
                  <ul className="space-y-2 mt-2">
                    {[
                      "Free replacement during the warranty period",
                      "Full refund if we cannot deliver within 24 hours",
                      "Lifetime WhatsApp support during your subscription",
                    ].map(p => (
                      <li key={p} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="mt-0">
                <h3 className="font-bold mb-3 text-base">Frequently asked questions</h3>
                <FaqItems productName={product.name} durationDays={durationDays} />
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Sticky purchase card */}
          <div>
            <Card
              className="md:sticky md:top-28"
              style={{ border: "2px solid hsl(var(--primary) / 0.2)", boxShadow: "0 8px 30px hsl(var(--primary) / 0.1)" }}
            >
              <CardContent className="p-6 md:p-7">
                {/* Price block */}
                <div className="mb-5 pb-5 border-b border-border">
                  <div className="flex items-end gap-3 mb-1">
                    <div
                      className="text-4xl md:text-5xl font-black text-primary"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                      data-testid="text-price"
                    >
                      ৳{product.price_bdt.toLocaleString("en-BD")}
                    </div>
                    {product.original_price_bdt && (
                      <div className="text-base text-muted-foreground line-through pb-2">
                        ৳{product.original_price_bdt.toLocaleString("en-BD")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground text-sm">{durationDays}-day access</span>
                    {savingsAmt > 0 && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        Save ৳{savingsAmt.toLocaleString("en-BD")} ({savings}% off)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* "vs direct" comparison block — AIO/conversion */}
                {product.original_price_bdt && savingsAmt > 0 && (
                  <div className="mb-5 rounded-lg overflow-hidden border" data-testid="block-vs-direct">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
                      AIPT vs buying direct
                    </div>
                    <div className="divide-y">
                      <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">Direct vendor (after BD VAT + FX)</span>
                        <span className="font-semibold line-through">৳{product.original_price_bdt.toLocaleString("en-BD")}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-green-50 dark:bg-green-950/30">
                        <span className="font-semibold">AIPT — {durationDays} days</span>
                        <span className="font-black text-green-700 dark:text-green-400">৳{product.price_bdt.toLocaleString("en-BD")}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">You save</span>
                        <span className="font-bold text-primary">৳{savingsAmt.toLocaleString("en-BD")} ({savings}% off)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust quick list */}
                <div className="space-y-2.5 mb-6 rounded-lg p-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" /> Activation in 1 hour
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" /> Pay in BDT — bKash, Nagad, Bank
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" /> 30-day replacement warranty
                  </div>
                  {product.stock_count != null && product.stock_count > 0 && product.stock_count <= 10 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                      ⚠️ Only {product.stock_count} left in stock
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-14 text-base font-bold rounded-lg mb-3 shadow-md"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  data-testid="btn-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-lg mb-3"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  data-testid="btn-buy-now"
                >
                  Buy Now
                </Button>
                <a
                  href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hi AIPT, I'd like to ask about: ${product.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
                  data-testid="btn-whatsapp-inquiry"
                >
                  <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
                </a>

                <div className="mt-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" /> Secure payment · Verified by AIPT
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust badges row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_BADGES.map(b => (
            <div
              key={b.title}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30"
              data-testid={`trust-${b.title.toLowerCase().replace(/ /g, "-")}`}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
              >
                <b.Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>
                  You may also like
                </h2>
                <p className="text-sm text-muted-foreground mt-1">More from {product.category_name}</p>
              </div>
              <Link href={`/products?category_id=${product.category_id}`}>
                <Button variant="ghost" size="sm" className="gap-1" data-testid="btn-view-all-related">
                  View all <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => {
                const grad = getProductGradient(p.name);
                const sav = p.original_price_bdt ? Math.round((1 - p.price_bdt / p.original_price_bdt) * 100) : 0;
                return (
                  <Link key={p.id} href={`/products/${p.id}`}>
                    <Card
                      className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                      data-testid={`related-product-${p.id}`}
                    >
                      <ProductLogoBanner
                        name={p.name}
                        imageUrl={p.image_url}
                        gradient={grad}
                        size="card"
                        isFeatured={p.is_featured ?? false}
                        savingsPct={sav}
                      />
                      <CardContent className="p-4">
                        <div className="font-bold text-sm line-clamp-1 mb-1">{p.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{p.description}</div>
                        <div className="flex items-baseline gap-2">
                          <div className="font-black text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                            ৳{p.price_bdt.toLocaleString("en-BD")}
                          </div>
                          {p.original_price_bdt && (
                            <div className="text-xs text-muted-foreground line-through">
                              ৳{p.original_price_bdt.toLocaleString("en-BD")}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recently viewed strip (excluding current product) */}
        {recentlyViewedList.length > 0 && (
          <section className="mt-16" data-testid="section-pdp-recently-viewed">
            <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
              Recently viewed
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewedList.map(p => {
                const grad = getProductGradient(p.name);
                const sav = p.original_price_bdt ? Math.round((1 - p.price_bdt / p.original_price_bdt) * 100) : 0;
                return (
                  <Link key={p.id} href={`/products/${p.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer" data-testid={`pdp-recent-${p.id}`}>
                      <ProductLogoBanner
                        name={p.name}
                        imageUrl={p.image_url}
                        gradient={grad}
                        size="card"
                        isFeatured={p.is_featured ?? false}
                        savingsPct={sav}
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
          </section>
        )}
      </div>

      {/* Mobile sticky bottom CTA */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 flex items-center gap-3"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground line-through leading-none">
            {product.original_price_bdt ? `৳${product.original_price_bdt.toLocaleString("en-BD")}` : "\u00A0"}
          </div>
          <div className="text-xl font-black text-primary leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            ৳{product.price_bdt.toLocaleString("en-BD")}
          </div>
        </div>
        <Button onClick={handleAddToCart} variant="outline" disabled={!inStock} className="h-11" data-testid="mobile-btn-add">
          <ShoppingCart className="h-4 w-4 mr-1" /> Add
        </Button>
        <Button onClick={handleBuyNow} disabled={!inStock} className="h-11 px-5 font-bold" data-testid="mobile-btn-buy">
          Buy Now
        </Button>
      </div>
    </>
  );
}
