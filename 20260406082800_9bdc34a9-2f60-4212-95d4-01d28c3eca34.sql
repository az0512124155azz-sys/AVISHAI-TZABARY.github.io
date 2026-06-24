CREATE TABLE public.sale_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  sale_text_he text NOT NULL DEFAULT '',
  sale_text_en text NOT NULL DEFAULT '',
  discount_percent integer NOT NULL DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sale settings" ON public.sale_settings FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage sale settings" ON public.sale_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.sale_settings (is_active, sale_text_he, sale_text_en, discount_percent)
VALUES (false, 'מבצע סוף שבוע!', 'Weekend Sale!', 10);

CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage admin settings" ON public.admin_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view admin settings" ON public.admin_settings FOR SELECT TO public USING (true);