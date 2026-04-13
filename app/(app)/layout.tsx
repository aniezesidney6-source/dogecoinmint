'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Wallet, Users, ArrowUpCircle,
  Settings, LogOut, Menu, ChevronRight
} from 'lucide-react';
import { FloatingParticles } from '@/components/FloatingParticles';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/wallet',    label: 'Wallet',    icon: <Wallet size={18} /> },
  { href: '/referrals', label: 'Referrals', icon: <Users size={18} /> },
  { href: '/upgrade',   label: 'Upgrade',   icon: <ArrowUpCircle size={18} /> },
];

// Aligned with design system tokens
const PLAN_COLORS: Record<string, string> = {
  free:    'rgba(255,255,255,0.45)',
  starter: '#F7B731',
  pro:     '#7B61FF',
  elite:   '#00E5FF',
};

function DogeCoinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-nav" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-nav)" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dogePrice, setDogePrice] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('/api/market');
        const data = await res.json();
        setDogePrice(data.dogePrice ?? null);
      } catch {}
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#F7B731', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!session) return null;

  const plan = session.user.plan ?? 'free';
  const planColor = PLAN_COLORS[plan] ?? 'rgba(255,255,255,0.45)';
  const username = session.user.name ?? session.user.email ?? 'User';
  const initials = username.slice(0, 2).toUpperCase();

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full"
      style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="inline-flex items-center gap-2">
          <DogeCoinIcon />
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
          >
            <span style={{ color: '#F7B731' }}>Dogecoin</span>
            <span style={{ color: '#00FFB2' }}>Mint</span>
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: `${planColor}22`,
              color: planColor,
              border: `1px solid ${planColor}40`,
              fontFamily: 'var(--font-space-grotesk)',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{username}</p>
            <span
              className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: `${planColor}18`,
                color: planColor,
                fontFamily: 'var(--font-space-grotesk)',
              }}
            >
              {plan}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(247,183,49,0.08)' : 'transparent',
                color: active ? '#F7B731' : 'rgba(255,255,255,0.45)',
                borderLeft: active ? '2px solid #F7B731' : '2px solid transparent',
              }}
            >
              {item.icon}
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" style={{ color: '#F7B731' }} />}
            </Link>
          );
        })}
        {session.user.isAdmin && (
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2"
            style={{
              background: pathname === '/admin' ? 'rgba(247,183,49,0.08)' : 'transparent',
              color: pathname === '/admin' ? '#F7B731' : 'rgba(255,255,255,0.4)',
              borderLeft: pathname === '/admin' ? '2px solid #F7B731' : '2px solid transparent',
            }}
          >
            <Settings size={18} />
            Admin
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {dogePrice !== null && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>DOGE</span>
            <span className="text-xs font-bold" style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}>
              ${dogePrice.toFixed(5)}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,69,85,0.08)';
            e.currentTarget.style.color = '#FF4555';
            e.currentTarget.style.borderColor = 'rgba(255,69,85,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050810' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-shrink-0 flex-col h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-60 h-full flex-shrink-0 flex flex-col z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle particles behind content */}
        <FloatingParticles count={14} opacity={0.5} />

        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 relative z-10"
          style={{ background: 'rgba(13,17,23,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: '#F7B731' }}>
            <Menu size={22} />
          </button>
          <span
            className="font-bold text-base"
            style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
          >
            <span style={{ color: '#F7B731' }}>Dogecoin</span>
            <span style={{ color: '#00FFB2' }}>Mint</span>
          </span>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
