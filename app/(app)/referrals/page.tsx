'use client';

import { useEffect, useState } from 'react';
import { Copy, Send, CheckCircle, X as XIcon } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface Stats {
  referralCode: string;
  referralCount: number;
  totalEarned: number;
  plan: string;
}

// Updated tier colors for design system
const TIERS = [
  { name: 'Bronze',  min: 0,  max: 4,        boost: '5%',  color: '#F7B731',              glow: 'rgba(247,183,49,0.15)' },
  { name: 'Silver',  min: 5,  max: 14,       boost: '10%', color: 'rgba(255,255,255,0.7)', glow: 'rgba(255,255,255,0.08)' },
  { name: 'Gold',    min: 15, max: 29,       boost: '15%', color: '#F7B731',              glow: 'rgba(247,183,49,0.2)' },
  { name: 'Diamond', min: 30, max: Infinity, boost: '25%', color: '#7B61FF',              glow: 'rgba(123,97,255,0.2)' },
];

function getTier(refs: number) {
  return TIERS.find((t) => refs >= t.min && refs <= t.max) ?? TIERS[0];
}
function getNextTier(refs: number) {
  const idx = TIERS.findIndex((t) => refs >= t.min && refs <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  backdropFilter: 'blur(12px)',
};

export default function ReferralsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/user/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const referralURL = stats
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${stats.referralCode}`
    : '';

  async function copyURL() {
    await navigator.clipboard.writeText(referralURL);
    setCopied(true);
    toast('Referral link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card h-28 shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20 shimmer" />)}
        </div>
        <div className="card h-48 shimmer" />
      </div>
    );
  }

  if (!stats) return null;

  const refs = stats.referralCount;
  const tier = getTier(refs);
  const nextTier = getNextTier(refs);
  const progressPct = nextTier
    ? Math.min(100, ((refs - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;
  const bonusEarned = (stats.totalEarned * Math.min(refs * 0.05, 0.5)).toFixed(4);
  const boostPct = Math.min(refs * 5, 50);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Referrals</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Earn more by growing the DogecoinMint community
        </p>
      </div>

      {/* Referral URL card */}
      <div className="p-6" style={CARD}>
        <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Your Referral Link</h3>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Share this link to earn mining bonuses for every friend who joins.
        </p>
        <div className="flex gap-2">
          <div
            className="flex-1 px-4 py-3 rounded-xl text-sm truncate"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.65)',
              fontFamily: 'var(--font-space-mono)',
            }}
          >
            {referralURL}
          </div>
          <button
            onClick={copyURL}
            className="px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5 flex-shrink-0 font-bold"
            style={
              copied
                ? { background: 'rgba(0,255,178,0.12)', border: '1px solid rgba(0,255,178,0.3)', color: '#00FFB2' }
                : { background: 'rgba(247,183,49,0.12)', border: '1px solid rgba(247,183,49,0.3)', color: '#F7B731' }
            }
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <a
            href={`https://twitter.com/intent/tweet?text=I'm mining DOGE on DogecoinMint! Join me: ${encodeURIComponent(referralURL)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(247,183,49,0.1)', border: '1px solid rgba(247,183,49,0.25)', color: '#F7B731' }}
          >
            <XIcon size={14} /> Tweet
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralURL)}&text=Join DogecoinMint and earn DOGE!`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', color: '#00FFB2' }}
          >
            <Send size={14} /> Telegram
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 text-center" style={CARD}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Referrals</p>
          <p className="font-bold text-2xl" style={{ color: '#00E5FF', fontFamily: 'var(--font-space-mono)' }}>{refs}</p>
        </div>
        <div className="p-4 text-center" style={CARD}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Bonus Earned</p>
          <p className="font-bold text-xl" style={{ color: '#00FFB2', fontFamily: 'var(--font-space-mono)' }}>{bonusEarned}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>DOGE</p>
        </div>
        <div className="p-4 text-center" style={CARD}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Earnings Boost</p>
          <p className="font-bold text-2xl" style={{ color: '#F7B731', fontFamily: 'var(--font-space-mono)' }}>+{boostPct}%</p>
        </div>
      </div>

      {/* Tier progress */}
      <div className="p-6" style={CARD}>
        <h3 className="font-bold text-base mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Referral Tiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {TIERS.map((t) => {
            const active = tier.name === t.name;
            return (
              <div
                key={t.name}
                className="p-4 rounded-xl text-center transition-all"
                style={{
                  background: active ? t.glow : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? t.color + '50' : 'rgba(255,255,255,0.06)'}`,
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: active ? `0 0 20px ${t.glow}` : 'none',
                }}
              >
                <p
                  className="font-bold text-sm mb-1"
                  style={{ fontFamily: 'var(--font-space-grotesk)', color: active ? t.color : 'rgba(255,255,255,0.4)' }}
                >
                  {t.name}
                </p>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max}`} refs
                </p>
                <p
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-space-mono)', color: active ? t.color : 'rgba(255,255,255,0.3)' }}
                >
                  +{t.boost}
                </p>
              </div>
            );
          })}
        </div>

        {nextTier && (
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: tier.color }}>{tier.name} tier</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                {nextTier.min - refs} more to {nextTier.name}
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: '#F7B731' }}
              />
            </div>
          </div>
        )}
        {!nextTier && (
          <div className="text-center py-3">
            <p className="text-sm font-bold" style={{ color: '#7B61FF', fontFamily: 'var(--font-space-grotesk)' }}>
              You've reached Diamond tier! Maximum boost active.
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="p-6" style={CARD}>
        <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Link', desc: 'Copy your unique referral link and share it with friends on social media or directly.' },
            { step: '2', title: 'Friends Sign Up', desc: "When they register using your link, they're linked to your account automatically." },
            { step: '3', title: 'Earn More DOGE', desc: 'Every referral adds 5% to your mining earnings, stacking up to a 50% total boost.' },
          ].map((s) => (
            <div key={s.step} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold mb-3"
                style={{
                  background: 'rgba(247,183,49,0.12)',
                  color: '#F7B731',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                {s.step}
              </div>
              <h4 className="font-semibold text-sm mb-1">{s.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
