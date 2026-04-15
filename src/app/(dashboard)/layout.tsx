'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return; }
      supabase.from('members').select('status,paid').eq('id', data.user.id).single()
        .then(({ data: m }) => {
          if (!m || !m.paid || m.status !== 'active') { router.replace('/payment'); return; }
          setReady(true);
        });
    });
  }, [router]);

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
