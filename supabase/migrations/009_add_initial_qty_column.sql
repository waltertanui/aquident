-- Add initial_qty column to sales_inventory table
ALTER TABLE public.sales_inventory
ADD COLUMN IF NOT EXISTS initial_qty integer DEFAULT 0;

-- Update existing rows to have initial_qty equal to current qty (as a best guess for existing data)
UPDATE public.sales_inventory
SET initial_qty = qty
WHERE initial_qty = 0;
