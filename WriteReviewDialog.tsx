import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Upload, Send, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateCustomerReview } from "@/hooks/useCustomerReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WriteReviewDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { lang, dir } = useLanguage();
  const create = useCreateCustomerReview();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const L = (he: string, en: string) => (lang === "he" ? he : en);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `reviews/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success(L("התמונה הועלתה", "Image uploaded"));
    } catch {
      toast.error(L("שגיאה בהעלאת תמונה", "Image upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(L("נא למלא שם", "Please enter your name"));
      return;
    }
    if (rating < 1 || rating > 5) return;
    try {
      await create.mutateAsync({
        customer_name: name.trim().slice(0, 80),
        rating,
        comment: comment.trim().slice(0, 500) || null,
        image_url: imageUrl,
      });
      toast.success(L("תודה על הביקורת!", "Thanks for your review!"));
      setName(""); setRating(5); setComment(""); setImageUrl(null);
      setOpen(false);
    } catch {
      toast.error(L("שגיאה בשליחה", "Failed to submit"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
            <Star className="w-4 h-4 mr-2" />
            {L("רשום ביקורת", "Write a review")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent dir={dir} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L("שתפו אותנו במה שחשבתם", "Share your experience")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">{L("שם", "Name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="mb-2 block">{L("דירוג", "Rating")}</Label>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} stars`}
                >
                  <Star className={`w-8 h-8 ${(hover || rating) >= n ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1 block">{L("תגובה (לא חובה)", "Comment (optional)")}</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} className="bg-secondary border-border min-h-[90px]" />
          </div>
          <div>
            <Label className="mb-1 block">{L("תמונה (לא חובה)", "Photo (optional)")}</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="review" className="w-24 h-24 rounded-lg object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? L("מעלה...", "Uploading...") : L("העלה תמונה", "Upload image")}
              </Button>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={create.isPending} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
            <Send className="w-4 h-4 mr-2" />
            {L("שלח ביקורת", "Submit review")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}