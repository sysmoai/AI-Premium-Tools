import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useListOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import type { ListOrdersStatus, Order } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: allOrders, isLoading } = useListOrders({
    status: statusFilter !== "all" ? (statusFilter as ListOrdersStatus) : undefined,
  });

  const updateStatus = useUpdateOrderStatus();

  const orders = allOrders ?? [];
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleStatusChange(orderId: number, status: string) {
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        data: { status: status as Order["status"] },
      });
      queryClient.invalidateQueries({ queryKey: ["listOrders"] });
      toast({ title: "Status updated", description: `Order #${orderId} marked as ${status}.` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="font-black text-2xl text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>AIPT</div>
          <div className="text-sm text-muted-foreground">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">📊 Dashboard</div></Link>
          <Link href="/admin/orders"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer" data-testid="nav-orders">🛒 Orders</div></Link>
          <Link href="/admin/products"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">📦 Products</div></Link>
          <Link href="/admin/customers"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">👥 Customers</div></Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/"><Button variant="ghost" size="sm" className="w-full justify-start"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Store</Button></Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Orders</h1>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-semibold">Order</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Total</th>
                    <th className="text-left p-4 font-semibold">Payment</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="p-4"><Skeleton className="h-6 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : pageOrders.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No orders found</td></tr>
                  ) : (
                    pageOrders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-muted/20 transition-colors" data-testid={`row-order-${order.id}`}>
                        <td className="p-4 font-mono font-semibold">#{order.id}</td>
                        <td className="p-4">
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-muted-foreground text-xs">{order.customer_phone}</div>
                        </td>
                        <td className="p-4 font-bold text-primary">৳{order.total_bdt.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="capitalize">{order.payment_method?.replace("_", " ")}</div>
                          {order.payment_ref && <div className="text-xs text-muted-foreground font-mono">{order.payment_ref}</div>}
                        </td>
                        <td className="p-4">
                          <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 capitalize`}>{order.status}</Badge>
                        </td>
                        <td className="p-4">
                          <Select
                            value={order.status}
                            onValueChange={val => handleStatusChange(order.id, val)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">{orders.length} order(s) total</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="btn-prev-page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="btn-next-page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
