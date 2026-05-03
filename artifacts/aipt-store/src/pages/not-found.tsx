import { Link } from "wouter";
import { Compass, Home, ShoppingBag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/config/contact";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div
          className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"
          style={{
            background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))",
            boxShadow: "0 10px 40px hsl(262 83% 58% / 0.35)",
          }}
        >
          <Compass className="h-10 w-10" />
        </div>

        <div
          className="text-7xl font-black mb-2"
          style={{
            fontFamily: "Outfit, sans-serif",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back to shopping for AI tools.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="btn-404-home">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="btn-404-products">
              <ShoppingBag className="h-4 w-4" />
              Browse Tools
            </Button>
          </Link>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
          data-testid="link-404-whatsapp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Need help finding something? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
