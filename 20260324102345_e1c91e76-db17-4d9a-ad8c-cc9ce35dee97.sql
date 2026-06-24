
-- Create available_colors table for admin-managed colors
CREATE TABLE public.available_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  hex text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.available_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colors viewable by everyone" ON public.available_colors FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage colors" ON public.available_colors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed with default colors
INSERT INTO public.available_colors (name, name_en, hex, sort_order) VALUES
  ('לבן', 'White', '#FFFFFF', 1),
  ('שחור', 'Black', '#1a1a1a', 2),
  ('אדום', 'Red', '#e53e3e', 3),
  ('כחול', 'Blue', '#3182ce', 4),
  ('ירוק', 'Green', '#38a169', 5),
  ('צהוב', 'Yellow', '#ecc94b', 6),
  ('כתום', 'Orange', '#ed8936', 7),
  ('ורוד', 'Pink', '#ed64a6', 8),
  ('סגול', 'Purple', '#805ad5', 9),
  ('תכלת', 'Cyan', '#4fd1c5', 10),
  ('זהב', 'Gold', '#d4a017', 11),
  ('כסף', 'Silver', '#a0aec0', 12);

-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', true);

-- Allow anyone to upload to order-files
CREATE POLICY "Anyone can upload order files" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'order-files');
CREATE POLICY "Order files are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'order-files');
