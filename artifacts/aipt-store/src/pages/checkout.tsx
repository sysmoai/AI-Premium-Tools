import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Smartphone, Building, Copy, Check, ShoppingCart, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer, useCreateOrder } from "@workspace/api-client-react";
import type { CartItem } from "@/hooks/use-cart";
import { BKASH_NUMBER, NAGAD_NUMBER, BANK_INFO } from "@/config/contact";
import { useSeo } from "@/hooks/use-seo";

interface CheckoutProps {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
}

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", icon: <Smartphone className="h-5 w-5" />, number: BKASH_NUMBER, active: "border-pink-500 bg-pink-50 dark:bg-pink-900/30", labelColor: "text-pink-700 dark:text-pink-400", iconColor: "text-pink-600" },
  { id: "nagad", label: "Nagad", icon: <Smartphone className="h-5 w-5" />, number: NAGAD_NUMBER, active: "border-orange-500 bg-orange-50 dark:bg-orange-900/30", labelColor: "text-orange-700 dark:text-orange-400", iconColor: "text-orange-600" },
  { id: "bank_transfer", label: "Bank Transfer", icon: <Building className="h-5 w-5" />, number: BANK_INFO, active: "border-blue-500 bg-blue-50 dark:bg-blue-900/30", labelColor: "text-blue-700 dark:text-blue-400", iconColor: "text-blue-600" },
] as const;

const STEPS = [
  { label: "Cart", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Details", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Confirm", icon: <Check className="h-4 w-4" /> },
];

