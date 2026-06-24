CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review images"
ON public.review_images
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage review images"
ON public.review_images
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);