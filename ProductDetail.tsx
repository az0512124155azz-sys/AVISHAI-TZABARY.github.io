import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, dir, t } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const product = products?.find((p) => p.id === id);
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">...</p></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4" dir={dir}>
        <Package className="w-16 h-16 text-muted-foreground" />
        <p className="text-foreground">{lang === "he" ? "המוצר לא נמצא" : "Product not found"}</p>
        <Button onClick={() => navigate("/")}>{lang === "he" ? "חזרה לדף הבית" : "Back home"}</Button>
      </div>
    );
  }

  const gallery = [product.image_url, ...(((product as any).images as string[] | null) ?? [])].filter(Boolean) as string[];
  const finalPrice = product.discount_percent && product.discount_percent > 0
    ? product.price * (1 - product.discount_percent / 100)
    : product.price;

  useEffect(() => {
    if (!product) return;
    const prevTitle = document.title;
    document.title = `${product.name} — Magic 3D`;

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? "";
    if (metaDesc && product.description) metaDesc.setAttribute("content", product.description.slice(0, 160));

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "product-ld";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || undefined,
      image: gallery.length ? gallery : undefined,
      category: product.category,
      offers: {
        "@type": "Offer",
        priceCurrency: "ILS",
        price: Number(finalPrice).toFixed(2),
        availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute("content", prevDesc);
      document.getElementById("product-ld")?.remove();
    };
  }, [product, finalPrice, gallery]);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            {lang === "he" ? "חזרה" : "Back"}
          </Button>
          <h1 className="text-lg font-black gradient-text">Magic 3D</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-3xl overflow-hidden bg-secondary border border-border flex items-center justify-center">
            {gallery[activeImg] ? (
              <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-24 h-24 text-muted-foreground" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImg === i ? "border-primary ring-2 ring-primary/40" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            {product.discount_percent && product.discount_percent > 0 && (
              <Badge className="bg-destructive text-destructive-foreground mb-2">
                {product.discount_percent}% {lang === "he" ? "הנחה" : "OFF"}
              </Badge>
            )}
            <h1 className="text-4xl font-black font-heading text-foreground mb-2">{product.name}</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black gradient-text">₪{finalPrice.toFixed(0)}</span>
              {product.discount_percent && product.discount_percent > 0 && (
                <span className="text-xl text-muted-foreground line-through">₪{product.price}</span>
              )}
            </div>
          </div>

          {product.description && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-bold text-foreground mb-2 text-lg">{lang === "he" ? "תיאור" : "Description"}</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">{lang === "he" ? "צבעים זמינים" : "Available colors"}</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((hex) => (
                  <div key={hex} className="w-9 h-9 rounded-full border-2 border-border" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button asChild size="lg" className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
              <Link to="/#order">
                <ShoppingCart className="w-5 h-5 ml-2" />
                {lang === "he" ? "הזמן עכשיו" : "Order now"}
              </Link>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            📍 {t("order.pickup_notice")}
          </div>
        </div>
      </main>
    </div>
  );
}