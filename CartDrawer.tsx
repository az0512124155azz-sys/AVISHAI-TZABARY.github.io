import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Plus, Minus, Trash2, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, setQuantity, remove, clear, count, total } = useCart();
  const { lang, dir } = useLanguage();
  const createOrder = useCreateOrder();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const L = (he: string, en: string) => (lang === "he" ? he : en);

  // Prefill from signed-in user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string; phone?: string };
        if (!name) setName(meta.full_name || meta.name || "");
        if (!phone && u.phone) setPhone(u.phone);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Hide on admin
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return null;

  const handleCheckout = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(L("נא למלא שם וטלפון", "Please fill in name and phone"));
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!/^(\+972|0)5\d{8}$/.test(cleanPhone)) {
      toast.error(L("מספר טלפון לא תקין", "Invalid phone number"));
      return;
    }
    if (!items.length) return;

    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        quantity: i.quantity,
        orderContext: "catalog",
        colors: [],
      }));
      await createOrder.mutateAsync({
        customer_name: name,
        customer_phone: phone,
        order_type: "catalog",
        items: orderItems,
        notes: notes || null,
        participants: null,
        file_url: null,
        total_price: total,
        discount_percent: 0,
        final_price: total,
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });
      let msg = `🛒 ${L("הזמנה חדשה מ-Magic 3D", "New order from Magic 3D")}\n`;
      msg += `📅 ${L("תאריך", "Date")}: ${dateStr}\n\n`;
      msg += `👤 ${L("שם", "Name")}: ${name}\n📱 ${L("טלפון", "Phone")}: ${phone}\n\n`;
      msg += `📦 ${L("מוצרים", "Items")}\n`;
      items.forEach((i) => {
        msg += `• ${i.name} x${i.quantity} — ₪${(i.price * i.quantity).toFixed(0)}\n`;
      });
      msg += `\n💰 ${L("סך הכל", "Total")}: ₪${total.toFixed(0)}`;
      if (notes) msg += `\n📝 ${L("הערות", "Notes")}: ${notes}`;
      msg += `\n\n📍 ${L("איסוף עצמי בלבד – גני תקווה", "Pickup only – Ganei Tikva")}`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success(L("ההזמנה נשלחה!", "Order sent!"));
      clear();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : L("שמירת ההזמנה נכשלה", "Failed to save order"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="cart"
          className="fixed bottom-6 end-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          {count > 0 && (
            <span className="absolute -top-1 -end-1 min-w-[22px] h-[22px] px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-full sm:max-w-md flex flex-col" dir={dir}>
        <SheetHeader>
          <SheetTitle className="gradient-text font-heading">{L("סל קניות", "Shopping Cart")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{L("הסל ריק", "Your cart is empty")}</p>
            </div>
          ) : (
            items.map((i) => (
              <div key={i.productId} className="flex gap-3 p-3 rounded-xl bg-secondary border border-border">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex items-center justify-center shrink-0">
                  {i.image_url ? (
                    <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground">₪{i.price} {L("ליחידה", "each")}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-background rounded-lg">
                      <button onClick={() => setQuantity(i.productId, i.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:text-primary">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>
                      <button onClick={() => setQuantity(i.productId, i.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:text-primary">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => remove(i.productId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">{L("סך הכל", "Total")}</span>
              <span className="text-2xl font-black gradient-text">₪{total.toFixed(0)}</span>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">{L("שם מלא", "Full name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border h-9" />
              </div>
              <div>
                <Label className="text-xs">{L("טלפון", "Phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" className="bg-secondary border-border h-9" />
              </div>
              <div>
                <Label className="text-xs">{L("הערות (אופציונלי)", "Notes (optional)")}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border h-9" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {L("איסוף עצמי בלבד – גני תקווה", "Pickup only – Ganei Tikva")}
            </p>
            <Button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold"
            >
              {submitting ? L("שולח...", "Sending...") : L("שלח בוואטסאפ", "Send via WhatsApp")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}