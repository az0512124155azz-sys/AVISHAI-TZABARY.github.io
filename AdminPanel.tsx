import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useColors, useCreateColor, useDeleteColor } from "@/hooks/useColors";
import { useUpdateColor } from "@/hooks/useColors";
import { useOrders, useUpdateOrderDiscount, useSetOrderPrice } from "@/hooks/useOrders";
import { useTransactions, useAllTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useReviewImages, useCreateReviewImage, useDeleteReviewImage } from "@/hooks/useReviewImages";
import { useCustomerReviews, useDeleteCustomerReview } from "@/hooks/useCustomerReviews";
import { useSaleSettings, useUpdateSaleSettings } from "@/hooks/useSaleSettings";
import { useAdminSetting, useSetAdminSetting } from "@/hooks/useAdminSettings";
import { supabase } from "@/integrations/supabase/client";
import { confirmOrderAndDeductStock } from "@/lib/orderConfirmation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Plus, Pencil, Trash2, Save, X, Upload, ArrowRight, Palette, ClipboardCheck, Send, CheckCircle, DollarSign, TrendingUp, TrendingDown, Printer, Star, ExternalLink, Lightbulb, RefreshCw, Tag, CreditCard, Monitor, Users } from "lucide-react";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  in_stock: boolean;
  stock_quantity: string;
  discount_percent: string;
  colors: string[];
  image_url: string;
  images: string[];
  print_link: string;
  allow_two_colors: boolean;
  allow_custom_text: boolean;
  allow_custom_image: boolean;
};

const emptyForm: ProductForm = {
  name: "", description: "", price: "0", category: "general",
  in_stock: true, stock_quantity: "0", discount_percent: "0", colors: [], image_url: "", images: [], print_link: "", allow_two_colors: false,
  allow_custom_text: false, allow_custom_image: false,
};

