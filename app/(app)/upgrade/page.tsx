'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useSession } from 'next-auth/react';
import { PLAN_HASHRATES, PLAN_RATES, PLAN_PRICES } from '@/lib/constants';

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ['45 MH/s hashrate', '1.15 DOGE/day', 'Basic dashboard', 'Referral rewards', 'Email support'],
  starter: ['185 MH/s hashrate', '5.04 DOGE/day', 'Advanced stats', 'Priority support', 'Earnings analytics'],
  pro:     ['620 MH/s hashrate', '17.28 DOGE/day', 'Real-time charts', 'API access', '24/7 priority support', 'Custom worker ID'],
  elite:   ['1,850 MH/s hashrate', '54.72 DOGE/day', 'Dedicated pool', 'White-glove support', 'Custom analytics', 'Early feature access'],
};

// Per-plan visual config
const PLAN_VISUAL: Record<string, {
  color: string;
  border: string;
  shadow: string;
  badge?: string;
  badgeStyle?: React.CSSProperties;
}> = {
  free: {
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.15)',
    shadow: 'none',
  },
  starter: {
    color: '#F7B731',
    border: '1px solid rgba(247,183,49,0.4)',
    shadow: '0 0 24px rgba(247,183,49,0.08)',
  },
  pro: {
    color: '#7B61FF',
    border: '1px solid rgba(123,97,255,0.5)',
    shadow: '0 0 30px rgba(123,97,255,0.15)',
    badge: 'MOST POPULAR',
    badgeStyle: { background: '#7B61FF', color: '#ffffff' },
  },
  elite: {
    color: '#00FFB2',
    border: '1px solid rgba(0,255,178,0.4)',
    shadow: '0 0 28px rgba(0,255,178,0.12)',
  },
};

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(12px)',
};

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
};

export default function UpgradePage() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const [dogePrice, setDogePrice] = useState(0.08);
  const [investment, setInvestment] = useState(100);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/market')
      .then((r) => r.json())
      .then((d) => setDogePrice(d.dogePrice ?? 0.08))
      .catch(() => {});
  }, []);

  const currentPlan = session?.user.plan ?? 'free';

  async function handleUpgrade(plan: string) {
    if (plan === currentPlan) return;
    setUpgrading(plan);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user.id, plan }),
      });
      if (res.ok) {
        await updateSession({ plan });
        toast(`Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`, 'success');
      } else {
        toast('Plan upgrade requested! Contact support to complete. (Demo: use admin panel)', 'info');
      }
    } finally {
      setUpgrading(null);
    }
  }

  const dailyRate = PLAN_RATES['pro'] * 60 * 24;
  const dailyUSD = dailyRate * dogePrice;
  const roi = {
    daily: dailyUSD.toFixed(4),
    monthly: (dailyUSD * 30).toFixed(3),
    yearly: (dailyUSD * 365).toFixed(2),
    breakEven: Math.ceil(PLAN_PRICES['pro'] / dailyUSD),
  };

  const plans = Object.keys(PLAN_HASHRATES);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Upgrade Plan
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          More hashrate = more DOGE earnings every minute
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const v = PLAN_VISUAL[plan] ?? PLAN_VISUAL.free;
          const isCurrent = plan === currentPlan;
          const dogePerDay = PLAN_RATES[plan] * 60 * 24;
          const price = PLAN_PRICES[plan];

          return (
            <div
              key={plan}
              className="flex flex-col relative transition-all duration-200 hover:-translate-y-1 p-6 rounded-2xl"
              style={{
                ...CARD,
                border: isCurrent ? `2px solid ${v.color}` : v.border,
                boxShadow: v.shadow,
              }}
            >
              {/* Most Popular badge */}
              {v.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ ...v.badgeStyle, fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {v.badge}
                </div>
              )}
              {/* Current plan badge */}
              {isCurrent && (
                <div
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${v.color}18`,
                    border: `1px solid ${v.color}40`,
                    color: v.color,
                    fontFamily: 'var(--font-space-grotesk)',
                  }}
                >
                  CURRENT
                </div>
              )}

              <h3
                className="font-bold text-lg mb-1 capitalize"
                style={{ color: v.color, fontFamily: 'var(--font-space-grotesk)' }}
              >
                {plan}
              </h3>
              <div className="mb-4">
                {price === 0 ? (
                  <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>${price}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                  </>
                )}
              </div>

              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-bold" style={{ color: v.color, fontFamily: 'var(--font-space-mono)' }}>
                  {PLAN_HASHRATES[plan].toLocaleString()} MH/s
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  ~{dogePerDay.toFixed(2)} DOGE/day
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  ≈ ${(dogePerDay * dogePrice).toFixed(3)}/day
                </p>
              </div>

              <ul className="flex-1 space-y-2 mb-5">
                {(PLAN_FEATURES[plan] ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <Check size={12} style={{ color: '#00FFB2', flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || upgrading === plan}
                className="w-full py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-default"
                style={
                  isCurrent
                    ? { background: `${v.color}12`, border: `1px solid ${v.color}30`, color: v.color }
                    : { background: '#F7B731', color: '#050810' }
                }
              >
                {upgrading === plan ? <Loader2 size={14} className="animate-spin" /> : null}
                {isCurrent ? 'Current Plan' : price === 0 ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ROI Calculator */}
      <div className="w-full p-6 rounded-2xl" style={{ ...CARD, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          ROI Calculator — Pro Plan
        </h3>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Estimate returns based on current DOGE price (
          <span style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}>
            ${dogePrice.toFixed(5)}
          </span>
          )
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Investment (USD)
          </label>
          <input
            type="number"
            value={investment}
            onChange={(e) => setInvestment(Math.max(1, Number(e.target.value)))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ ...INPUT_STYLE, fontFamily: 'var(--font-space-mono)' }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Daily',      value: `$${roi.daily}` },
            { label: 'Monthly',    value: `$${roi.monthly}` },
            { label: 'Yearly',     value: `$${roi.yearly}` },
            { label: 'Break-even', value: `${roi.breakEven}d` },
          ].map((r) => (
            <div key={r.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</p>
              <p
                className="font-bold text-sm"
                style={{ color: '#00FFB2', fontFamily: 'var(--font-space-mono)' }}
              >
                {r.value}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Estimates based on current DOGE price. Actual earnings may vary with market conditions.
        </p>
      </div>
    </div>
  );
}
