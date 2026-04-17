-- THE APEX - Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  role_type TEXT DEFAULT '',
  region TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'rejected')),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  tier TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table for configurable tier prices
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier prices (stored in cents)
INSERT INTO settings (key, value) VALUES
  ('tier_inner_price', '200000'),
  ('tier_private_price', '1000000'),
  ('tier_sanctum_price', '2000000'),
  ('tier_inner_name', 'Inner Circle'),
  ('tier_private_name', 'Private Circle'),
  ('tier_sanctum_name', 'Apex Inner Sanctum')
ON CONFLICT (key) DO NOTHING;

-- Deals / Opportunities table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  value_range TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Requests / Introductions table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_member UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member UUID REFERENCES members(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_requests_from ON requests(from_member);
CREATE INDEX idx_requests_status ON requests(status);

-- Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Members can read active members" ON members
  FOR SELECT USING (
    status = 'active' OR id = auth.uid() OR
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own member record" ON members
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own record" ON members
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update any member" ON members
  FOR UPDATE USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));

-- Deals policies
CREATE POLICY "Active members can read active deals" ON deals
  FOR SELECT USING (
    status = 'active' OR
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert deals" ON deals
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update deals" ON deals
  FOR UPDATE USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete deals" ON deals
  FOR DELETE USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));

-- Requests policies
CREATE POLICY "Users can read own requests" ON requests
  FOR SELECT USING (
    from_member = auth.uid() OR
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Active members can create requests" ON requests
  FOR INSERT WITH CHECK (
    from_member = auth.uid() AND
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins can update requests" ON requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));

-- Settings RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  );

-- Create initial admin user (run after first signup)
-- UPDATE members SET role = 'admin' WHERE email = 'your-admin@email.com';
