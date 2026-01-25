-- Add payment_status and notes to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS notes text;

-- Add check constraint for payment_status
ALTER TABLE sales 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('paid', 'pending'));
