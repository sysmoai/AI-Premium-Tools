import { Link } from "wouter";
import { Package, ShoppingCart, Users, TrendingUp, LogOut, LayoutDashboard, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardStats, useListOrders } from "@workspace/api-client-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useListOrders();

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const recent = (recentOrders ?? []).slice(0, 5);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="font-black text-2xl text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>AIPT</div>
          <div className="text-sm text-muted-foreground">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer" data-testid="nav-dashboard">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </div>
          </Link>
          <Link href="/admin/orders">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer" data-testid="nav-orders">
              <ClipboardList className="h-4 w-4" /> Orders
            </div>
          </Link>
          <Link href="/admin/products">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer" data-testid="nav-products">
              <Package className="h-4 w-4" /> Products
            </div>
          </Link>
          <Link href="/admin/customers">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer" data-testid="nav-customers">
              <Users className="h-4 w-4" /> Customers
            </div>
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onLogout} data-testid="btn-logout">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Total Revenue", value: statsLoading ? null : `৳${(stats?.total_revenue_bdt || 0).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-green-600 bg-green-100" },
              { label: "Total Orders", value: statsLoading ? null : stats?.total_orders, icon: <ShoppingCart className="h-5 w-5" />, color: "text-blue-600 bg-blue-100" },
              { label: "Products", value: statsLoading ? null : stats?.total_products, icon: <Package className="h-5 w-5" />, color: "text-purple-600 bg-purple-100" },
              { label: "Customers", value: statsLoading ? null : stats?.total_customers, icon: <Users className="h-5 w-5" />, color: "text-orange-600 bg-orange-100" },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mb-1" />
                  ) : (
                    <div className="text-3xl font-black mb-1" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, '-')}`}>{stat.value}</div>
                  )}
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl">Recent Orders</h2>
                  <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" data-testid="link-all-orders">View all</Button>
                  </Link>
                </div>
                {ordersLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {recent.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-order-${order.id}`}>
                        <div>
                          <div className="font-medium">#{order.id} — {order.customer_name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{order.payment_method?.replace("_", " ")} · ৳{order.total_bdt.toLocaleString()}</div>
                        </div>
                        <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 capitalize`}>{order.status}</Badge>
                      </div>
                    ))}
                    {recent.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No orders yet</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Order Status Breakdown</h2>
                {statsLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Pending", count: stats?.pending_orders || 0, color: "bg-yellow-400" },
                      {
                        label: "Confirmed",
                        count: Math.max(0, (stats?.total_orders || 0) - (stats?.pending_orders || 0) - (stats?.delivered_orders || 0) - (stats?.cancelled_orders || 0)),
                        color: "bg-blue-400",
                      },
                      { label: "Delivered", count: stats?.delivered_orders || 0, color: "bg-green-400" },
                      { label: "Cancelled", count: stats?.cancelled_orders || 0, color: "bg-red-400" },
                    ].map(s => {
                      const total = Math.max(1, stats?.total_orders || 1);
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span>{s.label}</span>
                            <span className="font-medium">{s.count}</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${(s.count / total) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
