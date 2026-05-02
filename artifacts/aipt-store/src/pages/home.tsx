import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Clock, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

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

export default function Home({ onAddToCart }: HomeProps) {
  const { data: featured, isLoading: featuredLoading } = useListProducts({ featured: true, is_active: true });
  const { data: categories, isLoading: catsLoading } = useListCategories();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(262,83%,10%)] via-[hsl(262,70%,18%)] to-[hsl(220,90%,20%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0ibTM2IDM0djItaC0ydi0yaDB6bTAtNHY0aC00di00aDR6bTQtNHY0aC00di00aDR6bTAgOHYtNGg0djRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm">
              Bangladesh's #1 Student AI Store
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Superior AI,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-blue-300">
                Surprising Prices.
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
              Premium AI tools — ChatGPT, Midjourney, Canva Pro, and 25+ more — at 15-20% below market price. Built for Bangladeshi students and freelancers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 font-bold px-8 h-14 text-base rounded-full" data-testid="btn-shop-now">
                  Shop All Tools <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/products?category_id=5">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base rounded-full" data-testid="btn-student-packs">
                  Student Packages
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 text-white/70 text-sm">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-300" /> Trusted by 1000+ students</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-violet-300" /> Access within 1 hour</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-violet-300" /> 4.9/5 rating</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="bg-primary text-primary-foreground py-6">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "AI Tools", value: "29+" },
            { label: "Happy Students", value: "1000+" },
            { label: "Avg Savings", value: "20%" },
            { label: "Delivery Time", value: "1hr" },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
              <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Browse by Category</h2>
        {catsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map(cat => (
              <Link key={cat.id} href={`/products?category_id=${cat.id}`}>
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer group text-center" data-testid={`card-category-${cat.id}`}>
                  <CardContent className="p-5">
                    <div className="text-3xl mb-2">{CATEGORY_ICONS[cat.slug] || "🤖"}</div>
                    <div className="font-semibold text-sm leading-tight group-hover:text-primary">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{cat.product_count} tools</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Featured Tools</h2>
          <Link href="/products">
            <Button variant="ghost" className="text-primary" data-testid="link-view-all">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured?.map(product => (
              <Card key={product.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300" data-testid={`card-product-${product.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {product.is_featured && <Badge className="mb-2 bg-primary/10 text-primary border-0 text-xs">Featured</Badge>}
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{product.description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {product.features?.slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      {product.original_price_bdt && (
                        <div className="text-sm text-muted-foreground line-through">৳{product.original_price_bdt}</div>
                      )}
                      <div className="text-2xl font-black text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>৳{product.price_bdt}</div>
                      <div className="text-xs text-muted-foreground">{product.duration_days || 30} days</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button variant="outline" size="sm" data-testid={`btn-details-${product.id}`}>Details</Button>
                      </Link>
                      <Button size="sm" onClick={() => onAddToCart({ productId: product.id, name: product.name, price_bdt: product.price_bdt, image_url: product.image_url ?? undefined, duration_days: product.duration_days ?? undefined })} data-testid={`btn-add-cart-${product.id}`}>
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose AIPT */}
      <section className="bg-muted/40 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Outfit, sans-serif' }}>Why Students Choose AIPT</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="h-6 w-6" />, title: "15-20% Lower Prices", desc: "We pass the savings directly to students. Same tools, better price — always." },
              { icon: <Users className="h-6 w-6" />, title: "Student-First Packages", desc: "8 exclusive bundles designed for university life — research, design, writing, and more." },
              { icon: <Clock className="h-6 w-6" />, title: "Access in 1 Hour", desc: "Pay via bKash, Nagad, or bank transfer. Get your AI tools delivered within 1 hour." },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground mb-4">{item.icon}</div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Ready to level up?</h2>
        <p className="text-muted-foreground text-lg mb-8">Join 1000+ Bangladeshi students already using AIPT tools.</p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold" data-testid="btn-cta-shop">
            Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
