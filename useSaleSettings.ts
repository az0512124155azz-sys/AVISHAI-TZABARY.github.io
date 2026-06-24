import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SaleSettings = {
  id: string;
  is_active: boolean;
  sale_text_he: string;
  sale_text_en: string;
  discount_percent: number;
  start_date: string | null;
  end_date: string | null;
};

export function useSaleSettings() {
  return useQuery({
    queryKey: ["sale_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as SaleSettings;
    },
  });
}

export function useUpdateSaleSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<Omit<SaleSettings, "id">>) => {
      const { data: existing } = await supabase
        .from("sale_settings" as any)
        .select("id")
        .limit(1)
        .single();
      if (!existing) throw new Error("No sale settings found");
      const { error } = await supabase
        .from("sale_settings" as any)
        .update(settings as any)
        .eq("id", (existing as any).id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sale_settings"] }),
  });
}
