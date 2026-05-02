import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLogin: () => void;
}

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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>Admin Panel</h1>
            <p className="text-muted-foreground mt-1">AIPT Back Office</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                data-testid="input-admin-password"
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold" data-testid="btn-admin-login">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
