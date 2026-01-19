-- Internal Inventory Table (separate from sales_inventory)
-- Used for clinic internal supplies tracking

CREATE TABLE IF NOT EXISTS internal_inventory (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low', 'Out')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_internal_inventory_sku ON internal_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_internal_inventory_status ON internal_inventory(status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_internal_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER internal_inventory_updated_at
    BEFORE UPDATE ON internal_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_internal_inventory_updated_at();

-- Enable Row Level Security
ALTER TABLE internal_inventory ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON internal_inventory
    FOR ALL
    USING (true)
    WITH CHECK (true);
