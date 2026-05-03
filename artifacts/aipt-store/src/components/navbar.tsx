import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Menu,
  X,
  Moon,
  Sun,
  MessageCircle,
  Search,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Clock,
  Wallet,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { WHATSAPP_URL } from "@/config/contact";
import { useListCategories, useListProducts } from "@workspace/api-client-react";

interface NavbarProps {
  cartCount: number;
}

const ANNOUNCEMENTS = [
  { icon: ShieldCheck, text: "30-day warranty on every order" },
  { icon: Clock, text: "Activation within 1 hour after payment" },
  { icon: Wallet, text: "bKash · Nagad · Rocket · Bank Transfer" },
  { icon: Sparkles, text: "Trusted by 1,000+ Bangladeshi students & freelancers" },
];

export default function Navbar({ cartCount }: NavbarProps) {
  const [location, navigate] = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [open, setOpen] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [catsOpen, setCatsOpen] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const prevCount = useRef(cartCount);
  const catsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  const { data: categories } = useListCategories();
  const { data: allProducts } = useListProducts({ is_active: true });
  const trimmedSearch = searchValue.trim().toLowerCase();
  const searchResults = trimmedSearch.length >= 2
    ? (allProducts ?? [])
        .filter(p => p.name.toLowerCase().includes(trimmedSearch) || (p.description ?? "").toLowerCase().includes(trimmedSearch))
        .slice(0, 6)
    : [];

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

  // Rotate announcement bar every 4s
  useEffect(() => {
    const t = setInterval(() => setAnnIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Close categories dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) {
        setCatsOpen(false);
      }
    }
    if (catsOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
    return undefined;
  }, [catsOpen]);

  // Close search autocomplete on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
    return undefined;
  }, [searchOpen]);

  const isActive = (path: string) => location === path;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setOpen(false);
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Tools" },
  ];

  const Ann = ANNOUNCEMENTS[annIdx];
  const AnnIcon = Ann.icon;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      {/* Announcement bar */}
      <div
        className="text-white text-xs font-medium"
        style={{ background: "linear-gradient(90deg, hsl(262 83% 28%), hsl(220 90% 30%))" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <AnnIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" data-testid="text-announcement">{Ann.text}</span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 hover:underline shrink-0"
            data-testid="link-announcement-whatsapp"
          >
            <MessageCircle className="h-3 w-3" />
            <span>Need help? Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div
        style={{
          background: "hsl(var(--background) / 0.85)",
          borderBottom: "1px solid",
          borderImage: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--primary) / 0.1)) 1",
          boxShadow: "0 1px 20px hsl(var(--primary) / 0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer shrink-0" data-testid="link-logo">
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
              <span className="font-black text-xl hidden sm:inline" style={{ fontFamily: "Outfit, sans-serif" }}>
                AIPT
              </span>
            </div>
          </Link>

          {/* Desktop nav + Categories dropdown */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    isActive(link.href) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                  data-testid={`nav-${link.label.toLowerCase().replace(/ /g, "-")}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            <div ref={catsRef} className="relative">
              <button
                onClick={() => setCatsOpen(o => !o)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-1"
                data-testid="btn-categories"
              >
                Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${catsOpen ? "rotate-180" : ""}`} />
              </button>
              {catsOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-2xl py-2 z-50"
                  style={{ boxShadow: "0 10px 40px hsl(var(--primary) / 0.15)" }}
                  data-testid="menu-categories"
                >
                  {categories?.map(cat => (
                    <Link key={cat.id} href={`/products?category_id=${cat.id}`}>
                      <span
                        onClick={() => setCatsOpen(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-muted cursor-pointer transition-colors"
                        data-testid={`menu-cat-${cat.slug}`}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search bar (desktop) */}
          <form ref={searchRef} onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchValue}
              onChange={e => { setSearchValue(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search ChatGPT, Claude, Midjourney…"
              className="pl-9 h-10 rounded-full bg-muted/50 border-muted focus-visible:bg-background"
              data-testid="input-navbar-search"
            />
            {searchOpen && trimmedSearch.length >= 2 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl py-1.5 z-50 max-h-96 overflow-y-auto"
                style={{ boxShadow: "0 10px 40px hsl(var(--primary) / 0.18)" }}
                data-testid="menu-search-results"
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No tools found for "<span className="font-medium">{searchValue}</span>".
                    <button
                      type="submit"
                      className="block mx-auto mt-2 text-primary text-xs font-semibold hover:underline"
                    >
                      Search all products →
                    </button>
                  </div>
                ) : (
                  <>
                    {searchResults.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => { setSearchOpen(false); setSearchValue(""); navigate(`/products/${p.id}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left transition-colors"
                        data-testid={`search-result-${p.id}`}
                      >
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} loading="lazy" className="h-7 w-7 object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-primary">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.category_name}</div>
                        </div>
                        <div className="text-sm font-bold text-primary shrink-0">৳{p.price_bdt.toLocaleString("en-BD")}</div>
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="block w-full text-center text-xs text-primary font-semibold py-2 border-t border-border hover:bg-muted transition-colors"
                    >
                      View all results for "{searchValue}" →
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto md:ml-0">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all hover:scale-105 shadow-sm"
              style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
              data-testid="btn-whatsapp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>

            <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode" data-testid="btn-toggle-dark">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" aria-label="Cart" data-testid="btn-cart">
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
              <Button variant="outline" size="sm" className="hidden md:flex gap-1.5" data-testid="btn-admin">
                <User className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" data-testid="btn-mobile-menu">
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SheetDescription className="sr-only">Browse AIPT pages, search tools, and access your cart</SheetDescription>
                {/* Mobile search */}
                <form onSubmit={submitSearch} className="mt-8 mb-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder="Search tools…"
                    className="pl-9 h-10"
                    data-testid="input-mobile-search"
                  />
                </form>

                <div className="flex flex-col gap-1">
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

                  <div className="mt-3 mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </div>
                  {categories?.map(cat => (
                    <Link key={cat.id} href={`/products?category_id=${cat.id}`}>
                      <span
                        className="block px-4 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  ))}

                  <div className="mt-3 mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Account
                  </div>
                  <Link href="/cart">
                    <span
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium cursor-pointer hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Cart {cartCount > 0 && <Badge className="ml-auto">{cartCount}</Badge>}
                    </span>
                  </Link>
                  <Link href="/admin">
                    <span
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium cursor-pointer hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Admin Panel
                    </span>
                  </Link>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 mt-4 rounded-lg text-white font-medium"
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
      </div>
    </header>
  );
}
