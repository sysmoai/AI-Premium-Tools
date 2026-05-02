import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, Moon, Sun, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WHATSAPP_URL } from "@/config/contact";

interface NavbarProps {
  cartCount: number;
}

export default function Navbar({ cartCount }: NavbarProps) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [open, setOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const prevCount = useRef(cartCount);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aipt_dark", String(next));
  }

  useEffect(() => {
    const saved = localStorage.getItem("aipt_dark");
    if (saved === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (cartCount !== prevCount.current && cartCount > 0) {
      setBadgePop(true);
      const t = setTimeout(() => setBadgePop(false), 350);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
    return undefined;
  }, [cartCount]);

  const isActive = (path: string) => location === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Tools" },
  ];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "hsl(var(--background) / 0.85)",
        borderBottom: "1px solid",
        borderImage: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--primary) / 0.1)) 1",
        boxShadow: "0 1px 20px hsl(var(--primary) / 0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-logo">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))",
                fontFamily: "Outfit, sans-serif",
                boxShadow: "0 2px 12px hsl(262 83% 58% / 0.4)",
              }}
            >
              AI
            </div>
            <span className="font-black text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
              AIPT
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(/ /g, "-")}`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* WhatsApp CTA */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all hover:scale-105 shadow-sm"
            style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
            data-testid="btn-whatsapp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp Support
          </a>

          <Button variant="ghost" size="icon" onClick={toggleDark} data-testid="btn-toggle-dark">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" data-testid="btn-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full bg-primary text-primary-foreground border-2 border-background transition-transform ${badgePop ? "badge-pop" : ""}`}
                  data-testid="badge-cart-count"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="hidden md:flex" data-testid="btn-admin">
              Admin
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="btn-mobile-menu">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href}>
                    <span
                      className={`block px-4 py-3 rounded-lg text-base font-medium cursor-pointer transition-colors ${
                        isActive(link.href) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
                <Link href="/admin">
                  <span
                    className="block px-4 py-3 rounded-lg text-base font-medium cursor-pointer hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Admin Panel
                  </span>
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-white font-medium"
                  style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
