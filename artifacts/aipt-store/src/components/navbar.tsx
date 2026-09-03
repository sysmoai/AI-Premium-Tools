import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, Moon, Sun, MessageCircle, Search, ChevronDown, Wallet, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { WHATSAPP_URL } from "@/config/contact";
import { useListCategories, useListProducts } from "@workspace/api-client-react";

interface NavbarProps { cartCount: number }

const ANNOUNCEMENTS = [
  { icon: Wallet, text: "Checkout in BDT: bKash · Nagad · Bank Transfer" },
  { icon: MessageCircle, text: "Digital order support is available on WhatsApp" },
  { icon: ShoppingCart, text: "Prices and availability come from the live AIPT catalog" },
];

export default function Navbar({ cartCount }: NavbarProps) {
  const [location, navigate] = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [annIdx, setAnnIdx] = useState(0);
  const prevCount = useRef(cartCount);
  const [badgePop, setBadgePop] = useState(false);
  const catsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const { data: categories = [] } = useListCategories();
  const { data: allProducts } = useListProducts({ is_active: true });

  const trimmedSearch = searchValue.trim().toLowerCase();
  const searchResults = trimmedSearch.length >= 2
    ? (allProducts ?? []).filter(p => p.name.toLowerCase().includes(trimmedSearch) || (p.description ?? "").toLowerCase().includes(trimmedSearch)).slice(0, 6)
    : [];

  useEffect(() => {
    const saved = localStorage.getItem("aipt_dark");
    if (saved === "true") { setDark(true); document.documentElement.classList.add("dark"); }
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

  useEffect(() => {
    const t = setInterval(() => setAnnIdx(i => (i + 1) % ANNOUNCEMENTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) setCatsOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aipt_dark", String(next));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setOpen(false);
    setSearchOpen(false);
  }

  const Ann = ANNOUNCEMENTS[annIdx];
  const AnnIcon = Ann.icon;
  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      <div className="text-white text-xs font-medium" style={{ background: "linear-gradient(90deg, hsl(262 83% 28%), hsl(220 90% 30%))" }}>
        <div className="max-w-6xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate"><AnnIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate" data-testid="text-announcement">{Ann.text}</span></div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1 hover:underline shrink-0"><MessageCircle className="h-3 w-3" />Need help? WhatsApp</a>
        </div>
      </div>

      <div style={{ background: "hsl(var(--background) / 0.9)", borderBottom: "1px solid hsl(var(--border))", boxShadow: "0 1px 20px hsl(var(--primary) / 0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/"><div className="flex items-center gap-2.5 cursor-pointer shrink-0" data-testid="link-logo"><img src="/brand/aipt-icon.svg" alt="AIPT" className="h-9 w-9 rounded-lg" /><span className="font-black text-xl hidden sm:inline" style={{ fontFamily: "Outfit, sans-serif" }}>AIPT</span></div></Link>

          <nav className="hidden lg:flex items-center gap-1">
            {[{href:"/",label:"Home"},{href:"/products",label:"All Tools"}].map(link => (
              <Link key={link.href} href={link.href}><span className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${isActive(link.href) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>{link.label}</span></Link>
            ))}
            <div ref={catsRef} className="relative">
              <button onClick={() => setCatsOpen(v => !v)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-1">Categories <ChevronDown className={`h-3.5 w-3.5 transition-transform ${catsOpen ? "rotate-180" : ""}`} /></button>
              {catsOpen && <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-2xl py-2 z-50">
                {categories.map(cat => <Link key={cat.id} href={`/products?category_id=${cat.id}`}><span onClick={() => setCatsOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-muted cursor-pointer">{cat.name}</span></Link>)}
              </div>}
            </div>
          </nav>

          <form ref={searchRef} onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input type="search" value={searchValue} onChange={e => { setSearchValue(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Search tools…" className="pl-9 h-10 rounded-full bg-muted/50" data-testid="input-navbar-search" />
            {searchOpen && trimmedSearch.length >= 2 && <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl py-1.5 z-50 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? <div className="px-4 py-5 text-center text-sm text-muted-foreground">No matching tools.</div> : searchResults.map(p => (
                <button type="button" key={p.id} onClick={() => { setSearchOpen(false); setSearchValue(""); navigate(`/products/${p.id}`); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left">
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate">{p.name}</div><div className="text-xs text-muted-foreground truncate">{p.category_name}</div></div><div className="text-sm font-bold text-primary">৳{p.price_bdt.toLocaleString("en-BD")}</div>
                </button>
              ))}
            </div>}
          </form>

          <div className="flex items-center gap-1.5 ml-auto md:ml-0">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
            <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Link href="/cart"><Button variant="ghost" size="icon" className="relative" aria-label="Cart" data-testid="btn-cart"><ShoppingCart className="h-5 w-5" />{cartCount > 0 && <Badge className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full ${badgePop ? "badge-pop" : ""}`}>{cartCount}</Badge>}</Button></Link>
            <Link href="/admin"><Button variant="outline" size="sm" className="hidden md:flex gap-1.5"><User className="h-3.5 w-3.5" />Admin</Button></Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetTitle>Navigation</SheetTitle><SheetDescription>Browse AIPT pages and tools.</SheetDescription>
                <form onSubmit={submitSearch} className="mt-6 mb-4 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Search tools…" className="pl-9" /></form>
                <div className="flex flex-col gap-1">
                  <Link href="/"><span onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-muted cursor-pointer">Home</span></Link>
                  <Link href="/products"><span onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-muted cursor-pointer">All Tools</span></Link>
                  {categories.map(cat => <Link key={cat.id} href={`/products?category_id=${cat.id}`}><span onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer">{cat.name}</span></Link>)}
                  <Link href="/track-order"><span onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-muted cursor-pointer">Track Order</span></Link>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 mx-4 h-11 rounded-lg text-white font-semibold flex items-center justify-center gap-2" style={{ background: "#25d366" }}><MessageCircle className="h-4 w-4" />WhatsApp Support</a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
