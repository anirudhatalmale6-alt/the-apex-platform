import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Member = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  role_type: string;
  region: string;
  industry: string;
  status: 'pending' | 'active';
  paid: boolean;
  created_at: string;
};

export type Deal = {
  id: string;
  title: string;
  description: string;
  value_range: string;
  status: 'active' | 'draft';
  created_at: string;
};

export type Request = {
  id: string;
  from_member: string;
  to_member: string | null;
  deal_id: string | null;
  purpose: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  from_member_name?: string;
  to_member_name?: string;
  deal_title?: string;
};
