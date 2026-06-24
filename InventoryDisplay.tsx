import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/useProducts";
import { useColors } from "@/hooks/useColors";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { confirmOrderAndDeductStock } from "@/lib/orderConfirmation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ClipboardList, ArrowLeft, Maximize2, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function InventoryDisplay() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: products } = useProducts();
  const { data: colors } = useColors();
  const { data: orders } = useOrders();
  const [now, setNow] = useState(new Date());

  const L = (he: string, en: string) => (lang === "he" ? he : en);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Give Supabase a moment to restore the session from storage before bouncing
      const t = setTimeout(() => {
        if (!user) navigate("/admin-login", { replace: true, state: { from: "/inventory-display" } });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500" dir={dir}>
        {L("טוען…", "Loading…")}
      </div>
    );
  }

  const goFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleConfirmOrder = async (orderId: string) => {
    const order = orders?.find((o) => o.id === orderId);
    if (!order) return;
    try {
      await confirmOrderAndDeductStock({ order, products, note: null });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(L("ההזמנה אושרה והמלאי עודכן", "Order confirmed and stock updated"));
    } catch {
      toast.error(L("שגיאה באישור ההזמנה", "Error confirming order"));
    }
  };

  const pendingOrders = (orders ?? []).filter(o => o.confirmation_status !== "confirmed");

  return (
    <div className="min-h-screen bg-white text-gray-900" dir={dir}>
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-600" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              {L("חזרה", "Back")}
            </Button>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              Magic 3D — {L("מסך מלאי", "Inventory")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">
                {now.toLocaleTimeString(lang === "he" ? "he-IL" : "en-US")}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={goFullscreen} className="border-gray-300 text-gray-700">
              <Maximize2 className="w-4 h-4 ml-2" />
              {L("מסך מלא", "Fullscreen")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Materials as 3D spool cards */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {L("חומרי גלם", "Materials")}
            <Badge className="ml-auto bg-gray-100 text-gray-700 border border-gray-200">{colors?.length ?? 0}</Badge>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(colors ?? []).map(c => {
              const qty = (c as any).quantity ?? 0;
              const material = (c as any).material_type ?? "PLA";
              const isLow = qty > 0 && qty <= 2;
              const isEmpty = qty === 0;
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border-2 p-4 flex flex-col items-center text-center transition-all ${
                    isEmpty ? "border-red-300 bg-red-50" :
                    isLow ? "border-amber-300 bg-amber-50" :
                    "border-gray-200 bg-white"
                  }`}
                >
                  {/* Spool SVG */}
                  <div className="relative w-20 h-20 mb-2">
                    <svg viewBox="0 0 80 80" className="w-full h-full">
                      {/* Spool body */}
                      <ellipse cx="40" cy="60" rx="35" ry="10" fill="#e5e7eb" />
                      <rect x="5" y="20" width="70" height="40" rx="4" fill={c.hex} opacity="0.85" />
                      <ellipse cx="40" cy="20" rx="35" ry="10" fill={c.hex} />
                      <ellipse cx="40" cy="20" rx="35" ry="10" fill="white" opacity="0.2" />
                      {/* Center hole */}
                      <ellipse cx="40" cy="20" rx="12" ry="4" fill="white" />
                      <rect x="28" y="20" width="24" height="30" fill="white" />
                      <ellipse cx="40" cy="50" rx="12" ry="4" fill="#e5e7eb" />
                      {/* Filament wrap lines */}
                      <ellipse cx="40" cy="25" rx="30" ry="6" fill="none" stroke={c.hex} strokeWidth="1.5" opacity="0.6" />
                      <ellipse cx="40" cy="32" rx="28" ry="5" fill="none" stroke={c.hex} strokeWidth="1.5" opacity="0.4" />
                      <ellipse cx="40" cy="39" rx="26" ry="5" fill="none" stroke={c.hex} strokeWidth="1.5" opacity="0.3" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{material}</div>
                  <div className="font-semibold text-gray-800 text-sm leading-tight w-full">{lang === "he" ? c.name : c.name_en}</div>
                  <div className={`text-2xl font-black mt-1 ${isEmpty ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-900"}`}>
                    {qty}
                  </div>
                </div>
              );
            })}
            {!colors?.length && <div className="col-span-full text-sm text-gray-400 text-center py-8">{L("אין חומרים", "No materials")}</div>}
          </div>

          {/* Product stock below */}
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {L("מלאי מוצרים", "Product Stock")}
          </h2>
          <div className="space-y-2">
            {(products ?? []).map(p => {
              const qty = p.stock_quantity ?? 0;
              const isOut = !p.in_stock || qty === 0;
              const isLow = !isOut && qty <= 3;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    isOut ? "border-red-200 bg-red-50" :
                    isLow ? "border-amber-200 bg-amber-50" :
                    "border-gray-200 bg-white"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">{p.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {(p.colors ?? []).slice(0, 5).map(hex => (
                        <div key={hex} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-900"}`}>{qty}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Orders */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            {L("הזמנות", "Orders")}
            <Badge className="ml-auto bg-blue-100 text-blue-700 border border-blue-200">
              {pendingOrders.length} {L("ממתינות", "pending")}
            </Badge>
          </h2>

          <div className="space-y-3">
            {pendingOrders.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-400">
                {L("אין הזמנות ממתינות", "No pending orders")}
              </div>
            )}
            {pendingOrders.map((o) => {
              const items = Array.isArray(o.items) ? (o.items as any[]) : [];
              return (
                <div key={o.id} className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-bold text-gray-900">{o.customer_name}</div>
                    <Badge className="bg-blue-600 text-white">{o.order_type}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(o.created_at).toLocaleString(lang === "he" ? "he-IL" : "en-US")} · {o.customer_phone}
                  </div>
                  {items.length > 0 && (
                    <ul className="text-sm text-gray-800 space-y-1 list-disc ps-5">
                      {items.map((it: any, idx: number) => {
                        const name = it.productName || it.name || it.product_name || it.title || L("פריט", "Item");
                        const colorNames = Array.isArray(it.colors)
                          ? it.colors.map((c: any) => (typeof c === "string" ? c : c?.name)).filter(Boolean).join(", ")
                          : (it.color || "");
                        return (
                          <li key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{name}</span>
                            {it.quantity ? <span className="text-gray-500">× {it.quantity}</span> : null}
                            {Array.isArray(it.colors) && it.colors.map((c: any, i: number) => (
                              typeof c === "object" && c?.hex ? (
                                <span key={i} className="inline-block w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                              ) : null
                            ))}
                            {colorNames && <span className="text-xs text-gray-500">({colorNames})</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {o.notes && (
                    <div className="mt-2 text-sm text-gray-600 italic">"{o.notes}"</div>
                  )}
                  <div className="mt-2 text-sm font-bold text-blue-700">
                    {L("סה״כ", "Total")}: ₪{o.final_price ?? o.total_price}
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleConfirmOrder(o.id)}
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    {L("אשר הזמנה", "Confirm order")}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}