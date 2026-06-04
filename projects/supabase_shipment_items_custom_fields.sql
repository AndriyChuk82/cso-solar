-- Safe Migration: Add custom fields to shipment_items for overriding estimate values
-- This script preserves all current data and adds the fields if they do not exist.

ALTER TABLE public.shipment_items ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE public.shipment_items ADD COLUMN IF NOT EXISTS custom_price NUMERIC;
ALTER TABLE public.shipment_items ADD COLUMN IF NOT EXISTS custom_currency TEXT;
ALTER TABLE public.shipment_items ADD COLUMN IF NOT EXISTS note TEXT;
