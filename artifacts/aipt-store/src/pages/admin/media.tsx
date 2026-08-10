import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Copy, ImageIcon, Search, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { listMedia, uploadMedia, type MediaAsset } from "@/lib/admin-media-api";

type Filter = "all" | "image" | "video";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMedia() {
  useSeo({ title: "Admin Media | AIPT", noindex: true });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const media = await listMedia({
        type: filter === "all" ? undefined : filter,
        search: search || undefined,
      });
      setItems(media);
    } catch (error) {
      toast({
        title: "Could not load media",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || uploading) return;
    const selected = Array.from(files);
    setUploading(true);
    let success = 0;

    for (const file of selected) {
      try {
        await uploadMedia(file, {
          altText: file.type.startsWith("image/") ? file.name.replace(/\.[^.]+$/, "") : undefined,
        });
        success += 1;
      } catch (error) {
        toast({
          title: `Upload failed: ${file.name}`,
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (success > 0) {
      toast({ title: "Upload complete", description: `${success} file${success === 1 ? "" : "s"} added to the AIPT media library.` });
      await load();
    }
  }

  async function copyUrl(url: string) {
    const absolute = new URL(url, window.location.origin).toString();
    await navigator.clipboard.writeText(absolute);
    toast({ title: "Media URL copied" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="font-black text-2xl text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>AIPT</div>
          <div className="text-sm text-muted-foreground">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link href="/admin"><div className="px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">📊 Dashboard</div></Link>
          <Link href="/admin/orders"><div className="px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">🛒 Orders</div></Link>
          <Link href="/admin/products"><div className="px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">📦 Products</div></Link>
          <Link href="/admin/media"><div className="px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground cursor-pointer">🖼️ Media</div></Link>
          <Link href="/admin/customers"><div className="px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer">👥 Customers</div></Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/"><Button variant="ghost" size="sm" className="w-full justify-start"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Store</Button></Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Media Library</h1>
            <p className="text-sm text-muted-foreground mt-1">First-party product images and videos stored in Cloudflare R2.</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={(event) => void handleFiles(event.target.files)}
              data-testid="input-media-files"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} data-testid="btn-upload-media">
              <Upload className="h-4 w-4 mr-2" /> {uploading ? "Uploading…" : "Upload Media"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filenames, alt text, captions…" className="pl-9" />
          </div>
          <div className="flex gap-2">
            {(["all", "image", "video"] as Filter[]).map((value) => (
              <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                {value === "image" && <ImageIcon className="h-4 w-4 mr-1.5" />}
                {value === "video" && <Video className="h-4 w-4 mr-1.5" />}
                {value === "all" ? "All" : value === "image" ? "Images" : "Videos"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-[4/3] rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h2 className="font-semibold">No media found</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload product images or videos to start the first-party library.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                  {item.asset_type === "video" ? (
                    <video src={item.url} controls preload="metadata" className="w-full h-full object-contain bg-black" />
                  ) : (
                    <img src={item.url} alt={item.alt_text || item.original_filename || "AIPT media"} loading="lazy" className="w-full h-full object-contain" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" title={item.original_filename || item.key}>{item.original_filename || item.key}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatBytes(item.size_bytes)} · {item.mime_type}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{item.asset_type}</Badge>
                    <span className="text-xs text-muted-foreground">Used {item.usage_count}×</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => void copyUrl(item.url)}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy URL
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
