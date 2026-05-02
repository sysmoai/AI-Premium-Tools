import { useParams, Link } from "wouter";
import { CheckCircle, Package, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrder(Number(id), {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(Number(id)) },
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-6">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Order Placed!</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Thank you for your order. We'll verify your payment and deliver your AI tools within 1 hour.
      </p>

      {order && (
        <Card className="text-left mb-8" data-testid="card-order-details">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-muted-foreground">Order ID</div>
                <div className="font-bold text-lg" data-testid="text-order-id">#{order.id}</div>
              </div>
              <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 capitalize`} data-testid="badge-status">
                {order.status}
              </Badge>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Items</h3>
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product_name} ×{item.quantity}</span>
                  <span className="font-medium">৳{(item.unit_price_bdt * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between font-bold text-xl">
              <span>Total</span>
              <span className="text-primary">৳{order.total_bdt.toLocaleString()}</span>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Payment</div>
                <div className="font-medium capitalize">{order.payment_method?.replace("_", " ")}</div>
              </div>
              {order.payment_ref && (
                <div>
                  <div className="text-muted-foreground">Ref No.</div>
                  <div className="font-medium font-mono">{order.payment_ref}</div>
                </div>
              )}
              {order.customer_name && (
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{order.customer_name}</div>
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{order.customer_phone}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-6 mb-8 text-left">
        <div className="flex items-center gap-2 font-semibold mb-2">
          <MessageCircle className="h-5 w-5 text-blue-600" /> What happens next?
        </div>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>We verify your payment (usually within 30 minutes)</li>
          <li>You receive your AI tool access via WhatsApp or email</li>
          <li>Start using your tools immediately!</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/products">
          <Button variant="outline" className="rounded-full px-8" data-testid="btn-continue-shopping">
            Continue Shopping
          </Button>
        </Link>
        <Link href="/">
          <Button className="rounded-full px-8" data-testid="btn-back-home">
            Back to Home <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
