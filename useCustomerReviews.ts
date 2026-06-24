import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CustomerReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
};

export function useCustomerReviews() {
  return useQuery({
    queryKey: ["customer_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomerReview[];
    },
  });
}

export function useCreateCustomerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_name: string; rating: number; comment?: string | null; image_url?: string | null }) => {
      const { error } = await supabase.from("customer_reviews" as any).insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer_reviews"] }),
  });
}

export function useDeleteCustomerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_reviews" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer_reviews"] }),
  });
}