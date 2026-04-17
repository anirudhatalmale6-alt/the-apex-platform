import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase-server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const supabase = createServiceClient();

    // Get member's tier
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('tier, status')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Only approved members can pay
    if (member.status !== 'approved') {
      return NextResponse.json({ error: 'Member is not approved for payment' }, { status: 403 });
    }

    // Get tier price from settings
    let unitAmount = 200000; // Default: CHF 2,000
    let tierDisplayName = 'THE APEX Membership';

    if (member.tier) {
      const tierPriceKey = `tier_${member.tier}_price`;
      const tierNameKey = `tier_${member.tier}_name`;

      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [tierPriceKey, tierNameKey]);

      if (settings) {
        for (const s of settings) {
          if (s.key === tierPriceKey) unitAmount = parseInt(s.value, 10);
          if (s.key === tierNameKey) tierDisplayName = `THE APEX - ${s.value}`;
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'chf',
          product_data: {
            name: tierDisplayName,
            description: 'One-time membership fee for THE APEX network.',
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?cancelled=true`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
