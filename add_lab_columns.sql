ALTER TABLE walkins 
ADD COLUMN IF NOT EXISTS lab_procedures text,
ADD COLUMN IF NOT EXISTS lab_notes text,
ADD COLUMN IF NOT EXISTS lab_type text DEFAULT 'Internal';
-- lab_cost already existed in previous context or should be added if missing
ALTER TABLE walkins ADD COLUMN IF NOT EXISTS lab_cost numeric DEFAULT 0;
