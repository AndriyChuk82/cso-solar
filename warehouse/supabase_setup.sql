-- ПОВНЕ НАЛАШТУВАННЯ ДОСТУПУ ДЛЯ МОДУЛЯ СКЛАД (SUPABASE)
-- Цей файл містить команди для виконання в SQL Editor на supabase.com
-- Оновлено: 2026-05-15 у зв'язку зі змінами політики Data API

--------------------------------------------------------------------------------
-- 1. НАДАННЯ ДОСТУПУ ДО ТАБЛИЦЬ (GRANT)
-- Без цих команд API (supabase-js) не зможе звертатися до таблиць після жовтня 2026
--------------------------------------------------------------------------------

-- Категорії
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
-- Склади
GRANT ALL ON TABLE public.warehouses TO anon, authenticated, service_role;
-- Товари
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
-- Операції (журнал)
GRANT ALL ON TABLE public.operations TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- 2. НАДАННЯ ДОСТУПУ ДО ФУНКЦІЙ (RPC)
-- Дозволяє викликати збережені процедури для звітів
--------------------------------------------------------------------------------

-- Функція залишків на дату
GRANT EXECUTE ON FUNCTION public.get_balances_at_date TO anon, authenticated, service_role;
-- Функція порівняльного звіту
GRANT EXECUTE ON FUNCTION public.get_compare_report_data TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- 3. НАЛАШТУВАННЯ ROW LEVEL SECURITY (RLS)
-- Навіть якщо права надані через GRANT, RLS може блокувати доступ, 
-- якщо не створено відповідних політик (Policies)
--------------------------------------------------------------------------------

-- Вмикаємо RLS для всіх таблиць
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Створюємо політики повного доступу для анонімної ролі (anon)
-- Оскільки додаток використовує anon key для всіх операцій

-- Категорії
DROP POLICY IF EXISTS "Allow anon access to categories" ON public.categories;
CREATE POLICY "Allow anon access to categories" ON public.categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Склади
DROP POLICY IF EXISTS "Allow anon access to warehouses" ON public.warehouses;
CREATE POLICY "Allow anon access to warehouses" ON public.warehouses FOR ALL TO anon USING (true) WITH CHECK (true);

-- Товари
DROP POLICY IF EXISTS "Allow anon access to products" ON public.products;
CREATE POLICY "Allow anon access to products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);

-- Операції
DROP POLICY IF EXISTS "Allow anon access to operations" ON public.operations;
CREATE POLICY "Allow anon access to operations" ON public.operations FOR ALL TO anon USING (true) WITH CHECK (true);

--------------------------------------------------------------------------------
-- 💡 ПОРАДА: Якщо ви створюєте нову таблицю в схемі public, 
-- обов'язково додайте для неї аналогічний GRANT та POLICY, 
-- інакше додаток отримає помилку 42501 (Permission Denied).
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- ⚠️ ЯК ПОВЕРНУТИ ВСЕ НАЗАД (REVERT)
-- Якщо після виконання скрипта виникли проблеми з доступом, 
-- виконайте ці команди, щоб вимкнути обмеження:
--------------------------------------------------------------------------------
/*
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations DISABLE ROW LEVEL SECURITY;
*/

--------------------------------------------------------------------------------
-- 4. ТАБЛИЦІ ТА ПОЛІТИКИ ДЛЯ МОДУЛЯ «БАЛАНСИ КЛІЄНТІВ»
--------------------------------------------------------------------------------

-- Покупці (клієнти)
CREATE TABLE IF NOT EXISTS public.buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Фінансові транзакції покупців
CREATE TABLE IF NOT EXISTS public.buyer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.buyer_transactions(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'issue', 'payment', 'adjustment'
    amount NUMERIC, -- null якщо ціна невідома (очікує оцінки)
    currency TEXT, -- 'UAH', 'USD', or null
    converted_amount NUMERIC, -- сума зарахування (якщо була конвертація)
    conversion_rate NUMERIC, -- курс конвертації
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending_price', 'completed', 'reserved'
    comment TEXT,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Елементи видачі (специфікація товарів)
CREATE TABLE IF NOT EXISTS public.buyer_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.buyer_transactions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL,
    price NUMERIC, -- null якщо ціна невідома
    currency TEXT, -- 'UAH' або 'USD'
    operation_id TEXT -- зв'язок зі складським списанням в operations.id (зазвичай text)
);

-- Права доступу
GRANT ALL ON TABLE public.buyers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.buyer_transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.buyer_transaction_items TO anon, authenticated, service_role;

