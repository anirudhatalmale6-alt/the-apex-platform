'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase, Member } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import { Search, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function MembersPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setLocale(getLocale());
    const handler = () => setLocale(getLocale());
    window.addEventListener('locale-changed', handler);
    return () => window.removeEventListener('locale-changed', handler);
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'active');
      if (!error && data) setMembers(data as Member[]);
      setLoading(false);
    }
    fetchMembers();
  }, []);

  const regions = useMemo(
    () => Array.from(new Set(members.map((m) => m.region).filter(Boolean))).sort(),
    [members]
  );

  const roleTypes = useMemo(
    () => Array.from(new Set(members.map((m) => m.role_type).filter(Boolean))).sort(),
    [members]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (regionFilter && m.region !== regionFilter) return false;
      if (roleFilter && m.role_type !== roleFilter) return false;
      if (q) {
        const haystack = `${m.name} ${m.role_type} ${m.region} ${m.industry}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [members, search, regionFilter, roleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[--apex-gold] text-sm tracking-[4px] uppercase animate-pulse">
          {t(locale, 'loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-light tracking-[6px] uppercase text-[--apex-gold]">
          {t(locale, 'members_title')}
        </h1>
        <p className="text-[--apex-muted] text-sm mt-2 tracking-wide">
          {t(locale, 'members_subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--apex-muted]" />
          <input
            type="text"
            placeholder={t(locale, 'members_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-11"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="md:w-52"
        >
          <option value="">{t(locale, 'members_region')}</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="md:w-52"
        >
          <option value="">{t(locale, 'members_role')}</option>
          {roleTypes.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="apex-card text-center py-20">
          <p className="text-[--apex-muted] text-sm tracking-wide">
            {locale === 'de'
              ? 'Keine Mitglieder gefunden.'
              : 'No members found matching your criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((member) => (
            <div key={member.id} className="apex-card-hover flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-medium tracking-wide text-white mb-3">
                  {member.name}
                </h2>
                <div className="space-y-2 text-sm text-[--apex-muted]">
                  {member.role_type && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-[--apex-gold-dark]" />
                      <span>{member.role_type}</span>
                    </div>
                  )}
                  {member.region && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[--apex-gold-dark]" />
                      <span>{member.region}</span>
                    </div>
                  )}
                  {member.industry && (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-[--apex-gold-dark] text-[10px] font-bold">
                        &bull;
                      </span>
                      <span>{member.industry}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href={`/requests?target=${member.id}&name=${encodeURIComponent(member.name)}`}
                  className="apex-btn block w-full text-center !text-[10px] !tracking-[3px] !px-4 !py-2.5"
                >
                  {t(locale, 'members_request_intro')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
