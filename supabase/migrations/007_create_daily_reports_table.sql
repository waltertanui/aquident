-- Migration: Create daily_reports table
-- Purpose: Store daily reports for different departments

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL CHECK (department IN ('assistant', 'lab', 'finance')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying by date and department
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_dept ON daily_reports(department);
