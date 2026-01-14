-- Migration: Add payment columns to walkins table
-- Run this SQL in your Supabase SQL Editor or as a migration

-- Add clinic_cost column
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS clinic_cost NUMERIC DEFAULT 0;

-- Add insurance_amount column
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS insurance_amount NUMERIC DEFAULT 0;

-- Add cash_amount column
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS cash_amount NUMERIC DEFAULT 0;

-- Add balance column
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Add to_come_again column
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS to_come_again BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN walkins.clinic_cost IS 'Total clinic cost for the procedure';
COMMENT ON COLUMN walkins.insurance_amount IS 'Amount covered by insurance';
COMMENT ON COLUMN walkins.cash_amount IS 'Cash payment received from patient';
COMMENT ON COLUMN walkins.balance IS 'Remaining balance (clinic_cost - insurance - cash)';
COMMENT ON COLUMN walkins.to_come_again IS 'Whether patient needs to return for follow-up';
