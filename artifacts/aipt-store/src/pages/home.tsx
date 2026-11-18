import { Link } from "wouter";
import { ArrowRight, Shield, Wallet, MessageCircle, ChevronRight, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { WHATSAPP_URL } from "@/config/contact";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { useSeo } from "@/hooks/use-seo";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface HomeProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "ai-text": "✍️",
  "ai-image": "🎨",
  "ai-productivity": "⚡",
  "ai-video": "🎬",
  "student-packages": "🎓",
  "freelancer-packages": "💼",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "ai-text": "from-violet-500 to-purple-600",
  "ai-image": "from-pink-500 to-rose-600",
  "ai-productivity": "from-blue-500 to-cyan-600",
  "ai-video": "from-orange-500 to-red-600",
  "student-packages": "from-green-500 to-emerald-600",
  "freelancer-packages": "from-indigo-500 to-blue-600",
};

const homeFaq = [
  { q: "How can I pay?", a: "Current checkout methods are bKash, Nagad, and Bank Transfer. Orders are recorded in BDT." },
  { q: "How does delivery work?", a: "AIPT products are digitally fulfilled after payment confirmation. Timing varies by product, availability, payment verification, and order status." },
  { q: "Is AIPT the provider of these tools?", a: "AIPT is the seller/support entity. Third-party service names and trademarks belong to their providers; a listing does not itself imply provider affiliation or authorization." },
  { q: "What if I need help after ordering?", a: "Contact AIPT on WhatsApp with your order ID and payment reference. Current delivery and refund policies explain how order issues are reviewed." },
];

