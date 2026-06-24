import { Link } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReviewImages } from "@/hooks/useReviewImages";
import { useCustomerReviews } from "@/hooks/useCustomerReviews";
import { WriteReviewDialog } from "@/components/WriteReviewDialog";

export function ReviewsSection() {
  const { lang, dir } = useLanguage();
  const { data: reviewImages } = useReviewImages();
  const { data: reviews } = useCustomerReviews();
  const L = (he: string, en: string) => (lang === "he" ? he : en);

  const previewReviews = (reviews ?? []).slice(0, 3);
  const previewImages = (reviewImages ?? []).slice(0, 4);
  const hasAny = previewReviews.length > 0 || previewImages.length > 0;

  return (
    <section id="reviews" className="py-20 px-4" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-accent fill-accent" />
            ))}
          </div>
          <h2 className="text-4xl font-black font-heading gradient-text inline-block mb-4">
            {L("מה הלקוחות אומרים", "Customer Reviews")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {L("ביקורות אמיתיות מלקוחות מרוצים", "Real reviews from happy customers")}
          </p>
        </div>

        {!hasAny && (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground mb-8">
            {L("עדיין אין ביקורות — היו הראשונים לשתף!", "No reviews yet — be the first to share!")}
          </div>
        )}

        {previewReviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {previewReviews.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-foreground">{r.customer_name}</div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-foreground/90 line-clamp-4 whitespace-pre-line">{r.comment}</p>}
                {r.image_url && (
                  <img src={r.image_url} alt={`Review by ${r.customer_name}`} className="w-full rounded-xl border border-border max-h-48 object-cover" loading="lazy" />
                )}
              </div>
            ))}
          </div>
        )}

        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {previewImages.map((img) => (
              <div key={img.id} className="rounded-2xl overflow-hidden border border-border">
                <img src={img.image_url} alt={img.caption || "review"} className="w-full aspect-square object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <WriteReviewDialog />
          <Link to="/reviews">
            <Button variant="outline">
              {L("צפה בכל הביקורות", "View all reviews")}
              <ArrowLeft className="w-4 h-4 mr-2 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
