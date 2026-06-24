import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminSetting(key: string) {
  return useQuery({
    queryKey: ["admin_settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings" as any)
        .select("*")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.value as string | null;
    },
  });
}

export function useSetAdminSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase
        .from("admin_settings" as any)
        .select("id")
        .eq("key", key)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("admin_settings" as any)
          .update({ value } as any)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings" as any)
          .insert({ key, value } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_settings"] }),
  });
}
