-- Create extension if it doesn't exist to support UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create daily_reports table
-- This table stores all types of daily reports (Assistant, Lab, Finance)
-- The 'content' column is JSONB to flexibly store different report structures
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL CHECK (department IN ('assistant', 'lab', 'finance')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Associate indices for common query patterns
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_dept ON daily_reports(department);

-- Enable Row Level Security (RLS) is recommended
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all reports (Adjust as needed)
CREATE POLICY "Enable read access for authenticated users" ON daily_reports
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert reports
CREATE POLICY "Enable insert access for authenticated users" ON daily_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- EXAMPLE DATA STRUCTURES FOR 'content' COLUMN:

-- 1. Assistant Report
/*
{
  "comments": "Everything went well",
  "challenges": "None",
  "suggestions": "Buy more gloves",
  "ppe_compliance": true,
  "inventory_check": "All good",
  "records_updated": true,
  "follow_up_issues": "Patient X needs call",
  "patients_assisted": 12,
  "operatory_cleaning": true,
  "chairside_assistance": "Dr. Smith",
  "dentist_coordination": "Good",
  "patient_instructions": "Post-op care explained",
  "procedures_supported": "Extraction, Cleaning",
  "appointment_scheduling": "5 confirmed",
  "sterilization_completed": true,
  "sterilization_log_completed": true
}
*/

-- 2. Lab Report
/*
{
  "comments": "...",
  "challenges": "...",
  "suggestions": "...",
  "ppe_usage": true,
  "rework_cases": 0,
  "materials_used": "Acrylic, Zirconia",
  "cases_processed": 5,
  "equipment_issues": "None",
  "inventory_check": "Low on wax",
  "adjustments_made": "Minor occlusion fix",
  "feedback_received": "Positive",
  "infection_control": true,
  "insurance_results": "...",
  "prosthetic_types": "Crowns, Dentures",
  "clarification_pending": "None",
  "dentist_coordination": "...",
  "fit_finish_checks": true,
  "special_instructions": "Urgent case for tomorrow",
  "equipment_maintenance": "Weekly maintenance done",
  "waste_disposal_completed": true
}
*/

-- 3. Finance Report
/*
{
  "comments": "...",
  "challenges": "...",
  "follow_ups": "...",
  "suggestions": "...",
  "tax_entries": "VAT filed",
  "audit_queries": "None",
  "expense_claims": "Reviewed",
  "documents_filed": true,
  "internal_controls": "Checked",
  "journal_entries": "Posted",
  "ledger_updates": true,
  "reports_shared": true,
  "payments_disbursed": 5000,
  "regulatory_filings": true,
  "payments_received": 15000,
  "variance_analysis": "Within limits",
  "budget_monitoring": "On track",
  "department_queries": "Resolved",
  "financial_ratios": "Healthy",
  "invoices_processed": 20,
  "outstanding_items": "2 invoices pending",
  "bank_reconciliation": true,
  "cash_flow_summary": true
}
*/
