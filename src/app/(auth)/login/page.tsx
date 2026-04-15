'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    setMounted(true);

    const handleLocaleChange = () => setLocale(getLocale());
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  async function checkMemberStatusAndRedirect(userId: string) {
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('status, paid')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      router.push('/payment');
      return;
    }

    if (member.status === 'active' && member.paid) {
      router.push('/dashboard');
    } else {
      router.push('/payment');
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        await checkMemberStatusAndRedirect(data.user.id);
      }
    } catch {
      setError(t(locale, 'error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError(t(locale, 'error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Login Card */}
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
            {t(locale, 'login_subtitle')}
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
            {t(locale, 'login_title')}
          </h2>

          {/* Toggle: Password / Magic Link */}
          <div className="flex mb-8 rounded-lg overflow-hidden" style={{ border: '1px solid #1E1E1E' }}>
            <button
              type="button"
              onClick={() => {
                setUseMagicLink(false);
                setError('');
                setMagicLinkSent(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: !useMagicLink ? '#C9A96E' : 'transparent',
                color: !useMagicLink ? '#0A0A0A' : '#666',
              }}
            >
              {t(locale, 'login_password')}
            </button>
            <button
              type="button"
              onClick={() => {
                setUseMagicLink(true);
                setError('');
                setMagicLinkSent(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: useMagicLink ? '#C9A96E' : 'transparent',
                color: useMagicLink ? '#0A0A0A' : '#666',
              }}
            >
              Magic Link
            </button>
          </div>

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

          {/* Magic Link Sent Confirmation */}
          {magicLinkSent && (
            <div
              className="mb-6 p-4 rounded-lg text-sm text-center"
              style={{
                backgroundColor: 'rgba(201, 169, 110, 0.08)',
                border: '1px solid rgba(201, 169, 110, 0.3)',
                color: '#C9A96E',
              }}
            >
              {t(locale, 'login_magic_sent')}
            </div>
          )}

          {/* Form */}
          {!magicLinkSent && (
            <form onSubmit={useMagicLink ? handleMagicLink : handlePasswordLogin}>
              {/* Email */}
              <div className="mb-5">
                <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                  {t(locale, 'login_email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                  style={{
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #1E1E1E',
                    color: '#E5E5E5',
                  }}
                  placeholder="you@example.com"
                />
              </div>

              {/* Password (only for password mode) */}
              {!useMagicLink && (
                <div className="mb-8">
                  <label className="apex-label block mb-2 text-sm" style={{ color: '#999' }}>
                    {t(locale, 'login_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors duration-200"
                    style={{
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #1E1E1E',
                      color: '#E5E5E5',
                    }}
                    placeholder="••••••••"
                  />
                </div>
              )}

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
                {loading
                  ? t(locale, 'loading')
                  : useMagicLink
                  ? t(locale, 'login_magic')
                  : t(locale, 'login_submit')}
              </button>
            </form>
          )}

          {/* Register Link */}
          <div className="mt-8 text-center text-sm" style={{ color: '#666' }}>
            {t(locale, 'login_no_account')}{' '}
            <a
              href="/register"
              className="font-medium transition-colors duration-200 hover:underline"
              style={{ color: '#C9A96E' }}
            >
              {t(locale, 'login_register')}
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
