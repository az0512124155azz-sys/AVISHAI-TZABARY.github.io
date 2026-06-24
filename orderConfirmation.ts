import { supabase } from "@/integrations/supabase/client";

type ConfirmableOrder = {
  id: string;
  confirmation_status?: string | null;
  items?: any[] | null;
};

type StockProduct = {
  id: string;
  stock_quantity?: number | null;
};

export async function confirmOrderAndDeductStock({
  order,
  products,
  note,
}: {
  order: ConfirmableOrder;
  products?: StockProduct[];
  note?: string | null;
}) {
  if (order.confirmation_status !== "confirmed") {
    const items = Array.isArray(order.items) ? order.items : [];
    const runningStock = new Map<string, number>();
    const productIds = [...new Set(items.map((item) => item.productId || item.product_id).filter(Boolean))];
    let stockProducts = products ?? [];

    if (productIds.length > 0 && stockProducts.length === 0) {
      const { data, error } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .in("id", productIds);
      if (error) throw error;
      stockProducts = data ?? [];
    }

    for (const item of items) {
      const productId = item.productId || item.product_id;
      if (!productId) continue;

      const product = stockProducts.find((p) => p.id === productId);
      if (!product) continue;

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const currentStock = runningStock.get(productId) ?? Number(product.stock_quantity ?? 0);
      const nextStock = Math.max(0, currentStock - quantity);
      runningStock.set(productId, nextStock);
    }

    for (const [productId, stockQuantity] of runningStock.entries()) {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: stockQuantity, in_stock: stockQuantity > 0 } as any)
        .eq("id", productId);
      if (error) throw error;
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      confirmation_status: "confirmed",
      admin_confirmation_note: note || null,
      confirmed_at: new Date().toISOString(),
    } as any)
    .eq("id", order.id);

  if (error) throw error;
}