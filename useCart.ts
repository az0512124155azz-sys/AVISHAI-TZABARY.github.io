import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

const KEY = "magic3d_cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("magic3d:cart"));
  void persistRemote(items);
}

let currentUserId: string | null = null;

async function persistRemote(items: CartItem[]) {
  if (!currentUserId) return;
  try {
    await supabase.from("user_carts").upsert({ user_id: currentUserId, items: items as never, updated_at: new Date().toISOString() });
  } catch {
    /* ignore */
  }
}

function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const it of [...a, ...b]) {
    const existing = map.get(it.productId);
    if (existing) existing.quantity += it.quantity;
    else map.set(it.productId, { ...it });
  }
  return Array.from(map.values());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(read);

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("storage", sync);
    window.addEventListener("magic3d:cart", sync);

    // Initial: load user + remote cart, merge with local
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null;
      currentUserId = uid;
      if (!uid) return;
      const { data: row } = await supabase.from("user_carts").select("items").eq("user_id", uid).maybeSingle();
      const remote = (row?.items as unknown as CartItem[] | undefined) ?? [];
      const local = read();
      const merged = mergeCarts(local, remote);
      localStorage.setItem(KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event("magic3d:cart"));
      void persistRemote(merged);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const uid = session?.user?.id ?? null;
      const wasAnon = currentUserId === null;
      currentUserId = uid;
      if (uid && wasAnon) {
        const { data: row } = await supabase.from("user_carts").select("items").eq("user_id", uid).maybeSingle();
        const remote = (row?.items as unknown as CartItem[] | undefined) ?? [];
        const local = read();
        const merged = mergeCarts(local, remote);
        localStorage.setItem(KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event("magic3d:cart"));
        void persistRemote(merged);
      }
      if (!uid) {
        // Signed out: clear local cart so next user doesn't inherit
        localStorage.setItem(KEY, "[]");
        window.dispatchEvent(new Event("magic3d:cart"));
      }
    });

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("magic3d:cart", sync);
      authSub.subscription.unsubscribe();
    };
  }, []);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const current = read();
    const existing = current.find((i) => i.productId === item.productId);
    const next = existing
      ? current.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i))
      : [...current, { ...item, quantity: qty }];
    write(next);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = read();
    const next = quantity <= 0
      ? current.filter((i) => i.productId !== productId)
      : current.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    write(next);
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, add, setQuantity, remove, clear, count, total };
}