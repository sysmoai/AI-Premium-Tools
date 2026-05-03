import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/order-success";
import TrackOrder from "@/pages/track-order";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";
import AdminCustomers from "@/pages/admin/customers";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppInner() {
  const [location] = useLocation();
  const { items, total, count, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("aipt_admin") === "true");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  function handleAddToCart(product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) {
    addItem(product);
    toast({ title: "Added to cart", description: `${product.name} added successfully.` });
  }

  function handleLogout() {
    localStorage.removeItem("aipt_admin");
    setIsAdmin(false);
  }

  const isAdminRoute = location.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar cartCount={count} />}
      <div className="flex-1">
        <Switch>
          {/* Store routes */}
          <Route path="/" component={() => <Home onAddToCart={handleAddToCart} />} />
          <Route path="/products" component={() => <Products onAddToCart={handleAddToCart} />} />
          <Route path="/products/:id" component={() => <ProductDetail onAddToCart={handleAddToCart} />} />
          <Route path="/cart" component={() => <Cart items={items} total={total} onRemove={removeItem} onUpdateQuantity={updateQuantity} />} />
          <Route path="/checkout" component={() => <Checkout items={items} total={total} onClearCart={clearCart} />} />
          <Route path="/order-success/:id" component={OrderSuccess} />
          <Route path="/track-order" component={TrackOrder} />

          {/* Admin routes */}
          <Route path="/admin">
            {isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/orders">
            {isAdmin ? <AdminOrders /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/products">
            {isAdmin ? <AdminProducts /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/customers">
            {isAdmin ? <AdminCustomers /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppInner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
