import { Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerReviews } from "@/hooks/useCustomerReviews";
import { useReviewImages } from "@/hooks/useReviewImages";
import { WriteReviewDialog } from "@/components/WriteReviewDialog";

export default function AllReviews() {
  const { lang, dir } = useLanguage();
  const { data: reviews } = useCustomerReviews();
  const { data: galleryImages } = useReviewImages();
  const L = (he: string, en: string) => (lang === "he" ? he : en);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 ml-2" />
              {L("חזרה", "Back")}
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black gradient-text">{L("כל הביקורות", "All Reviews")}</h1>
          <WriteReviewDialog />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">{L("ביקורות לקוחות", "Customer feedback")}</h2>
          {!reviews?.length ? (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              {L("עדיין אין ביקורות — היו הראשונים!", "No reviews yet — be the first!")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground">{r.customer_name}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-foreground/90 whitespace-pre-line">{r.comment}</p>}
                  {r.image_url && (
                    <img src={r.image_url} alt={`Review by ${r.customer_name}`} className="w-full rounded-xl border border-border max-h-80 object-cover" loading="lazy" />
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!!galleryImages?.length && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">{L("גלריית תמונות", "Photo gallery")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryImages.map((img) => (
                <div key={img.id} className="rounded-2xl overflow-hidden border border-border">
                  <img src={img.image_url} alt={img.caption || "review"} className="w-full aspect-square object-cover" loading="lazy" />
                  {img.caption && <div className="p-2 text-xs text-foreground">{img.caption}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}