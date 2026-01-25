-- Update RLS policies for daily_reports to allow public/anon access
-- This fixes the "new row violates row-level security policy" error

-- 1. Enable RLS (just in case)
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON daily_reports;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON daily_reports;
DROP POLICY IF EXISTS "Enable usage for all users" ON daily_reports;

-- 3. Create permissive policies for development
-- Allow ANYONE with the API key (anon or authenticated) to VIEW reports
CREATE POLICY "Enable read access for all users" ON daily_reports
  FOR SELECT
  USING (true);

-- Allow ANYONE with the API key (anon or authenticated) to INSERT reports
CREATE POLICY "Enable insert access for all users" ON daily_reports
  FOR INSERT
  WITH CHECK (true);

-- Allow ANYONE with the API key (anon or authenticated) to UPDATE reports
CREATE POLICY "Enable update access for all users" ON daily_reports
  FOR UPDATE
  USING (true);
