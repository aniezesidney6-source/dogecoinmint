'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Check, X, Edit2, Save, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface User {
  _id: string;
  username: string;
  email: string;
  plan: string;
  balance: number;
  hashrate: number;
  miningActive: boolean;
  referralCount: number;
  createdAt: string;
  isAdmin: boolean;
}

interface Withdrawal {
  _id: string;
  userId: { username: string; email: string };
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface MarketData {
  dogePrice: number;
  priceChange24h: number;
  networkHashrate: number;
  difficulty: number;
  blockHeight: number;
  activeMiners: number;
  fetchedAt: string;
}

// Design-system plan colors
const PLAN_COLORS: Record<string, string> = {
  free:    'rgba(255,255,255,0.45)',
  starter: '#F7B731',
  pro:     '#7B61FF',
  elite:   '#00E5FF',
};

function statusBadgeStyle(status: string) {
  if (status === 'approved' || status === 'completed')
    return { background: 'rgba(0,255,178,0.12)', color: '#00FFB2' };
  if (status === 'rejected')
    return { background: 'rgba(255,69,85,0.12)', color: '#FF4555' };
  return { background: 'rgba(247,183,49,0.12)', color: '#F7B731' };
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
}

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  backdropFilter: 'blur(12px)',
};

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<'users' | 'withdrawals' | 'market'>('users');

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wFilter, setWFilter] = useState('pending');
  const [wLoading, setWLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const [market, setMarket] = useState<MarketData | null>(null);
  const [mktLoading, setMktLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && !session?.user.isAdmin) router.replace('/dashboard');
  }, [status, session, router]);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setUsersLoading(false);
  }, [search]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab, loadUsers]);

  const loadWithdrawals = useCallback(async () => {
    setWLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${wFilter}`);
    if (res.ok) {
      const data = await res.json();
      setWithdrawals(data.withdrawals);
    }
    setWLoading(false);
  }, [wFilter]);

  useEffect(() => {
    if (tab === 'withdrawals') loadWithdrawals();
  }, [tab, loadWithdrawals]);

  async function loadMarket(force = false) {
    setMktLoading(true);
    const res = await fetch(`/api/market${force ? '?force=true' : ''}`);
    if (res.ok) setMarket(await res.json());
    setMktLoading(false);
  }

  useEffect(() => {
    if (tab === 'market') loadMarket();
  }, [tab]);

  async function saveBalance(userId: string) {
    const balance = parseFloat(editBalanceValue);
    if (isNaN(balance)) return;
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, balance }),
    });
    if (res.ok) {
      toast('Balance updated', 'success');
      setEditingBalance(null);
      loadUsers();
    }
  }

  async function handleWithdrawalAction() {
    if (!confirmModal) return;
    setActionLoading(confirmModal.id);
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId: confirmModal.id, action: confirmModal.action }),
    });
    if (res.ok) {
      toast(`Withdrawal ${confirmModal.action === 'approve' ? 'approved' : 'rejected'}`, 'success');
      loadWithdrawals();
    } else {
      toast('Action failed', 'error');
    }
    setConfirmModal(null);
    setActionLoading(null);
  }

  if (status === 'loading') return null;
  if (!session?.user.isAdmin) return null;

  const totalBalance = users.reduce((a, u) => a + u.balance, 0);
  const activeMiners = users.filter((u) => u.miningActive).length;
  const pendingWdCount = withdrawals.filter((w) => w.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Manage users, withdrawals, and market data</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',          value: users.length.toString(),          color: '#00E5FF' },
          { label: 'Active Miners',        value: activeMiners.toString(),          color: '#00FFB2' },
          { label: 'Platform Balance',     value: `${totalBalance.toFixed(0)} DOGE`, color: '#F7B731' },
          { label: 'Pending Withdrawals',  value: String(pendingWdCount),           color: '#FF4555' },
        ].map((s) => (
          <div key={s.label} className="p-4" style={CARD}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            <p className="font-bold text-xl" style={{ color: s.color, fontFamily: 'var(--font-space-mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['users', 'withdrawals', 'market'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? 'rgba(247,183,49,0.12)' : 'transparent',
              color: tab === t ? '#F7B731' : 'rgba(255,255,255,0.5)',
              borderBottom: tab === t ? '1px solid rgba(247,183,49,0.4)' : '1px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="p-6" style={CARD}>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>
          </div>
          {usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['User', 'Plan', 'Balance', 'Hashrate', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const pc = PLAN_COLORS[u.plan] ?? 'rgba(255,255,255,0.45)';
                    return (
                      <tr
                        key={u._id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        className="transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(247,183,49,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: `${pc}18`, color: pc }}
                            >
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{u.username}</p>
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                            style={{ background: `${pc}18`, color: pc, fontFamily: 'var(--font-space-grotesk)' }}
                          >
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {editingBalance === u._id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editBalanceValue}
                                onChange={(e) => setEditBalanceValue(e.target.value)}
                                className="w-20 px-2 py-1 rounded-lg text-xs outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(247,183,49,0.3)', color: '#fff', fontFamily: 'var(--font-space-mono)' }}
                              />
                              <button
                                onClick={() => saveBalance(u._id)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#00FFB2' }}
                              >
                                <Save size={12} />
                              </button>
                              <button
                                onClick={() => setEditingBalance(null)}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#FF4555' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ fontFamily: 'var(--font-space-mono)' }}>{u.balance.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs" style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}>
                            {u.hashrate.toFixed(0)} MH/s
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{
                                background: u.miningActive ? '#00FFB2' : 'rgba(255,255,255,0.2)',
                                boxShadow: u.miningActive ? '0 0 4px #00FFB2' : 'none',
                              }}
                            />
                            <span className="text-xs" style={{ color: u.miningActive ? '#00FFB2' : 'rgba(255,255,255,0.4)' }}>
                              {u.miningActive ? 'Mining' : 'Paused'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{timeAgo(u.createdAt)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => { setEditingBalance(u._id); setEditBalanceValue(u.balance.toFixed(2)); }}
                            className="p-1.5 rounded-lg transition-all hover:-translate-y-0.5"
                            style={{ color: '#F7B731', background: 'rgba(247,183,49,0.08)' }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No users found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Withdrawals tab */}
      {tab === 'withdrawals' && (
        <div className="p-6" style={CARD}>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={wFilter}
              onChange={(e) => setWFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm outline-none transition-all"
              style={INPUT_STYLE}
              onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
              onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
            >
              {['pending', 'approved', 'rejected', 'all'].map((f) => (
                <option key={f} value={f} style={{ background: '#0D1117' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {wLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['User', 'Amount', 'Wallet Address', 'Requested', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr
                      key={w._id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(247,183,49,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="py-3 px-3">
                        <p className="text-xs font-medium">{w.userId?.username ?? 'Unknown'}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{w.userId?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-bold" style={{ color: '#FF4555', fontFamily: 'var(--font-space-mono)' }}>
                          {w.amount.toFixed(2)} DOGE
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-space-mono)' }}>
                          {w.walletAddress.slice(0, 16)}...
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{timeAgo(w.createdAt)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={statusBadgeStyle(w.status)}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {w.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setConfirmModal({ id: w._id, action: 'approve' })}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                              style={{ background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', color: '#00FFB2' }}
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => setConfirmModal({ id: w._id, action: 'reject' })}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                              style={{ background: 'rgba(255,69,85,0.1)', border: '1px solid rgba(255,69,85,0.25)', color: '#FF4555' }}
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {withdrawals.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No withdrawals</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Market tab */}
      {tab === 'market' && (
        <div className="p-6" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Cached Market Data</h3>
            <button
              onClick={() => loadMarket(true)}
              disabled={mktLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: 'rgba(247,183,49,0.1)', border: '1px solid rgba(247,183,49,0.25)', color: '#F7B731' }}
            >
              <RefreshCw size={14} className={mktLoading ? 'animate-spin' : ''} />
              Refresh Now
            </button>
          </div>
          {market ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'DOGE Price',       value: `$${market.dogePrice.toFixed(6)}`,        color: '#F7B731' },
                { label: '24h Change',        value: `${market.priceChange24h >= 0 ? '+' : ''}${market.priceChange24h.toFixed(2)}%`, color: market.priceChange24h >= 0 ? '#00FFB2' : '#FF4555' },
                { label: 'Network Hashrate', value: `${market.networkHashrate.toFixed(0)} TH/s`, color: '#00E5FF' },
                { label: 'Difficulty',        value: market.difficulty.toLocaleString(),       color: '#7B61FF' },
                { label: 'Block Height',      value: market.blockHeight.toLocaleString(),      color: '#F7B731' },
                { label: 'Active Miners',     value: String(market.activeMiners),              color: '#00FFB2' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
                  <p className="font-bold" style={{ color: item.color, fontFamily: 'var(--font-space-mono)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          )}
          {market && (
            <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Last fetched: {new Date(market.fetchedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{ ...CARD, border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {confirmModal.action === 'approve' ? 'Approve' : 'Reject'} Withdrawal?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {confirmModal.action === 'reject'
                ? 'The amount will be refunded to the user.'
                : 'This will mark the withdrawal as approved.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleWithdrawalAction}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={
                  confirmModal.action === 'approve'
                    ? { background: '#00FFB2', color: '#050810' }
                    : { background: '#FF4555', color: '#ffffff' }
                }
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
