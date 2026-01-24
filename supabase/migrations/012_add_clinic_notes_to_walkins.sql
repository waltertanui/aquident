-- Add clinic_notes column to walkins table
ALTER TABLE walkins 
ADD COLUMN clinic_notes TEXT;
