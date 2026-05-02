import { Link } from "wouter";
import { Package, ShoppingCart, Users, TrendingUp, LogOut, LayoutDashboard, ClipboardList, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardStats, useListOrders } from "@workspace/api-client-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

const STAT_CONFIGS = [
  {
    label: "Total Revenue",
    icon: <TrendingUp className="h-5 w-5" />,
    iconBg: "linear-gradient(135deg, #22c55e, #16a34a)",
    cardBg: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    border: "border-green-200 dark:border-green-900",
    valueColor: "text-green-700 dark:text-green-400",
    key: "revenue",
  },
  {
    label: "Total Orders",
    icon: <ShoppingCart className="h-5 w-5" />,
    iconBg: "linear-gradient(135deg, #3b82f6, #2563eb)",
    cardBg: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    border: "border-blue-200 dark:border-blue-900",
    valueColor: "text-blue-700 dark:text-blue-400",
    key: "orders",
  },
  {
    label: "Customers",
    icon: <Users className="h-5 w-5" />,
    iconBg: "linear-gradient(135deg, #a855f7, #7c3aed)",
    cardBg: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
    border: "border-violet-200 dark:border-violet-900",
    valueColor: "text-violet-700 dark:text-violet-400",
    key: "customers",
  },
  {
    label: "Pending Orders",
    icon: <Clock className="h-5 w-5" />,
    iconBg: "linear-gradient(135deg, #f97316, #ea580c)",
    cardBg: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
    border: "border-orange-200 dark:border-orange-900",
    valueColor: "text-orange-700 dark:text-orange-400",
    key: "pending",
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useListOrders();

  const recent = (recentOrders ?? []).slice(0, 5);

  const statValues: Record<string, string | number | null> = {
    revenue: statsLoading ? null : `৳${(stats?.total_revenue_bdt || 0).toLocaleString()}`,
    orders: statsLoading ? null : (stats?.total_orders ?? 0),
    customers: statsLoading ? null : (stats?.total_customers ?? 0),
    pending: statsLoading ? null : (stats?.pending_orders ?? 0),
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <div
            className="font-black text-2xl mb-0.5"
            style={{
              fontFamily: "Outfit, sans-serif",
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AIPT
          </div>
          <div className="text-sm text-muted-foreground">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer" data-testid="nav-dashboard">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </div>
          </Link>
          <Link href="/admin/orders">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer transition-colors" data-testid="nav-orders">
              <ClipboardList className="h-4 w-4" /> Orders
            </div>
          </Link>
          <Link href="/admin/products">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer transition-colors" data-testid="nav-products">
              <Package className="h-4 w-4" /> Products
            </div>
          </Link>
          <Link href="/admin/customers">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer transition-colors" data-testid="nav-customers">
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

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's what's happening today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {STAT_CONFIGS.map(conf => (
              <Card
                key={conf.label}
                className={`border ${conf.border} bg-gradient-to-br ${conf.cardBg} shadow-sm overflow-hidden`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-md"
                      style={{ background: conf.iconBg }}
                    >
                      {conf.icon}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right leading-tight max-w-20">
                      {conf.label}
                    </span>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-28 mb-1" />
                  ) : (
                    <div
                      className={`text-3xl font-black ${conf.valueColor} mb-0.5`}
                      style={{ fontFamily: "Outfit, sans-serif" }}
                      data-testid={`stat-${conf.label.toLowerCase().replace(/ /g, "-")}`}
                    >
                      {statValues[conf.key]}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">All time</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl">Recent Orders</h2>
                  <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" data-testid="link-all-orders">View all</Button>
                  </Link>
                </div>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recent.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-order-${order.id}`}>
                        <div>
                          <div className="font-medium text-sm">#{order.id} — {order.customer_name}</div>
                          <div className="text-xs text-muted-foreground capitalize mt-0.5">
                            {order.payment_method?.replace("_", " ")} · <span className="font-semibold text-primary">৳{order.total_bdt.toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 capitalize text-xs`}>{order.status}</Badge>
                      </div>
                    ))}
                    {recent.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">No orders yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Breakdown */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-bold text-xl mb-6">Order Status</h2>
                {statsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {[
                      { label: "Pending", count: stats?.pending_orders || 0, barColor: "linear-gradient(90deg, #fbbf24, #f59e0b)", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
                      {
                        label: "Confirmed",
                        count: Math.max(0, (stats?.total_orders || 0) - (stats?.pending_orders || 0) - (stats?.delivered_orders || 0) - (stats?.cancelled_orders || 0)),
                        barColor: "linear-gradient(90deg, #60a5fa, #3b82f6)",
                        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      },
                      { label: "Delivered", count: stats?.delivered_orders || 0, barColor: "linear-gradient(90deg, #4ade80, #22c55e)", badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                      { label: "Cancelled", count: stats?.cancelled_orders || 0, barColor: "linear-gradient(90deg, #f87171, #ef4444)", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                    ].map(s => {
                      const total = Math.max(1, stats?.total_orders || 1);
                      const pct = Math.round((s.count / total) * 100);
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="font-medium">{s.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                                {s.count}
                              </span>
                              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: s.barColor }}
                            />
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
