import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="font-black text-2xl text-primary mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>AIPT</div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI Premium Tools — Bangladesh's student-first AI subscription store. Superior AI, surprising prices.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              📍 Bangladesh · 🕐 Delivery within 1 hour
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <div><Link href="/"><span className="text-muted-foreground hover:text-foreground cursor-pointer">Home</span></Link></div>
              <div><Link href="/products"><span className="text-muted-foreground hover:text-foreground cursor-pointer">All Tools</span></Link></div>
              <div><Link href="/cart"><span className="text-muted-foreground hover:text-foreground cursor-pointer">Cart</span></Link></div>
              <div><Link href="/admin"><span className="text-muted-foreground hover:text-foreground cursor-pointer">Admin Panel</span></Link></div>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">Payment Methods</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">📱 bKash</div>
              <div className="flex items-center gap-2">📱 Nagad</div>
              <div className="flex items-center gap-2">🏦 Bank Transfer</div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              💬 Support via WhatsApp
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} AI Premium Tools (AIPT). All rights reserved.</div>
          <div>Made with ❤️ for Bangladeshi students</div>
        </div>
      </div>
    </footer>
  );
}
