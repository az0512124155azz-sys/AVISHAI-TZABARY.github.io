ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.available_colors ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.available_colors ADD COLUMN IF NOT EXISTS material_type text NOT NULL DEFAULT 'PLA';