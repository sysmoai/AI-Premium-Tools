import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListCustomers } from "@workspace/api-client-react";

const PAGE_SIZE = 10;

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: allCustomers, isLoading } = useListCustomers();

  const customers = (allCustomers ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const pageCustomers = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="font-black text-2xl text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>AIPT</div>
          <div className="text-sm text-muted-foreground">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">📊 Dashboard</div></Link>
          <Link href="/admin/orders"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">🛒 Orders</div></Link>
          <Link href="/admin/products"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">📦 Products</div></Link>
          <Link href="/admin/customers"><div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer" data-testid="nav-customers">👥 Customers</div></Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/"><Button variant="ghost" size="sm" className="w-full justify-start"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Store</Button></Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Customers</h1>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              data-testid="input-customer-search"
            />
          </div>
          <div className="text-sm text-muted-foreground">{customers.length} customer{customers.length !== 1 ? "s" : ""}</div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">University</th>
                    <th className="text-left p-4 font-semibold">Orders</th>
                    <th className="text-left p-4 font-semibold">Total Spent</th>
                    <th className="text-left p-4 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="p-4"><Skeleton className="h-5 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : pageCustomers.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No customers found</td></tr>
                  ) : (
                    pageCustomers.map(customer => (
                      <tr key={customer.id} className="border-b hover:bg-muted/20 transition-colors" data-testid={`row-customer-${customer.id}`}>
                        <td className="p-4">
                          <div className="font-medium">{customer.name}</div>
                          {customer.email && <div className="text-xs text-muted-foreground">{customer.email}</div>}
                        </td>
                        <td className="p-4 font-mono text-sm">{customer.phone}</td>
                        <td className="p-4">
                          {customer.university ? (
                            <Badge variant="outline" className="text-xs">{customer.university}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 font-medium">{customer.order_count || 0}</td>
                        <td className="p-4 font-bold text-primary">৳{(customer.total_spent_bdt || 0).toLocaleString()}</td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-GB") : "—"}
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
          <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="btn-prev-page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="btn-next-page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
