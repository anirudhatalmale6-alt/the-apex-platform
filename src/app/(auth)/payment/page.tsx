'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getLocale, Locale } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const translations: Record<string, Record<Locale, string>> = {
  title: { en: 'THE APEX', de: 'THE APEX' },
  subtitle: { en: 'Ultra-Exclusive Membership', de: 'Ultra-Exklusive Mitgliedschaft' },
  amount: { en: 'CHF 2,000', de: 'CHF 2\'000' },
  oneTime: { en: 'One-time payment', de: 'Einmalige Zahlung' },
  fullAccess: { en: 'Full access to the member network', de: 'Voller Zugang zum Mitgliedernetzwerk' },
  payNow: { en: 'Pay Now', de: 'Jetzt bezahlen' },
  processing: { en: 'Processing...', de: 'Wird verarbeitet...' },
  securedBy: { en: 'Secured by Stripe', de: 'Gesichert durch Stripe' },
  featureNetwork: { en: 'Access to exclusive member network', de: 'Zugang zum exklusiven Mitgliedernetzwerk' },
  featureEvents: { en: 'Priority invitations to private events', de: 'Priorit\u00e4tseinladungen zu privaten Events' },
  featureConcierge: { en: 'Personal concierge service', de: 'Pers\u00f6nlicher Concierge-Service' },
  featureDirectory: { en: 'Member directory & direct messaging', de: 'Mitgliederverzeichnis & Direktnachrichten' },
  featureLifetime: { en: 'Lifetime membership \u2014 no recurring fees', de: 'Lebenslange Mitgliedschaft \u2014 keine wiederkehrenden Geb\u00fchren' },
  included: { en: 'What\u2019s Included', de: 'Was enthalten ist' },
};

function tt(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>('en');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);

      // Check if already paid
      const { data: member } = await supabase
        .from('members')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (member?.status === 'active') {
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
      // Trigger entrance animation
      setTimeout(() => setVisible(true), 50);
    }

    checkAuth();
  }, [router]);

  async function handlePayment() {
    if (!userId || paying) return;
    setPaying(true);

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '2px solid #1a1a1a',
          borderTopColor: '#C9A96E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  const features = [
    'featureNetwork',
    'featureEvents',
    'featureConcierge',
    'featureDirectory',
    'featureLifetime',
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}>
        {/* Language Switcher */}
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10,
        }}>
          <LanguageSwitcher />
        </div>

        {/* Card */}
        <div style={{
          maxWidth: 480,
          width: '100%',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36,
              fontWeight: 700,
              color: '#C9A96E',
              letterSpacing: '0.15em',
              margin: 0,
            }}>
              {tt('title', locale)}
            </h1>
            <p className="apex-label" style={{
              color: '#666',
              fontSize: 13,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: 8,
            }}>
              {tt('subtitle', locale)}
            </p>
          </div>

          {/* Amount Card */}
          <div style={{
            background: 'linear-gradient(145deg, #111111, #0D0D0D)',
            border: '1px solid #1a1a1a',
            borderRadius: 16,
            padding: '40px 32px',
            textAlign: 'center',
            marginBottom: 32,
          }}>
            <p className="apex-label" style={{
              color: '#666',
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
            }}>
              {tt('oneTime', locale)}
            </p>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 56,
              fontWeight: 700,
              color: '#C9A96E',
              lineHeight: 1,
              marginBottom: 12,
            }}>
              {tt('amount', locale)}
            </div>

            <p style={{
              color: '#888',
              fontSize: 15,
              margin: 0,
            }}>
              {tt('fullAccess', locale)}
            </p>
          </div>

          {/* Features */}
          <div style={{
            background: '#111111',
            border: '1px solid #1a1a1a',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 32,
          }}>
            <p className="apex-label" style={{
              color: '#C9A96E',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: '0 0 20px 0',
            }}>
              {tt('included', locale)}
            </p>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              {features.map((key) => (
                <li key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#ccc',
                  fontSize: 14,
                }}>
                  <span style={{
                    color: '#C9A96E',
                    fontSize: 16,
                    flexShrink: 0,
                    width: 20,
                    textAlign: 'center',
                  }}>
                    &#10003;
                  </span>
                  {tt(key, locale)}
                </li>
              ))}
            </ul>
          </div>

          {/* Pay Button */}
          <button
            className="apex-btn-solid"
            onClick={handlePayment}
            disabled={paying}
            style={{
              width: '100%',
              padding: '18px 32px',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#0A0A0A',
              backgroundColor: '#C9A96E',
              border: 'none',
              borderRadius: 12,
              cursor: paying ? 'not-allowed' : 'pointer',
              opacity: paying ? 0.7 : 1,
              transition: 'opacity 0.2s ease, transform 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (!paying) {
                (e.target as HTMLElement).style.opacity = '0.9';
                (e.target as HTMLElement).style.transform = 'scale(1.01)';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = paying ? '0.7' : '1';
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            {paying ? tt('processing', locale) : tt('payNow', locale)}
          </button>

          {/* Secured by Stripe */}
          <div style={{
            textAlign: 'center',
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{
              color: '#555',
              fontSize: 12,
              letterSpacing: '0.05em',
            }}>
              {tt('securedBy', locale)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
