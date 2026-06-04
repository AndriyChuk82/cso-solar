-- Add conversion columns to public.project_payments
ALTER TABLE public.project_payments ADD COLUMN IF NOT EXISTS is_conversion BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.project_payments ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC;
ALTER TABLE public.project_payments ADD COLUMN IF NOT EXISTS related_payment_id TEXT;
