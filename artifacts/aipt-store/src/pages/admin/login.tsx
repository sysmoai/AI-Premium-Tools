import { useState } from "react";
import { Lock, Sparkles, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLogin: () => void;
}

const FEATURES = [
  { icon: <Zap className="h-4 w-4" />, text: "Real-time order management" },
  { icon: <Users className="h-4 w-4" />, text: "Customer insights & tracking" },
  { icon: <Shield className="h-4 w-4" />, text: "Secure payment verification" },
  { icon: <Sparkles className="h-4 w-4" />, text: "Product catalog control" },
];

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === "aipt2024") {
      localStorage.setItem("aipt_admin", "true");
      onLogin();
      toast({ title: "Welcome, Admin!", description: "You are now logged in." });
    } else {
      toast({ title: "Incorrect password", description: "Please try again.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div
        className="hidden md:flex w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, hsl(262 83% 12%), hsl(262 70% 22%), hsl(220 90% 26%))" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white, transparent)", transform: "translate(30%, 30%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center justify-center h-12 w-12 rounded-lg font-black text-lg mb-4 shadow-lg"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontFamily: "Outfit, sans-serif",
              backdropFilter: "blur(10px)",
            }}
          >
            AI
          </div>
          <div className="font-black text-3xl mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>AIPT</div>
          <div className="text-white/60 text-sm">AI Premium Tools · Admin</div>
        </div>

        {/* Middle content */}
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Manage your store,<br />grow your impact.
          </h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Monitor orders, manage products, and keep 1000+ students powered by AI tools.
          </p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-white/80">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} AIPT · Bangladesh's #1 Student AI Store
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center h-14 w-14 rounded-lg font-black text-xl text-white mb-3 shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", fontFamily: "Outfit, sans-serif" }}
            >
              AI
            </div>
            <div className="font-black text-2xl" style={{ fontFamily: "Outfit, sans-serif" }}>AIPT Admin</div>
          </div>

          <div className="mb-8">
            <div
              className="inline-flex items-center justify-center h-12 w-12 rounded-lg text-white mb-5 shadow-md"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-admin-password"
                className="h-12 rounded-lg"
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold rounded-lg shadow-md" data-testid="btn-admin-login">
              Sign in to Admin Panel
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Need help? Contact support via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