-- Вмикаємо RLS
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_transaction_items ENABLE ROW LEVEL SECURITY;

-- Створюємо політики повного доступу для anon
DROP POLICY IF EXISTS "Allow anon access to buyers" ON public.buyers;
CREATE POLICY "Allow anon access to buyers" ON public.buyers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to buyer_transactions" ON public.buyer_transactions;
CREATE POLICY "Allow anon access to buyer_transactions" ON public.buyer_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to buyer_transaction_items" ON public.buyer_transaction_items;
CREATE POLICY "Allow anon access to buyer_transaction_items" ON public.buyer_transaction_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Додаємо підтримку архівування накладних
ALTER TABLE public.buyer_transactions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Додаємо колонку представників до таблиці покупців (список імен через кому)
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS representatives TEXT;

-- Додаємо колонку отримувача до фінансових транзакцій (хто саме забирав дане списання)
ALTER TABLE public.buyer_transactions ADD COLUMN IF NOT EXISTS picked_up_by TEXT;
-- Додаємо підтримку журналу дій користувачів (Аудит-лог)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_email TEXT,
    user_name TEXT,
    action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'UNARCHIVE'
    entity_type TEXT NOT NULL, -- 'BUYER_TRANSACTION', 'PRODUCT', 'WAREHOUSE', 'BUYER'
    entity_id TEXT,
    entity_title TEXT,
    details JSONB
);

GRANT ALL ON TABLE public.activity_logs TO anon, authenticated, service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon access to activity_logs" ON public.activity_logs;
CREATE POLICY "Allow anon access to activity_logs" ON public.activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);

--------------------------------------------------------------------------------
-- 5. ТАБЛИЦІ ТА ПОЛІТИКИ ДЛЯ МОДУЛЯ «ВІДПРАВЛЕННЯ»
--------------------------------------------------------------------------------

-- Відправники (Від кого відправлено)
CREATE TABLE IF NOT EXISTS public.shipment_senders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Клієнти відправлень (одноразові/разові покупці)
CREATE TABLE IF NOT EXISTS public.shipment_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Відправлення
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.shipment_clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    shipping_address TEXT,
    sender_id UUID REFERENCES public.shipment_senders(id) ON DELETE SET NULL,
    sender_name TEXT,
    carrier TEXT DEFAULT 'Нова Пошта',
    ttn TEXT,
    shipment_number TEXT,
    status TEXT NOT NULL DEFAULT 'reserved', -- 'reserved', 'shipped', 'paid', 'cancelled'
    payment_method TEXT DEFAULT 'cod', -- 'cod', 'kit_group', 'cash'
    total_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'UAH', -- 'UAH', 'USD'
    advance_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    debt_amount NUMERIC DEFAULT 0,
    comment TEXT,
    user_email TEXT,
    user_name TEXT,
    shipped_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Товари відправлення
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'UAH',
    operation_id TEXT -- зв'язок із таблицею operations після підтвердження відправки
);

-- Історія оплат по відправленнях
CREATE TABLE IF NOT EXISTS public.shipment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'advance', 'final_payment'
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'UAH',
    payment_method TEXT,
    comment TEXT,
    user_email TEXT,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Початкові відправники
INSERT INTO public.shipment_senders (name) VALUES 
    ('Пастушок Петро'),
    ('Мастушок Марія'),
    ('Пастушок Юра')
ON CONFLICT (name) DO NOTHING;

-- Права доступу
GRANT ALL ON TABLE public.shipment_senders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.shipment_clients TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.shipments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.shipment_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.shipment_payments TO anon, authenticated, service_role;

-- Вмикаємо RLS
ALTER TABLE public.shipment_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_payments ENABLE ROW LEVEL SECURITY;

-- Політики повного доступу для anon
DROP POLICY IF EXISTS "Allow anon access to shipment_senders" ON public.shipment_senders;
CREATE POLICY "Allow anon access to shipment_senders" ON public.shipment_senders FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to shipment_clients" ON public.shipment_clients;
CREATE POLICY "Allow anon access to shipment_clients" ON public.shipment_clients FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to shipments" ON public.shipments;
CREATE POLICY "Allow anon access to shipments" ON public.shipments FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to shipment_items" ON public.shipment_items;
CREATE POLICY "Allow anon access to shipment_items" ON public.shipment_items FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to shipment_payments" ON public.shipment_payments;
CREATE POLICY "Allow anon access to shipment_payments" ON public.shipment_payments FOR ALL TO anon USING (true) WITH CHECK (true);
