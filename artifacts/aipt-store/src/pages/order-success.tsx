import { useParams, Link } from "wouter";
import { CheckCircle, Package, MessageCircle, ArrowRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useSeo } from "@/hooks/use-seo";
import { LeaveReviewForm } from "@/components/leave-review-form";

function readStashedPhone(id: string | undefined): string | undefined {
  if (!id) return undefined;
  try { return sessionStorage.getItem(`aipt_order_phone_${id}`) ?? undefined; } catch { return undefined; }
}

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const phone = readStashedPhone(id);
  const params = phone ? { phone } : undefined;
  const { data: order, isLoading } = useGetOrder(Number(id), params, { query: { enabled: !!id, queryKey: getGetOrderQueryKey(Number(id), params) } });

  useSeo({
    title: id ? `Order #${id} Submitted — AIPT` : "Order Submitted — AIPT",
    description: "Your AIPT digital order has been submitted. Keep the order ID and payment reference for fulfilment and support.",
    type: "website",
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const NEXT_STEPS = [
    { icon: <Clock className="h-5 w-5 text-blue-600" />, title: "Payment review", desc: "AIPT reviews the payment reference and order record.", color: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: <MessageCircle className="h-5 w-5 text-green-600" />, title: "Digital fulfilment", desc: "Fulfilment is coordinated using the contact information on the order. Timing varies by product and order status.", color: "border-green-200 dark:border-green-900", bg: "bg-green-50 dark:bg-green-950/30" },
    { icon: <Zap className="h-5 w-5 text-violet-600" />, title: "Order support", desc: "If you need a status update, contact AIPT with the order ID and payment reference.", color: "border-violet-200 dark:border-violet-900", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 space-y-6"><Skeleton className="h-24 w-24 rounded-full mx-auto" /><Skeleton className="h-10 w-64 mx-auto" /><Skeleton className="h-48 rounded-lg" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="relative inline-flex items-center justify-center mb-8">
        <div className="absolute h-28 w-28 rounded-full opacity-30 pulse-ring" style={{ background: "radial-gradient(circle, hsl(142 76% 50%), transparent)" }} />
        <div className="relative h-24 w-24 rounded-full flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}><CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} /></div>
      </div>

      <div className="mb-2 text-3xl">🎉</div>
      <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Order Submitted</h1>
      <p className="text-muted-foreground text-lg mb-10">Thank you. Keep your order ID and payment reference while AIPT reviews and fulfils the digital order.</p>

      {order && (
        <Card className="text-left mb-8" data-testid="card-order-details"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div><div className="text-sm text-muted-foreground">Order ID</div><div className="font-bold text-xl font-mono" data-testid="text-order-id">#{order.id}</div></div>
            <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 capitalize text-sm px-3 py-1`} data-testid="badge-status">{order.status}</Badge>
          </div>
          <div className="space-y-2.5 mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-sm"><Package className="h-4 w-4 text-primary" /> Items ordered</h3>
            {order.items?.map(item => <div key={item.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{item.product_name} ×{item.quantity}</span><span className="font-medium">৳{(item.unit_price_bdt * item.quantity).toLocaleString()}</span></div>)}
          </div>
          <div className="border-t pt-4 flex justify-between font-bold text-xl mb-4"><span>Total</span><span className="text-primary">৳{order.total_bdt.toLocaleString()}</span></div>
          <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs mb-0.5">Payment Method</div><div className="font-medium capitalize">{order.payment_method?.replace("_", " ")}</div></div>
            {order.payment_ref && <div><div className="text-muted-foreground text-xs mb-0.5">Ref No.</div><div className="font-medium font-mono">{order.payment_ref}</div></div>}
            {order.customer_name && <div><div className="text-muted-foreground text-xs mb-0.5">Customer</div><div className="font-medium">{order.customer_name}</div></div>}
            {order.customer_phone && <div><div className="text-muted-foreground text-xs mb-0.5">Phone</div><div className="font-medium">{order.customer_phone}</div></div>}
          </div>
        </CardContent></Card>
      )}

      <div className="text-left mb-10">
        <h3 className="font-bold text-xl mb-4 text-center">What happens next?</h3>
        <div className="space-y-3">{NEXT_STEPS.map((step, idx) => <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border ${step.color} ${step.bg}`}><div className="h-10 w-10 rounded-full bg-white dark:bg-black/20 flex items-center justify-center shadow-sm shrink-0">{step.icon}</div><div><div className="font-semibold text-sm">{step.title}</div><div className="text-muted-foreground text-sm">{step.desc}</div></div></div>)}</div>
      </div>

      {order && order.items && order.items.length > 0 && (
        <div className="text-left mb-10">
          <h3 className="font-bold text-xl mb-2 text-center">Review what you bought</h3>
          <p className="text-sm text-muted-foreground text-center mb-5">A review submitted from this order can be linked to the matching order after moderation, which allows the storefront to identify verified-buyer reviews accurately.</p>
          <div className="space-y-4">
            {Array.from(new Map(order.items.map(item => [item.product_id, { product_id: item.product_id, product_name: item.product_name ?? `Product #${item.product_id}` }])).values()).map(p => (
              <LeaveReviewForm key={p.product_id} orderId={order.id} customerPhone={order.customer_phone ?? phone} customerName={order.customer_name} productId={p.product_id} productName={p.product_name} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/products"><Button variant="outline" className="rounded-full px-8 h-12" data-testid="btn-continue-shopping">Continue Shopping</Button></Link>
        <Link href="/"><Button className="rounded-full px-8 h-12 font-bold shadow-md" data-testid="btn-back-home">Back to Home <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}
