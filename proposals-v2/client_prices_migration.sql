-- ============================================================
-- МІГРАЦІЯ: Персональний прайс клієнта (для КП)
-- Виконати в Supabase SQL Editor
-- ============================================================

-- 1. Додаємо позначку "клієнт КП" до існуючої таблиці buyers
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS is_kp_client BOOLEAN NOT NULL DEFAULT false;

-- 2. Таблиця персональних цін клієнтів
CREATE TABLE IF NOT EXISTS public.client_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost_price NUMERIC,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'kp'
  source_kp_id TEXT,
  source_kp_number TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

-- 3. Права доступу
GRANT ALL ON TABLE public.client_prices TO anon, authenticated, service_role;

-- 4. Row Level Security
ALTER TABLE public.client_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon access to client_prices" ON public.client_prices;
CREATE POLICY "Allow anon access to client_prices" ON public.client_prices
  FOR ALL TO anon USING (true) WITH CHECK (true);