export default function Home({ onAddToCart }: HomeProps) {
  const { data: featured, isLoading: featuredLoading } = useListProducts({ featured: true, is_active: true });
  const { data: allProducts } = useListProducts({ is_active: true });
  const { data: categories = [], isLoading: catsLoading } = useListCategories();
  const { ids: recentIds } = useRecentlyViewed();
  const recentProducts = recentIds.map(rid => allProducts?.find(p => p.id === rid)).filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, 4);
  const productCount = allProducts?.length ?? 0;
  const categoryCount = categories.length;
  const studentPackagesCat = categories.find(c => c.slug === "student-packages");
  const studentPackagesHref = studentPackagesCat ? `/products?category_id=${studentPackagesCat.id}` : "/products";

  useSeo({
    title: "AIPT — AI & Digital Tool Subscriptions in Bangladesh",
    description: `Browse ${productCount || "the current"} active AIPT catalog entries. Prices are shown in BDT and checkout currently supports bKash, Nagad, and Bank Transfer.`,
    keywords: "AI tools Bangladesh, AI subscriptions BDT, bKash AI subscription, AIPT",
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "AIPT — AI Premium Tools",
        url: typeof window !== "undefined" ? window.location.origin : undefined,
        description: "Bangladesh-focused seller and support service for digital AI and tool subscriptions.",
        areaServed: "BD",
        paymentAccepted: "bKash, Nagad, Bank Transfer",
        currenciesAccepted: "BDT",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AIPT — AI Premium Tools",
        url: typeof window !== "undefined" ? window.location.origin : undefined,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${typeof window !== "undefined" ? window.location.origin : ""}/products?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Store",
        name: "AIPT — AI Premium Tools",
        image: typeof window !== "undefined" ? `${window.location.origin}/opengraph.jpg` : undefined,
        address: { "@type": "PostalAddress", addressCountry: "BD" },
        paymentAccepted: "bKash, Nagad, Bank Transfer",
        currenciesAccepted: "BDT",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: homeFaq.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
      },
    ],
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden text-white min-h-[560px] flex items-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 20% 30%, hsl(262 83% 30% / 0.7) 0px, transparent 55%), radial-gradient(ellipse at 80% 10%, hsl(220 90% 28% / 0.6) 0px, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm">🇧🇩 Bangladesh · BDT checkout</Badge>
            <h1 className="font-black mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
              AI & digital tool
              <span className="block" style={{ background: "linear-gradient(90deg, #c4b5fd, #93c5fd, #6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>subscriptions</span>
              <span className="block text-white text-3xl md:text-4xl mt-1 font-bold">for Bangladesh</span>
            </h1>
            <p className="text-lg text-white/80 mb-10 max-w-xl leading-relaxed">Browse the current AIPT catalog, see live BDT pricing, and place digital orders using the payment methods shown at checkout.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products"><Button size="lg" className="font-bold px-8 h-14 text-base rounded-full shadow-lg transition-transform hover:scale-105" style={{ background: "white", color: "hsl(262 83% 30%)" }} data-testid="btn-shop-now">Shop All Tools <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
              <Link href={studentPackagesHref}><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base rounded-full">Student Packages</Button></Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-5 text-white/75 text-sm">
              <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-violet-300" /> bKash · Nagad · Bank</div>
              <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-violet-300" /> Digital order support</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-300" /> Provider/seller identity separated</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="relative py-5" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { label: "Active Catalog", value: allProducts ? String(productCount) : "—" },
            { label: "Categories", value: categories.length ? String(categoryCount) : "—" },
            { label: "Checkout Methods", value: "3" },
            { label: "Fulfilment", value: "Digital" },
          ].map(stat => <div key={stat.label} className="py-2"><div className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.value}</div><div className="text-white/75 text-sm mt-0.5">{stat.label}</div></div>)}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pt-10" data-testid="section-answer">
        <div className="rounded-2xl p-6 md:p-8 border" style={{ background: "hsl(var(--muted) / 0.35)", borderColor: "hsl(var(--primary) / 0.18)" }}>
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">About AIPT</div>
          <p className="text-base md:text-lg leading-relaxed"><strong>AIPT (AI Premium Tools)</strong> is a Bangladesh-focused seller and support service for digital AI and tool subscriptions. The live catalog is the source of truth for current products, pricing and availability. AIPT is the seller/support entity; third-party service names and trademarks belong to their respective providers.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8"><div><p className="text-primary text-sm font-semibold mb-1">Browse by category</p><h2 className="text-3xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Find the right tool</h2></div><Link href="/products"><Button variant="ghost" className="hidden sm:flex">View all <ChevronRight className="ml-1 h-4 w-4" /></Button></Link></div>
        {catsLoading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{categories.slice(0, 6).map(cat => <Link key={cat.id} href={`/products?category_id=${cat.id}`}><Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden"><CardContent className="p-0"><div className={`h-2 bg-gradient-to-r ${CATEGORY_GRADIENTS[cat.slug] ?? "from-violet-500 to-blue-500"}`} /><div className="p-5 text-center"><div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] ?? "✨"}</div><div className="font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{cat.name}</div></div></CardContent></Card></Link>)}</div>}
      </section>

      <section className="bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8"><div><p className="text-primary text-sm font-semibold mb-1 flex items-center gap-1"><Sparkles className="h-4 w-4" /> Current catalog picks</p><h2 className="text-3xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Featured tools</h2></div><Link href="/products"><Button variant="ghost">All products <ChevronRight className="ml-1 h-4 w-4" /></Button></Link></div>
          {featuredLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{(featured ?? []).slice(0, 8).map(p => { const grad = getProductGradient(p.name); return <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"><Link href={`/products/${p.id}`}><div className="cursor-pointer"><ProductLogoBanner name={p.name} imageUrl={p.image_url} gradient={grad} size="card" isFeatured={p.is_featured ?? false} savingsPct={0} /></div></Link><CardContent className="p-5"><Link href={`/products/${p.id}`}><h3 className="font-bold line-clamp-2 hover:text-primary cursor-pointer min-h-12" style={{ fontFamily: "Outfit, sans-serif" }}>{p.name}</h3></Link><div className="flex items-end justify-between mt-3"><div><div className="text-xs text-muted-foreground">Current AIPT price</div><div className="text-xl font-black text-primary">৳{p.price_bdt.toLocaleString("en-BD")}</div></div><Button size="sm" onClick={() => onAddToCart({ productId: p.id, name: p.name, price_bdt: p.price_bdt, image_url: p.image_url, duration_days: p.duration_days })}>Add</Button></div></CardContent></Card>; })}</div>}
        </div>
      </section>

      {recentProducts.length > 0 && <section className="max-w-6xl mx-auto px-4 py-14"><h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Recently viewed</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{recentProducts.map(p => { const grad = getProductGradient(p.name); return <Link key={p.id} href={`/products/${p.id}`}><Card className="overflow-hidden h-full hover:shadow-lg transition-all"><ProductLogoBanner name={p.name} imageUrl={p.image_url} gradient={grad} size="card" savingsPct={0} /><CardContent className="p-4"><div className="font-bold text-sm line-clamp-1">{p.name}</div><div className="font-black text-primary mt-1">৳{p.price_bdt.toLocaleString("en-BD")}</div></CardContent></Card></Link>; })}</div></section>}

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10"><p className="text-primary text-sm font-semibold mb-1">Why use the AIPT storefront?</p><h2 className="text-3xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Clear local ordering facts</h2></div>
        <div className="grid md:grid-cols-3 gap-5">
          <Card><CardContent className="p-6"><Wallet className="h-8 w-8 text-primary mb-4" /><h3 className="font-bold text-lg mb-2">BDT checkout</h3><p className="text-sm text-muted-foreground">Current checkout options are bKash, Nagad, and Bank Transfer.</p></CardContent></Card>
          <Card><CardContent className="p-6"><MessageCircle className="h-8 w-8 text-primary mb-4" /><h3 className="font-bold text-lg mb-2">Digital order support</h3><p className="text-sm text-muted-foreground">Use the order ID and payment reference when contacting AIPT about fulfilment or an order issue.</p></CardContent></Card>
          <Card><CardContent className="p-6"><Shield className="h-8 w-8 text-primary mb-4" /><h3 className="font-bold text-lg mb-2">Seller/provider clarity</h3><p className="text-sm text-muted-foreground">AIPT is the seller/support entity; third-party product names remain the providers' trademarks.</p></CardContent></Card>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8"><HelpCircle className="h-9 w-9 text-primary mx-auto mb-3" /><h2 className="text-3xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Quick questions</h2></div>
          <Accordion type="single" collapsible>{homeFaq.map((item, i) => <AccordionItem key={i} value={`faq-${i}`}><AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent></AccordionItem>)}</Accordion>
          <div className="text-center mt-6"><Link href="/faq"><Button variant="outline">Read the full FAQ <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-3xl p-8 md:p-12 text-white text-center" style={{ background: "linear-gradient(135deg, hsl(262 83% 35%), hsl(220 90% 35%))" }}>
          <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Check the current catalog before you order</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-7">Use the live product page for the current price and description. If a fulfilment detail is unclear, contact AIPT first.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3"><Link href="/products"><Button size="lg" className="bg-white text-purple-800 hover:bg-white/90 font-bold">Browse products <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10"><MessageCircle className="mr-2 h-4 w-4" />Ask on WhatsApp</Button></a></div>
        </div>
      </section>
    </div>
  );
}
