-- =========================================
-- CSO Solar — Модуль «Оренда землі»
-- Supabase Setup (Виправлено та оптимізовано)
-- =========================================

-- 1. Таблиця орендодавців
CREATE TABLE IF NOT EXISTS public.landlords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Таблиця земельних ділянок
CREATE TABLE IF NOT EXISTS public.land_plots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  settlement TEXT,
  area_hectares DECIMAL(10,4) NOT NULL DEFAULT 0,
  cadastral_number TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  boundary_json TEXT,
  payment_type TEXT NOT NULL DEFAULT 'mixed' CHECK (payment_type IN ('money', 'natural', 'mixed')),
  annual_rate_money DECIMAL(12,2) DEFAULT 0,
  annual_rate_natural TEXT,
  lease_start_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.land_plots ADD COLUMN IF NOT EXISTS boundary_json TEXT;

-- 3. Таблиця нарахувань
CREATE TABLE IF NOT EXISTS public.lease_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id UUID NOT NULL REFERENCES public.land_plots(id) ON DELETE CASCADE,
  charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  charge_type TEXT NOT NULL DEFAULT 'money' CHECK (charge_type IN ('money', 'grain', 'oil', 'sugar', 'other')),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'грн',
  description TEXT,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Таблиця оплат
CREATE TABLE IF NOT EXISTS public.lease_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id UUID NOT NULL REFERENCES public.land_plots(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL DEFAULT 'money' CHECK (payment_type IN ('money', 'grain', 'oil', 'sugar', 'other')),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'грн',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Індекси для прискорення вибірок
CREATE INDEX IF NOT EXISTS idx_land_plots_landlord ON public.land_plots(landlord_id);
CREATE INDEX IF NOT EXISTS idx_lease_charges_plot ON public.lease_charges(plot_id);
CREATE INDEX IF NOT EXISTS idx_lease_payments_plot ON public.lease_payments(plot_id);
CREATE INDEX IF NOT EXISTS idx_landlords_active ON public.landlords(active);
CREATE INDEX IF NOT EXISTS idx_land_plots_active ON public.land_plots(active);

-- 6. Очищення існуючих views для безпечного створення
DROP VIEW IF EXISTS public.landlord_balances CASCADE;
DROP VIEW IF EXISTS public.plot_balances CASCADE;

-- 7. View: Баланс по кожній ділянці
CREATE OR REPLACE VIEW public.plot_balances AS
SELECT
  p.id AS plot_id,
  p.landlord_id,
  p.address,
  p.area_hectares,
  l.full_name AS landlord_name,
  -- Гроші
  COALESCE(c.charged_money, 0) AS charged_money,
  COALESCE(pay.paid_money, 0) AS paid_money,
  COALESCE(c.charged_money, 0) - COALESCE(pay.paid_money, 0) AS debt_money,
  -- Зерно
  COALESCE(c.charged_grain, 0) AS charged_grain,
  COALESCE(pay.paid_grain, 0) AS paid_grain,
  COALESCE(c.charged_grain, 0) - COALESCE(pay.paid_grain, 0) AS debt_grain,
  -- Олія
  COALESCE(c.charged_oil, 0) AS charged_oil,
  COALESCE(pay.paid_oil, 0) AS paid_oil,
  COALESCE(c.charged_oil, 0) - COALESCE(pay.paid_oil, 0) AS debt_oil,
  -- Цукор
  COALESCE(c.charged_sugar, 0) AS charged_sugar,
  COALESCE(pay.paid_sugar, 0) AS paid_sugar,
  COALESCE(c.charged_sugar, 0) - COALESCE(pay.paid_sugar, 0) AS debt_sugar,
  -- Інше
  COALESCE(c.charged_other, 0) AS charged_other,
  COALESCE(pay.paid_other, 0) AS paid_other
FROM public.land_plots p
JOIN public.landlords l ON l.id = p.landlord_id
LEFT JOIN (
  SELECT
    plot_id,
    SUM(CASE WHEN charge_type = 'money' THEN amount ELSE 0 END) AS charged_money,
    SUM(CASE WHEN charge_type = 'grain' THEN amount ELSE 0 END) AS charged_grain,
    SUM(CASE WHEN charge_type = 'oil' THEN amount ELSE 0 END) AS charged_oil,
    SUM(CASE WHEN charge_type = 'sugar' THEN amount ELSE 0 END) AS charged_sugar,
    SUM(CASE WHEN charge_type = 'other' THEN amount ELSE 0 END) AS charged_other
  FROM public.lease_charges
  GROUP BY plot_id
) c ON c.plot_id = p.id
LEFT JOIN (
  SELECT
    plot_id,
    SUM(CASE WHEN payment_type = 'money' THEN amount ELSE 0 END) AS paid_money,
    SUM(CASE WHEN payment_type = 'grain' THEN amount ELSE 0 END) AS paid_grain,
    SUM(CASE WHEN payment_type = 'oil' THEN amount ELSE 0 END) AS paid_oil,
    SUM(CASE WHEN payment_type = 'sugar' THEN amount ELSE 0 END) AS paid_sugar,
    SUM(CASE WHEN payment_type = 'other' THEN amount ELSE 0 END) AS paid_other
  FROM public.lease_payments
  GROUP BY plot_id
) pay ON pay.plot_id = p.id
WHERE p.active = true;

-- 8. View: Зведений баланс по орендодавцю
CREATE OR REPLACE VIEW public.landlord_balances AS
SELECT
  l.id AS landlord_id,
  l.full_name,
  l.phone,
  COUNT(DISTINCT pb.plot_id) AS plot_count,
  COALESCE(SUM(pb.area_hectares), 0) AS total_area,
  COALESCE(SUM(pb.charged_money), 0) AS charged_money,
  COALESCE(SUM(pb.paid_money), 0) AS paid_money,
  COALESCE(SUM(pb.debt_money), 0) AS debt_money,
  COALESCE(SUM(pb.charged_grain), 0) AS charged_grain,
  COALESCE(SUM(pb.paid_grain), 0) AS paid_grain,
  COALESCE(SUM(pb.debt_grain), 0) AS debt_grain,
  COALESCE(SUM(pb.charged_oil), 0) AS charged_oil,
  COALESCE(SUM(pb.paid_oil), 0) AS paid_oil,
  COALESCE(SUM(pb.debt_oil), 0) AS debt_oil,
  COALESCE(SUM(pb.charged_sugar), 0) AS charged_sugar,
  COALESCE(SUM(pb.paid_sugar), 0) AS paid_sugar,
  COALESCE(SUM(pb.debt_sugar), 0) AS debt_sugar
FROM public.landlords l
LEFT JOIN public.plot_balances pb ON pb.landlord_id = l.id
WHERE l.active = true
GROUP BY l.id, l.full_name, l.phone;

-- 9. Політики безпеки RLS (з попереднім видаленням)
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for landlords" ON public.landlords;
DROP POLICY IF EXISTS "Allow all for land_plots" ON public.land_plots;
DROP POLICY IF EXISTS "Allow all for lease_charges" ON public.lease_charges;
DROP POLICY IF EXISTS "Allow all for lease_payments" ON public.lease_payments;

CREATE POLICY "Allow all for landlords" ON public.landlords FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for land_plots" ON public.land_plots FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for lease_charges" ON public.lease_charges FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for lease_payments" ON public.lease_payments FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 10. Права доступу
GRANT ALL ON TABLE public.landlords TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.land_plots TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lease_charges TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.lease_payments TO anon, authenticated, service_role;
GRANT SELECT ON public.plot_balances TO anon, authenticated, service_role;
GRANT SELECT ON public.landlord_balances TO anon, authenticated, service_role;
