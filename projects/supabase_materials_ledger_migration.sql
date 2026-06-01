-- Migration: Create project_materials_ledger table for express unpriced shipments
-- Safe migration: Does not touch or modify existing tables.

CREATE TABLE IF NOT EXISTS public.project_materials_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'шт.',
    price NUMERIC,
    currency TEXT NOT NULL DEFAULT 'UAH',
    status TEXT NOT NULL DEFAULT 'Видано',
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    issued_by TEXT,
    is_priced BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_materials_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy for all actions (same as other crm tables)
CREATE POLICY "Allow all actions for authenticated users" 
ON public.project_materials_ledger
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_materials_ledger_project_id ON public.project_materials_ledger(project_id);
