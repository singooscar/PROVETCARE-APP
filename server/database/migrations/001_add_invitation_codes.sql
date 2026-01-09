-- ============================================================================
-- MIGRATION: Add Invitation Codes Table for Admin Registration
-- Date: 2026-01-08
-- Purpose: Enable secure veterinarian registration with invitation codes
-- ============================================================================
-- Create invitation_codes table
CREATE TABLE IF NOT EXISTS invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE
    SET NULL,
        used_by INTEGER REFERENCES users(id) ON DELETE
    SET NULL,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitation_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_unused ON invitation_codes(is_used, expires_at);
-- Insert bootstrap invitation code (valid for 30 days)
-- This code can be used to register the first additional admin
INSERT INTO invitation_codes (code, created_by, expires_at)
VALUES (
        'bootstrap-admin-2026-provetcare',
        1,
        -- Created by first admin (admin@provetcare.com)
        CURRENT_TIMESTAMP + INTERVAL '30 days'
    ) ON CONFLICT (code) DO NOTHING;
-- Verification query
SELECT 'invitation_codes table created' as status,
    COUNT(*) as total_codes,
    COUNT(*) FILTER (
        WHERE is_used = FALSE
    ) as available_codes
FROM invitation_codes;