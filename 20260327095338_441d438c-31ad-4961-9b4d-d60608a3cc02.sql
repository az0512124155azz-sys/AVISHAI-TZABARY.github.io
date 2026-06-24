ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_confirmation_note text,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS green_invoice_document_id text,
ADD COLUMN IF NOT EXISTS green_invoice_url text,
ADD COLUMN IF NOT EXISTS green_invoice_status text;