import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/hooks/use-cart";

interface CartProps {
  items: CartItem[];
  total: number;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export default function Cart({ items, total, onRemove, onUpdateQuantity }: CartProps) {
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Discover premium AI tools at student-friendly prices</p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-8" data-testid="btn-browse-products">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.productId} data-testid={`card-cart-item-${item.productId}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.duration_days || 30} days</div>
                  <div className="text-primary font-bold text-lg mt-1">৳{item.price_bdt}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} data-testid={`btn-decrease-${item.productId}`}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.productId}`}>{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} data-testid={`btn-increase-${item.productId}`}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right min-w-20">
                  <div className="font-bold">৳{(item.price_bdt * item.quantity).toLocaleString()}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.productId)} data-testid={`btn-remove-${item.productId}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h2 className="font-bold text-xl mb-6">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                    <span>৳{(item.price_bdt * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span className="text-primary" data-testid="text-cart-total">৳{total.toLocaleString()}</span>
              </div>
              <Link href="/checkout">
                <Button className="w-full h-12 font-bold rounded-xl" data-testid="btn-checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" className="w-full mt-3" data-testid="btn-continue-shopping">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
