'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase, Request as IntroRequest } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import { MessageSquare, Clock, Check, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function RequestsPageContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('target');
  const dealId = searchParams.get('deal');
  const prefillName = searchParams.get('name') || '';

  const [locale, setLocale] = useState<Locale>('en');
  const [requests, setRequests] = useState<IntroRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(!!(targetId || dealId));
  const [target, setTarget] = useState(prefillName);
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    const handler = () => setLocale(getLocale());
    window.addEventListener('locale-changed', handler);
    return () => window.removeEventListener('locale-changed', handler);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchRequests(user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function fetchRequests(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('from_member', uid)
      .order('created_at', { ascending: false });
    if (!error && data) setRequests(data as IntroRequest[]);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !purpose.trim()) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    const payload: Record<string, unknown> = {
      from_member: userId,
      to_member: targetId || null,
      deal_id: dealId || null,
      purpose: purpose.trim(),
      message: message.trim() || null,
      status: 'pending',
    };

    const { error } = await supabase.from('requests').insert(payload);

    if (error) {
      setSubmitError(t(locale, 'error'));
      setSubmitting(false);
      return;
    }

    setSubmitSuccess(true);
    setPurpose('');
    setMessage('');
    setTarget('');
    setShowForm(false);
    setSubmitting(false);
    fetchRequests(userId);
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3" />
            {t(locale, 'req_status_approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <X className="w-3 h-3" />
            {t(locale, 'req_status_rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            {t(locale, 'req_status_pending')}
          </span>
        );
    }
  }

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-light tracking-[6px] uppercase text-[--apex-gold]">
            {t(locale, 'req_title')}
          </h1>
          <p className="text-[--apex-muted] text-sm mt-2 tracking-wide">
            {t(locale, 'req_subtitle')}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="apex-btn !text-[10px] !tracking-[3px] !px-6 !py-2.5 flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {t(locale, 'req_new')}
          </button>
        )}
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="mb-6 px-5 py-3 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm tracking-wide">
          {t(locale, 'success')}
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <div className="apex-card mb-8">
          <h2 className="text-sm font-light tracking-[4px] uppercase text-[--apex-gold] mb-6">
            {t(locale, 'req_new')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-[2px] uppercase text-[--apex-muted] mb-2">
                {t(locale, 'req_target')}
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={!!(targetId || dealId)}
                className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={t(locale, 'req_target')}
              />
            </div>
            <div>
              <label className="block text-xs tracking-[2px] uppercase text-[--apex-muted] mb-2">
                {t(locale, 'req_purpose')}
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full"
                placeholder={t(locale, 'req_purpose')}
              />
            </div>
            <div>
              <label className="block text-xs tracking-[2px] uppercase text-[--apex-muted] mb-2">
                {t(locale, 'req_message')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full resize-none"
                placeholder={t(locale, 'req_message')}
              />
            </div>
            {submitError && (
              <p className="text-red-400 text-sm tracking-wide">{submitError}</p>
            )}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !purpose.trim()}
                className="apex-btn !text-[10px] !tracking-[3px] !px-8 !py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? t(locale, 'loading') : t(locale, 'req_submit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSubmitError('');
                }}
                className="text-[--apex-muted] text-xs tracking-[2px] uppercase hover:text-white transition-colors"
              >
                {t(locale, 'cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="apex-card text-center py-20">
          <MessageSquare className="w-8 h-8 text-[--apex-gold-dark] mx-auto mb-4 opacity-40" />
          <p className="text-[--apex-muted] text-sm tracking-wide">
            {t(locale, 'req_empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="apex-card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-4 h-4 text-[--apex-gold-dark] shrink-0" />
                    <h3 className="text-white font-medium tracking-wide truncate">
                      {req.to_member_name || req.deal_title || req.to_member || req.deal_id || '---'}
                    </h3>
                  </div>
                  <p className="text-sm text-[--apex-muted] tracking-wide mb-1">
                    {req.purpose}
                  </p>
                  {req.message && (
                    <p className="text-xs text-[--apex-muted]/60 tracking-wide leading-relaxed">
                      {req.message}
                    </p>
                  )}
                  <p className="text-[10px] text-[--apex-muted]/40 tracking-wider mt-3 uppercase">
                    {new Date(req.created_at).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="shrink-0">
                  {statusBadge(req.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[--apex-gold] text-sm tracking-[4px] uppercase animate-pulse">
            Loading...
          </div>
        </div>
      }
    >
      <RequestsPageContent />
    </Suspense>
  );
}
