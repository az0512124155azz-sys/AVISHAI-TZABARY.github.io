import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";

export function FeaturedProduct() {
  const { data: products } = useProducts();
  const { lang } = useLanguage();

  // Show the first product with a discount or the first product in stock
  const featured = products?.find((p) => p.discount_percent && p.discount_percent > 0 && p.in_stock)
    || products?.find((p) => p.in_stock);

  if (!featured) return null;

  return (
    <div className="mt-12 glass rounded-2xl p-4 max-w-sm mx-auto flex items-center gap-4 animate-fade-in">
      {featured.image_url && (
        <img
          src={featured.image_url}
          alt={featured.name}
          className="w-16 h-16 rounded-xl object-cover border border-border"
        />
      )}
      <div className="text-right flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3.5 h-3.5 text-accent fill-accent" />
          <span className="text-xs text-accent font-medium">
            {lang === "he" ? "מוצר מומלץ" : "Featured"}
          </span>
        </div>
        <p className="text-sm font-bold text-foreground truncate">{featured.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">₪{featured.price}</span>
          {featured.discount_percent ? (
            <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full font-bold">
              -{featured.discount_percent}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
