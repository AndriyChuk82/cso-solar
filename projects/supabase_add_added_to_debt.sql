-- Add added_to_debt column to track items whose cost has been transferred to client's agreed sum (debt)
ALTER TABLE public.shipment_items ADD COLUMN IF NOT EXISTS added_to_debt BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.project_materials_ledger ADD COLUMN IF NOT EXISTS added_to_debt BOOLEAN DEFAULT FALSE NOT NULL;
