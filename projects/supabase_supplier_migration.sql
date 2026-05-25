-- Database migration for Suppliers tracking in CRM

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  note text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

-- 2. Supplier Deals Table
CREATE TABLE IF NOT EXISTS public.supplier_deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  paid_sum numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  paid_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text NOT NULL DEFAULT 'Активна', -- 'Активна', 'Завершена', 'Скасована'
  note text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.supplier_deals FOR ALL USING (true) WITH CHECK (true);

-- 3. Supplier Deal Items Table (Materials they owe us)
CREATE TABLE IF NOT EXISTS public.supplier_deal_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid REFERENCES public.supplier_deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  received_quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'шт.',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_deal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.supplier_deal_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Supplier Receipts Table (Log of incoming materials)
CREATE TABLE IF NOT EXISTS public.supplier_receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid REFERENCES public.supplier_deals(id) ON DELETE CASCADE,
  received_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.supplier_receipts FOR ALL USING (true) WITH CHECK (true);

-- 5. Supplier Receipt Items Table
CREATE TABLE IF NOT EXISTS public.supplier_receipt_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id uuid REFERENCES public.supplier_receipts(id) ON DELETE CASCADE,
  deal_item_id uuid REFERENCES public.supplier_deal_items(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplier_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.supplier_receipt_items FOR ALL USING (true) WITH CHECK (true);
