import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListProducts, useCreateProduct, useUpdateProduct, useListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface ProductForm {
  name: string;
  description: string;
  price_bdt: string;
  original_price_bdt: string;
  category_id: string;
  duration_days: string;
  is_featured: boolean;
  is_active: boolean;
  features: string;
  image_url: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price_bdt: "", original_price_bdt: "",
  category_id: "", duration_days: "30", is_featured: false, is_active: true, features: "", image_url: "",
};

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products, isLoading } = useListProducts({ search: search || undefined });
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(product: NonNullable<typeof products>[0]) {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price_bdt: String(product.price_bdt),
      original_price_bdt: String(product.original_price_bdt || ""),
      category_id: String(product.category_id || ""),
      duration_days: String(product.duration_days || 30),
      is_featured: product.is_featured || false,
      is_active: product.is_active !== false,
      features: (product.features || []).join("\n"),
      image_url: product.image_url || "",
    });
    setShowDialog(true);
  }

  function updateForm(field: keyof ProductForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price_bdt: Number(form.price_bdt),
      original_price_bdt: form.original_price_bdt ? Number(form.original_price_bdt) : undefined,
      category_id: form.category_id ? Number(form.category_id) : 0,
      duration_days: Number(form.duration_days) || 30,
      is_featured: form.is_featured,
      is_active: form.is_active,
      features: form.features ? form.features.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
      image_url: form.image_url,
    };
    try {
      if (editId) {
        await updateProduct.mutateAsync({ id: editId, data: payload });
        toast({ title: "Product updated" });
      } else {
        await createProduct.mutateAsync({ data: payload });
        toast({ title: "Product created" });
      }
      queryClient.invalidateQueries({ queryKey: ["listProducts"] });
      setShowDialog(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
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
          <Link href="/admin"><div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">📊 Dashboard</div></Link>
          <Link href="/admin/orders"><div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">🛒 Orders</div></Link>
          <Link href="/admin/products"><div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer">📦 Products</div></Link>
          <Link href="/admin/customers"><div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 cursor-pointer">👥 Customers</div></Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/"><Button variant="ghost" size="sm" className="w-full justify-start"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Store</Button></Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Products</h1>
          <Button onClick={openCreate} data-testid="btn-add-product">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" data-testid="input-product-search" />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Price</th>
                    <th className="text-left p-4 font-semibold">Duration</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
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
                  ) : (
                    products?.map(product => (
                      <tr key={product.id} className="border-b hover:bg-muted/20 transition-colors" data-testid={`row-product-${product.id}`}>
                        <td className="p-4">
                          <div className="font-medium">{product.name}</div>
                          {product.is_featured && <Badge className="bg-primary/10 text-primary border-0 text-xs mt-1">Featured</Badge>}
                        </td>
                        <td className="p-4 text-muted-foreground">{product.category_name || "—"}</td>
                        <td className="p-4">
                          <div className="font-bold text-primary">৳{product.price_bdt}</div>
                          {product.original_price_bdt && <div className="text-xs text-muted-foreground line-through">৳{product.original_price_bdt}</div>}
                        </td>
                        <td className="p-4 text-muted-foreground">{product.duration_days || 30}d</td>
                        <td className="p-4">
                          {product.is_active ? (
                            <span className="flex items-center gap-1 text-green-600"><Check className="h-3 w-3" /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground"><X className="h-3 w-3" /> Inactive</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(product)} data-testid={`btn-edit-product-${product.id}`}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-product-form">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => updateForm("name", e.target.value)} required data-testid="input-product-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => updateForm("description", e.target.value)} data-testid="input-product-desc" />
            </div>
            <div className="space-y-1.5">
              <Label>Logo / Image URL</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={form.image_url}
                  onChange={e => updateForm("image_url", e.target.value)}
                  placeholder="https://logo.clearbit.com/openai.com"
                  data-testid="input-product-image-url"
                />
                {form.image_url && (
                  <img
                    key={form.image_url}
                    src={form.image_url}
                    alt="preview"
                    className="h-10 w-10 rounded object-contain border border-border bg-white shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Paste a direct image URL or use clearbit: https://logo.clearbit.com/domain.com</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price (BDT) *</Label>
                <Input type="number" value={form.price_bdt} onChange={e => updateForm("price_bdt", e.target.value)} required data-testid="input-product-price" />
              </div>
              <div className="space-y-1.5">
                <Label>Original Price</Label>
                <Input type="number" value={form.original_price_bdt} onChange={e => updateForm("original_price_bdt", e.target.value)} data-testid="input-product-orig-price" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category_id}
                  onChange={e => updateForm("category_id", e.target.value)}
                  data-testid="select-product-category"
                >
                  <option value="">No category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input type="number" value={form.duration_days} onChange={e => updateForm("duration_days", e.target.value)} data-testid="input-product-duration" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                rows={4}
                value={form.features}
                onChange={e => updateForm("features", e.target.value)}
                placeholder="GPT-4 access&#10;Unlimited messages&#10;Browser integration"
                data-testid="textarea-product-features"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="featured" checked={form.is_featured} onCheckedChange={v => updateForm("is_featured", v)} data-testid="switch-product-featured" />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="active" checked={form.is_active} onCheckedChange={v => updateForm("is_active", v)} data-testid="switch-product-active" />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} data-testid="btn-cancel-product">Cancel</Button>
              <Button type="submit" data-testid="btn-save-product">{editId ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
