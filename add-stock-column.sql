-- Add stock column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Update existing products to have a default stock value based on in_stock
UPDATE public.products SET stock = 100 WHERE in_stock = true AND stock = 0;
UPDATE public.products SET stock = 0 WHERE in_stock = false;

-- Create trigger to keep in_stock and stock in sync
CREATE OR REPLACE FUNCTION public.sync_stock_in_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- When stock is updated, update in_stock accordingly
  IF NEW.stock IS NOT NULL THEN
    NEW.in_stock := NEW.stock > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_stock_trigger ON public.products;

CREATE TRIGGER sync_stock_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_stock_in_stock();

-- Also update the products table to allow proper stock management
COMMENT ON COLUMN public.products.stock IS 'Actual stock quantity';
COMMENT ON COLUMN public.products.in_stock IS 'Whether item is in stock (auto-synced with stock > 0)';
