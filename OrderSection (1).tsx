import { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useColors } from "@/hooks/useColors";
import { useCreateOrder } from "@/hooks/useOrders";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Upload, PartyPopper, Wrench, Send, Plus, Minus, X, FileUp, MapPin, Percent } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap = { ShoppingCart, Upload, PartyPopper, Wrench };

type CartItem = { productId: string; productName: string; quantity: number; colors: string[]; orderContext: "catalog" | "birthday_catalog"; customText?: string; customImageUrl?: string };

export function OrderSection() {
  const { data: products } = useProducts();
  const { data: colors } = useColors();
  const { t, lang, dir } = useLanguage();
  const createOrder = useCreateOrder();

  const orderTypes = [
    { id: "catalog", label: t("type.catalog"), icon: "ShoppingCart", desc: t("type.catalog_desc") },
    { id: "custom", label: t("type.custom"), icon: "Upload", desc: t("type.custom_desc") },
    { id: "birthday", label: t("type.birthday"), icon: "PartyPopper", desc: t("type.birthday_desc") },
    { id: "repair", label: t("type.repair"), icon: "Wrench", desc: t("type.repair_desc") },
  ] as const;

  const [orderType, setOrderType] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [customMaterial, setCustomMaterial] = useState<string>("");
  const [participants, setParticipants] = useState(10);
  const [birthdaySubType, setBirthdaySubType] = useState<"catalog" | "custom">("catalog");
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>("");
  const [birthdayFileUrl, setBirthdayFileUrl] = useState<string | null>(null);
  const [birthdayFileName, setBirthdayFileName] = useState<string>("");
  const [repairImageUrl, setRepairImageUrl] = useState<string | null>(null);
  const [repairImageName, setRepairImageName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [repairUploading, setRepairUploading] = useState(false);
  const [birthdayUploading, setBirthdayUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const repairFileRef = useRef<HTMLInputElement>(null);
  const birthdayFileRef = useRef<HTMLInputElement>(null);

  const isBirthdayMode = orderType === "birthday" && birthdaySubType === "catalog";
  const BIRTHDAY_DISCOUNT = 5;
  const isBirthdayCartItem = (item: CartItem) => item.orderContext === "birthday_catalog";
  const catalogItems = cart.filter((item) => !isBirthdayCartItem(item));
  const birthdayCatalogItems = cart.filter(isBirthdayCartItem);
  const hasCustomOrder = orderType === "custom" || !!customFileUrl || customColors.length > 0;
  const hasBirthdayCustomOrder = (orderType === "birthday" && birthdaySubType === "custom") || !!birthdayFileUrl;
  const hasRepairOrder = orderType === "repair" || !!repairImageUrl;
  const hasOrderContent = () => catalogItems.length > 0 || birthdayCatalogItems.length > 0 || hasCustomOrder || hasBirthdayCustomOrder || hasRepairOrder;

  const addToCart = (productId: string, productName: string) => {
    const orderContext: CartItem["orderContext"] = isBirthdayMode ? "birthday_catalog" : "catalog";
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.orderContext === orderContext);
      if (existing) {
        if (isBirthdayMode) {
          toast.info(`${productName} ${t("order.added")}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === productId && i.orderContext === orderContext ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, productName, quantity: 1, colors: [], orderContext }];
    });
    toast.success(`${productName} ${t("order.added")}`);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: item.quantity + delta } : item)).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCartItemColor = (index: number, hex: string) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const product = products?.find(p => p.id === item.productId);
        const maxColors = (product as any)?.allow_two_colors ? 2 : 1;
        const hasColor = item.colors.includes(hex);
        if (hasColor) return { ...item, colors: item.colors.filter((c) => c !== hex) };
        if (item.colors.length >= maxColors) return { ...item, colors: [...item.colors.slice(1), hex] };
        return { ...item, colors: [...item.colors, hex] };
      })
    );
  };

  const toggleCustomColor = (hex: string) => {
    setCustomColors((prev) => {
      const has = prev.includes(hex);
      if (has) return prev.filter((c) => c !== hex);
      if (prev.length >= 2) return [prev[1], hex];
      return [...prev, hex];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("order-files").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("order-files").getPublicUrl(path);
      setCustomFileUrl(urlData.publicUrl);
      setCustomFileName(file.name);
      toast.success(t("order.file_uploaded"));
    } catch {
      toast.error(t("order.file_error"));
    } finally {
      setUploading(false);
    }
  };

  const handleRepairImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRepairUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("order-files").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("order-files").getPublicUrl(path);
      setRepairImageUrl(urlData.publicUrl);
      setRepairImageName(file.name);
      toast.success(t("order.photo_uploaded"));
    } catch {
      toast.error(t("order.file_error"));
    } finally {
      setRepairUploading(false);
    }
  };

  const handleBirthdayFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBirthdayUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("order-files").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("order-files").getPublicUrl(path);
      setBirthdayFileUrl(urlData.publicUrl);
      setBirthdayFileName(file.name);
      toast.success(t("order.file_uploaded"));
    } catch {
      toast.error(t("order.file_error"));
    } finally {
      setBirthdayUploading(false);
    }
  };

  const getColorName = (hex: string) => {
    const c = colors?.find((c) => c.hex === hex);
    return c ? (lang === "he" ? c.name : c.name_en) : hex;
  };

  const getEstimatedTotal = () => {
    let total = 0;
    cart.forEach((item) => {
      const product = products?.find((p) => p.id === item.productId);
      if (product) {
        const price = product.discount_percent
          ? product.price * (1 - product.discount_percent / 100)
          : product.price;
        if (isBirthdayCartItem(item)) {
          total += price * participants * (1 - BIRTHDAY_DISCOUNT / 100);
        } else {
          total += price * item.quantity;
        }
      }
    });
    return Math.round(total * 100) / 100;
  };

  const buildWhatsAppMessage = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    let msg = `🪄 ${lang === "he" ? "הזמנה חדשה מ-Magic 3D" : "New order from Magic 3D"}\n`;
    msg += `📅 ${t("order.date_label")}: ${dateStr}\n\n`;
    msg += `👤 ${lang === "he" ? "שם" : "Name"}: ${name}\n📱 ${lang === "he" ? "טלפון" : "Phone"}: ${phone}\n\n`;

    if (catalogItems.length > 0) {
      msg += `📦 ${t("type.catalog")}\n\n`;
      catalogItems.forEach((item) => {
        msg += `• ${item.productName} x${item.quantity}`;
        if (item.colors.length) msg += ` (${item.colors.map(getColorName).join(", ")})`;
        if (item.customText) msg += `\n  ✏️ ${lang === "he" ? "כיתוב" : "Text"}: ${item.customText}`;
        if (item.customImageUrl) msg += `\n  🖼️ ${lang === "he" ? "תמונה" : "Image"}: ${item.customImageUrl}`;
        msg += `\n`;
      });
      msg += `\n`;
    }

    if (hasCustomOrder) {
      msg += `🎨 ${t("type.custom")}\n`;
      if (customMaterial) msg += `${lang === "he" ? "חומר" : "Material"}: ${customMaterial}\n`;
      if (customColors.length) msg += `${t("order.color")}: ${customColors.map(getColorName).join(", ")}\n`;
      if (customFileUrl) msg += `📎 ${lang === "he" ? "קובץ" : "File"}: ${customFileName}\n🔗 ${customFileUrl}\n`;
      msg += `\n`;
    }

    if (birthdayCatalogItems.length > 0 || hasBirthdayCustomOrder) {
      msg += `🎉 ${t("type.birthday")} (${birthdaySubType === "catalog" ? t("order.birthday_catalog") : t("order.birthday_custom")})\n`;
      msg += `👥 ${t("order.participants")}: ${participants}\n`;
      msg += `🏷️ ${t("order.birthday_discount_note")}\n`;
      if (birthdayCatalogItems.length > 0) {
        msg += `\n📦 ${t("order.products")} (${t("order.per_participant")}):\n`;
        birthdayCatalogItems.forEach((item) => {
          const product = products?.find((p) => p.id === item.productId);
          const unitPrice = product
            ? product.discount_percent ? product.price * (1 - product.discount_percent / 100) : product.price
            : 0;
          msg += `• ${item.productName}`;
          if (item.colors.length) msg += ` (${item.colors.map(getColorName).join(", ")})`;
          msg += ` — ₪${unitPrice} × ${participants} = ₪${Math.round(unitPrice * participants * 100) / 100}`;
          msg += `\n`;
        });
      }
      if (hasBirthdayCustomOrder) {
        if (birthdayFileUrl) msg += `📎 ${lang === "he" ? "קובץ" : "File"}: ${birthdayFileName}\n🔗 ${birthdayFileUrl}\n`;
      }
      msg += `\n`;
    }

    if (hasRepairOrder) {
      msg += `🔧 ${t("type.repair")}\n`;
      if (repairImageUrl) msg += `📷 ${t("order.upload_photo")}: ${repairImageName}\n🔗 ${repairImageUrl}\n`;
    }

    const total = getEstimatedTotal();
    if (total > 0) {
      msg += `\n💰 ${t("order.estimated_total")}: ₪${total}`;
      if (birthdayCatalogItems.length > 0 || hasBirthdayCustomOrder) msg += ` (${BIRTHDAY_DISCOUNT}% ${t("catalog.discount")} ${t("type.birthday")})`;
    }
    if (notes) msg += `\n📝 ${t("order.notes")}: ${notes}`;
    msg += `\n\n📍 ${t("order.pickup_notice")}`;
    return msg;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(t("order.fill_required"));
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const phoneValid = /^(\+972|0)5\d{8}$/.test(cleanPhone);
    if (!phoneValid) {
      toast.error(lang === "he" ? "מספר טלפון לא תקין (לדוגמה: 0501234567)" : "Invalid phone number (e.g. 0501234567)");
      return;
    }
    if (!hasOrderContent()) {
      toast.error(t("order.add_products"));
      return;
    }

    const total = getEstimatedTotal();
    const orderParts = [
      catalogItems.length > 0 ? "catalog" : null,
      hasCustomOrder ? "custom" : null,
      birthdayCatalogItems.length > 0 ? "birthday_catalog" : null,
      hasBirthdayCustomOrder ? "birthday_custom" : null,
      hasRepairOrder ? "repair" : null,
    ].filter(Boolean) as string[];
    const fileUrl = [customFileUrl, birthdayFileUrl, repairImageUrl].filter(Boolean).join("\n") || null;
    const orderItems = [
      ...catalogItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        orderContext: item.orderContext,
        colors: item.colors.map((hex) => ({ hex, name: getColorName(hex) })),
        customText: item.customText,
        customImageUrl: item.customImageUrl,
      })),
      ...birthdayCatalogItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: participants,
        orderContext: item.orderContext,
        colors: item.colors.map((hex) => ({ hex, name: getColorName(hex) })),
        customText: item.customText,
        customImageUrl: item.customImageUrl,
      })),
      ...(hasCustomOrder ? [{ productName: t("type.custom"), quantity: 1, orderContext: "custom", material: customMaterial || null, colors: customColors.map((hex) => ({ hex, name: getColorName(hex) })), fileUrl: customFileUrl, fileName: customFileName }] : []),
      ...(hasBirthdayCustomOrder ? [{ productName: t("type.birthday"), quantity: participants, orderContext: "birthday_custom", colors: [], fileUrl: birthdayFileUrl, fileName: birthdayFileName }] : []),
      ...(hasRepairOrder ? [{ productName: t("type.repair"), quantity: 1, orderContext: "repair", colors: [], fileUrl: repairImageUrl, fileName: repairImageName }] : []),
    ];
    try {
      await createOrder.mutateAsync({
        customer_name: name,
        customer_phone: phone,
        order_type: orderParts.join(" + "),
        items: orderItems,
        notes: notes || null,
        participants: birthdayCatalogItems.length > 0 || hasBirthdayCustomOrder ? participants : null,
        file_url: fileUrl,
        total_price: total,
        discount_percent: birthdayCatalogItems.length > 0 || hasBirthdayCustomOrder ? BIRTHDAY_DISCOUNT : 0,
        final_price: total,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("order.save_failed"));
      return;
    }

    const message = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    toast.success(t("order.sent"));
  };

  const availableProducts = products?.filter((p) => p.in_stock) ?? [];
  const colorList = colors ?? [];
  const availableColorList = colorList.filter((c) => (c.quantity ?? 0) > 0);
  const materialsAvailable = Array.from(new Set(availableColorList.map((c) => c.material_type || "PLA")));
  const customColorOptions = customMaterial
    ? colorList.filter((c) => (c.material_type || "PLA") === customMaterial)
    : [];
  const isColorOutOfStock = (hex: string) => {
    const c = colorList.find((cc) => cc.hex === hex);
    return !c || (c.quantity ?? 0) <= 0;
  };
  const visibleCartEntries = cart
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (isBirthdayMode ? isBirthdayCartItem(item) : !isBirthdayCartItem(item)));

  return (
    <section id="order" className="py-20 px-4" dir={dir}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black font-heading gradient-text inline-block mb-4">{t("order.title")}</h2>
          <p className="text-muted-foreground text-lg">{t("order.subtitle")}</p>
        </div>

        {/* Pickup notice */}
        <div className="flex items-center justify-center gap-2 mb-8 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{t("order.pickup_notice")}</span>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 space-y-8">
          {/* Personal info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground mb-2 block">{t("order.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("order.name_placeholder")} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-foreground mb-2 block">{t("order.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("order.phone_placeholder")} className="bg-secondary border-border" />
            </div>
          </div>

          {/* Order type with descriptions */}
          <div>
            <Label className="text-foreground mb-3 block">{t("order.type")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {orderTypes.map((type) => {
                const Icon = iconMap[type.icon as keyof typeof iconMap];
                return (
                  <button
                    key={type.id}
                    onClick={() => setOrderType(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      orderType === type.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-secondary hover:border-primary/40"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${orderType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${orderType === type.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {type.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{type.desc}</span>
                    {type.id === "birthday" && (
                      <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                        <Percent className="w-3 h-3" /> {t("order.birthday_discount_note")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birthday sub-type selector */}
          {orderType === "birthday" && (
            <div className="space-y-4">
              <Label className="text-foreground block">{t("order.birthday_type")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["catalog", "custom"] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setBirthdaySubType(sub)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      birthdaySubType === sub
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-secondary hover:border-primary/40"
                    }`}
                  >
                    {sub === "catalog" ? <ShoppingCart className={`w-5 h-5 ${birthdaySubType === sub ? "text-primary" : "text-muted-foreground"}`} /> : <Upload className={`w-5 h-5 ${birthdaySubType === sub ? "text-primary" : "text-muted-foreground"}`} />}
                    <span className={`text-sm font-medium ${birthdaySubType === sub ? "text-foreground" : "text-muted-foreground"}`}>
                      {sub === "catalog" ? t("order.birthday_catalog") : t("order.birthday_custom")}
                    </span>
                  </button>
                ))}
              </div>
              {birthdaySubType === "custom" && (
                <p className="text-sm text-muted-foreground">{t("order.birthday_custom_desc")}</p>
              )}
            </div>
          )}

          {/* Color picker for custom model - per-item style (up to 2) */}
          {orderType === "custom" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                {lang === "he"
                  ? "💬 נציג יצור איתך קשר בנוגע למחיר לאחר שליחת ההזמנה"
                  : "💬 A representative will contact you regarding pricing after submitting the order"}
              </div>
              <div className="space-y-2">
                <Label className="text-foreground block">
                  {lang === "he" ? "בחר חומר" : "Choose material"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {materialsAvailable.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setCustomMaterial(m); setCustomColors([]); }}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        customMaterial === m
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  {materialsAvailable.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {lang === "he" ? "אין כרגע חומרים במלאי" : "No materials in stock"}
                    </p>
                  )}
                </div>
              </div>
              {customMaterial && (
                <div className="space-y-2">
                  <Label className="text-foreground block">
                    {t("order.choose_colors")} ({customColors.length}/2)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {customColorOptions.map((c) => {
                      const out = (c.quantity ?? 0) <= 0;
                      return (
                        <button
                          key={c.hex}
                          onClick={() => !out && toggleCustomColor(c.hex)}
                          disabled={out}
                          className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                            out
                              ? "border-border opacity-30 cursor-not-allowed"
                              : customColors.includes(c.hex)
                              ? "border-primary scale-110 ring-2 ring-primary/40"
                              : "border-border hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={`${lang === "he" ? c.name : c.name_en}${out ? ` (${lang === "he" ? "אזל מהמלאי" : "out of stock"})` : ""}`}
                        >
                          {out && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-destructive">✕</span>}
                        </button>
                      );
                    })}
                  </div>
                  {customColors.length > 0 && (
                    <p className="text-sm text-muted-foreground">{t("order.color_selected")} {customColors.map(getColorName).join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Catalog product selection */}
          {(orderType === "catalog" || (orderType === "birthday" && birthdaySubType === "catalog")) && (
            <div className="space-y-4">
              <Label className="text-foreground block mt-4">{t("order.products")}</Label>
              {availableProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("order.no_products")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product.id, product.name)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary hover:border-primary/40 transition-all text-right"
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-accent font-bold text-sm">₪{product.price}</p>
                      </div>
                      <Plus className="w-5 h-5 text-primary" />
                    </button>
                  ))}
                </div>
              )}

              {visibleCartEntries.length > 0 && (
                <div className="space-y-3 mt-4">
                  <Label className="text-foreground block">{t("order.cart")}</Label>
                  {visibleCartEntries.map(({ item, index: cartIndex }) => (
                    <div key={`${item.orderContext}-${item.productId}`} className="p-3 rounded-xl bg-secondary border border-border space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-foreground">
                          {item.productName}
                          {isBirthdayMode && <span className="text-muted-foreground"> × {participants} {t("order.per_participant")}</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          {!isBirthdayMode && (
                            <>
                              <button onClick={() => updateQuantity(cartIndex, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(cartIndex, 1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20">
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          <button onClick={() => removeFromCart(cartIndex)} className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center hover:bg-destructive/40">
                            <X className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {/* Per-item color selector for ALL catalog modes */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("order.choose_colors")} ({item.colors.length}/2)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {colorList.map((c) => {
                            const out = (c.quantity ?? 0) <= 0;
                            return (
                              <button
                                key={c.hex}
                                onClick={() => !out && toggleCartItemColor(cartIndex, c.hex)}
                                disabled={out}
                                className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                                  out
                                    ? "border-border opacity-30 cursor-not-allowed"
                                    : item.colors.includes(c.hex)
                                    ? "border-primary scale-110 ring-2 ring-primary/40"
                                    : "border-border hover:scale-105"
                                }`}
                                style={{ backgroundColor: c.hex }}
                                title={`${lang === "he" ? c.name : c.name_en}${out ? ` (${lang === "he" ? "אזל מהמלאי" : "out of stock"})` : ""}`}
                              >
                                {out && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-destructive">✕</span>}
                              </button>
                            );
                          })}
                        </div>
                        {item.colors.length > 0 && (
                          <p className="text-xs text-muted-foreground">{t("order.color_selected")} {item.colors.map(getColorName).join(", ")}</p>
                        )}
                      </div>
                      {/* Custom text input */}
                      {(() => {
                        const product = products?.find(p => p.id === item.productId);
                        const allowText = (product as any)?.allow_custom_text;
                        const allowImage = (product as any)?.allow_custom_image;
                        return (
                          <>
                            {allowText && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">✏️ {lang === "he" ? "כיתוב מותאם אישית" : "Custom text"}</p>
                                <Input
                                  value={item.customText || ""}
                                  onChange={(e) => setCart(prev => prev.map((ci, idx) => idx === cartIndex ? { ...ci, customText: e.target.value } : ci))}
                                  placeholder={lang === "he" ? "הכנס טקסט..." : "Enter text..."}
                                  className="bg-muted border-border h-8 text-sm"
                                />
                              </div>
                            )}
                            {allowImage && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">🖼️ {lang === "he" ? "תמונה מותאמת אישית" : "Custom image"}</p>
                                {item.customImageUrl ? (
                                  <div className="flex items-center gap-2">
                                    <img src={item.customImageUrl} alt="Custom" className="w-10 h-10 rounded-lg object-cover border border-border" />
                                    <button onClick={() => setCart(prev => prev.map((ci, idx) => idx === cartIndex ? { ...ci, customImageUrl: undefined } : ci))} className="text-xs text-destructive underline">
                                      {lang === "he" ? "הסר" : "Remove"}
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border hover:border-primary/40 transition-all text-xs">
                                    <Upload className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-foreground">{lang === "he" ? "העלה תמונה" : "Upload image"}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const ext = file.name.split(".").pop();
                                        const path = `custom/${crypto.randomUUID()}.${ext}`;
                                        const { error } = await supabase.storage.from("order-files").upload(path, file);
                                        if (error) throw error;
                                        const { data: urlData } = supabase.storage.from("order-files").getPublicUrl(path);
                                         setCart(prev => prev.map((ci, idx) => idx === cartIndex ? { ...ci, customImageUrl: urlData.publicUrl } : ci));
                                        toast.success(lang === "he" ? "תמונה הועלתה" : "Image uploaded");
                                      } catch {
                                        toast.error(lang === "he" ? "שגיאה בהעלאה" : "Upload error");
                                      }
                                    }} />
                                  </label>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom model - file upload */}
          {orderType === "custom" && (
            <div>
              <Label className="text-foreground mb-2 block">{t("order.upload_file")}</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs,.fbx,.gcode"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border bg-secondary hover:border-primary/40 transition-all"
              >
                <FileUp className="w-8 h-8 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {uploading ? t("order.uploading") : customFileName ? customFileName : t("order.click_upload")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("order.file_formats")}</p>
                </div>
              </button>
              {customFileUrl && (
                <p className="text-sm text-accent mt-2">✓ {t("order.file_uploaded")}</p>
              )}
            </div>
          )}

          {/* Birthday */}
          {orderType === "birthday" && (
            <div className="space-y-4">
              <Label className="text-foreground block">{t("order.participants")}</Label>
              <div className="flex items-center gap-4">
                <button onClick={() => setParticipants(Math.max(1, participants - 1))} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-all">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-black gradient-text w-16 text-center">{participants}</span>
                <button onClick={() => setParticipants(participants + 1)} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{t("order.birthday_desc")}</p>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Percent className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">{t("order.birthday_discount_note")}</span>
              </div>

              {/* Custom birthday file upload */}
              {birthdaySubType === "custom" && (
                <div>
                  <Label className="text-foreground mb-2 block">{t("order.birthday_upload")}</Label>
                  <input
                    ref={birthdayFileRef}
                    type="file"
                    accept=".stl,.obj,.3mf,.step,.stp,.iges,.igs,.fbx,.gcode,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleBirthdayFileUpload}
                    disabled={birthdayUploading}
                  />
                  <button
                    onClick={() => birthdayFileRef.current?.click()}
                    disabled={birthdayUploading}
                    className="w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border bg-secondary hover:border-primary/40 transition-all"
                  >
                    <FileUp className="w-8 h-8 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {birthdayUploading ? t("order.uploading") : birthdayFileName ? birthdayFileName : t("order.click_upload")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("order.birthday_upload_formats")}</p>
                    </div>
                  </button>
                  {birthdayFileUrl && (
                    <p className="text-sm text-accent mt-2">✓ {t("order.file_uploaded")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Repair */}
          {orderType === "repair" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">{t("order.repair_desc")}</p>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                {lang === "he"
                  ? "💬 נציג יצור איתך קשר בנוגע למחיר לאחר שליחת ההזמנה"
                  : "💬 A representative will contact you regarding pricing after submitting the order"}
              </div>

              <div>
                <Label className="text-foreground mb-2 block">{t("order.upload_photo")}</Label>
                <input
                  ref={repairFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleRepairImageUpload}
                  disabled={repairUploading}
                />
                <button
                  onClick={() => repairFileRef.current?.click()}
                  disabled={repairUploading}
                  className="w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border bg-secondary hover:border-primary/40 transition-all"
                >
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {repairUploading ? t("order.uploading") : repairImageName ? repairImageName : t("order.upload_photo")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("order.photo_formats")}</p>
                  </div>
                </button>
                {repairImageUrl && <p className="text-sm text-accent mt-2">✓ {t("order.photo_uploaded")}</p>}
              </div>
            </div>
          )}

          {/* Order Summary */}
          {hasOrderContent() && (
            <div className="rounded-xl border border-border bg-secondary p-4 space-y-2">
              <Label className="text-foreground block font-bold">{t("order.summary")}</Label>
              {cart.map((item, i) => {
                const product = products?.find((p) => p.id === item.productId);
                const unitPrice = product
                  ? product.discount_percent
                    ? product.price * (1 - product.discount_percent / 100)
                    : product.price
                  : 0;
                return (
                  <div key={i} className="flex justify-between text-sm text-foreground">
                    <span>
                      {item.productName}
                      {item.colors.length > 0 && ` (${item.colors.map(getColorName).join(", ")})`}
                      {isBirthdayCartItem(item) ? ` × ${participants}` : ` x${item.quantity}`}
                    </span>
                    <span className="font-bold">₪{Math.round(unitPrice * (isBirthdayCartItem(item) ? participants * (1 - BIRTHDAY_DISCOUNT / 100) : item.quantity) * 100) / 100}</span>
                  </div>
                );
              })}
              {hasCustomOrder && (
                <div className="flex justify-between text-sm text-foreground">
                  <span>{t("type.custom")}</span>
                  <span className="font-bold">{customFileUrl ? "✓" : "—"}</span>
                </div>
              )}
              {hasBirthdayCustomOrder && (
                <div className="flex justify-between text-sm text-foreground">
                  <span>{t("type.birthday")} — {t("order.birthday_custom")} × {participants}</span>
                  <span className="font-bold">{birthdayFileUrl ? "✓" : "—"}</span>
                </div>
              )}
              {hasRepairOrder && (
                <div className="flex justify-between text-sm text-foreground">
                  <span>{t("type.repair")}</span>
                  <span className="font-bold">{repairImageUrl ? "✓" : "—"}</span>
                </div>
              )}
              {(birthdayCatalogItems.length > 0 || hasBirthdayCustomOrder) && (
                <div className="flex justify-between text-sm text-accent">
                  <span>{t("order.birthday_discount_note")}</span>
                  <span>-{BIRTHDAY_DISCOUNT}%</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between text-foreground font-bold">
                <span>{t("order.estimated_total")}</span>
                <span className="text-primary text-lg">₪{getEstimatedTotal()}</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-foreground mb-2 block">{t("order.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("order.notes_placeholder")}
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold text-lg py-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02]"
          >
            <Send className="w-5 h-5 ml-2" />
            {t("order.submit")}
          </Button>
        </div>
      </div>
    </section>
  );
}
