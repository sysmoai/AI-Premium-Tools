import { useState } from "react";
import { Link } from "wouter";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrder } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/use-seo";
import { WHATSAPP_URL } from "@/config/contact";

const STATUS_META: Record<string, { label: string; color: string; Icon: typeof Clock; desc: string }> = {
  pending: {
    label: "Awaiting payment confirmation",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    Icon: Clock,
    desc: "We've received your order and are verifying your payment. This usually takes under 30 minutes during business hours.",
  },
  confirmed: {
    label: "Payment confirmed — preparing your account",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Icon: AlertCircle,
    desc: "Payment confirmed! Your account credentials will be delivered to your WhatsApp within 1 hour.",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Icon: CheckCircle,
    desc: "Your order has been delivered. Check your WhatsApp for login credentials. Enjoy!",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Icon: XCircle,
    desc: "This order was cancelled. If you believe this is a mistake, please reach out on WhatsApp.",
  },
};

type OrderResult = Awaited<ReturnType<typeof getOrder>>;

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: "Track Your Order — AIPT",
    description: "Check the status of your AI subscription order from AIPT. Enter your order ID and phone number to see real-time updates.",
    keywords: "track order AIPT, order status Bangladesh, AI subscription delivery",
    type: "website",
  });

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);

    const id = Number(orderId.trim());
    const ph = phone.trim();
    if (!id || isNaN(id)) {
      setError("Please enter a valid order ID (numbers only).");
      return;
    }
    if (!ph) {
      setError("Please enter the phone number you used at checkout.");
      return;
    }

    setLoading(true);
    try {
      // Server enforces phone matching and returns 404 on mismatch — we just
      // forward the digits-only phone as a query param.
      const entered = ph.replace(/\D/g, "");
      const result = await getOrder(id, { phone: entered });
      setOrder(result);
    } catch {
      setError("We couldn't find an order matching both that ID and phone number. Double-check and try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = order ? STATUS_META[order.status ?? "pending"] ?? STATUS_META.pending : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-8">
        <div
          className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-4 shadow-lg"
          style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
        >
          <Package className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          Track Your Order
        </h1>
        <p className="text-muted-foreground">Check the status of your AIPT order in real time.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={lookup} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  placeholder="e.g. 1023"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  inputMode="numeric"
                  data-testid="input-order-id"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="tel"
                  data-testid="input-track-phone"
                />
              </div>
            </div>
            {error && (
              <div
                className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2"
                data-testid="text-error"
              >
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-12 font-bold" disabled={loading} data-testid="btn-lookup">
              <Search className="h-4 w-4 mr-2" /> {loading ? "Looking up…" : "Track Order"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {order && meta && (
        <Card data-testid="card-order-result">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Order #{order.id}</div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <meta.Icon className="h-5 w-5" />
                  {meta.label}
                </h2>
              </div>
              <Badge className={`${meta.color} border-0 text-sm px-3 py-1`} data-testid="badge-status">
                {(order.status ?? "pending").toUpperCase()}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{meta.desc}</p>

            <Separator className="my-4" />

            <div className="text-sm space-y-2 mb-6">
              {order.customer_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment method</span>
                <span className="font-medium capitalize">{order.payment_method?.replace("_", " ")}</span>
              </div>
              {order.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order placed</span>
                  <span className="font-medium">{new Date(order.created_at).toLocaleString("en-BD")}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border p-4 mb-5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" /> Items
              </div>
              <div className="space-y-2 text-sm">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between" data-testid={`item-${item.id}`}>
                    <span>
                      {item.product_name} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">৳{(item.unit_price_bdt * item.quantity).toLocaleString("en-BD")}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>
                  ৳{order.total_bdt.toLocaleString("en-BD")}
                </span>
              </div>
            </div>

            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hi AIPT, I need help with order #${order.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg text-white font-semibold transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
              data-testid="btn-track-whatsapp"
            >
              <MessageCircle className="h-4 w-4" /> Need help with this order?
            </a>
          </CardContent>
        </Card>
      )}

      {!order && (
        <div className="text-center text-sm text-muted-foreground mt-8">
          Lost your order ID?{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
            Message us on WhatsApp
          </a>{" "}
          and we'll find it for you.
          <div className="mt-6">
            <Link href="/products">
              <Button variant="outline" className="gap-1">
                Continue shopping <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
