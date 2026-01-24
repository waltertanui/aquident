-- Add columns for document URLs to the walkins table
-- These will store the Supabase Storage URLs instead of base64

ALTER TABLE walkins
ADD COLUMN IF NOT EXISTS card_image_url TEXT,
ADD COLUMN IF NOT EXISTS consent_form_url TEXT;

-- Create a storage bucket for patient documents (run this in Supabase Dashboard -> Storage)
-- Bucket name: patient-documents
-- Public: false (for privacy)
