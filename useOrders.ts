import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: any[];
  notes: string | null;
  participants: number | null;
  file_url: string | null;
  total_price: number;
  discount_percent: number;
  final_price: number;
  created_at: string;
  confirmation_status: string;
  admin_confirmation_note: string | null;
  confirmed_at: string | null;
  green_invoice_document_id: string | null;
  green_invoice_url: string | null;
  green_invoice_status: string | null;
};

export function useOrders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("orders-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => queryClient.invalidateQueries({ queryKey: ["orders"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Order[];
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateOrderDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, discount_percent, final_price }: { id: string; discount_percent: number; final_price: number }) => {
      const { error } = await supabase
        .from("orders")
        .update({ discount_percent, final_price } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSetOrderPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, total_price }: { id: string; total_price: number }) => {
      const { error } = await supabase
        .from("orders")
        .update({ total_price, final_price: total_price, discount_percent: 0 } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<Order, "id" | "created_at" | "confirmation_status" | "admin_confirmation_note" | "confirmed_at" | "green_invoice_document_id" | "green_invoice_url" | "green_invoice_status">) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user_id = session?.user?.id ?? null;
      const { error } = await supabase
        .from("orders")
        .insert({ ...order, user_id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
