import { useMemo, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search, Heart, X, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function CatalogSection() {
  const { data: products, isLoading } = useProducts();
  const { t, lang, dir } = useLanguage();
  const { isFavorite, toggle } = useFavorites();
  const { add } = useCart();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, query]);

  const L = (he: string, en: string) => (lang === "he" ? he : en);

  return (
    <section id="catalog" className="py-20 px-4" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black font-heading gradient-text inline-block mb-4">{t("catalog.title")}</h2>
          <p className="text-muted-foreground text-lg">{t("catalog.subtitle")}</p>
        </div>

        {/* Search + filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={L("חיפוש מוצר...", "Search products...")}
              className="ps-10 bg-secondary border-border h-11"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label="clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl bg-card animate-pulse h-80" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {products?.length ? L("לא נמצאו תוצאות", "No results") : t("catalog.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <ProductCardWrapper key={product.id} hasDescription={!!product.description} productId={product.id}>
                <div className="aspect-square overflow-hidden bg-secondary relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
                    aria-label="favorite"
                    className="absolute top-3 start-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-destructive text-destructive" : "text-foreground"}`} />
                  </button>
                  {product.discount_percent && product.discount_percent > 0 && (
                    <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-bold text-sm">
                      {product.discount_percent}% {t("catalog.discount")}
                    </Badge>
                  )}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <span className="text-foreground font-bold text-lg">{t("catalog.out_of_stock")}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-foreground mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {product.discount_percent && product.discount_percent > 0 ? (
                        <>
                          <span className="text-2xl font-black gradient-text">
                            ₪{(product.price * (1 - product.discount_percent / 100)).toFixed(0)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">₪{product.price}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black gradient-text">₪{product.price}</span>
                      )}
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex gap-1">
                        {product.colors.slice(0, 4).map((color) => (
                          <div key={color} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    )}
                  </div>
                  {product.in_stock && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const price = product.discount_percent && product.discount_percent > 0
                          ? Math.round(product.price * (1 - product.discount_percent / 100))
                          : product.price;
                        add({ productId: product.id, name: product.name, price, image_url: product.image_url ?? null });
                        toast.success(`${product.name} ${L("נוסף לסל", "added to cart")}`);
                      }}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary font-bold text-sm py-2 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {L("הוסף לסל", "Add to cart")}
                    </button>
                  )}
                </div>
              </ProductCardWrapper>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCardWrapper({ children, hasDescription, productId }: { children: React.ReactNode; hasDescription: boolean; productId: string }) {
  const className = "group block rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 text-right";
  if (hasDescription) {
    return <Link to={`/product/${productId}`} className={className}>{children}</Link>;
  }
  return <div className={className}>{children}</div>;
}
