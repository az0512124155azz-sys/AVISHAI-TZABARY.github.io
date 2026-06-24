CREATE TABLE public.user_carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_carts TO authenticated;
GRANT ALL ON public.user_carts TO service_role;
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.user_carts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);