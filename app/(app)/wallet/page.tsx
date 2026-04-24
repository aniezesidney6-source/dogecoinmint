'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Loader2, Copy, CheckCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
}

interface Stats {
  balance: number;
  marketData: { dogePrice: number };
}

const DEPOSIT_ADDRESS = 'D7xQ3mK9pR2nV8wA4fL6tY1cB5hJ0eN3uG';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${DEPOSIT_ADDRESS}&bgcolor=050810&color=F7B731`;

const TX_ICONS: Record<string, React.ReactNode> = {
  mining:     <span>⛏</span>,
  referral:   <span>👥</span>,
  deposit:    <ArrowDownCircle size={16} style={{ color: '#F7B731' }} />,
  withdrawal: <ArrowUpCircle size={16} style={{ color: '#FF4555' }} />,
};

function txAmountColor(tx: Transaction) {
  if (tx.type === 'withdrawal') return '#FF4555';
  if (tx.type === 'deposit') return '#F7B731';
  return '#00FFB2';
}

function statusBadgeStyle(status: string) {
  if (status === 'completed' || status === 'approved')
    return { background: 'rgba(0,255,178,0.1)', color: '#00FFB2' };
  if (status === 'rejected')
    return { background: 'rgba(255,69,85,0.1)', color: '#FF4555' };
  return { background: 'rgba(247,183,49,0.1)', color: '#F7B731' };
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

function focusGold(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)';
}
function blurDefault(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
}

export default function WalletPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'history' | 'deposit' | 'withdraw'>('history');
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState('all');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [statsRes, txRes] = await Promise.all([
      fetch('/api/user/stats'),
      fetch(`/api/user/transactions?page=${txPage}&limit=15&type=${txFilter}`),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (txRes.ok) {
      const d = await txRes.json();
      setTransactions(d.transactions);
      setTxTotal(d.total);
    }
    setLoading(false);
  }, [txPage, txFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    async function loadWithdrawals() {
      const res = await fetch('/api/user/transactions?type=withdrawal&limit=10');
      if (res.ok) {
        const d = await res.json();
        setWithdrawals(d.transactions.filter((t: Transaction) => t.type === 'withdrawal'));
      }
    }
    loadWithdrawals();
  }, [tab]);

  function handleCopyAddress() {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS).then(() => {
      setCopied(true);
      toast('Address copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    setDepositLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`${amount} DOGE deposited successfully!`, 'success');
        setDepositAmount('');
        setStats((prev) => prev ? { ...prev, balance: data.balance } : prev);
        loadData();
      } else {
        toast(data.error ?? 'Deposit failed', 'error');
      }
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAddress.trim()) { toast('Enter a wallet address', 'error'); return; }
    setWithdrawLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, walletAddress: withdrawAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Withdrawal submitted! Processing in 3–5 business days.', 'success');
        setWithdrawAmount('');
        setWithdrawAddress('');
        loadData();
      } else {
        toast(data.error ?? 'Withdrawal failed', 'error');
      }
    } finally {
      setWithdrawLoading(false);
    }
  }

  const dogePrice = stats?.marketData?.dogePrice ?? 0.08;
  const balance = stats?.balance ?? 0;
  const totalPages = Math.ceil(txTotal / 15);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card h-32 shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20 shimmer" />)}
        </div>
        <div className="card h-64 shimmer" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Wallet</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Manage your DOGE balance</p>
      </div>

      {/* Balance hero */}
      <div className="w-full p-8 text-center" style={CARD}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,229,255,0.1)' }}
        >
          <Wallet size={22} style={{ color: '#00E5FF' }} />
        </div>
        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Available Balance</p>
        <p
          className="font-bold text-4xl md:text-5xl"
          style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}
        >
          {balance.toFixed(4)} DOGE
        </p>
        <p
          className="text-lg mt-2"
          style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-space-mono)' }}
        >
          ≈ ${(balance * dogePrice).toFixed(2)} USD
        </p>
      </div>

      {/* Mini stats */}
      <div className="w-full grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Deposited',
            value: `${transactions.filter(t => t.type === 'deposit' && t.amount > 0).reduce((a, t) => a + t.amount, 0).toFixed(2)} DOGE`,
            color: '#F7B731',
          },
          {
            label: 'Total Withdrawn',
            value: `${Math.abs(transactions.filter(t => t.type === 'withdrawal').reduce((a, t) => a + t.amount, 0)).toFixed(2)} DOGE`,
            color: '#FF4555',
          },
          {
            label: 'Pending',
            value: `${withdrawals.filter(w => w.status === 'pending').length}`,
            color: '#F7B731',
          },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center" style={CARD}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            <p className="font-semibold text-sm" style={{ color: s.color, fontFamily: 'var(--font-space-mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="w-full flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['history', 'deposit', 'withdraw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
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

      {/* History tab */}
      {tab === 'history' && (
        <div className="w-full p-8" style={CARD}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h3 className="font-bold text-base flex-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Transaction History</h3>
            <select
              value={txFilter}
              onChange={(e) => { setTxFilter(e.target.value); setTxPage(1); }}
              className="px-3 py-1.5 rounded-xl text-xs outline-none transition-all"
              style={{ ...INPUT_STYLE, fontFamily: 'var(--font-space-grotesk)' }}
              onFocus={focusGold}
              onBlur={blurDefault}
            >
              {['all', 'mining', 'deposit', 'withdrawal', 'referral'].map((f) => (
                <option key={f} value={f} style={{ background: '#0D1117' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    {TX_ICONS[tx.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{timeAgo(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: txAmountColor(tx), fontFamily: 'var(--font-space-mono)' }}
                    >
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(4)} DOGE
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={statusBadgeStyle(tx.status)}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setTxPage(p)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: txPage === p ? 'rgba(247,183,49,0.15)' : 'rgba(255,255,255,0.05)',
                    color: txPage === p ? '#F7B731' : 'rgba(255,255,255,0.5)',
                    border: txPage === p ? '1px solid rgba(247,183,49,0.3)' : '1px solid transparent',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deposit tab */}
      {tab === 'deposit' && (
        <div className="w-full p-8 space-y-8" style={CARD}>
          <div>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Deposit DOGE</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Send DOGE to the address below, then confirm the amount to credit your account.
            </p>
          </div>

          {/* Wallet address card */}
          <div
            className="w-full rounded-2xl p-6"
            style={{
              background: 'rgba(247,183,49,0.04)',
              border: '1px solid rgba(247,183,49,0.18)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: 'rgba(247,183,49,0.6)' }}
            >
              ChainForgeX Deposit Address
            </p>

            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* QR code */}
              <div
                className="flex-shrink-0 rounded-2xl overflow-hidden"
                style={{ border: '2px solid rgba(247,183,49,0.25)', lineHeight: 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={QR_URL}
                  alt="Deposit QR code"
                  width={180}
                  height={180}
                  style={{ display: 'block' }}
                />
              </div>

              {/* Address + copy */}
              <div className="flex-1 w-full min-w-0">
                <div
                  className="w-full px-4 py-3 rounded-xl mb-3 break-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(247,183,49,0.2)',
                  }}
                >
                  <p
                    className="text-sm leading-relaxed select-all"
                    style={{ color: '#F7B731', fontFamily: 'var(--font-space-mono)' }}
                  >
                    {DEPOSIT_ADDRESS}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5 mb-5"
                  style={{
                    background: copied ? 'rgba(0,255,178,0.12)' : 'rgba(247,183,49,0.12)',
                    border: copied ? '1px solid rgba(0,255,178,0.3)' : '1px solid rgba(247,183,49,0.3)',
                    color: copied ? '#00FFB2' : '#F7B731',
                  }}
                >
                  {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                {/* Network badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                  style={{ background: 'rgba(0,255,178,0.07)', border: '1px solid rgba(0,255,178,0.15)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#00FFB2', boxShadow: '0 0 6px #00FFB2' }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#00FFB2' }}>
                    DOGE Network • ~1 min confirmation
                  </span>
                </div>

                {/* Warning notice */}
                <div
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,69,85,0.06)', border: '1px solid rgba(255,69,85,0.15)' }}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#FF4555' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Send only <strong style={{ color: '#ffffff' }}>DOGE</strong> to this address. Minimum deposit: <strong style={{ color: '#ffffff' }}>10 DOGE</strong>. Deposits reflect within 3–6 network confirmations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Confirm amount to credit balance
            </span>
            <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Amount form */}
          <form onSubmit={handleDeposit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Amount (DOGE)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="10"
                step="0.01"
                required
                placeholder="Min. 10 DOGE"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-space-mono)' }}
                onFocus={focusGold}
                onBlur={blurDefault}
              />
              {depositAmount && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  ≈ ${(parseFloat(depositAmount) * dogePrice).toFixed(4)} USD
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {[10, 50, 100, 500].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setDepositAmount(String(a))}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(247,183,49,0.06)',
                    border: '1px solid rgba(247,183,49,0.15)',
                    color: '#F7B731',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={depositLoading}
              className="w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#F7B731', color: '#050810' }}
            >
              {depositLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownCircle size={16} />}
              Confirm Deposit
            </button>
          </form>
        </div>
      )}

      {/* Withdraw tab */}
      {tab === 'withdraw' && (
        <div className="w-full p-8" style={CARD}>
          <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Withdraw DOGE</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Minimum 10 DOGE · 0.5 DOGE network fee · Processed within 3–5 business days
          </p>
          <form onSubmit={handleWithdraw} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Amount (DOGE)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="10"
                step="0.01"
                required
                placeholder="Min. 10 DOGE"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-space-mono)' }}
                onFocus={focusGold}
                onBlur={blurDefault}
              />
              {withdrawAmount && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Total deducted: {(parseFloat(withdrawAmount) + 0.5).toFixed(2)} DOGE (incl. fee)
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>DOGE Wallet Address</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                required
                placeholder="D..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ ...INPUT_STYLE, fontFamily: 'var(--font-space-mono)' }}
                onFocus={focusGold}
                onBlur={blurDefault}
              />
            </div>
            <button
              type="submit"
              disabled={withdrawLoading}
              className="w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#00FFB2', color: '#050810' }}
            >
              {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />}
              Submit Withdrawal
            </button>
          </form>

          {withdrawals.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Recent Withdrawals</h4>
              <div className="space-y-2">
                {withdrawals.slice(0, 5).map((w) => (
                  <div
                    key={w._id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Clock size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs truncate"
                        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-space-mono)' }}
                      >
                        {w.walletAddress}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(w.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm"
                        style={{ color: '#FF4555', fontFamily: 'var(--font-space-mono)' }}
                      >
                        {Math.abs(w.amount).toFixed(2)} DOGE
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={statusBadgeStyle(w.status)}>
                        {w.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
