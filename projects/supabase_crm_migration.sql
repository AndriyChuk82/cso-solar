-- Створення таблиці Клієнтів
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  type text DEFAULT 'B2C',
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Додавання зв'язку клієнта до проєктів
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Створення таблиці Відвантажень (Логістика)
CREATE TABLE IF NOT EXISTS public.project_shipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL, 
  date date NOT NULL DEFAULT CURRENT_DATE,
  carrier text,
  tracking_number text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.project_shipments FOR ALL USING (true) WITH CHECK (true);

-- Створення таблиці товарів у відвантаженні
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid REFERENCES public.project_shipments(id) ON DELETE CASCADE,
  project_item_id text NOT NULL, 
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.shipment_items FOR ALL USING (true) WITH CHECK (true);

-- Додавання ознаки послуги до позицій проєкту
ALTER TABLE public.project_items ADD COLUMN IF NOT EXISTS is_service boolean DEFAULT false;

-- Додавання колонки коментаря до клієнтів
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS note text;

-- Створення таблиці Логів (Audit Trail)
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text,
  client_id uuid,
  action_type text NOT NULL,
  details text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON public.crm_audit_logs FOR ALL USING (true) WITH CHECK (true);
