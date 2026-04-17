'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Cpu, DollarSign, TrendingUp, Award, Play, Pause, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MiningRing } from '@/components/MiningRing';
import { EarningsChart } from '@/components/EarningsChart';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/components/ToastProvider';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Design-system-aligned plan colors
const PLAN_COLORS: Record<string, string> = {
  free:    'rgba(255,255,255,0.45)',
  starter: '#F7B731',
  pro:     '#7B61FF',
  elite:   '#00E5FF',
};

const PLAN_MAX_HASHRATES: Record<string, number> = {
  free: 45, starter: 185, pro: 620, elite: 1850,
};

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface MarketData {
  dogePrice: number;
  priceChange24h: number;
  networkHashrate: number;
  difficulty: number;
  blockHeight: number;
}

interface StatsData {
  balance: number;
  totalEarned: number;
  hashrate: number;
  plan: string;
  miningActive: boolean;
  referralCount: number;
  referralCode: string;
  username: string;
  lastMined: number | null;
  earnRatePerSecond: number;
  marketData: MarketData;
  transactions: Transaction[];
}

interface PricePoint { date: string; price: number }

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function txColor(tx: Transaction): string {
  if (tx.type === 'withdrawal') return '#FF4555';
  if (tx.type === 'deposit') return '#F7B731';
  return '#00FFB2'; // mining, referral
}

const TX_ICONS: Record<string, string> = { mining: '⛏', referral: '👥', deposit: '↓', withdrawal: '↑' };

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.000001) { setValue(target); return; }
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setValue(start + diff * (step / steps));
      if (step >= steps) { clearInterval(timer); setValue(target); prev.current = target; }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// Computes a live-increasing display balance without waiting for DB updates.
