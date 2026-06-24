
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  order_type text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  participants integer,
  file_url text,
  total_price numeric NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  final_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
