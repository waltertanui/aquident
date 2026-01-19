-- Inventory Requests Table
-- Tracks stock requests from lab orders and clinic that need approval

CREATE TABLE IF NOT EXISTS inventory_requests (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES internal_inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL CHECK (source IN ('internal_lab', 'external_lab', 'clinic')),
    source_reference TEXT,
    patient_name TEXT,
    requested_by TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_requests_status ON inventory_requests(status);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_item ON inventory_requests(inventory_item_id);

-- Enable Row Level Security
ALTER TABLE inventory_requests ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON inventory_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);
