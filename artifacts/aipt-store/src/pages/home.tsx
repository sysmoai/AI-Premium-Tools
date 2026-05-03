import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Clock, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { useInView } from "@/hooks/use-in-view";
import { WHATSAPP_URL } from "@/config/contact";
import { ProductLogoBanner, getProductGradient } from "@/components/product-logo-banner";
import { useSeo } from "@/hooks/use-seo";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { Clock as ClockIcon } from "lucide-react";

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

const TOOL_CHIPS = [
  { name: "ChatGPT 5", emoji: "🤖", delay: "animate-float-d1", top: "12%", right: "6%", rotate: "-2deg" },
  { name: "Midjourney", emoji: "🎨", delay: "animate-float-d2 animate-float-reverse", top: "32%", right: "22%", rotate: "2deg" },
  { name: "Canva Pro", emoji: "✏️", delay: "animate-float-d3", top: "54%", right: "4%", rotate: "-1deg" },
  { name: "Claude AI", emoji: "🧠", delay: "animate-float-d4 animate-float-reverse", top: "22%", right: "38%", rotate: "1.5deg" },
  { name: "Notion AI", emoji: "📋", delay: "animate-float-d5", top: "68%", right: "28%", rotate: "-2deg" },
];

export default function Home({ onAddToCart }: HomeProps) {
  const { data: featured, isLoading: featuredLoading } = useListProducts({ featured: true, is_active: true });
  const { data: allProducts } = useListProducts({ is_active: true });
  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { ref: statRef, inView: statInView } = useInView();
  const { ids: recentIds } = useRecentlyViewed();
  const recentProducts = recentIds
    .map(rid => allProducts?.find(p => p.id === rid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const studentPackagesCat = categories?.find(c => c.slug === "student-packages");
  const studentPackagesHref = studentPackagesCat ? `/products?category_id=${studentPackagesCat.id}` : "/products";
  // Derived from the public products endpoint — the dashboard stats endpoint
  // is admin-only and shouldn't be reached from a marketing page.
  const totalToolsCount = (allProducts?.length ?? 0) || 71;
  const totalCustomersClaim = "1000+";

  useSeo({
    title: "AIPT — Affordable AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney",
    description: `Bangladesh's #1 store for premium AI subscriptions. ${totalToolsCount}+ tools including ChatGPT, Claude, Midjourney, Canva Pro and more. Pay in BDT via bKash, Nagad, or bank — 1-hour activation, 30-day warranty.`,
    keywords: "AI tools Bangladesh, ChatGPT Bangladesh, Claude Bangladesh, Midjourney Bangladesh, premium AI subscriptions BDT, bKash AI subscription, AIPT",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AIPT — AI Premium Tools",
      url: typeof window !== "undefined" ? window.location.origin : undefined,
      description: "Bangladesh's most affordable store for premium AI subscriptions.",
      areaServed: "BD",
      paymentAccepted: "bKash, Nagad, Rocket, Upay, Bank Transfer",
    },
  });

  return (
    <div className="min-h-screen">
      <section
        className="relative overflow-hidden text-white min-h-[580px] flex items-center"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse at 20% 30%, hsl(262 83% 30% / 0.7) 0px, transparent 55%)",
              "radial-gradient(ellipse at 80% 10%, hsl(220 90% 28% / 0.6) 0px, transparent 50%)",
              "radial-gradient(ellipse at 60% 70%, hsl(280 80% 22% / 0.5) 0px, transparent 50%)",
            ].join(", "),
          }}
        />

        <div className="hidden md:block absolute inset-0 pointer-events-none">
          {TOOL_CHIPS.map(chip => (
            <div
              key={chip.name}
              className={`absolute animate-float ${chip.delay}`}
              style={{ top: chip.top, right: chip.right, transform: `rotate(${chip.rotate})` }}
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-2 text-sm font-medium shadow-lg">
                <span className="text-base">{chip.emoji}</span>
                <span className="text-white/90">{chip.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm">
              🇧🇩 Bangladesh's #1 Student AI Store
            </Badge>
            <h1 className="font-black mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
              Affordable AI
              <span
                className="block"
                style={{
                  background: "linear-gradient(90deg, #c4b5fd, #93c5fd, #6ee7b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Subscriptions
              </span>
              <span className="block text-white/70 text-3xl md:text-4xl mt-1">for All in Bangladesh.</span>
            </h1>
            <p className="text-lg text-white/80 mb-10 max-w-xl leading-relaxed">
              Your trusted partner for affordable educational and freelancing tool subscriptions. Premium AI tools at prices everyone can afford.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button
                  size="lg"
                  className="font-bold px-8 h-14 text-base rounded-full shadow-lg transition-transform hover:scale-105"
                  style={{ background: "white", color: "hsl(262 83% 30%)" }}
                  data-testid="btn-shop-now"
                >
                  Shop All Tools <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={studentPackagesHref}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base rounded-full"
                  data-testid="btn-student-packs"
                >
                  Student Packages
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-300" /> Trusted by {totalCustomersClaim} students
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-300" /> Access within 1 hour
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-300" /> 4.9/5 rating
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section
        ref={statRef as React.RefObject<HTMLElement>}
        className="relative py-5 transition-all duration-700"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
          opacity: statInView ? 1 : 0,
          transform: statInView ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { label: "AI Tools", value: `${totalToolsCount}+` },
            { label: "Happy Customers", value: totalCustomersClaim },
            { label: "Avg Savings", value: "20%" },
            { label: "Delivery Time", value: "1 hr" },
          ].map(stat => (
            <div key={stat.label} className="py-2">
              <div className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.value}</div>
              <div className="text-white/75 text-sm mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-14 pb-2" data-testid="section-recently-viewed">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>
                Recently viewed
              </h2>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProducts.map(p => {
              const grad = getProductGradient(p.name);
              const sav = p.original_price_bdt ? Math.round((1 - p.price_bdt / p.original_price_bdt) * 100) : 0;
              return (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <Card
                    className="overflow-hidden h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                    data-testid={`recent-product-${p.id}`}
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

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Browse by Category</h2>
        {catsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* All Tools card */}
            <Link href="/products">
              <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group text-center" data-testid="card-category-all">
                <CardContent className="p-4 flex flex-col items-center gap-2.5">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-xl shadow-md bg-gradient-to-br from-slate-500 to-gray-600 group-hover:scale-110 transition-transform">
                    🔮
                  </div>
                  <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">All Tools</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {totalToolsCount}+ tools
                  </span>
                </CardContent>
              </Card>
            </Link>

            {categories?.map(cat => {
              const gradient = CATEGORY_GRADIENTS[cat.slug] || "from-primary to-secondary";
              const icon = CATEGORY_ICONS[cat.slug] || "🤖";
              return (
                <Link key={cat.id} href={`/products?category_id=${cat.id}`}>
                  <Card
                    className="hover:border-primary hover:shadow-lg transition-all cursor-pointer group text-center"
                    data-testid={`card-category-${cat.id}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2.5">
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center text-xl shadow-md bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}
                      >
                        {icon}
                      </div>
                      <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{cat.name}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {cat.product_count} tools
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Featured Tools</h2>
          <Link href="/products">
            <Button variant="ghost" className="text-primary" data-testid="link-view-all">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured?.map(product => {
              const gradient = getProductGradient(product.name);
              const savingsPct = product.original_price_bdt
                ? Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)
                : 0;
              return (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                  data-testid={`card-product-${product.id}`}
                >
                  <ProductLogoBanner
                    name={product.name}
                    imageUrl={product.image_url}
                    gradient={gradient}
                    size="card"
                    isFeatured={product.is_featured ?? false}
                    savingsPct={savingsPct}
                  />

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
      </section>

      {/* Why Choose AIPT */}
      <section className="py-16" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: "Outfit, sans-serif" }}>
            Why Students Choose AIPT
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="h-6 w-6" />, title: "15–20% Lower Prices", desc: "We pass the savings directly to students. Same tools, better price — always." },
              { icon: <Users className="h-6 w-6" />, title: "Student-First Packages", desc: "8 exclusive bundles designed for university life — research, design, writing, and more." },
              { icon: <Clock className="h-6 w-6" />, title: "Access in 1 Hour", desc: "Pay via bKash, Nagad, or bank transfer. Get your AI tools delivered within 1 hour." },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div
                  className="inline-flex items-center justify-center h-14 w-14 rounded-lg text-primary-foreground mb-4 shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                >
                  {item.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16" data-testid="section-testimonials">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            What our customers say
          </h2>
          <p className="text-muted-foreground">Real reviews from Bangladeshi students, freelancers and creators</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Tahmid R.",
              role: "Freelance designer · Dhaka",
              quote: "Got my Midjourney within 40 minutes of paying via bKash. Been using it for 4 months without a single issue. Saved me thousands of taka vs paying directly.",
              tool: "Midjourney",
            },
            {
              name: "Sumaiya I.",
              role: "BUET student · Researcher",
              quote: "ChatGPT Plus at this price is unbeatable in BD. Support replied to my WhatsApp in 5 minutes when I had a login question. Will keep renewing.",
              tool: "ChatGPT Plus",
            },
            {
              name: "Imran H.",
              role: "Content creator · Chittagong",
              quote: "Tried two other sellers before AIPT — both had problems. AIPT delivered within an hour and gave a real warranty. This is the only place I buy from now.",
              tool: "Canva Pro",
            },
          ].map(t => (
            <Card key={t.name} className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                  </div>
                  <div className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    {t.tool}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div
          className="rounded-lg p-12 relative overflow-hidden"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid hsl(var(--primary) / 0.15)",
            boxShadow: "0 4px 40px hsl(var(--primary) / 0.06)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15) 0px, transparent 70%)",
            }}
          />
          <h2 className="relative text-4xl font-black mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Ready to level up?</h2>
          <p className="relative text-muted-foreground text-lg mb-8">Join {totalCustomersClaim} Bangladeshi customers already using AIPT tools.</p>
          <div className="relative flex flex-wrap gap-4 justify-center">
            <Link href="/products">
              <Button
                size="lg"
                className="rounded-full px-10 h-14 text-base font-bold shadow-lg hover:scale-105 transition-transform"
                data-testid="btn-cta-shop"
              >
                Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 h-14 rounded-full text-white font-bold shadow-lg hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
