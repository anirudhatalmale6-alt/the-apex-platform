-- THE APEX - Tier System Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This adds tier support to existing installations

-- 1. Add tier column to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT NULL;

-- 2. Update status check constraint to support new statuses
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check
  CHECK (status IN ('pending', 'approved', 'active', 'rejected'));

-- 3. Create settings table for configurable prices
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert default tier prices (stored in cents: 200000 = CHF 2,000)
INSERT INTO settings (key, value) VALUES
  ('tier_inner_price', '200000'),
  ('tier_private_price', '1000000'),
  ('tier_sanctum_price', '2000000'),
  ('tier_inner_name', 'Inner Circle'),
  ('tier_private_name', 'Private Circle'),
  ('tier_sanctum_name', 'Apex Inner Sanctum')
ON CONFLICT (key) DO NOTHING;

-- 5. Settings RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Anyone can read settings') THEN
    CREATE POLICY "Anyone can read settings" ON settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can update settings') THEN
    CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (
      EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can insert settings') THEN
    CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END
$$;

-- 6. Update members RLS to allow approved members to read their own data
-- (The existing policy already handles this via id = auth.uid())
