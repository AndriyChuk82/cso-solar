-- Safe Migration: Add note column to project_materials_ledger
-- This script only adds the new column if it does not already exist, preserving all current data.

ALTER TABLE public.project_materials_ledger ADD COLUMN IF NOT EXISTS note TEXT;
