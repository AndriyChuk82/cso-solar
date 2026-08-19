-- Fix Security Warning: Enable RLS on public.shipment_items table
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;

-- Ensure public access policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shipment_items' 
    AND policyname = 'Enable all for anon'
  ) THEN
    CREATE POLICY "Enable all for anon" ON public.shipment_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
