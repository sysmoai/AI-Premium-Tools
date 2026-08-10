import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ErrorBoundary } from "@/components/error-boundary";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

// Eagerly loaded — needed for first paint
import Home from "@/pages/home";

// Lazy-loaded routes — code-split per page
const Products = lazy(() => import("@/pages/products"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const OrderSuccess = lazy(() => import("@/pages/order-success"));
const TrackOrder = lazy(() => import("@/pages/track-order"));
const Faq = lazy(() => import("@/pages/faq"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const ShippingPolicy = lazy(() => import("@/pages/shipping-policy"));
const RefundPolicy = lazy(() => import("@/pages/refund-policy"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const Terms = lazy(() => import("@/pages/terms"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminProductMedia = lazy(() => import("@/pages/admin/product-media"));
const AdminMedia = lazy(() => import("@/pages/admin/media"));
const AdminCustomers = lazy(() => import("@/pages/admin/customers"));

const PageLoader = () => (
  <div className="max-w-6xl mx-auto px-4 py-20">
    <Skeleton className="h-8 w-48 mb-6" />
    <Skeleton className="h-4 w-full mb-4" />
    <Skeleton className="h-4 w-3/4 mb-4" />
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

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
    toast({ title: "Added to cart", description: product.name + " added successfully." });
  }

  function handleLogout() {
    localStorage.removeItem("aipt_admin");
    localStorage.removeItem("aipt_admin_token");
    setIsAdmin(false);
  }

  const isAdminRoute = location.startsWith("/admin");

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar cartCount={count} />}
      <div className="flex-1">
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Store routes */}
          <Route path="/" component={() => <Home onAddToCart={handleAddToCart} />} />
          <Route path="/products" component={() => <Products onAddToCart={handleAddToCart} />} />
          <Route path="/products/:id" component={() => <ProductDetail onAddToCart={handleAddToCart} />} />
          <Route path="/cart" component={() => <Cart items={items} total={total} onRemove={removeItem} onUpdateQuantity={updateQuantity} />} />
          <Route path="/checkout" component={() => <Checkout items={items} total={total} onClearCart={clearCart} />} />
          <Route path="/order-success/:id" component={OrderSuccess} />
          <Route path="/track-order" component={TrackOrder} />
          <Route path="/faq" component={Faq} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/shipping-policy" component={ShippingPolicy} />
          <Route path="/refund-policy" component={RefundPolicy} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms" component={Terms} />

          {/* Admin routes */}
          <Route path="/admin">
            {isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/orders">
            {isAdmin ? <AdminOrders /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/products/:id/media">
            {isAdmin ? <AdminProductMedia /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/products">
            {isAdmin ? <AdminProducts /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/media">
            {isAdmin ? <AdminMedia /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>
          <Route path="/admin/customers">
            {isAdmin ? <AdminCustomers /> : <AdminLogin onLogin={() => setIsAdmin(true)} />}
          </Route>

          <Route component={NotFound} />
        </Switch>
        </Suspense>
        </ErrorBoundary>
      </div>
      {!isAdminRoute && <Footer />}
    </div>
    </ErrorBoundary>
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
