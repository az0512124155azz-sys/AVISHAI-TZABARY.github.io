CREATE OR REPLACE FUNCTION public.admin_list_auth_users()
RETURNS TABLE(id uuid, email text, full_name text, avatar_url text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')::text AS full_name,
    (u.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE auth.uid() IS NOT NULL
  ORDER BY u.last_sign_in_at DESC NULLS LAST, u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_auth_users() TO authenticated;

DROP POLICY IF EXISTS "Admins view all carts" ON public.user_carts;
CREATE POLICY "Admins view all carts" ON public.user_carts
  FOR SELECT TO authenticated
  USING (true);