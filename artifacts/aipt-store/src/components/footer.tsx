import { useState } from "react";
import { Link } from "wouter";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  Facebook,
  Instagram,
  Youtube,
  Send,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_URL, WHATSAPP_HOURS } from "@/config/contact";
import { useListCategories } from "@workspace/api-client-react";

const TRUST_BADGES = [
  { icon: ShieldCheck, title: "Seller Clarity", subtitle: "AIPT is the seller and support contact" },
  { icon: Truck, title: "Digital Fulfilment", subtitle: "Handled after payment confirmation" },
  { icon: RefreshCw, title: "Order Support", subtitle: "Use your order ID when contacting us" },
  { icon: Lock, title: "BDT Checkout", subtitle: "bKash · Nagad · Bank" },
];

const PAYMENT_METHODS = [
  { name: "bKash", color: "#E2136E" },
  { name: "Nagad", color: "#EC1C24" },
  { name: "Bank", color: "#1E40AF" },
];

const SOCIALS = [
  { Icon: Facebook, href: "https://facebook.com/aiptbd", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com/aiptbd", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com/@aiptbd", label: "YouTube" },
  { Icon: Send, href: "https://t.me/aiptbd", label: "Telegram" },
];

export default function Footer() {
  const { data: categories = [] } = useListCategories();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    toast({
      title: "Newsletter signup is not active yet",
      description: "No subscription was created. Please use WhatsApp for current offers or support.",
    });
  }

  return (
    <footer className="mt-20" style={{ position: "relative" }}>
      <div className="border-y border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_BADGES.map(b => (
            <div key={b.title} className="flex items-start gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
              >
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm" data-testid={`badge-${b.title.toLowerCase().replace(/ /g, "-")}`}>{b.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--secondary) / 0.4), transparent)",
        }}
      />

      <div className="bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-10">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-md"
                  style={{
                    background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  AI
                </div>
                <div
                  className="font-black text-2xl"
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  AIPT
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                A Bangladesh-focused seller and support service for digital AI and tool subscriptions. Current product details,
                prices and availability are published by the live catalog.
              </p>

              <div className="mb-5">
                <div className="font-semibold text-sm mb-2">Newsletter</div>
                <form onSubmit={subscribe} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="h-10 rounded-full bg-background"
                    data-testid="input-newsletter-email"
                    required
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full h-10 w-10 shrink-0"
                    aria-label="Check newsletter availability"
                    data-testid="btn-newsletter-subscribe"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
                <div className="text-xs text-muted-foreground mt-1.5">Signup is not active yet; submitting does not create a subscription.</div>
              </div>

              <div className="flex items-center gap-2">
                {SOCIALS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="h-9 w-9 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    data-testid={`link-social-${s.label.toLowerCase()}`}
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <h3 className="font-bold mb-4">Shop</h3>
              <div className="space-y-2.5 text-sm">
                <div>
                  <Link href="/products">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">All Tools</span>
                  </Link>
                </div>
                {categories?.slice(0, 7).map(cat => (
                  <div key={cat.id}>
                    <Link href={`/products?category_id=${cat.id}`}>
                      <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" data-testid={`footer-cat-${cat.slug}`}>
                        {cat.name}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-bold mb-4">Help</h3>
              <div className="space-y-2.5 text-sm">
                <div><Link href="/cart"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Cart</span></Link></div>
                <div><Link href="/track-order"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Order Tracking</span></Link></div>
                <div><Link href="/refund-policy"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Refund Policy</span></Link></div>
                <div><Link href="/shipping-policy"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Delivery Policy</span></Link></div>
                <div><Link href="/faq"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">FAQ</span></Link></div>
                <div><Link href="/contact"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span></Link></div>
              </div>
            </div>

            <div className="md:col-span-3">
              <h3 className="font-bold mb-4">Contact</h3>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold w-fit transition-all hover:scale-105 shadow-md mb-3"
                style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
                data-testid="footer-btn-whatsapp"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{WHATSAPP_HOURS}</span></div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /><a href="mailto:admin@aipremium.tools" className="hover:text-foreground transition-colors">admin@aipremium.tools</a></div>
                <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>Dhaka, Bangladesh</span></div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{WHATSAPP_HOURS}</span></div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-muted-foreground">Checkout methods:</span>
              {PAYMENT_METHODS.map(p => (
                <div key={p.name} className="px-3 py-1.5 rounded-md text-white text-xs font-bold shadow-sm" style={{ background: p.color }} data-testid={`pay-${p.name.toLowerCase()}`}>
                  {p.name}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Lock className="h-3 w-3" />Orders are recorded in BDT</div>
          </div>

          <div className="border-t border-border mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} AI Premium Tools (AIPT). All rights reserved.</div>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/shipping-policy" className="hover:text-foreground transition-colors">Delivery</Link>
              <Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
