'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/login'); return; }

      // If returning from Stripe payment, verify and activate
      const sessionId = searchParams.get('session_id');
      if (sessionId && searchParams.get('payment') === 'success') {
        await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }

      const { data: m } = await supabase.from('members')
        .select('status,paid')
        .eq('id', data.user.id)
        .single();

      if (!m || !m.paid || m.status !== 'active') {
        router.replace('/payment');
        return;
      }
      setReady(true);
    }
    check();
  }, [router, searchParams]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-apex-gold text-sm tracking-[4px] uppercase animate-pulse">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-6 lg:p-10">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-apex-gold text-sm tracking-[4px] uppercase animate-pulse">Loading...</div>
      </div>
    }>
      <DashboardGuard>{children}</DashboardGuard>
    </Suspense>
  );
}
