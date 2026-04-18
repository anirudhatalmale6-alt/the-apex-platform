import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['tier_inner_price', 'tier_private_price', 'tier_sanctum_price']);

  const prices: number[] = [];
  if (data) {
    for (const row of data) {
      const cents = parseInt(row.value, 10);
      if (!isNaN(cents)) prices.push(cents);
    }
  }

  if (prices.length === 0) {
    prices.push(200000, 2000000);
  }

  const minCHF = Math.min(...prices) / 100;
  const maxCHF = Math.max(...prices) / 100;

  return NextResponse.json({ min: minCHF, max: maxCHF });
}
