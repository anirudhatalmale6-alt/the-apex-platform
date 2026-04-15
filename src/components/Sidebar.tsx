'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase, Member } from '@/lib/supabase';
import { t, getLocale, Locale } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { LayoutDashboard, Users, Briefcase, MessageSquare, Shield, LogOut, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [member, setMember] = useState<Member | null>(null);
  const [locale, setLocale] = useState<Locale>('en');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocale(getLocale());
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('members').select('*').eq('id', data.user.id).single()
          .then(({ data: m }) => { if (m) setMember(m as Member); });
      }
    });
  }, []);

  const links = [
    { href: '/dashboard', icon: LayoutDashboard, label: t(locale, 'nav_dashboard') },
    { href: '/members', icon: Users, label: t(locale, 'nav_members') },
    { href: '/opportunities', icon: Briefcase, label: t(locale, 'nav_opportunities') },
    { href: '/requests', icon: MessageSquare, label: t(locale, 'nav_requests') },
    ...(member?.role === 'admin' ? [{ href: '/admin', icon: Shield, label: t(locale, 'nav_admin') }] : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const nav = (
    <>
      <div className="p-6 border-b border-[--apex-border]">
        <h1 className="font-playfair text-2xl font-bold tracking-[4px] bg-gradient-to-b from-white via-apex-gold to-apex-gold-dark bg-clip-text text-transparent">
          THE APEX
        </h1>
        <p className="text-[10px] text-apex-muted tracking-[3px] mt-1 uppercase">Members Area</p>
      </div>
      <nav className="flex-1 py-4">
        {links.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-6 py-3 text-[13px] font-medium tracking-[1px] transition-all
              ${pathname === href
                ? 'text-apex-gold border-r-2 border-apex-gold bg-[rgba(201,169,110,0.05)]'
                : 'text-apex-muted hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[--apex-border] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-apex-muted truncate max-w-[140px]">{member?.name}</div>
          <LanguageSwitcher />
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-[12px] text-apex-muted hover:text-red-400 transition-colors w-full">
          <LogOut size={14} /> {t(locale, 'nav_logout')}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 text-apex-gold p-2 bg-apex-card border border-[--apex-border]">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-apex-card border-r border-[--apex-border] flex flex-col z-40
        transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {nav}
      </aside>
    </>
  );
}
