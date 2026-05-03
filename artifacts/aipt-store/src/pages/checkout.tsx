import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Smartphone, Building, Copy, Check, ShoppingCart, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer, useCreateOrder } from "@workspace/api-client-react";
import type { CartItem } from "@/hooks/use-cart";
import { BKASH_NUMBER, NAGAD_NUMBER, BANK_INFO } from "@/config/contact";

interface CheckoutProps {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
}

const PAYMENT_METHODS = [
  {
    id: "bkash",
    label: "bKash",
    icon: <Smartphone className="h-5 w-5" />,
    number: BKASH_NUMBER,
    tint: "border-pink-400 bg-pink-50 dark:bg-pink-950/20",
    activeTint: "border-pink-500 bg-pink-50 dark:bg-pink-900/30 shadow-md shadow-pink-100 dark:shadow-pink-900/10",
    labelColor: "text-pink-700 dark:text-pink-400",
    iconColor: "text-pink-600",
    pill: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  },
  {
    id: "nagad",
    label: "Nagad",
    icon: <Smartphone className="h-5 w-5" />,
    number: NAGAD_NUMBER,
    tint: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
    activeTint: "border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-md shadow-orange-100 dark:shadow-orange-900/10",
    labelColor: "text-orange-700 dark:text-orange-400",
    iconColor: "text-orange-600",
    pill: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: <Building className="h-5 w-5" />,
    number: BANK_INFO,
    tint: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
    activeTint: "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md shadow-blue-100 dark:shadow-blue-900/10",
    labelColor: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-600",
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/products"><Button data-testid="btn-go-shop">Shop Now</Button></Link>
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
    }).catch(() => {
      setCopied(false);
    });
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
      toast({
        title: "Invalid phone number",
        description: "Enter a valid Bangladeshi mobile number (e.g. 01712345678).",
        variant: "destructive",
      });
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
      onClearCart();
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      toast({
        title: "Order failed",
        description: extractErrorMessage(err, "Something went wrong. Please try again."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/cart">
        <Button variant="ghost" className="mb-6 -ml-2" data-testid="btn-back-cart">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
        </Button>
      </Link>

      {/* 3-step progress indicator */}
      <div className="flex items-center justify-center mb-8 w-full max-w-xs mx-auto px-2">
        {STEPS.map((step, idx) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all ${
                  idx === 0
                    ? "bg-muted text-muted-foreground"
                    : idx === 1
                    ? "text-white shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
                style={idx === 1 ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" } : {}}
              >
                <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">{step.icon}</span>
              </div>
              <span className={`text-[11px] font-medium leading-none ${idx === 1 ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1.5 mb-4 rounded-full"
                style={{
                  background: idx === 0
                    ? "linear-gradient(90deg, hsl(var(--muted)), hsl(var(--primary) / 0.4))"
                    : "hsl(var(--muted))",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Your full name" required data-testid="input-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="e.g. 01712345678" required data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="you@example.com" data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University (optional)</Label>
                    <Input id="university" value={form.university} onChange={e => updateForm("university", e.target.value)} placeholder="e.g. BUET, DU, NSU" data-testid="input-university" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Payment Method</h2>
                <div className="grid grid-cols-3 gap-3 mb-6" role="radiogroup" aria-label="Payment method">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === pm.id}
                      aria-label={`Pay with ${pm.label}`}
                      onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-2 min-h-[72px] rounded-lg border-2 font-medium text-sm transition-all touch-manipulation ${
                        paymentMethod === pm.id ? pm.activeTint : "border-border hover:border-primary/30"
                      }`}
                      data-testid={`btn-payment-${pm.id}`}
                    >
                      <span className={paymentMethod === pm.id ? pm.iconColor : "text-muted-foreground"}>
                        {pm.icon}
                      </span>
                      <span className={paymentMethod === pm.id ? pm.labelColor : "text-foreground"}>
                        {pm.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Send-to info */}
                <div className="rounded-lg p-4 mb-5" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                  <p className="font-semibold text-sm mb-2">
                    Send <span className="text-primary font-black">৳{total.toLocaleString()}</span> to:
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="text-primary font-mono text-lg font-bold flex-1">
                      {currentPm.number}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyNumber}
                      className="h-8 rounded-lg shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="ml-1.5 text-xs">{copied ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs mt-2">After sending, enter your transaction ID below</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentRef">Transaction / Reference Number *</Label>
                  <Input
                    id="paymentRef"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. 8N7A2B1C or TXN123456"
                    required
                    data-testid="input-payment-ref"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-4">Order Notes (optional)</h2>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={form.notes}
                  onChange={e => updateForm("notes", e.target.value)}
                  placeholder="Any special instructions or requests..."
                  data-testid="textarea-notes"
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="md:sticky md:top-6" style={{ boxShadow: "0 4px 20px hsl(var(--primary) / 0.08)" }}>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex-1 mr-2 truncate">{item.name} ×{item.quantity}</span>
                      <span className="font-medium shrink-0">৳{(item.price_bdt * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-black text-xl mb-8">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-checkout-total">৳{total.toLocaleString()}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 font-bold text-base rounded-lg shadow-md"
                  disabled={submitting}
                  data-testid="btn-place-order"
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  🔒 Your data is safe with us
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
