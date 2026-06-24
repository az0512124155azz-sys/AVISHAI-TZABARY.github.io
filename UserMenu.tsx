import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogIn, LogOut, Package, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserOrders } from "@/hooks/useUserOrders";

export function UserMenu() {
  const { lang, dir } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const L = (he: string, en: string) => (lang === "he" ? he : en);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: orders } = useUserOrders(user?.id);

  // Hide menu on admin pages
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return null;

  const signIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "select_account",
        },
      });
      if (result.error) {
        console.error("[sign-in error]", result.error);
        const msg = (result.error as { message?: string })?.message ?? String(result.error);
        toast.error(L("התחברות נכשלה: ", "Sign-in failed: ") + msg);
      }
    } catch (e) {
      console.error("[sign-in exception]", e);
      toast.error(L("שגיאה בהתחברות", "Sign-in error"));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success(L("התנתקת", "Signed out"));
  };

  // Not signed in: tiny icon-only button
  if (!user) {
    return (
      <button
        onClick={signIn}
        disabled={loading}
        aria-label={L("התחבר", "Sign in")}
        className="fixed top-4 right-4 z-50 glass rounded-full w-9 h-9 flex items-center justify-center text-foreground hover:text-primary transition-colors disabled:opacity-50"
      >
        <LogIn className="w-4 h-4" />
      </button>
    );
  }

  const meta = (user.user_metadata ?? {}) as { avatar_url?: string; full_name?: string; name?: string };
  const name = meta.full_name || meta.name || user.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={L("חשבון", "Account")}
          className="fixed top-4 right-4 z-50 glass rounded-full w-9 h-9 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition"
        >
          {meta.avatar_url ? (
            <img src={meta.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-foreground">{initial}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto p-0" style={{ direction: dir }}>
        <div className="p-3 border-b border-border flex items-center gap-3">
          {meta.avatar_url ? (
            <img src={meta.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center font-bold">{initial}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={signOut} aria-label="sign out" className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            {L("ההזמנות שלי", "My orders")} ({orders?.length ?? 0})
          </p>
          {!orders || orders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {L("אין הזמנות עדיין", "No orders yet")}
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const items = (o.items as Array<{ productName?: string; quantity?: number }>) || [];
                const confirmed = o.confirmation_status === "confirmed";
                return (
                  <div key={o.id} className="p-2.5 rounded-lg bg-secondary border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                      <span className={`flex items-center gap-1 font-bold ${confirmed ? "text-primary" : "text-muted-foreground"}`}>
                        {confirmed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {confirmed ? L("אושר", "Confirmed") : L("ממתין", "Pending")}
                      </span>
                    </div>
                    {items.length > 0 && (
                      <ul className="text-foreground">
                        {items.map((it, i) => (
                          <li key={i}>• {it.productName} × {it.quantity}</li>
                        ))}
                      </ul>
                    )}
                    {o.notes && <p className="text-muted-foreground italic">📝 {o.notes}</p>}
                    {o.admin_confirmation_note && (
                      <p className="text-accent">📋 {o.admin_confirmation_note}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">{L("סך הכל", "Total")}</span>
                      <span className="font-bold text-foreground">₪{Number(o.final_price).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}