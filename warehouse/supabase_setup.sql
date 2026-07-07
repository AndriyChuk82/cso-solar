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
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'issue', 'payment', 'adjustment'
    amount NUMERIC, -- null якщо ціна невідома (очікує оцінки)
    currency TEXT, -- 'UAH', 'USD', or null
    converted_amount NUMERIC, -- сума зарахування (якщо була конвертація)
    conversion_rate NUMERIC, -- курс конвертації
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending_price', 'completed'
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

