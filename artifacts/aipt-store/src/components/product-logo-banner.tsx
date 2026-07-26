import { useState, useEffect } from "react";

export function getProductGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-amber-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % gradients.length;
  return gradients[hash];
}

interface ProductLogoBannerProps {
  name: string;
  imageUrl?: string | null;
  gradient: string;
  size?: "card" | "detail";
  isFeatured?: boolean;
  savingsPct?: number;
  className?: string;
}

export function ProductLogoBanner({
  name,
  imageUrl,
  gradient,
  size = "card",
  isFeatured,
  savingsPct,
  className = "",
}: ProductLogoBannerProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const initial = name.charAt(0).toUpperCase();

  const showGradient = !imageUrl || imgError;

  const logoSize = size === "detail" ? "h-24 w-24" : "h-12 w-12";
  const initialBig = size === "detail" ? "text-9xl" : "text-5xl";
  const initialSmall = size === "detail" ? "text-7xl" : "text-4xl";
  const dropShadow = size === "detail" ? "drop-shadow-xl" : "drop-shadow-md";
  const containerH = size === "detail" ? "h-48" : "h-20";
  const badgePosition = size === "detail" ? "top-3 right-3" : "top-2 left-2";
  const badgePad = size === "detail" ? "px-2.5 py-1" : "px-2 py-0.5";
  const rounded = size === "detail" ? "rounded-2xl" : "";

  return (
    <div
      className={`relative ${containerH} ${rounded} ${showGradient ? `bg-gradient-to-br ${gradient}` : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700"} flex items-center justify-center overflow-hidden ${className}`}
    >
      {imageUrl && !imgError && (
        <img
          key={imageUrl}
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`${logoSize} object-contain ${dropShadow}`}
          onError={() => setImgError(true)}
        />
      )}
      {showGradient && (
        <div
          className={`flex flex-col items-center justify-center w-full h-full absolute inset-0 ${rounded} bg-gradient-to-br ${gradient}`}
        >
          <span
            className={`${initialBig} font-black text-white/25 select-none absolute`}
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {initial}
          </span>
          <span
            className={`${initialSmall} font-black text-white relative z-10 ${dropShadow}`}
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {initial}
          </span>
        </div>
      )}
      {(isFeatured || (savingsPct != null && savingsPct > 0)) && (
        <div className={`absolute ${badgePosition} flex ${size === "detail" ? "gap-1.5" : "flex-col gap-1"}`}>
          {isFeatured && (
            <span
              className={`inline-flex items-center ${badgePad} rounded-full text-xs font-semibold backdrop-blur-sm ${
                showGradient
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              ⭐ Featured
            </span>
          )}
          {savingsPct != null && savingsPct > 0 && (
            <span className={`inline-flex items-center ${badgePad} rounded-full text-xs font-semibold bg-green-500 text-white`}>
              Save {savingsPct}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