// DB balance updates once daily via cron; this adds accrued earnings in real time.
function useLiveBalance(
  dbBalance: number,
  earnRatePerSecond: number,
  lastMined: number | null,
): number {
  const computeLive = () => {
    if (earnRatePerSecond <= 0 || lastMined === null) return dbBalance;
    const secondsElapsed = Math.max(0, (Date.now() - lastMined) / 1000);
    return dbBalance + earnRatePerSecond * secondsElapsed;
  };

  const [display, setDisplay] = useState(computeLive);

  // Resync baseline whenever the DB value or rate changes
  useEffect(() => {
    setDisplay(computeLive());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbBalance, earnRatePerSecond, lastMined]);

  // Tick every second to advance the displayed balance
  useEffect(() => {
    if (earnRatePerSecond <= 0) return;
    const id = setInterval(() => setDisplay(computeLive()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbBalance, earnRatePerSecond, lastMined]);

  return display;
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  backdropFilter: 'blur(12px)',
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isFrozen = session?.user?.isFrozen ?? false;
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [priceChart, setPriceChart] = useState<PricePoint[]>([]);

  const balance = useLiveBalance(
    stats?.balance ?? 0,
    stats?.earnRatePerSecond ?? 0,
    stats?.lastMined ?? null,
  );
  const hashrate = useCountUp(stats?.hashrate ?? 0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    async function loadChart() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/dogecoin/market_chart?vs_currency=usd&days=7');
        if (res.ok) {
          const data = await res.json();
          setPriceChart(
            (data.prices as number[][]).map((p) => ({
              date: new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: parseFloat(p[1].toFixed(6)),
            }))
          );
        }
      } catch {}
    }
    loadChart();
  }, []);

  async function toggleMining() {
    setToggleLoading(true);
    try {
      const res = await fetch('/api/user/mining/toggle', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStats((prev) => prev ? { ...prev, miningActive: data.miningActive } : prev);
        toast(data.miningActive ? 'Mining started!' : 'Mining paused', 'success');
      }
    } finally {
      setToggleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-28 shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="card h-64 shimmer lg:col-span-2" />
          <div className="card h-64 shimmer lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const plan = stats.plan;
  const color = PLAN_COLORS[plan] ?? 'rgba(255,255,255,0.45)';
  const maxHashrate = PLAN_MAX_HASHRATES[plan] ?? 45;
  const dogePrice = stats.marketData?.dogePrice ?? 0.08;
  const usdBalance = (balance * dogePrice).toFixed(2);
  const earned24h = (stats.totalEarned * 0.05).toFixed(4);
  const efficiency = Math.min(100, Math.round((hashrate / maxHashrate) * 100));
  const workerID = `DM-${stats.referralCode?.toUpperCase() ?? 'XXXX'}-01`;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Frozen banner */}
      {isFrozen && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(247,183,49,0.08)', border: '1px solid rgba(247,183,49,0.3)', color: '#F7B731' }}
        >
          <span>⚠</span>
          Your account is frozen. Contact{' '}
          <a href="mailto:support@dogecoinmint.com" style={{ color: '#F7B731', textDecoration: 'underline' }}>
            support@dogecoinmint.com
          </a>{' '}
          to resolve this.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Mining Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Real-time stats — updates every 4 seconds
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={18} />}
          iconColor="#F7B731"
          label="Balance"
          value={`${balance.toFixed(4)} DOGE`}
          subValue={`≈ $${usdBalance} USD`}
          mono
        />
        <StatCard
          icon={<Cpu size={18} />}
          iconColor={color}
          label="Hashrate"
          value={`${hashrate.toFixed(1)} MH/s`}
          subValue={`${efficiency}% efficiency`}
          mono
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          iconColor="#00FFB2"
          label="Earned Today"
          value={`${earned24h} DOGE`}
          subValue={`$${(parseFloat(earned24h) * dogePrice).toFixed(4)}`}
          mono
        />
        <StatCard
          icon={<Award size={18} />}
          iconColor="#F7B731"
          label="Total Earned"
          value={`${stats.totalEarned.toFixed(4)} DOGE`}
          subValue={`$${(stats.totalEarned * dogePrice).toFixed(2)}`}
          mono
        />
      </div>

      {/* Mining ring + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="p-6 lg:col-span-2 flex flex-col items-center" style={CARD_STYLE}>
          <MiningRing
            hashrate={hashrate}
            maxHashrate={maxHashrate}
            plan={plan}
            color={color}
            miningActive={stats.miningActive}
          />

          {/* Active badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full mt-4"
            style={{
              background: stats.miningActive ? 'rgba(0,255,178,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${stats.miningActive ? 'rgba(0,255,178,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: stats.miningActive ? '#00FFB2' : 'rgba(255,255,255,0.25)',
                boxShadow: stats.miningActive ? '0 0 6px #00FFB2' : 'none',
              }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: stats.miningActive ? '#00FFB2' : 'rgba(255,255,255,0.4)' }}
            >
              {stats.miningActive ? 'Active' : 'Paused'}
            </span>
          </div>

          {/* Toggle button */}
          <button
            onClick={toggleMining}
            disabled={toggleLoading || isFrozen}
            className="mt-4 w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={
              stats.miningActive
                ? { background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', color: '#00FFB2' }
                : { background: '#F7B731', color: '#050810' }
            }
          >
            {stats.miningActive ? <Pause size={16} /> : <Play size={16} />}
            {stats.miningActive ? 'Stop Mining' : 'Start Mining'}
          </button>

          {/* Pool info */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Pool</span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>DogecoinMint Global #1</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Worker ID</span>
              <span style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}>{workerID}</span>
            </div>
          </div>
        </div>

        {/* Stats panel */}
        <div className="p-6 lg:col-span-3 flex flex-col" style={CARD_STYLE}>
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Mining Stats</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Plan', value: plan.charAt(0).toUpperCase() + plan.slice(1), color },
              { label: 'Workers', value: '1' },
              { label: 'Efficiency', value: `${efficiency}%`, color: efficiency >= 80 ? '#00FFB2' : '#F7B731' },
              { label: 'Uptime', value: '99.9%', color: '#00FFB2' },
              { label: 'Difficulty', value: (stats.marketData?.difficulty ?? 0).toLocaleString().slice(0, 8), small: true },
              { label: 'Block Reward', value: '10,000 DOGE' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                <p
                  className={`font-semibold text-sm ${s.small ? 'text-xs' : ''}`}
                  style={{ color: s.color ?? '#ffffff', fontFamily: 'var(--font-space-mono)' }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>14-Day Earnings</p>
            <EarningsChart dogePrice={dogePrice} />
          </div>
        </div>
      </div>

      {/* Transactions + price chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="p-6" style={CARD_STYLE}>
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Recent Transactions</h3>
          {stats.transactions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {stats.transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    {TX_ICONS[tx.type] ?? '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{timeAgo(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: txColor(tx), fontFamily: 'var(--font-space-mono)' }}
                    >
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(4)}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: tx.status === 'completed' ? 'rgba(0,255,178,0.1)' : 'rgba(247,183,49,0.1)',
                        color: tx.status === 'completed' ? '#00FFB2' : '#F7B731',
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DOGE price chart */}
        <div className="p-6" style={CARD_STYLE}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-space-grotesk)' }}>DOGE / USD (7d)</h3>
            <div className="flex items-center gap-2">
              <span style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)', fontSize: 14, fontWeight: 700 }}>
                ${dogePrice.toFixed(5)}
              </span>
              <span
                className="text-xs"
                style={{ color: (stats.marketData?.priceChange24h ?? 0) >= 0 ? '#00FFB2' : '#FF4555' }}
              >
                {(stats.marketData?.priceChange24h ?? 0) >= 0 ? '▲' : '▼'}
                {Math.abs(stats.marketData?.priceChange24h ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
          {priceChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={priceChart}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F7B731" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F7B731" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(13,17,23,0.97)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  itemStyle={{ color: '#F7B731', fontSize: 12 }}
                  formatter={(v: unknown) => [`$${(v as number).toFixed(5)}`, 'DOGE']}
                />
                <Area type="monotone" dataKey="price" stroke="#F7B731" strokeWidth={2} fill="url(#priceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <Activity size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Network Hash', value: `${(stats.marketData?.networkHashrate ?? 0).toFixed(0)} TH/s` },
              { label: 'Block Height', value: (stats.marketData?.blockHeight ?? 0).toLocaleString() },
              { label: 'Referrals', value: String(stats.referralCount) },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                <p className="text-xs font-medium" style={{ fontFamily: 'var(--font-space-mono)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
