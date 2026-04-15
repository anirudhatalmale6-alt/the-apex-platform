'use client';

import { useEffect, useState } from 'react';
import { supabase, Member, Deal } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import { Users, Briefcase, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const [locale, setLoc] = useState<Locale>('en');
  const [memberName, setMemberName] = useState('');
  const [stats, setStats] = useState({ members: 0, deals: 0, requests: 0 });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [latestDeals, setLatestDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoc(getLocale());
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase.from('members').select('name').eq('id', user.id).single();
      if (me) setMemberName(me.name);

      const [mc, dc, rc, rm, ld] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('from_member', user.id).eq('status', 'pending'),
        supabase.from('members').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('deals').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(3),
      ]);

      setStats({ members: mc.count ?? 0, deals: dc.count ?? 0, requests: rc.count ?? 0 });
      setRecentMembers((rm.data as Member[]) ?? []);
      setLatestDeals((ld.data as Deal[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-apex-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: t(locale, 'dash_members'), value: stats.members, icon: Users },
    { label: t(locale, 'dash_opportunities'), value: stats.deals, icon: Briefcase },
    { label: t(locale, 'dash_requests'), value: stats.requests, icon: MessageSquare },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-playfair text-3xl md:text-4xl text-white mb-2">
          {t(locale, 'dash_welcome')}, <span className="text-apex-gold">{memberName}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="apex-card-hover rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-apex-gold/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-apex-gold" />
                </div>
                <span className="font-playfair text-3xl font-bold text-white">{c.value}</span>
              </div>
              <p className="text-apex-muted text-sm">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="apex-card rounded-xl">
          <h2 className="font-playfair text-xl text-white mb-6">{t(locale, 'dash_recent_members')}</h2>
          {recentMembers.length === 0 ? (
            <p className="text-apex-muted text-sm">{locale === 'de' ? 'Noch keine Mitglieder.' : 'No members yet.'}</p>
          ) : (
            <ul className="space-y-4">
              {recentMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-white text-sm font-medium">{m.name}</p>
                    <p className="text-apex-muted text-xs mt-0.5">{m.role_type}</p>
                  </div>
                  <span className="text-apex-gold text-xs">{m.region}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="apex-card rounded-xl">
          <h2 className="font-playfair text-xl text-white mb-6">{t(locale, 'dash_recent_opps')}</h2>
          {latestDeals.length === 0 ? (
            <p className="text-apex-muted text-sm">{locale === 'de' ? 'Noch keine Deals.' : 'No deals yet.'}</p>
          ) : (
            <ul className="space-y-4">
              {latestDeals.map((d) => (
                <li key={d.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium">{d.title}</p>
                    <span className="text-apex-gold text-xs font-medium">{d.value_range}</span>
                  </div>
                  <p className="text-apex-muted text-xs line-clamp-2">{d.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
