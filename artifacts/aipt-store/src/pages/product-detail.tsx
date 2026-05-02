import { useParams, Link } from "wouter";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailProps {
  onAddToCart: (product: { productId: number; name: string; price_bdt: number; image_url?: string; duration_days?: number }) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(Number(id)) },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/products"><Button className="mt-6">Back to Products</Button></Link>
      </div>
    );
  }

  function handleAddToCart() {
    onAddToCart({
      productId: product!.id,
      name: product!.name,
      price_bdt: product!.price_bdt,
      image_url: product!.image_url ?? undefined,
      duration_days: product!.duration_days ?? undefined,
    });
    toast({ title: "Added to cart", description: `${product!.name} has been added to your cart.` });
  }

  const savings = product.original_price_bdt
    ? Math.round((1 - product.price_bdt / product.original_price_bdt) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/products">
        <Button variant="ghost" className="mb-8 -ml-2" data-testid="btn-back">
          <ArrowLeft className="h-4 w-4 mr-2" /> All Products
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {product.is_featured && <Badge className="bg-primary/10 text-primary border-0">Featured</Badge>}
            {savings > 0 && <Badge className="bg-green-100 text-green-700 border-0">Save {savings}%</Badge>}
            <Badge variant="outline">{product.category_name}</Badge>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{product.name}</h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{product.description}</p>

          <div className="mb-8">
            <h3 className="font-semibold mb-4">What's included:</h3>
            <div className="space-y-3">
              {product.features?.map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Card */}
        <div>
          <Card className="sticky top-6 border-2 border-primary/20">
            <CardContent className="p-8">
              <div className="mb-6">
                {product.original_price_bdt && (
                  <div className="text-lg text-muted-foreground line-through mb-1">৳{product.original_price_bdt}</div>
                )}
                <div className="text-5xl font-black text-primary mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  ৳{product.price_bdt}
                </div>
                <div className="text-muted-foreground">{product.duration_days || 30}-day access</div>
              </div>

              <div className="space-y-3 mb-8 border rounded-xl p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Access delivered within 1 hour</div>
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Pay via bKash, Nagad, or bank transfer</div>
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> WhatsApp support included</div>
                {product.stock_count && product.stock_count <= 10 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">⚠️ Only {product.stock_count} left in stock</div>
                )}
              </div>

              <Button className="w-full h-14 text-base font-bold rounded-xl" onClick={handleAddToCart} data-testid="btn-add-to-cart">
                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
              </Button>
              <Link href="/checkout">
                <Button variant="outline" className="w-full h-12 mt-3 rounded-xl" onClick={handleAddToCart} data-testid="btn-buy-now">
                  Buy Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
