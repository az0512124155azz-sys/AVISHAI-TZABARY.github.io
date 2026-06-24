import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Package, ShoppingCart, Phone, Mail, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/hooks/useOrders";

type AuthUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type CartItem = { productId: string; name: string; price: number; quantity: number };

function useAuthUsers() {
  return useQuery({
    queryKey: ["admin-auth-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_auth_users");
      if (error) throw error;
      return (data ?? []) as AuthUser[];
    },
  });
}

function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-details", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [ordersRes, cartRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("user_carts").select("items, updated_at").eq("user_id", userId!).maybeSingle(),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (cartRes.error) throw cartRes.error;
      return {
        orders: (ordersRes.data ?? []) as unknown as Order[],
        cart: (cartRes.data?.items as unknown as CartItem[] | undefined) ?? [],
        cartUpdated: cartRes.data?.updated_at as string | undefined,
      };
    },
  });
}

function useGuestOrders() {
  return useQuery({
    queryKey: ["admin-guest-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .is("user_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });
}

export function AdminUsersTab() {
  const { lang } = useLanguage();
  const L = (he: string, en: string) => (lang === "he" ? he : en);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"users" | "guests">("users");

  const { data: users, isLoading: usersLoading } = useAuthUsers();
  const { data: details, isLoading: detailsLoading } = useUserDetails(selectedId);
  const { data: guestOrders, isLoading: guestsLoading } = useGuestOrders();

  const selectedUser = users?.find((u) => u.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "users" ? "default" : "outline"} size="sm" onClick={() => { setMode("users"); setSelectedId(null); }}>
          <Mail className="w-4 h-4 mr-2" />
          {L("חשבונות מחוברים", "Signed-in users")} ({users?.length ?? 0})
        </Button>
        <Button variant={mode === "guests" ? "default" : "outline"} size="sm" onClick={() => { setMode("guests"); setSelectedId(null); }}>
          <Phone className="w-4 h-4 mr-2" />
          {L("הזמנות עם טלפון בלבד", "Phone-only orders")} ({guestOrders?.length ?? 0})
        </Button>
      </div>

      {mode === "users" && !selectedId && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            {L("חשבונות מחוברים", "Signed-in users")}
          </h2>
          {usersLoading ? (
            <p className="text-muted-foreground text-sm">{L("טוען...", "Loading...")}</p>
          ) : !users?.length ? (
            <p className="text-muted-foreground text-sm">{L("עדיין אין חשבונות", "No accounts yet")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border hover:border-primary text-start transition"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center font-bold text-foreground">
                      {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.last_sign_in_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {L("התחבר לאחרונה", "Last sign-in")}: {new Date(u.last_sign_in_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "users" && selectedId && selectedUser && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {L("חזרה לרשימה", "Back to list")}
          </Button>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border">
            {selectedUser.avatar_url ? (
              <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center font-bold text-xl text-foreground">
                {(selectedUser.full_name || selectedUser.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground">{selectedUser.full_name || L("ללא שם", "No name")}</p>
              <p className="text-sm text-muted-foreground break-all">{selectedUser.email}</p>
              <p className="text-xs text-muted-foreground">
                {L("נרשם", "Joined")}: {new Date(selectedUser.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}
              </p>
            </div>
          </div>

          {detailsLoading ? (
            <p className="text-muted-foreground text-sm">{L("טוען...", "Loading...")}</p>
          ) : (
            <>
              {/* Cart */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {L("הסל הנוכחי", "Current cart")} ({details?.cart.length ?? 0})
                </h3>
                {!details?.cart.length ? (
                  <p className="text-sm text-muted-foreground">{L("הסל ריק", "Cart is empty")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {details.cart.map((it) => (
                      <div key={it.productId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{it.name} × {it.quantity}</span>
                        <span className="text-muted-foreground">₪{(it.price * it.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    {details.cartUpdated && (
                      <p className="text-[10px] text-muted-foreground pt-2 border-t border-border mt-2">
                        {L("עודכן", "Updated")}: {new Date(details.cartUpdated).toLocaleString(lang === "he" ? "he-IL" : "en-US")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Orders */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {L("היסטוריית הזמנות", "Order history")} ({details?.orders.length ?? 0})
                </h3>
                {!details?.orders.length ? (
                  <p className="text-sm text-muted-foreground">{L("עדיין אין הזמנות", "No orders yet")}</p>
                ) : (
                  <div className="space-y-3">
                    {details.orders.map((o) => <OrderCard key={o.id} order={o} lang={lang} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {mode === "guests" && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {L("הזמנות עם טלפון בלבד", "Phone-only orders")}
          </h2>
          {guestsLoading ? (
            <p className="text-muted-foreground text-sm">{L("טוען...", "Loading...")}</p>
          ) : !guestOrders?.length ? (
            <p className="text-muted-foreground text-sm">{L("אין הזמנות כאלה", "No such orders")}</p>
          ) : (
            <div className="space-y-3">
              {guestOrders.map((o) => <OrderCard key={o.id} order={o} lang={lang} showCustomer />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, lang, showCustomer }: { order: Order; lang: string; showCustomer?: boolean }) {
  const L = (he: string, en: string) => (lang === "he" ? he : en);
  const items = (order.items as Array<{ productName?: string; quantity?: number }>) || [];
  const confirmed = order.confirmation_status === "confirmed";
  return (
    <div className="p-3 rounded-lg bg-secondary border border-border text-sm space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-muted-foreground text-xs">
          {new Date(order.created_at).toLocaleString(lang === "he" ? "he-IL" : "en-US")}
        </span>
        <span className={`text-xs font-bold ${confirmed ? "text-primary" : "text-muted-foreground"}`}>
          {confirmed ? L("✓ אושר", "✓ Confirmed") : L("⏳ ממתין", "⏳ Pending")}
        </span>
      </div>
      {showCustomer && (
        <div className="text-xs text-foreground">
          👤 {order.customer_name} · 📱 {order.customer_phone}
        </div>
      )}
      {items.length > 0 && (
        <ul className="text-foreground text-xs">
          {items.map((it, i) => <li key={i}>• {it.productName} × {it.quantity}</li>)}
        </ul>
      )}
      {order.notes && <p className="text-xs text-muted-foreground italic">📝 {order.notes}</p>}
      {order.admin_confirmation_note && <p className="text-xs text-accent">📋 {order.admin_confirmation_note}</p>}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-muted-foreground">{L("סך הכל", "Total")}</span>
        <span className="font-bold text-foreground">₪{Number(order.final_price).toFixed(0)}</span>
      </div>
    </div>
  );
}