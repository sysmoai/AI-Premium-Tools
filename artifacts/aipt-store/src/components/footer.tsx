import { Link } from "wouter";
import { MessageCircle, Phone } from "lucide-react";
import { WHATSAPP_URL, WHATSAPP_HOURS } from "@/config/contact";

export default function Footer() {
  return (
    <footer className="mt-16" style={{ position: "relative" }}>
      {/* Gradient top border */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--secondary) / 0.4), transparent)",
        }}
      />
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div
                className="font-black text-2xl mb-3"
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
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ai Premium Tools — Affordable AI subscriptions for all in Bangladesh.
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                📍 Bangladesh · 🕐 Delivery within 1 hour
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Link href="/">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Home</span>
                  </Link>
                </div>
                <div>
                  <Link href="/products">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">All Tools</span>
                  </Link>
                </div>
                <div>
                  <Link href="/cart">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Cart</span>
                  </Link>
                </div>
                <div>
                  <Link href="/admin">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Admin Panel</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-bold mb-4">Categories</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Link href="/products?category_id=1">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">AI Writing</span>
                  </Link>
                </div>
                <div>
                  <Link href="/products?category_id=2">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">AI Image Tools</span>
                  </Link>
                </div>
                <div>
                  <Link href="/products?category_id=3">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Productivity</span>
                  </Link>
                </div>
                <div>
                  <Link href="/products?category_id=5">
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Student Packages</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <div className="space-y-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold w-fit transition-all hover:scale-105 shadow-md"
                  style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Phone className="h-3.5 w-3.5" />
                  {WHATSAPP_HOURS}
                </div>
                <div className="text-sm text-muted-foreground">
                  📱 bKash · Nagad · Bank Transfer
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} AI Premium Tools (AIPT). All rights reserved.</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">⭐ 4.9 · 1000+ students served</span>
              <span className="hidden md:inline text-border">·</span>
              <span className="hidden md:inline">Made with ❤️ for Bangladeshi students</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
