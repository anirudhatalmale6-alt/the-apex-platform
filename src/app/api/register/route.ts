import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, region, role_type, industry } = await req.json();
    const supabase = createServiceClient();

    // Create auth user with email confirmed (skip email verification)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Insert member record using service role (bypasses RLS)
    const { error: memberError } = await supabase.from('members').insert({
      id: authData.user.id,
      name,
      email,
      role: 'member',
      role_type,
      region,
      industry,
      status: 'pending',
      paid: false,
      tier: null,
    });

    if (memberError) {
      // Clean up auth user if member insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ userId: authData.user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
