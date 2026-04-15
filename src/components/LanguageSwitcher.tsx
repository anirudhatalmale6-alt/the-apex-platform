'use client';
import { useState, useEffect } from 'react';
import { Locale, getLocale, setLocale } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const [locale, setLoc] = useState<Locale>('en');

  useEffect(() => { setLoc(getLocale()); }, []);

  const toggle = () => {
    const next = locale === 'en' ? 'de' : 'en';
    setLocale(next);
    setLoc(next);
    window.location.reload();
  };

  return (
    <button onClick={toggle} className="text-[11px] font-medium uppercase tracking-[3px] text-apex-muted hover:text-apex-gold transition-colors px-3 py-1 border border-[rgba(255,255,255,0.1)] hover:border-apex-gold">
      {locale === 'en' ? 'DE' : 'EN'}
    </button>
  );
}
