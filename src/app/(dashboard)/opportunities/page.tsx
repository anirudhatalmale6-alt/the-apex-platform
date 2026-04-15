'use client';

import { useEffect, useState } from 'react';
import { supabase, Deal } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import { Briefcase, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

export default function OpportunitiesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocale(getLocale());

    const handleLocaleChange = () => setLocale(getLocale());
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) setDeals(data);
      setLoading(false);
    }
    fetchDeals();
  }, []);

  function truncate(text: string, maxLength: number) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-apex-gold text-sm tracking-[4px] uppercase animate-pulse">
          {t(locale, 'loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light tracking-wide text-white mb-2">
          {t(locale, 'opps_title')}
        </h1>
        <p className="text-white/50 text-sm tracking-wide">
          {t(locale, 'opps_subtitle')}
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-apex-gold/60 via-apex-gold/20 to-transparent" />
      </div>

      {/* Empty State */}
      {deals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full border border-apex-gold/30 flex items-center justify-center mb-6">
            <Briefcase className="w-7 h-7 text-apex-gold/50" />
          </div>
          <h2 className="text-white/70 text-lg font-light mb-2">
            {locale === 'de' ? 'Keine Geschäftsmöglichkeiten verfügbar' : 'No opportunities available'}
          </h2>
          <p className="text-white/40 text-sm max-w-sm">
            {locale === 'de'
              ? 'Neue exklusive Deals werden in Kürze veröffentlicht.'
              : 'New exclusive deals will be published soon. Check back later.'}
          </p>
        </div>
      )}

      {/* Deals Grid */}
      {deals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="group relative border border-white/10 rounded-lg bg-white/[0.03] backdrop-blur-sm hover:border-apex-gold/30 transition-all duration-300 overflow-hidden"
            >
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-apex-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="p-6">
                {/* Status badge + date */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider bg-apex-gold/10 text-apex-gold border border-apex-gold/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-apex-gold animate-pulse" />
                    {t(locale, 'opps_status_active')}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDate(deal.created_at)}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white text-lg font-light tracking-wide mb-3 group-hover:text-apex-gold-light transition-colors duration-300">
                  {deal.title}
                </h3>

                {/* Description */}
                <p className="text-white/45 text-sm leading-relaxed mb-5">
                  {truncate(deal.description, 140)}
                </p>

                {/* Value range */}
                {deal.value_range && (
                  <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded bg-white/[0.03] border border-white/5">
                    <DollarSign className="w-4 h-4 text-apex-gold/70" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">
                        {t(locale, 'opps_value')}
                      </div>
                      <div className="text-white/80 text-sm font-light">
                        {deal.value_range}
                      </div>
                    </div>
                  </div>
                )}

                {/* Express Interest button */}
                <Link
                  href={`/requests?deal=${deal.id}&name=${encodeURIComponent(deal.title)}`}
                  className="block w-full text-center py-2.5 rounded border border-apex-gold/30 text-apex-gold text-sm tracking-wider uppercase hover:bg-apex-gold hover:text-black transition-all duration-300 font-light"
                >
                  {t(locale, 'opps_express_interest')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