export default function Checkout({ items, total, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "bank_transfer">("bkash");
  const [paymentRef, setPaymentRef] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", university: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const createCustomer = useCreateCustomer();
  const createOrder = useCreateOrder();
  const currentPm = PAYMENT_METHODS.find(p => p.id === paymentMethod)!;

  useSeo({
    title: "Checkout — AIPT",
    description: "Complete your AIPT digital order in BDT using bKash, Nagad, or Bank Transfer.",
    type: "website",
  });

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        <Card className="overflow-hidden border-2 border-dashed" style={{ borderColor: "hsl(var(--primary) / 0.25)" }}>
          <CardContent className="p-10 md:p-14 text-center">
            <div className="inline-flex h-20 w-20 rounded-2xl items-center justify-center text-white mb-6 shadow-xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}><ShoppingCart className="h-10 w-10" /></div>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Nothing to check out yet</h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto mb-8 leading-relaxed">Your cart is empty. Browse the live catalog, add a product, and return here to place a digital order.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/products"><Button size="lg" className="font-bold px-8 h-12 rounded-full" data-testid="btn-go-shop">Shop All Tools</Button></Link>
              <Link href="/track-order"><Button size="lg" variant="outline" className="font-semibold px-6 h-12 rounded-full">Track an order</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto pt-8 border-t border-border">
              {[{ v: "Digital", l: "Fulfilment" }, { v: "BDT", l: "Currency" }, { v: "3", l: "Payment methods" }].map(s => <div key={s.l} className="text-center"><div className="text-base md:text-lg font-black text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>{s.v}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.l}</div></div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function copyNumber() {
    navigator.clipboard.writeText(currentPm.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => setCopied(false));
  }

  function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === "object") {
      const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      return e.response?.data?.error ?? e.response?.data?.message ?? e.message ?? fallback;
    }
    return fallback;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Required fields missing", description: "Name and phone are required.", variant: "destructive" });
      return;
    }
    const phoneDigits = form.phone.replace(/[\s-]/g, "");
    if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(phoneDigits)) {
      toast({ title: "Invalid phone number", description: "Enter a valid Bangladeshi mobile number (e.g. 01712345678).", variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address or leave it blank.", variant: "destructive" });
      return;
    }
    if (!paymentRef.trim()) {
      toast({ title: "Payment reference required", description: "Enter your transaction/reference number.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const customer = await createCustomer.mutateAsync({
        data: {
          name: form.name.trim(),
          phone: phoneDigits,
          email: form.email.trim() || undefined,
          university: form.university.trim() || undefined,
        },
      });
      const order = await createOrder.mutateAsync({
        data: {
          customer_id: customer.id,
          payment_method: paymentMethod,
          payment_ref: paymentRef.trim(),
          notes: form.notes.trim() || undefined,
          items: items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
        },
      });
      try { sessionStorage.setItem(`aipt_order_phone_${order.id}`, phoneDigits); } catch { /* best effort */ }
      onClearCart();
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      toast({ title: "Order failed", description: extractErrorMessage(err, "Something went wrong. Please try again."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/cart"><Button variant="ghost" className="mb-6 -ml-2" data-testid="btn-back-cart"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart</Button></Link>

      <div className="flex items-center justify-center mb-8 w-full max-w-xs mx-auto px-2">
        {STEPS.map((step, idx) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${idx === 1 ? "text-white shadow-md" : "bg-muted text-muted-foreground"}`} style={idx === 1 ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" } : {}}><span className="w-4 h-4 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">{step.icon}</span></div>
              <span className={`text-[11px] font-medium leading-none ${idx === 1 ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-1.5 mb-4 rounded-full bg-muted" />}
          </div>
        ))}
      </div>

      <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8">After payment confirmation, digital fulfilment is coordinated using the phone/WhatsApp contact on the order. Timing varies by product, availability, payment verification, and order status.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-6">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Your full name" required data-testid="input-name" /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone Number *</Label><Input id="phone" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="e.g. 01712345678" required data-testid="input-phone" /></div>
                <div className="space-y-2"><Label htmlFor="email">Email (optional)</Label><Input id="email" type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="you@gmail.com" data-testid="input-email" /></div>
                <div className="space-y-2"><Label htmlFor="university">University (optional)</Label><Input id="university" value={form.university} onChange={e => updateForm("university", e.target.value)} placeholder="e.g. BUET, DU, NSU" data-testid="input-university" /></div>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-6">Payment Method</h2>
              <div className="grid grid-cols-3 gap-3 mb-6" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map(pm => (
                  <button key={pm.id} type="button" role="radio" aria-checked={paymentMethod === pm.id} aria-label={`Pay with ${pm.label}`} onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)} className={`flex flex-col items-center justify-center gap-2 py-4 px-2 min-h-[72px] rounded-lg border-2 font-medium text-sm transition-all touch-manipulation ${paymentMethod === pm.id ? pm.active : "border-border hover:border-primary/30"}`} data-testid={`btn-payment-${pm.id}`}>
                    <span className={paymentMethod === pm.id ? pm.iconColor : "text-muted-foreground"}>{pm.icon}</span>
                    <span className={paymentMethod === pm.id ? pm.labelColor : "text-foreground"}>{pm.label}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg p-4 mb-5" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                <p className="font-semibold text-sm mb-2">Send <span className="text-primary font-black">৳{total.toLocaleString()}</span> to:</p>
                <div className="flex items-center gap-3"><code className="text-primary font-mono text-lg font-bold flex-1 break-all">{currentPm.number}</code><Button type="button" variant="outline" size="sm" onClick={copyNumber} className="h-8 rounded-lg shrink-0">{copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}<span className="ml-1.5 text-xs">{copied ? "Copied" : "Copy"}</span></Button></div>
                <p className="text-muted-foreground text-xs mt-2">After sending, enter the transaction/reference value below.</p>
              </div>
              <div className="space-y-2"><Label htmlFor="paymentRef">Transaction / Reference Number *</Label><Input id="paymentRef" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Transaction/reference" required data-testid="input-payment-ref" /></div>
            </CardContent></Card>

            <Card><CardContent className="p-6"><h2 className="font-bold text-xl mb-4">Order Notes (optional)</h2><textarea className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Any relevant fulfilment note..." data-testid="textarea-notes" /></CardContent></Card>
          </div>

          <div>
            <Card className="md:sticky md:top-6" style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.08)" }}><CardContent className="p-6">
              <h2 className="font-bold text-xl mb-6">Order Summary</h2>
              <div className="space-y-3 mb-4">{items.map(item => <div key={item.productId} className="flex justify-between text-sm"><span className="text-muted-foreground flex-1 mr-2 truncate">{item.name} ×{item.quantity}</span><span className="font-medium shrink-0">৳{(item.price_bdt * item.quantity).toLocaleString()}</span></div>)}</div>
              <Separator className="my-4" />
              <div className="flex justify-between font-black text-xl mb-2"><span>Total</span><span className="text-primary" data-testid="text-checkout-total">৳{total.toLocaleString()}</span></div>
              <p className="text-xs text-muted-foreground mb-8">The server validates current product pricing when the order is created.</p>
              <Button type="submit" className="w-full h-14 font-bold text-base rounded-lg shadow-md" disabled={submitting} data-testid="btn-place-order">{submitting ? "Placing Order..." : "Place Order"}</Button>
              <div className="mt-4 text-center text-xs text-muted-foreground">Do not include passwords, PINs, or recovery codes in notes.</div>
            </CardContent></Card>
          </div>
        </div>
      </form>
    </div>
  );
}
