-- Create appointments table for managing patient follow-up appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    -- Link to patient
    patient_no INTEGER REFERENCES walkins(no) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    patient_contacts VARCHAR(100),
    
    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    reason TEXT,
    notes TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_appointments_patient_no ON appointments(patient_no);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at_trigger
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Enable RLS (Row Level Security) - adjust policies as needed
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON appointments
    FOR ALL
    USING (true)
    WITH CHECK (true);
