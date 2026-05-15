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
