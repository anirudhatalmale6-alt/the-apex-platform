'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const REGIONS = ['Zürich', 'Zug', 'Geneva', 'Basel', 'Bern', 'Lugano', 'Other'];
const ROLES = ['Investor', 'Founder', 'Family Office', 'Real Estate', 'Advisor', 'Other'];

export default function RegisterPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [professionalRole, setProfessionalRole] = useState('');
  const [industry, setIndustry] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocale(getLocale());
    setMounted(true);

    const handleLocaleChange = () => setLocale(getLocale());
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from('members').insert({
          id: data.user.id,
          name,
          email,
          region,
          role_type: professionalRole,
          industry,
          status: 'pending',
          paid: false,
          role: 'member',
        });

        if (insertError) {
          setError(insertError.message);
          return;
        }

        router.push('/payment');
      }
    } catch {
      setError(t(locale, 'error'));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1E1E1E',
    color: '#E5E5E5',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Register Card */}
      <div
        className={`w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold tracking-widest mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #C9A96E 0%, #E8D5A3 50%, #C9A96E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            THE APEX
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase" style={{ color: '#666' }}>
            {t(locale, 'register_subtitle')}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{
            backgroundColor: '#111111',
            border: '1px solid #1E1E1E',
            boxShadow: '0 0 40px rgba(201, 169, 110, 0.03)',
          }}
        >
          <h2
            className="text-2xl font-semibold text-center mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#E5E5E5',
            }}
          >
            {t(locale, 'register_title')}
          </h2>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-3 rounded-lg text-sm text-center"
              style={{
                backgroundColor: 'rgba(201, 169, 110, 0.08)',
                border: '1px solid rgba(201, 169, 110, 0.2)',
                color: '#C9A96E',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister}>
            {/* Name */}
            <div className="mb-5">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                style={inputStyle}
                placeholder={locale === 'de' ? 'Ihr vollständiger Name' : 'Your full name'}
              />
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_password')}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {/* Region */}
            <div className="mb-5">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_region')}
              </label>
              <select
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200 appearance-none"
                style={{
                  ...inputStyle,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                }}
              >
                <option value="" disabled>
                  {locale === 'de' ? 'Region auswählen' : 'Select region'}
                </option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Professional Role */}
            <div className="mb-5">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_role_type')}
              </label>
              <select
                required
                value={professionalRole}
                onChange={(e) => setProfessionalRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200 appearance-none"
                style={{
                  ...inputStyle,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                }}
              >
                <option value="" disabled>
                  {locale === 'de' ? 'Rolle auswählen' : 'Select role'}
                </option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div className="mb-8">
              <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                {t(locale, 'register_industry')}
              </label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                style={inputStyle}
                placeholder={locale === 'de' ? 'z.B. Immobilien, Finanzen...' : 'e.g. Real Estate, Finance...'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="apex-btn w-full py-3.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-200"
              style={{
                backgroundColor: loading ? '#8B7A4E' : '#C9A96E',
                color: '#0A0A0A',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? t(locale, 'loading') : t(locale, 'register_submit')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm" style={{ color: '#666' }}>
            {t(locale, 'register_has_account')}{' '}
            <a
              href="/login"
              className="font-medium transition-colors duration-200 hover:underline"
              style={{ color: '#C9A96E' }}
            >
              {t(locale, 'register_login')}
            </a>
          </div>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-8 tracking-wider"
          style={{ color: '#333' }}
        >
          &copy; {new Date().getFullYear()} THE APEX. All rights reserved.
        </p>
      </div>
    </div>
  );
}
