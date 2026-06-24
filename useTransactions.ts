import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string;
  month: number;
  year: number;
  created_at: string;
};

export function useTransactions(month: number, year: number) {
  return useQuery({
    queryKey: ["transactions", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_transactions")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Transaction[];
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: ["transactions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Transaction[];
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<Transaction, "id" | "created_at">) => {
      const { error } = await supabase
        .from("business_transactions")
        .insert(t as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
