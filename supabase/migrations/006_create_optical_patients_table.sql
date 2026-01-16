-- Migration: Create independent optical_patients table
-- Purpose: Standalone optical module with its own patient tracking and payments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS optical_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient info
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M','F')),
  age INTEGER,
  dob DATE,
  contacts TEXT,
  residence TEXT,
  
  -- Prescription (JSONB for flexibility)
  -- Structure: {sphere, cylinder, axis, add, prism, va}
  prescription_od JSONB DEFAULT '{}',
  prescription_os JSONB DEFAULT '{}',
  pd TEXT,  -- Pupillary distance
  
  -- Frame & Lens
  frame_brand TEXT,
  frame_model TEXT,
  frame_color TEXT,
  frame_price NUMERIC DEFAULT 0,
  lens_type TEXT,
  lens_coating TEXT,
  lens_price NUMERIC DEFAULT 0,
  
  -- Order details
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'collected', 'cancelled')),
  
  -- Billing
  total_cost NUMERIC DEFAULT 0,
  insurance_amount NUMERIC DEFAULT 0,
  cash_amount NUMERIC DEFAULT 0,
  installments JSONB DEFAULT '[]',
  balance NUMERIC DEFAULT 0,
  price_locked BOOLEAN DEFAULT FALSE,
  price_locked_at TIMESTAMPTZ,
  price_locked_by TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_optical_patients_name ON optical_patients(name);
CREATE INDEX IF NOT EXISTS idx_optical_patients_status ON optical_patients(status);
CREATE INDEX IF NOT EXISTS idx_optical_patients_created_at ON optical_patients(created_at);
