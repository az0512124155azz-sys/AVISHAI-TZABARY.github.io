import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReviewImage = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export function useReviewImages() {
  return useQuery({
    queryKey: ["review_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as ReviewImage[];
    },
  });
}

export function useCreateReviewImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (img: { image_url: string; caption?: string }) => {
      const { error } = await supabase
        .from("review_images")
        .insert(img as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review_images"] }),
  });
}

export function useDeleteReviewImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("review_images")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review_images"] }),
  });
}
