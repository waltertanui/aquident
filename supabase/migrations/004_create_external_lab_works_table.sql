-- Migration: Create external_lab_works table
-- Description: Stores external lab work orders with items and quote information

CREATE TABLE IF NOT EXISTS external_lab_works (
    id TEXT PRIMARY KEY,
    doctor_name TEXT NOT NULL DEFAULT '',
    institution TEXT NOT NULL DEFAULT '',
    expected_date DATE,
    shipping_method TEXT DEFAULT 'Courier',
    notes TEXT,
    lab_procedures TEXT,
    lab_cost NUMERIC(12, 2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    quote JSONB DEFAULT '{"subtotal": 0, "tax": 0, "total": 0, "status": "pending"}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'declined', 'inProduction', 'completed')),
    capacity_ok BOOLEAN,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_external_lab_works_status ON external_lab_works(status);
CREATE INDEX IF NOT EXISTS idx_external_lab_works_expected_date ON external_lab_works(expected_date);
CREATE INDEX IF NOT EXISTS idx_external_lab_works_created_at ON external_lab_works(created_at);

-- Add RLS policies (adjust based on your auth setup)
ALTER TABLE external_lab_works ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON external_lab_works
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_external_lab_works_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS external_lab_works_updated_at_trigger ON external_lab_works;
CREATE TRIGGER external_lab_works_updated_at_trigger
    BEFORE UPDATE ON external_lab_works
    FOR EACH ROW
    EXECUTE FUNCTION update_external_lab_works_updated_at();
