'use client';

import { useEffect, useState } from 'react';
import { supabase, Member, Deal, Request, Setting } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, MessageSquare, Shield, Plus, Check, X, Trash2, Settings } from 'lucide-react';

type Tab = 'overview' | 'members' | 'deals' | 'requests' | 'settings';

interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  approvedMembers: number;
  rejectedMembers: number;
  totalDeals: number;
  openRequests: number;
}

interface DealForm {
  title: string;
  description: string;
  value_range: string;
  status: 'active' | 'draft';
}

const emptyDealForm: DealForm = {
  title: '',
  description: '',
  value_range: '',
  status: 'active',
};

const TIER_OPTIONS = [
  { value: 'inner', labelKey: 'admin_tier_inner' as const },
  { value: 'private', labelKey: 'admin_tier_private' as const },
  { value: 'sanctum', labelKey: 'admin_tier_sanctum' as const },
];

export default function AdminPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Data
  const [stats, setStats] = useState<AdminStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    approvedMembers: 0,
    rejectedMembers: 0,
    totalDeals: 0,
    openRequests: 0,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  // Tier selection per member (temporary state while admin is choosing)
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});

  // Deal form
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealForm, setDealForm] = useState<DealForm>(emptyDealForm);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  // Settings
  const [tierPrices, setTierPrices] = useState<Record<string, string>>({
    tier_inner_price: '2000',
    tier_private_price: '10000',
    tier_sanctum_price: '20000',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!member || member.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }

      await loadAllData();
    } catch (error) {
      console.error('Admin check failed:', error);
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllData() {
    await Promise.all([
      loadStats(),
      loadMembers(),
      loadDeals(),
      loadRequests(),
      loadSettings(),
    ]);
  }

  async function loadStats() {
    const [totalRes, activeRes, pendingRes, approvedRes, rejectedRes, dealsRes, requestsRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('deals').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      totalMembers: totalRes.count ?? 0,
      activeMembers: activeRes.count ?? 0,
      pendingMembers: pendingRes.count ?? 0,
      approvedMembers: approvedRes.count ?? 0,
      rejectedMembers: rejectedRes.count ?? 0,
      totalDeals: dealsRes.count ?? 0,
      openRequests: requestsRes.count ?? 0,
    });
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMembers(data as Member[]);
  }

  async function loadDeals() {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDeals(data as Deal[]);
  }

  async function loadRequests() {
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) {
      const reqs = data as Request[];
      setRequests(reqs);

      const memberIds = Array.from(new Set(reqs.map((r) => r.from_member)));
      if (memberIds.length > 0) {
        const { data: nameData } = await supabase
          .from('members')
          .select('id, name')
          .in('id', memberIds);
        if (nameData) {
          const names: Record<string, string> = {};
          nameData.forEach((m: { id: string; name: string }) => {
            names[m.id] = m.name;
          });
          setMemberNames(names);
        }
      }
    }
  }

  async function loadSettings() {
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['tier_inner_price', 'tier_private_price', 'tier_sanctum_price']);

    if (data) {
      const prices: Record<string, string> = {};
      (data as Setting[]).forEach((s) => {
        // Convert cents to CHF for display
        prices[s.key] = String(Math.round(parseInt(s.value, 10) / 100));
      });
      if (Object.keys(prices).length > 0) {
        setTierPrices((prev) => ({ ...prev, ...prices }));
      }
    }
  }

  // Member actions - approve with tier
  async function approveMember(memberId: string) {
    const tier = selectedTiers[memberId];
    if (!tier) {
      alert(locale === 'de' ? 'Bitte w\u00e4hlen Sie eine Stufe aus' : 'Please select a tier first');
      return;
    }

    await supabase.from('members').update({
      status: 'approved',
      tier: tier,
      paid: false,
    }).eq('id', memberId);

    setSelectedTiers((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });

    await Promise.all([loadMembers(), loadStats()]);
  }

  async function rejectMember(memberId: string) {
    await supabase.from('members').update({ status: 'rejected' }).eq('id', memberId);
    await Promise.all([loadMembers(), loadStats()]);
  }

  async function activateMember(memberId: string) {
    await supabase.from('members').update({ status: 'active', paid: true }).eq('id', memberId);
    await Promise.all([loadMembers(), loadStats()]);
  }

  async function deactivateMember(memberId: string) {
    await supabase.from('members').update({ status: 'pending', paid: false, tier: null }).eq('id', memberId);
    await Promise.all([loadMembers(), loadStats()]);
  }

  // Deal actions
  function openNewDealForm() {
    setDealForm(emptyDealForm);
    setEditingDealId(null);
    setShowDealForm(true);
  }

  function openEditDealForm(deal: Deal) {
    setDealForm({
      title: deal.title,
      description: deal.description,
      value_range: deal.value_range,
      status: deal.status,
    });
    setEditingDealId(deal.id);
    setShowDealForm(true);
  }

  async function saveDeal() {
    if (!dealForm.title.trim()) return;

    if (editingDealId) {
      await supabase.from('deals').update(dealForm).eq('id', editingDealId);
    } else {
      await supabase.from('deals').insert(dealForm);
    }

    setShowDealForm(false);
    setDealForm(emptyDealForm);
    setEditingDealId(null);
    await Promise.all([loadDeals(), loadStats()]);
  }

  async function deleteDeal(id: string) {
    await supabase.from('deals').delete().eq('id', id);
    await Promise.all([loadDeals(), loadStats()]);
  }

  // Request actions
  async function updateRequestStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('requests').update({ status }).eq('id', id);
    await Promise.all([loadRequests(), loadStats()]);
  }

  // Settings actions
  async function saveSettings() {
    setSavingSettings(true);
    setSettingsSaved(false);

    try {
      // Update each tier price (convert CHF to cents)
      for (const [key, value] of Object.entries(tierPrices)) {
        const cents = String(Math.round(parseFloat(value) * 100));
        await supabase.from('settings').upsert({
          key,
          value: cents,
          updated_at: new Date().toISOString(),
        });
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingSettings(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: t(locale, 'admin_stats'), icon: Shield },
    { key: 'members', label: t(locale, 'admin_members'), icon: Users },
    { key: 'deals', label: t(locale, 'admin_deals'), icon: Briefcase },
    { key: 'requests', label: t(locale, 'admin_requests'), icon: MessageSquare },
    { key: 'settings', label: t(locale, 'admin_settings'), icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-400',
      approved: 'bg-blue-500/10 text-blue-400',
      pending: 'bg-amber-500/10 text-amber-400',
      rejected: 'bg-red-500/10 text-red-400',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-400';
  }

  function getTierLabel(tier: string | null): string {
    if (!tier) return '-';
    const option = TIER_OPTIONS.find((o) => o.value === tier);
    return option ? t(locale, option.labelKey) : tier;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl text-white mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {t(locale, 'admin_title')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-[#C9A96E] text-[#C9A96E]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: t(locale, 'admin_total_members'), value: stats.totalMembers, icon: Users },
            { label: t(locale, 'admin_active_members'), value: stats.activeMembers, icon: Users },
            { label: t(locale, 'admin_pending_members'), value: stats.pendingMembers, icon: Users },
            { label: t(locale, 'admin_approved_members'), value: stats.approvedMembers, icon: Users },
            { label: t(locale, 'admin_rejected_members'), value: stats.rejectedMembers, icon: Users },
            { label: t(locale, 'admin_total_deals'), value: stats.totalDeals, icon: Briefcase },
            { label: t(locale, 'admin_open_requests'), value: stats.openRequests, icon: MessageSquare },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-[#111111] rounded-xl p-6 border border-transparent hover:border-[#C9A96E]/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C9A96E]" />
                  </div>
                  <span
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {card.value}
                  </span>
                </div>
                <p
                  className="text-gray-400 text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-[#111111] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Name</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Email</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Role Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Region</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Tier</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{member.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{member.role_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{member.region}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{getTierLabel(member.tier)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.status === 'pending' && (
                          <>
                            {/* Tier selection dropdown */}
                            <select
                              value={selectedTiers[member.id] || ''}
                              onChange={(e) => setSelectedTiers((prev) => ({ ...prev, [member.id]: e.target.value }))}
                              className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50"
                            >
                              <option value="">{t(locale, 'admin_select_tier')}</option>
                              {TIER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {t(locale, opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => approveMember(member.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t(locale, 'admin_approve')}
                            </button>
                            <button
                              onClick={() => rejectMember(member.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              {t(locale, 'admin_reject')}
                            </button>
                          </>
                        )}
                        {member.status === 'approved' && (
                          <>
                            <span className="text-xs text-blue-400 mr-2">
                              {locale === 'de' ? 'Warte auf Zahlung' : 'Awaiting payment'}
                            </span>
                            <button
                              onClick={() => activateMember(member.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Manually activate (skip payment)"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t(locale, 'admin_activate')}
                            </button>
                          </>
                        )}
                        {member.status === 'active' && member.role !== 'admin' && (
                          <button
                            onClick={() => deactivateMember(member.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            {t(locale, 'admin_deactivate')}
                          </button>
                        )}
                        {member.status === 'rejected' && (
                          <>
                            {/* Allow re-approving rejected members */}
                            <select
                              value={selectedTiers[member.id] || ''}
                              onChange={(e) => setSelectedTiers((prev) => ({ ...prev, [member.id]: e.target.value }))}
                              className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50"
                            >
                              <option value="">{t(locale, 'admin_select_tier')}</option>
                              {TIER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {t(locale, opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => approveMember(member.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t(locale, 'admin_approve')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div>
          {/* New Deal Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={openNewDealForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#C9A96E] text-black hover:bg-[#B8944D] transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              {t(locale, 'admin_deal_new')}
            </button>
          </div>

          {/* Deal Form Modal */}
          {showDealForm && (
            <div className="bg-[#111111] rounded-xl p-6 border border-[#C9A96E]/20 mb-6">
              <h3
                className="text-lg text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {editingDealId ? t(locale, 'edit') : t(locale, 'admin_deal_new')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t(locale, 'admin_deal_title')}
                  </label>
                  <input
                    type="text"
                    value={dealForm.title}
                    onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t(locale, 'admin_deal_value')}
                  </label>
                  <input
                    type="text"
                    value={dealForm.value_range}
                    onChange={(e) => setDealForm({ ...dealForm, value_range: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t(locale, 'admin_deal_desc')}
                  </label>
                  <textarea
                    value={dealForm.description}
                    onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                    rows={3}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={dealForm.status}
                    onChange={(e) => setDealForm({ ...dealForm, status: e.target.value as 'active' | 'draft' })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E]/50"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveDeal}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#C9A96E] text-black hover:bg-[#B8944D] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Check className="w-4 h-4" />
                  {t(locale, 'admin_deal_save')}
                </button>
                <button
                  onClick={() => { setShowDealForm(false); setEditingDealId(null); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {t(locale, 'cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Deals List */}
          <div className="space-y-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="bg-[#111111] rounded-xl p-5 border border-white/5 hover:border-[#C9A96E]/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3
                        className="text-white text-sm font-medium truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {deal.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          deal.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {deal.description}
                    </p>
                    {deal.value_range && (
                      <p className="text-[#C9A96E] text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {t(locale, 'opps_value')}: {deal.value_range}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditDealForm(deal)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {t(locale, 'edit')}
                    </button>
                    <button
                      onClick={() => deleteDeal(deal.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {deals.length === 0 && (
              <div className="bg-[#111111] rounded-xl p-12 text-center">
                <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  No deals yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-[#111111] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">From</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Purpose</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Message</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {memberNames[req.from_member] || req.from_member_name || req.from_member}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{req.purpose}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.message || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateRequestStatus(req.id, 'approved')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t(locale, 'admin_approve')}
                        </button>
                        <button
                          onClick={() => updateRequestStatus(req.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          {t(locale, 'admin_reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No pending requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <div className="bg-[#111111] rounded-xl p-6 border border-white/5">
            <h3
              className="text-lg text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {t(locale, 'admin_tier_prices')}
            </h3>

            <div className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
              {TIER_OPTIONS.map((tier) => {
                const priceKey = `tier_${tier.value}_price`;
                return (
                  <div key={tier.value}>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                      {t(locale, tier.labelKey)} (CHF)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">CHF</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={tierPrices[priceKey] || ''}
                        onChange={(e) => setTierPrices((prev) => ({ ...prev, [priceKey]: e.target.value }))}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-14 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/50"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      = CHF {Number(tierPrices[priceKey] || 0).toLocaleString()} ({(Number(tierPrices[priceKey] || 0) * 100).toLocaleString()} {locale === 'de' ? 'Rappen' : 'cents'})
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#C9A96E] text-black hover:bg-[#B8944D] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Check className="w-4 h-4" />
                {savingSettings ? (locale === 'de' ? 'Speichern...' : 'Saving...') : t(locale, 'save')}
              </button>
              {settingsSaved && (
                <span className="text-emerald-400 text-sm animate-pulse">
                  {t(locale, 'success')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
