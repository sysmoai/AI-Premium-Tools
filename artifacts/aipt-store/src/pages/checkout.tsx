import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Smartphone, Building } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer, useCreateOrder } from "@workspace/api-client-react";
import type { CartItem } from "@/hooks/use-cart";

interface CheckoutProps {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
}

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", icon: <Smartphone className="h-4 w-4" />, number: "01XXXXXXXXX" },
  { id: "nagad", label: "Nagad", icon: <Smartphone className="h-4 w-4" />, number: "01XXXXXXXXX" },
  { id: "bank_transfer", label: "Bank Transfer", icon: <Building className="h-4 w-4" />, number: "Dutch-Bangla Bank" },
] as const;

export default function Checkout({ items, total, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "bank_transfer">("bkash");
  const [paymentRef, setPaymentRef] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", university: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const createCustomer = useCreateCustomer();
  const createOrder = useCreateOrder();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Required fields missing", description: "Name and phone are required.", variant: "destructive" });
      return;
    }
    if (!paymentRef) {
      toast({ title: "Payment reference required", description: "Enter your transaction/reference number.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const customer = await createCustomer.mutateAsync({
        data: { name: form.name, phone: form.phone, email: form.email || undefined, university: form.university || undefined },
      });
      const order = await createOrder.mutateAsync({
        data: {
          customer_id: customer.id,
          payment_method: paymentMethod,
          payment_ref: paymentRef,
          notes: form.notes || undefined,
          items: items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
        },
      });
      onClearCart();
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      toast({ title: "Order failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/cart">
        <Button variant="ghost" className="mb-8 -ml-2" data-testid="btn-back-cart">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
        </Button>
      </Link>
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Checkout</h1>

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
                    <Input id="phone" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="01XXXXXXXXX" required data-testid="input-phone" />
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
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all ${paymentMethod === pm.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                      data-testid={`btn-payment-${pm.id}`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/40 p-4 mb-4 text-sm">
                  <p className="font-semibold mb-1">Send ৳{total.toLocaleString()} to:</p>
                  <p className="text-primary font-mono text-base">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.number}</p>
                  <p className="text-muted-foreground mt-1">After payment, enter your transaction ID below</p>
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
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex-1 mr-2 truncate">{item.name} ×{item.quantity}</span>
                      <span className="font-medium">৳{(item.price_bdt * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-xl mb-8">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-checkout-total">৳{total.toLocaleString()}</span>
                </div>
                <Button type="submit" className="w-full h-14 font-bold text-base rounded-xl" disabled={submitting} data-testid="btn-place-order">
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