export default function AdminPanel() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { data: colors } = useColors();
  const createColor = useCreateColor();
  const deleteColor = useDeleteColor();
  const updateColor = useUpdateColor();
  const { data: orders } = useOrders();
  const updateOrderDiscount = useUpdateOrderDiscount();
  const setOrderPrice = useSetOrderPrice();
  const queryClient = useQueryClient();

  const now = new Date();
  const [finMonth, setFinMonth] = useState(now.getMonth() + 1);
  const [finYear, setFinYear] = useState(now.getFullYear());
  const { data: transactions } = useTransactions(finMonth, finYear);
  const { data: allTransactions } = useAllTransactions();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const [txForm, setTxForm] = useState({ description: "", amount: "", type: "expense" as "expense" | "income" });

  const { data: reviewImages } = useReviewImages();
  const createReviewImage = useCreateReviewImage();
  const deleteReviewImage = useDeleteReviewImage();
  const { data: customerReviews } = useCustomerReviews();
  const deleteCustomerReview = useDeleteCustomerReview();
  const [reviewCaption, setReviewCaption] = useState("");
  const [reviewUploading, setReviewUploading] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "colors" | "confirmations" | "finance" | "reviews" | "suggestion" | "sale" | "payments" | "customers">("products");
  const [newColor, setNewColor] = useState({ name: "", name_en: "", hex: "#000000" });
  const [newColorMaterial, setNewColorMaterial] = useState("PLA");
  const [newColorQuantity, setNewColorQuantity] = useState("0");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [receiptDiscounts, setReceiptDiscounts] = useState<Record<string, string>>({});
  const [confirmationNotes, setConfirmationNotes] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [dailySuggestion, setDailySuggestion] = useState<any>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const { data: saleSettings } = useSaleSettings();
  const updateSale = useUpdateSaleSettings();
  const [saleForm, setSaleForm] = useState({ is_active: false, sale_text_he: "", sale_text_en: "", discount_percent: "0", start_date: "", end_date: "" });
  const [saleFormLoaded, setSaleFormLoaded] = useState(false);
  useEffect(() => {
    if (saleSettings && !saleFormLoaded) {
      setSaleForm({
        is_active: saleSettings.is_active,
        sale_text_he: saleSettings.sale_text_he,
        sale_text_en: saleSettings.sale_text_en,
        discount_percent: String(saleSettings.discount_percent),
        start_date: saleSettings.start_date ? saleSettings.start_date.slice(0, 16) : "",
        end_date: saleSettings.end_date ? saleSettings.end_date.slice(0, 16) : "",
      });
      setSaleFormLoaded(true);
    }
  }, [saleSettings, saleFormLoaded]);

  const { data: paymentLink } = useAdminSetting("payment_app_link");
  const setAdminSetting = useSetAdminSetting();
  const [paymentLinkInput, setPaymentLinkInput] = useState("");

  const fetchDailySuggestion = async () => {
    setSuggestionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-model-suggestion");
      if (error) throw error;
      setDailySuggestion(data?.suggestion || data?.raw || null);
    } catch (e) {
      console.error(e);
      toast.error(lang === "he" ? "שגיאה בטעינת ההצעה" : "Error loading suggestion");
    } finally {
      setSuggestionLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-foreground">{t("admin.loading")}</p></div>;
  if (!user) { navigate("/admin-login"); return null; }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      toast.success(t("admin.image_uploaded"));
    } catch {
      toast.error(t("admin.image_error"));
    } finally {
      setUploading(false);
    }
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `reviews/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      await createReviewImage.mutateAsync({ image_url: urlData.publicUrl, caption: reviewCaption || undefined });
      setReviewCaption("");
      toast.success(lang === "he" ? "תמונת ביקורת הועלתה" : "Review image uploaded");
    } catch {
      toast.error(t("admin.image_error"));
    } finally {
      setReviewUploading(false);
    }
  };

  const toggleColor = (hex: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(hex) ? f.colors.filter((c) => c !== hex) : [...f.colors, hex],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t("admin.enter_name")); return; }
    try {
      const payload = {
        name: form.name, description: form.description || null,
        price: Number(form.price) || 0, category: form.category,
        in_stock: form.in_stock, stock_quantity: Number(form.stock_quantity) || 0,
        discount_percent: Number(form.discount_percent) || 0,
        colors: form.colors, image_url: form.image_url || null, images: form.images, print_link: form.print_link || null, allow_two_colors: form.allow_two_colors,
        allow_custom_text: form.allow_custom_text, allow_custom_image: form.allow_custom_image,
      };
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload });
        toast.success(t("admin.updated"));
      } else {
        await createProduct.mutateAsync(payload);
        toast.success(t("admin.added"));
      }
      setShowForm(false); setEditingId(null); setForm(emptyForm);
    } catch { toast.error(t("admin.save_error")); }
  };

  const handleEdit = (product: NonNullable<typeof products>[0]) => {
    setForm({
      name: product.name, description: product.description || "",
      price: String(product.price), category: product.category,
      in_stock: product.in_stock, stock_quantity: String(product.stock_quantity),
      discount_percent: String(product.discount_percent || 0),
      colors: product.colors || [], image_url: product.image_url || "", images: ((product as any).images as string[] | null) ?? [], print_link: product.print_link || "", allow_two_colors: (product as any).allow_two_colors ?? false,
      allow_custom_text: (product as any).allow_custom_text ?? false,
      allow_custom_image: (product as any).allow_custom_image ?? false,
    });
    setEditingId(product.id); setShowForm(true);
  };

  const toBambuLink = (link: string): string => {
    if (link.startsWith("bambustudio://")) return link;
    return `bambustudio://open?file=${link}`;
  };

  const openBambuProtocol = (url: string) => {
    const link = toBambuLink(url);
    const a = document.createElement("a");
    a.href = link;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  const openPrintLink = (link?: string | null) => {
    if (!link) {
      toast.info(lang === "he" ? "אין קישור הדפסה למוצר הזה" : "No print link for this product");
      return;
    }
    openBambuProtocol(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.delete_confirm"))) return;
    try { await deleteProduct.mutateAsync(id); toast.success(t("admin.deleted")); }
    catch { toast.error(t("admin.delete_error")); }
  };

  const handleAddColor = async () => {
    if (!newColor.name.trim() || !newColor.name_en.trim()) return;
    try {
      await createColor.mutateAsync({
        ...newColor,
        sort_order: (colors?.length ?? 0) + 1,
        material_type: newColorMaterial || "PLA",
        quantity: Number(newColorQuantity) || 0,
      });
      setNewColor({ name: "", name_en: "", hex: "#000000" });
      setNewColorMaterial("PLA");
      setNewColorQuantity("0");
      toast.success(t("admin.color_added"));
    } catch { toast.error(t("admin.color_error")); }
  };

  const handleDeleteColor = async (id: string) => {
    try { await deleteColor.mutateAsync(id); toast.success(t("admin.color_deleted")); }
    catch { toast.error(t("admin.color_error")); }
  };

  const handleApplyDiscount = async (orderId: string, totalPrice: number) => {
    const discountStr = receiptDiscounts[orderId] || "0";
    const discount = Math.min(100, Math.max(0, Number(discountStr) || 0));
    const finalPrice = Math.round(totalPrice * (1 - discount / 100) * 100) / 100;
    try {
      await updateOrderDiscount.mutateAsync({ id: orderId, discount_percent: discount, final_price: finalPrice });
      toast.success(t("admin.discount_updated"));
    } catch {
      toast.error(t("admin.save_error"));
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    const note = confirmationNotes[orderId] || "";
    try {
      const order = orders?.find(o => o.id === orderId);
      if (!order) return;
      await confirmOrderAndDeductStock({ order, products, note });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(t("admin.order_confirmed"));
      // Auto-send WhatsApp confirmation to the customer with the latest note
      handleSendConfirmation({ ...order, admin_confirmation_note: note || order.admin_confirmation_note });
    } catch {
      toast.error(t("admin.save_error"));
    }
  };

  const handleSendConfirmation = (order: NonNullable<typeof orders>[0]) => {
    const items = order.items as any[];
    let msg = `✅ ${t("admin.confirmation_title")} — Magic 3D\n`;
    msg += `📅 ${new Date(order.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}\n\n`;
    msg += `👤 ${order.customer_name}\n📱 ${order.customer_phone}\n\n`;
    if (items.length > 0) {
      items.forEach((item: any) => {
        msg += `• ${item.productName} x${item.quantity}`;
        if (item.colors?.length) msg += ` (${item.colors.map((c: any) => c.name).join(", ")})`;
        msg += `\n`;
      });
      msg += `\n`;
    }
    if (order.notes) msg += `📝 ${order.notes}\n\n`;
    msg += `💰 ${t("admin.original_price")}: ₪${order.total_price}\n`;
    if (order.discount_percent > 0) {
      msg += `🏷️ ${t("admin.confirmation_discount")}: ${order.discount_percent}%\n`;
    }
    msg += `✅ ${t("admin.final_price")}: ₪${order.final_price}`;
    if (order.admin_confirmation_note) {
      msg += `\n\n📋 ${t("admin.note")}: ${order.admin_confirmation_note}`;
    }
    msg += `\n\n📍 ${lang === "he" ? "איסוף עצמי בגני תקווה" : "Pickup in Ganei Tikva"}`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = order.customer_phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("0") ? `972${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, "_blank");
    toast.success(t("admin.confirmation_sent"));
  };

  const handlePrintPendingOrders = () => {
    const pendingOrders = orders?.filter(o => o.confirmation_status !== "confirmed") ?? [];
    if (!pendingOrders.length) {
      toast.info(lang === "he" ? "אין הזמנות ממתינות" : "No pending orders");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><title>${lang === "he" ? "הזמנות ממתינות" : "Pending Orders"} - Magic 3D</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; direction: ${dir}; }
      .order { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
      .order h3 { margin: 0 0 8px; }
      .items { margin: 8px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 8px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>🪄 Magic 3D — ${lang === "he" ? "הזמנות ממתינות" : "Pending Orders"} (${pendingOrders.length})</h1>
    <p style="color:#666">${new Date().toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
    ${pendingOrders.map(order => {
      const items = order.items as any[];
      return `<div class="order">
        <h3>👤 ${order.customer_name} — 📱 ${order.customer_phone}</h3>
        <p><strong>${order.order_type}</strong> · ${new Date(order.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
        ${items.length > 0 ? `<div class="items">${items.map((item: any) => `<p>• ${item.productName} x${item.quantity}${item.colors?.length ? ` (${item.colors.map((c: any) => c.name).join(", ")})` : ""}</p>`).join("")}</div>` : ""}
        ${order.notes ? `<p>📝 ${order.notes}</p>` : ""}
        <p><strong>💰 ₪${order.final_price}</strong>${order.discount_percent > 0 ? ` (${order.discount_percent}% ${lang === "he" ? "הנחה" : "discount"})` : ""}</p>
      </div>`;
    }).join("")}
    </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handleOpenBambuStudio = (order: NonNullable<typeof orders>[0]) => {
    const items = order.items as any[];
    // Group items by color for efficient printing
    const colorGroups: Record<string, { productName: string; quantity: number; printLink?: string }[]> = {};
    items.forEach((item: any) => {
      const colorKey = item.colors?.length ? item.colors.map((c: any) => c.name).join("+") : (lang === "he" ? "ללא צבע" : "No color");
      if (!colorGroups[colorKey]) colorGroups[colorKey] = [];
      const product = products?.find(p => p.id === item.productId);
      colorGroups[colorKey].push({
        productName: item.productName,
        quantity: item.quantity,
        printLink: product?.print_link || undefined,
      });
    });

    // Build a summary and open print links grouped by color
    const linksToOpen: string[] = [];
    let summary = lang === "he" ? "📦 סידור לפי צבע:\n\n" : "📦 Grouped by color:\n\n";
    Object.entries(colorGroups).forEach(([color, groupItems]) => {
      summary += `🎨 ${color}:\n`;
      groupItems.forEach(gi => {
        summary += `  • ${gi.productName} x${gi.quantity}\n`;
        if (gi.printLink) linksToOpen.push(gi.printLink);
      });
      summary += "\n";
    });

    // If order has a direct file, open it in Bambu
    if (order.file_url) {
      openBambuProtocol(order.file_url);
    }

    // Open product print links
    if (linksToOpen.length > 0) {
      linksToOpen.forEach((link, i) => {
        setTimeout(() => {
          openBambuProtocol(link);
        }, i * 500);
      });
      toast.success(lang === "he" ? `פותח ${linksToOpen.length} קישורי הדפסה...` : `Opening ${linksToOpen.length} print links...`);
    } else if (!order.file_url) {
      toast.info(lang === "he" ? "אין קישורי הדפסה להזמנה זו" : "No print links for this order");
    }

    // Show color grouping summary
    if (items.length > 0) {
      console.log(summary);
      toast.info(lang === "he" ? "ראה קונסול לסידור לפי צבע" : "See console for color grouping", { duration: 5000 });
    }
  };

  const colorList = colors ?? [];
  const pendingOrders = orders?.filter(o => o.confirmation_status !== "confirmed") ?? [];
  const confirmedOrders = orders?.filter(o => o.confirmation_status === "confirmed") ?? [];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black font-heading gradient-text">{t("admin.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/inventory-display")}
            className="border-primary/40 text-primary hover:bg-primary/10"
            title={lang === "he" ? "מסך תצוגת מלאי להקרנה" : "Inventory display screen"}
          >
            <Monitor className="w-4 h-4 ml-2" />
            {lang === "he" ? "מסך הקרנה" : "Display"}
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 ml-2" />
            {t("admin.logout")}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={activeTab === "products" ? "default" : "outline"} onClick={() => setActiveTab("products")}>
            {t("admin.catalog_mgmt")}
          </Button>
          <Button variant={activeTab === "colors" ? "default" : "outline"} onClick={() => setActiveTab("colors")}>
            <Palette className="w-4 h-4 mr-2" />
            {t("admin.color_mgmt")}
          </Button>
          <Button variant={activeTab === "confirmations" ? "default" : "outline"} onClick={() => setActiveTab("confirmations")}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            {t("admin.confirmation_mgmt")}
          </Button>
          <Button variant={activeTab === "finance" ? "default" : "outline"} onClick={() => setActiveTab("finance")}>
            <DollarSign className="w-4 h-4 mr-2" />
            {t("admin.finance_mgmt")}
          </Button>
          <Button variant={activeTab === "reviews" ? "default" : "outline"} onClick={() => setActiveTab("reviews")}>
            <Star className="w-4 h-4 mr-2" />
            {lang === "he" ? "ביקורות" : "Reviews"}
          </Button>
          <Button variant={activeTab === "suggestion" ? "default" : "outline"} onClick={() => { setActiveTab("suggestion"); if (!dailySuggestion) fetchDailySuggestion(); }}>
            <Lightbulb className="w-4 h-4 mr-2" />
            {lang === "he" ? "הצעת היום" : "Daily Suggestion"}
          </Button>
          <Button variant={activeTab === "sale" ? "default" : "outline"} onClick={() => setActiveTab("sale")}>
            <Tag className="w-4 h-4 mr-2" />
            {lang === "he" ? "מבצעים" : "Sales"}
          </Button>
          <Button variant={activeTab === "payments" ? "default" : "outline"} onClick={() => { setActiveTab("payments"); if (paymentLink && !paymentLinkInput) setPaymentLinkInput(paymentLink); }}>
            <CreditCard className="w-4 h-4 mr-2" />
            {lang === "he" ? "תשלומים" : "Payments"}
          </Button>
          <Button variant={activeTab === "customers" ? "default" : "outline"} onClick={() => setActiveTab("customers")}>
            <Users className="w-4 h-4 mr-2" />
            {lang === "he" ? "לקוחות" : "Customers"}
          </Button>
        </div>

        {activeTab === "customers" && <AdminUsersTab />}

        {/* Order confirmations tab */}
        {activeTab === "confirmations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-foreground">{t("admin.confirmation_mgmt")} ({orders?.length ?? 0})</h2>
              <Button variant="outline" onClick={handlePrintPendingOrders} className="gap-2">
                <Printer className="w-4 h-4" />
                {lang === "he" ? `הדפס ממתינות (${pendingOrders.length})` : `Print Pending (${pendingOrders.length})`}
              </Button>
            </div>
            {!orders?.length ? (
              <div className="text-center py-16 glass rounded-2xl"><p className="text-muted-foreground">{t("admin.no_orders")}</p></div>
            ) : (
              <div className="space-y-4">
                {/* Pending orders first, then confirmed */}
                {[...pendingOrders, ...confirmedOrders].map((order) => {
                  const items = order.items as any[];
                  const isConfirmed = order.confirmation_status === "confirmed";
                  return (
                    <div key={order.id} className={`relative glass rounded-2xl p-5 space-y-3 transition-all ${isConfirmed ? "opacity-50 bg-muted/30" : ""}`}>
                      {/* Confirmed visual: green checkmark banner + strikethrough */}
                      {isConfirmed && (
                        <>
                          <div className="absolute top-0 left-0 right-0 h-1 bg-accent rounded-t-2xl" />
                          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                            <div className="w-[105%] h-[2px] bg-destructive/50 rotate-[-3deg]" />
                          </div>
                        </>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{order.customer_name}</h3>
                            {isConfirmed && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {t("admin.confirmed")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{order.customer_phone} · {new Date(order.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-sm text-accent font-medium mt-1">{order.order_type}</p>
                        </div>
                        {/* Bambu Studio button */}
                        <Button size="sm" variant="outline" onClick={() => handleOpenBambuStudio(order)} className="gap-1 text-xs">
                          <ExternalLink className="w-3 h-3" />
                          Bambu Studio
                        </Button>
                      </div>

                      {items.length > 0 && (
                        <div className="text-sm text-foreground space-y-1">
                          {items.map((item: any, i: number) => (
                            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                              <p>• {item.productName} x{item.quantity} {item.colors?.length ? `(${item.colors.map((c: any) => c.name).join(", ")})` : ""}</p>
                              {item.productId && products?.find((product) => product.id === item.productId)?.print_link && (
                                <Button size="sm" variant="outline" onClick={() => openPrintLink(products?.find((product) => product.id === item.productId)?.print_link)} className="gap-1 text-xs">
                                  <ExternalLink className="w-3 h-3" />
                                  {t("admin.open_print_link")}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {order.notes && <p className="text-sm text-muted-foreground">📝 {order.notes}</p>}
                      {order.file_url && <a href={order.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">📎 {lang === "he" ? "צפה בקובץ" : "View file"}</a>}
                      {order.admin_confirmation_note && (
                        <p className="text-sm text-accent">📋 {t("admin.note")}: {order.admin_confirmation_note}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                        <span className="text-sm text-foreground">{t("admin.original_price")}: <strong>₪{order.total_price}</strong></span>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">{lang === "he" ? "קבע מחיר:" : "Set price:"}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={priceInputs[order.id] ?? String(order.total_price || "")}
                              onChange={(e) => setPriceInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                              className="w-24 bg-secondary border-border h-8 text-sm"
                              placeholder="₪"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const v = Number(priceInputs[order.id] ?? order.total_price);
                                if (!Number.isFinite(v) || v < 0) { toast.error(lang === "he" ? "מחיר לא תקין" : "Invalid price"); return; }
                                try {
                                  await setOrderPrice.mutateAsync({ id: order.id, total_price: v });
                                  toast.success(lang === "he" ? "המחיר עודכן" : "Price updated");
                                } catch { toast.error(t("admin.save_error")); }
                              }}
                            >
                              <Save className="w-3 h-3 mr-1" />{lang === "he" ? "שמור" : "Save"}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={receiptDiscounts[order.id] ?? String(order.discount_percent)}
                            onChange={(e) => setReceiptDiscounts((d) => ({ ...d, [order.id]: e.target.value }))}
                            className="w-20 bg-secondary border-border h-8 text-sm"
                            placeholder="%"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                          <Button size="sm" variant="outline" onClick={() => handleApplyDiscount(order.id, order.total_price)}>
                            <Save className="w-3 h-3 mr-1" />{t("admin.apply_discount")}
                          </Button>
                        </div>
                        <span className="text-sm font-bold text-primary">{t("admin.final_price")}: ₪{order.final_price}</span>
                      </div>

                      {/* Confirmation note */}
                      {!isConfirmed && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <Label className="text-sm text-foreground">{t("admin.confirmation_note")}</Label>
                          <Textarea
                            value={confirmationNotes[order.id] ?? (order.admin_confirmation_note || "")}
                            onChange={(e) => setConfirmationNotes((n) => ({ ...n, [order.id]: e.target.value }))}
                            placeholder={t("admin.confirmation_note_placeholder")}
                            className="bg-secondary border-border min-h-[60px] text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleConfirmOrder(order.id)}>
                              <CheckCircle className="w-3 h-3 mr-1" />{t("admin.confirm_order")}
                            </Button>
                          </div>
                        </div>
                      )}
                      {isConfirmed && order.confirmed_at && (
                        <p className="text-xs text-muted-foreground pt-1">
                          ✅ {lang === "he" ? "אושר ב-" : "Confirmed on "}{new Date(order.confirmed_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Finance tracker tab */}
        {activeTab === "finance" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t("admin.finance_mgmt")}</h2>

            {/* All-time summary */}
            {(() => {
              const allIncome = (allTransactions ?? []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const allExpenses = (allTransactions ?? []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const allNet = allIncome - allExpenses;
              // Also add confirmed orders as income
              const ordersIncome = (orders ?? []).filter(o => o.confirmation_status === "confirmed").reduce((s, o) => s + o.final_price, 0);
              const grandIncome = allIncome + ordersIncome;
              const grandNet = grandIncome - allExpenses;
              return (
                <div className="glass rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-foreground text-lg">{lang === "he" ? "📊 סיכום כללי (כל הזמנים)" : "📊 All-Time Summary"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-xl border border-green-500/20">
                      <p className="text-xs text-muted-foreground">{lang === "he" ? "הכנסות מהזמנות" : "Orders Income"}</p>
                      <p className="text-lg font-black text-green-500">₪{ordersIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl border border-green-500/20">
                      <p className="text-xs text-muted-foreground">{lang === "he" ? "הכנסות נוספות" : "Other Income"}</p>
                      <p className="text-lg font-black text-green-500">₪{allIncome.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl border border-red-500/20">
                      <p className="text-xs text-muted-foreground">{lang === "he" ? "סה\"כ הוצאות" : "Total Expenses"}</p>
                      <p className="text-lg font-black text-red-500">₪{allExpenses.toLocaleString()}</p>
                    </div>
                    <div className={`text-center p-3 rounded-xl border-2 ${grandNet >= 0 ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                      <p className="text-xs text-muted-foreground">{lang === "he" ? "רווח נקי כולל" : "Total Net Profit"}</p>
                      <p className={`text-xl font-black ${grandNet >= 0 ? "text-green-500" : "text-red-500"}`}>₪{grandNet.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Month/Year selector */}
            <div className="flex gap-3 items-center flex-wrap">
              <select value={finMonth} onChange={(e) => setFinMonth(Number(e.target.value))} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { month: "long" })}
                  </option>
                ))}
              </select>
              <select value={finYear} onChange={(e) => setFinYear(Number(e.target.value))} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 5 }, (_, i) => {
                  const y = now.getFullYear() - 2 + i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>

            <h3 className="font-bold text-foreground text-lg">{lang === "he" ? "📅 סיכום חודשי" : "📅 Monthly Summary"}</h3>
            {(() => {
              const totalIncome = (transactions ?? []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const totalExpenses = (transactions ?? []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const net = totalIncome - totalExpenses;
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass rounded-2xl p-5 text-center space-y-1 border border-green-500/20">
                    <TrendingUp className="w-6 h-6 mx-auto text-green-500" />
                    <p className="text-sm text-muted-foreground">{t("admin.total_income")}</p>
                    <p className="text-2xl font-black text-green-500">₪{totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="glass rounded-2xl p-5 text-center space-y-1 border border-red-500/20">
                    <TrendingDown className="w-6 h-6 mx-auto text-red-500" />
                    <p className="text-sm text-muted-foreground">{t("admin.total_expenses")}</p>
                    <p className="text-2xl font-black text-red-500">₪{totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className={`glass rounded-2xl p-5 text-center space-y-1 border-2 ${net >= 0 ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                    <DollarSign className="w-6 h-6 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">{t("admin.net_profit")}</p>
                    <p className={`text-3xl font-black ${net >= 0 ? "text-green-500" : "text-red-500"}`}>₪{net.toLocaleString()}</p>
                  </div>
                </div>
              );
            })()}

            {/* Add transaction form */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-foreground">{lang === "he" ? "הוסף רשומה חדשה" : "Add New Record"}</h3>
              <div className="flex gap-2">
                <Button size="sm" variant={txForm.type === "expense" ? "destructive" : "outline"} onClick={() => setTxForm(f => ({ ...f, type: "expense" }))}>
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {t("admin.add_expense")}
                </Button>
                <Button size="sm" variant={txForm.type === "income" ? "default" : "outline"} onClick={() => setTxForm(f => ({ ...f, type: "income" }))}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {t("admin.add_income")}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.what_for")}</Label>
                  <Input value={txForm.description} onChange={(e) => setTxForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" placeholder={lang === "he" ? "למשל: קניית פילמנט" : "e.g.: filament purchase"} />
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.amount")}</Label>
                  <Input type="number" min="0" value={txForm.amount} onChange={(e) => setTxForm(f => ({ ...f, amount: e.target.value }))} className="bg-secondary border-border" placeholder="0" />
                </div>
                <Button onClick={async () => {
                  if (!txForm.description.trim() || !txForm.amount) { toast.error(lang === "he" ? "נא למלא תיאור וסכום" : "Please fill description and amount"); return; }
                  try {
                    await createTransaction.mutateAsync({ description: txForm.description, amount: Number(txForm.amount), type: txForm.type, month: finMonth, year: finYear });
                    setTxForm({ description: "", amount: "", type: txForm.type });
                    toast.success(t("admin.transaction_added"));
                  } catch { toast.error(t("admin.save_error")); }
                }} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
                  <Plus className="w-4 h-4 mr-1" /> {lang === "he" ? "הוסף" : "Add"}
                </Button>
              </div>
            </div>

            {/* Transaction list */}
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">{lang === "he" ? "רשומות החודש" : "This Month's Records"}</h3>
              {!transactions?.length ? (
                <div className="text-center py-12 glass rounded-2xl"><p className="text-muted-foreground">{t("admin.no_transactions")}</p></div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className={`flex items-center gap-3 p-3 rounded-xl border ${tx.type === "income" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                    <div className={`w-2 h-8 rounded-full ${tx.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="flex-1 text-foreground font-medium">{tx.description}</span>
                    <span className={`font-bold text-lg ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                      {tx.type === "income" ? "+" : "-"}₪{tx.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}</span>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      try { await deleteTransaction.mutateAsync(tx.id); toast.success(t("admin.transaction_deleted")); }
                      catch { toast.error(t("admin.save_error")); }
                    }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{lang === "he" ? "ניהול ביקורות לקוחות" : "Customer Reviews Management"}</h2>

            {/* Upload review image */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-foreground">{lang === "he" ? "העלאת תמונת ביקורת" : "Upload Review Image"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-foreground mb-1 block">{lang === "he" ? "כיתוב (אופציונלי)" : "Caption (optional)"}</Label>
                  <Input value={reviewCaption} onChange={(e) => setReviewCaption(e.target.value)} className="bg-secondary border-border" placeholder={lang === "he" ? "למשל: ביקורת מלקוח מרוצה" : "e.g.: Review from happy customer"} />
                </div>
                <div>
                  <input ref={reviewFileRef} type="file" accept="image/*" className="hidden" onChange={handleReviewImageUpload} />
                  <Button onClick={() => reviewFileRef.current?.click()} disabled={reviewUploading} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {reviewUploading ? (lang === "he" ? "מעלה..." : "Uploading...") : (lang === "he" ? "העלה תמונה" : "Upload Image")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Review images grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {!reviewImages?.length ? (
                <div className="col-span-full text-center py-12 glass rounded-2xl">
                  <Star className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{lang === "he" ? "אין תמונות ביקורות עדיין" : "No review images yet"}</p>
                </div>
              ) : (
                reviewImages.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border">
                    <img src={img.image_url} alt={img.caption || "Review"} className="w-full aspect-square object-cover" />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                        <p className="text-xs text-foreground truncate">{img.caption}</p>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7"
                      onClick={async () => {
                        try { await deleteReviewImage.mutateAsync(img.id); toast.success(lang === "he" ? "הביקורת נמחקה" : "Review deleted"); }
                        catch { toast.error(t("admin.delete_error")); }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Customer written reviews */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground text-lg">{lang === "he" ? "תגובות לקוחות" : "Customer comments"}</h3>
              {!customerReviews?.length ? (
                <div className="text-center py-8 glass rounded-2xl text-muted-foreground">
                  {lang === "he" ? "אין תגובות עדיין" : "No comments yet"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerReviews.map((r) => (
                    <div key={r.id} className="glass rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-foreground">{r.customer_name}</div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-foreground/90 whitespace-pre-line">{r.comment}</p>}
                      {r.image_url && <img src={r.image_url} alt="" className="w-full max-h-48 object-cover rounded-lg border border-border" />}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString(lang === "he" ? "he-IL" : "en-US")}</div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(lang === "he" ? "למחוק את התגובה?" : "Delete this comment?")) return;
                            try { await deleteCustomerReview.mutateAsync(r.id); toast.success(lang === "he" ? "התגובה נמחקה" : "Comment deleted"); }
                            catch { toast.error(t("admin.delete_error")); }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {lang === "he" ? "מחק" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Colors management tab */}
        {activeTab === "colors" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-foreground text-lg">{t("admin.add_color")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.color_name_he")}</Label>
                  <Input value={newColor.name} onChange={(e) => setNewColor(c => ({ ...c, name: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.color_name_en")}</Label>
                  <Input value={newColor.name_en} onChange={(e) => setNewColor(c => ({ ...c, name_en: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.color_hex")}</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={newColor.hex} onChange={(e) => setNewColor(c => ({ ...c, hex: e.target.value }))} className="w-10 h-10 rounded border-0 cursor-pointer" />
                    <Input value={newColor.hex} onChange={(e) => setNewColor(c => ({ ...c, hex: e.target.value }))} className="bg-secondary border-border flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{lang === "he" ? "סוג חומר" : "Material"}</Label>
                  <Input value={newColorMaterial} onChange={(e) => setNewColorMaterial(e.target.value)} placeholder="PLA / PETG / ABS" className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{lang === "he" ? "כמות במלאי" : "Quantity"}</Label>
                  <Input type="number" value={newColorQuantity} onChange={(e) => setNewColorQuantity(e.target.value)} className="bg-secondary border-border" />
                </div>
                <Button onClick={handleAddColor} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
                  <Plus className="w-4 h-4 mr-1" /> {t("admin.add_color")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {colorList.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border flex-wrap">
                  <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="flex-1 min-w-0 text-foreground font-medium truncate">{c.name} / {c.name_en}</span>
                  <Input
                    value={(c as any).material_type ?? "PLA"}
                    onChange={(e) => updateColor.mutate({ id: c.id, material_type: e.target.value })}
                    className="bg-secondary border-border w-24 h-8 text-xs"
                    title={lang === "he" ? "סוג חומר" : "Material"}
                  />
                  <Input
                    type="number"
                    value={String((c as any).quantity ?? 0)}
                    onChange={(e) => updateColor.mutate({ id: c.id, quantity: Number(e.target.value) || 0 })}
                    className="bg-secondary border-border w-20 h-8 text-xs"
                    title={lang === "he" ? "מלאי" : "Stock"}
                  />
                  <span className="text-muted-foreground text-xs">{c.hex}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteColor(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products tab */}
        {activeTab === "products" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{t("admin.catalog_mgmt")} ({products?.length ?? 0} {t("admin.products")})</h2>
              <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
                <Plus className="w-4 h-4 ml-2" /> {t("admin.new_product")}
              </Button>
            </div>

            {showForm && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-lg">{editingId ? t("admin.edit_product") : t("admin.new_product")}</h3>
                  <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.product_name")}</Label>
                    <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.category")}</Label>
                    <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.price")}</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.stock_qty")}</Label>
                    <Input type="number" value={form.stock_quantity} onChange={(e) => setForm(f => ({ ...f, stock_quantity: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.discount")}</Label>
                    <Input type="number" value={form.discount_percent} onChange={(e) => setForm(f => ({ ...f, discount_percent: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.in_stock} onCheckedChange={(v) => setForm(f => ({ ...f, in_stock: v }))} />
                    <Label className="text-foreground">{t("admin.in_stock")}</Label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.allow_two_colors} onCheckedChange={(v) => setForm(f => ({ ...f, allow_two_colors: v }))} />
                    <Label className="text-foreground">{lang === "he" ? "אפשר בחירת 2 צבעים" : "Allow 2 colors"}</Label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.allow_custom_text} onCheckedChange={(v) => setForm(f => ({ ...f, allow_custom_text: v }))} />
                    <Label className="text-foreground">{lang === "he" ? "✏️ אפשר כיתוב מותאם" : "✏️ Allow custom text"}</Label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.allow_custom_image} onCheckedChange={(v) => setForm(f => ({ ...f, allow_custom_image: v }))} />
                    <Label className="text-foreground">{lang === "he" ? "🖼️ אפשר תמונה מותאמת" : "🖼️ Allow custom image"}</Label>
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-1 block">{t("admin.description")}</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
                </div>
                  <div>
                    <Label className="text-foreground mb-1 block">{t("admin.print_link")}</Label>
                    <Input value={form.print_link} onChange={(e) => setForm(f => ({ ...f, print_link: e.target.value }))} className="bg-secondary border-border" placeholder="bambustudio://... / https://..." />
                  </div>
                <div>
                  <Label className="text-foreground mb-2 block">{t("admin.image")}</Label>
                  <div className="flex items-center gap-4">
                    {form.image_url && <img src={form.image_url} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-border" />}
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border hover:border-primary/40 transition-all">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{uploading ? t("admin.uploading") : t("admin.upload_image")}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">
                    {lang === "he" ? "🖼️ גלריית תמונות נוספות (לעמוד מוצר)" : "🖼️ Additional images (product page)"}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt={`gallery ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-border" />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border hover:border-primary/40 transition-all">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{galleryUploading ? t("admin.uploading") : (lang === "he" ? "הוסף תמונה" : "Add image")}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={galleryUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setGalleryUploading(true);
                        try {
                          const ext = file.name.split(".").pop();
                          const path = `gallery/${crypto.randomUUID()}.${ext}`;
                          const { error } = await supabase.storage.from("product-images").upload(path, file);
                          if (error) throw error;
                          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                          setForm(f => ({ ...f, images: [...f.images, urlData.publicUrl] }));
                          toast.success(t("admin.image_uploaded"));
                        } catch {
                          toast.error(t("admin.image_error"));
                        } finally {
                          setGalleryUploading(false);
                          e.target.value = "";
                        }
                      }} />
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">{t("admin.colors")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorList.map((c) => (
                      <button key={c.hex} onClick={() => toggleColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${form.colors.includes(c.hex) ? "border-primary scale-110 ring-2 ring-primary/40" : "border-border"}`}
                        style={{ backgroundColor: c.hex }} title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
                  <Save className="w-4 h-4 ml-2" /> {editingId ? t("admin.save") : t("admin.add")}
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />)}</div>
            ) : !products?.length ? (
              <div className="text-center py-16 glass rounded-2xl"><p className="text-muted-foreground">{t("admin.no_products")}</p></div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-all">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-xs">{t("admin.no_image")}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground truncate">{product.name}</h3>
                        {product.discount_percent && product.discount_percent > 0 && (
                          <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold">{product.discount_percent}% {t("catalog.discount")}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ₪{product.price} · {t("admin.stock")} {product.stock_quantity} · {product.in_stock ? t("admin.available") : t("admin.out_of_stock")}
                      </p>
                      {product.print_link && (
                        <button onClick={() => openPrintLink(product.print_link)} className="text-sm text-primary underline underline-offset-4">
                          {t("admin.open_print_link")}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "suggestion" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-accent" />
                {lang === "he" ? "הצעת המודל היומית" : "Daily Model Suggestion"}
              </h2>
              <Button variant="outline" onClick={fetchDailySuggestion} disabled={suggestionLoading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${suggestionLoading ? "animate-spin" : ""}`} />
                {lang === "he" ? "הצעה חדשה" : "New Suggestion"}
              </Button>
            </div>

            {suggestionLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <span className="mr-3 text-muted-foreground">{lang === "he" ? "חושב על מודל מגניב..." : "Thinking of a cool model..."}</span>
              </div>
            )}

            {!suggestionLoading && dailySuggestion && typeof dailySuggestion === "object" && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-6 space-y-4">
                <h3 className="text-xl font-bold text-foreground">{dailySuggestion.name}</h3>
                <p className="text-foreground/80">{dailySuggestion.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-background/50 p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground">{lang === "he" ? "קטגוריה" : "Category"}</p>
                    <p className="font-semibold text-foreground">{dailySuggestion.category}</p>
                  </div>
                  <div className="rounded-xl bg-background/50 p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground">{lang === "he" ? "טווח מחיר מומלץ" : "Suggested Price"}</p>
                    <p className="font-semibold text-foreground">₪{dailySuggestion.price_min} - ₪{dailySuggestion.price_max}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-accent/10 border border-accent/20 p-4">
                  <p className="text-sm font-medium text-accent mb-1">{lang === "he" ? "למה זה יימכר טוב?" : "Why will it sell?"}</p>
                  <p className="text-foreground/80">{dailySuggestion.reason}</p>
                </div>

                {dailySuggestion.search_url && (
                  <a href={dailySuggestion.search_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary underline underline-offset-4 hover:text-primary/80">
                    <ExternalLink className="w-4 h-4" />
                    {lang === "he" ? "חפש מודלים דומים" : "Search similar models"}
                  </a>
                )}

                <Button
                  className="w-full sm:w-auto gap-2"
                  onClick={async () => {
                    try {
                      const avgPrice = Math.round(((Number(dailySuggestion.price_min) || 0) + (Number(dailySuggestion.price_max) || 0)) / 2) || 0;
                      await createProduct.mutateAsync({
                        name: dailySuggestion.name,
                        description: `${dailySuggestion.description || ""}${dailySuggestion.reason ? `\n\n${dailySuggestion.reason}` : ""}`.trim() || null,
                        price: avgPrice,
                        category: dailySuggestion.category || "general",
                        in_stock: true,
                        stock_quantity: 0,
                        discount_percent: 0,
                        colors: [],
                        image_url: null,
                        images: [],
                        print_link: dailySuggestion.search_url || null,
                        allow_two_colors: false,
                        allow_custom_text: false,
                        allow_custom_image: false,
                      } as any);
                      toast.success(lang === "he" ? "המוצר נוסף לקטלוג" : "Product added to catalog");
                    } catch {
                      toast.error(lang === "he" ? "שגיאה בהוספת המוצר" : "Error adding product");
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {lang === "he" ? "הוסף לקטלוג" : "Add to catalog"}
                </Button>
              </div>
            )}

            {!suggestionLoading && dailySuggestion && typeof dailySuggestion === "string" && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-6 whitespace-pre-wrap text-foreground">
                {dailySuggestion}
              </div>
            )}

            {!suggestionLoading && !dailySuggestion && (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{lang === "he" ? "לחץ על \"הצעה חדשה\" לקבלת רעיון למודל" : "Click 'New Suggestion' to get a model idea"}</p>
              </div>
            )}
          </div>
        )}

        {/* Sale Management Tab */}
        {activeTab === "sale" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{lang === "he" ? "ניהול מבצעים" : "Sale Management"}</h2>
            <div className="rounded-2xl border border-border bg-secondary/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={saleForm.is_active} onCheckedChange={(v) => setSaleForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-foreground">{lang === "he" ? "מבצע פעיל" : "Sale Active"}</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">{lang === "he" ? "טקסט בעברית" : "Hebrew Text"}</Label>
                  <Input value={saleForm.sale_text_he} onChange={e => setSaleForm(f => ({ ...f, sale_text_he: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-foreground">{lang === "he" ? "טקסט באנגלית" : "English Text"}</Label>
                  <Input value={saleForm.sale_text_en} onChange={e => setSaleForm(f => ({ ...f, sale_text_en: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-foreground">{lang === "he" ? "אחוז הנחה" : "Discount %"}</Label>
                  <Input type="number" value={saleForm.discount_percent} onChange={e => setSaleForm(f => ({ ...f, discount_percent: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">{lang === "he" ? "תאריך התחלה" : "Start Date"}</Label>
                  <Input type="datetime-local" value={saleForm.start_date} onChange={e => setSaleForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-foreground">{lang === "he" ? "תאריך סיום" : "End Date"}</Label>
                  <Input type="datetime-local" value={saleForm.end_date} onChange={e => setSaleForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <Button onClick={async () => {
                try {
                  await updateSale.mutateAsync({
                    is_active: saleForm.is_active,
                    sale_text_he: saleForm.sale_text_he,
                    sale_text_en: saleForm.sale_text_en,
                    discount_percent: Number(saleForm.discount_percent) || 0,
                    start_date: saleForm.start_date ? new Date(saleForm.start_date).toISOString() : null,
                    end_date: saleForm.end_date ? new Date(saleForm.end_date).toISOString() : null,
                  });
                  toast.success(lang === "he" ? "המבצע עודכן" : "Sale updated");
                } catch { toast.error(lang === "he" ? "שגיאה בעדכון" : "Update error"); }
              }}>
                <Save className="w-4 h-4 mr-2" />
                {lang === "he" ? "שמור" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{lang === "he" ? "אפליקציית תשלומים" : "Payment App"}</h2>
            <div className="rounded-2xl border border-border bg-secondary/30 p-6 space-y-4">
              <p className="text-muted-foreground text-sm">{lang === "he" ? "שים כאן את הקישור לאפליקציית התשלומים שלך כדי לגשת אליה בקלות מהפאנל" : "Put your payment app link here for easy access from the panel"}</p>
              <div>
                <Label className="text-foreground">{lang === "he" ? "קישור לאפליקציה" : "App Link"}</Label>
                <Input placeholder="https://..." value={paymentLinkInput} onChange={e => setPaymentLinkInput(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button onClick={async () => {
                  try {
                    await setAdminSetting.mutateAsync({ key: "payment_app_link", value: paymentLinkInput });
                    toast.success(lang === "he" ? "הקישור נשמר" : "Link saved");
                  } catch { toast.error(lang === "he" ? "שגיאה" : "Error"); }
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  {lang === "he" ? "שמור" : "Save"}
                </Button>
                {(paymentLink || paymentLinkInput) && (
                  <Button variant="outline" onClick={() => window.open(paymentLinkInput || paymentLink || "", "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {lang === "he" ? "פתח אפליקציה" : "Open App"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
