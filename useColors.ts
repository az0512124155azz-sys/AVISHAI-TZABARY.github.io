import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AvailableColor = {
  id: string;
  name: string;
  name_en: string;
  hex: string;
  sort_order: number;
  quantity: number;
  material_type: string;
};

export function useColors() {
  return useQuery({
    queryKey: ["available_colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("available_colors" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as AvailableColor[];
    },
  });
}

export function useCreateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (color: Omit<AvailableColor, "id">) => {
      const { error } = await supabase.from("available_colors" as any).insert(color as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["available_colors"] }),
  });
}

export function useUpdateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AvailableColor> & { id: string }) => {
      const { error } = await supabase.from("available_colors" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["available_colors"] }),
  });
}

export function useDeleteColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("available_colors" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["available_colors"] }),
  });
}
