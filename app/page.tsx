'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Cpu, Zap, Users, Shield, Clock,
  Send, Globe, TrendingUp, X as XIcon,
} from 'lucide-react';
import { LiveTicker } from '@/components/LiveTicker';
import { FAQAccordion } from '@/components/FAQAccordion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface MarketData {
  dogePrice: number;
  priceChange24h: number;
  networkHashrate: number;
  activeMiners: number;
  marketCap: number;
}
interface PricePoint { date: string; price: number; }
interface Particle { x: number; y: number; size: number; duration: number; delay: number; }

// ─────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'How does ChainForgeX work?', a: 'ChainForgeX simulates cloud mining by allocating virtual hashrate to your account. We use real Dogecoin network data to make earnings feel authentic. Your simulated miners run 24/7 in the cloud.' },
  { q: 'How are earnings calculated?', a: "Earnings scale with your plan's hashrate relative to the real Dogecoin network. Higher network difficulty slightly reduces yield. Each referral adds 5% bonus, up to 50% total." },
  { q: 'When can I withdraw?', a: 'Request a withdrawal of any amount above 10 DOGE at any time. Processed within 3–5 business days to your DOGE wallet. A 0.5 DOGE network fee applies.' },
  { q: 'How do referrals work?', a: 'Share your unique link. Every friend who signs up and mines boosts your earnings by 5%. Stack up to 10 referrals for a 50% boost.' },
  { q: 'Is there a free plan?', a: 'Yes! Free gets you 45 MH/s and roughly 1.15 DOGE/day — no card needed, no expiry.' },
  { q: 'Is this real blockchain mining?', a: 'ChainForgeX is a simulation that uses real on-chain data (price, hashrate, difficulty) to compute realistic earnings. No physical miners involved.' },
];

const TESTIMONIALS = [
  { name: 'Alex Turner', handle: '@alexturner92', quote: "Been using ChainForgeX 3 months and already hit my first payout. Pro plan easily pays for itself.", avatar: 'Alex+Turner' },
  { name: 'Sarah Chen', handle: '@sarahchen_dev', quote: "Referral system is brilliant. Got 8 friends on board, earnings jumped 40%. Dashboard is clean.", avatar: 'Sarah+Chen' },
  { name: 'Marcus Webb', handle: '@marcuswebb', quote: "Finally a platform that uses real market data. Watching earnings scale with actual DOGE prices is legit.", avatar: 'Marcus+Webb' },
];

const PLANS = [
  { name: 'Free',    price: 0,     hashrate: 45,   dogePerDay: 1.15,  features: ['45 MH/s hashrate', '~1.15 DOGE/day', 'Basic dashboard', 'Referral rewards'] },
  { name: 'Starter', price: 9.99,  hashrate: 185,  dogePerDay: 5.04,  features: ['185 MH/s hashrate', '~5.04 DOGE/day', 'Advanced stats', 'Priority support'] },
  { name: 'Pro',     price: 29.99, hashrate: 620,  dogePerDay: 17.28, popular: true, features: ['620 MH/s hashrate', '~17.28 DOGE/day', 'Real-time charts', 'API access', '24/7 support', 'Custom worker ID'] },
  { name: 'Elite',   price: 99.99, hashrate: 1850, dogePerDay: 54.72, features: ['1,850 MH/s hashrate', '~54.72 DOGE/day', 'Dedicated pool', 'White-glove support', 'Early access'] },
];

// ─────────────────────────────────────────────────────────────────
// World-map dot data  (equirectangular, viewBox 960 × 480)
// ─────────────────────────────────────────────────────────────────
const MAP_DOTS: [number, number][] = [
  // North America
  [80,100],[96,84],[115,78],[135,74],[155,72],[175,72],[195,76],[212,82],[228,92],
  [242,105],[248,120],[240,136],[224,148],[208,160],[196,174],[188,190],[176,204],
  [164,216],[152,222],[140,210],[128,196],[116,180],[105,162],[98,146],[94,130],
  [96,114],[102,104],[200,215],[214,228],[222,244],[218,260],[210,268],
  // Greenland / Iceland
  [340,52],[358,46],[376,40],[394,36],[380,54],[364,62],[346,66],
  [408,72],[420,68],
  // South America
  [204,292],[220,284],[238,280],[256,286],[272,296],[282,312],[287,332],
  [282,358],[270,378],[252,392],[234,396],[218,386],[206,368],[198,348],
  [196,326],[198,304],
  // UK / Ireland
  [452,100],[460,94],[468,90],[464,104],[456,110],[444,106],
  // Scandinavia
  [462,62],[472,56],[484,54],[494,60],[504,68],[512,80],[500,86],[488,80],[476,74],
  [522,66],[534,58],[546,62],[540,74],[528,80],
  // Europe mainland
  [444,114],[456,108],[468,106],[480,108],[492,106],[505,102],[518,100],
  [530,102],[540,106],[550,112],[556,120],[544,124],[532,118],[520,112],[508,110],
  [496,112],[484,116],[472,118],[460,120],[450,126],[464,130],[478,128],[492,124],
  [490,134],[475,138],[458,136],
  // Russia west
  [568,88],[580,82],[592,78],[606,74],[622,74],[638,76],[618,88],[604,86],[588,90],
  // Russia east / Siberia
  [655,78],[672,72],[690,68],[712,66],[730,70],[748,74],[765,72],[782,68],[800,72],
  [818,76],[836,72],[854,78],[870,84],[882,92],[888,104],[876,114],[858,112],[840,108],
  [822,104],[804,100],[788,96],[772,94],[756,90],[740,86],[724,84],[708,82],[694,82],
  // Middle East
  [524,148],[538,142],[554,140],[566,148],[574,158],[568,170],[556,176],
  [544,168],[532,160],
  // India
  [616,170],[630,162],[646,166],[658,178],[664,196],[660,216],[648,230],[634,238],
  [620,232],[610,216],[606,196],[610,178],
  // Southeast Asia
  [698,178],[712,184],[728,192],[742,198],[756,196],[768,188],[778,182],
  [746,208],[730,216],[716,220],[702,214],
  [758,208],[772,214],[782,222],[778,234],[766,240],
  // Indonesia / Maritime
  [762,252],[778,248],[794,244],[810,248],[800,260],[784,264],[768,260],
  [820,256],[836,252],[826,268],
  // East Asia
  [788,142],[802,134],[816,128],[830,124],[842,130],[848,142],[838,150],
  [822,154],[808,150],[796,156],[784,162],[772,170],[760,174],
  // Japan
  [854,128],[862,120],[870,124],[866,134],[854,138],[848,148],[858,152],
  // Korea
  [820,140],[832,136],[840,142],[834,150],
  // Africa
  [448,162],[462,156],[476,154],[492,156],[508,162],[522,172],[534,186],
  [540,206],[542,228],[538,252],[530,272],[520,290],[505,302],[488,308],
  [472,302],[456,290],[446,272],[440,252],[438,228],[440,204],[444,182],
  [460,172],[476,168],[492,166],
  // Africa interior
  [476,210],[492,208],[508,212],[524,216],[504,228],[488,232],[472,228],
  [488,248],[504,252],[520,248],[508,268],[492,272],[476,264],[464,250],
  // Madagascar
  [574,268],[582,276],[580,292],[570,300],[562,292],[560,276],
  // Australia
  [714,292],[730,284],[748,280],[768,282],[784,290],[796,302],[802,318],
  [798,336],[784,350],[766,358],[748,356],[730,348],[716,336],[708,318],
  [706,302],[718,322],[736,332],[754,338],[770,334],[784,322],
  // New Zealand
  [876,358],[880,368],[874,378],[866,372],[862,360],
  [880,340],[888,348],[884,358],
];

// ─────────────────────────────────────────────────────────────────
// Network node positions (inside the globe area)
// ─────────────────────────────────────────────────────────────────
const NODES: [number, number][] = [
  [155, 145], [285, 185], [490, 108], [578, 162], [748, 148],
];

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

/** Floating ambient particles — ALL positions generated client-side only */
function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2,
        duration: 6 + Math.random() * 10,
        delay: Math.random() * 8,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: i % 3 === 0 ? '#F7B731' : i % 3 === 1 ? '#00E5FF' : '#7B61FF',
            opacity: 0.4,
            animation: `float-up ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Dogecoin coin SVG — slow rotateY spin */
function DogeCoin({ size = 180 }: { size?: number }) {
  return (
    <div
      className="coin-spin"
      style={{
        width: size,
        height: size,
        filter: 'drop-shadow(0 0 32px rgba(247,183,49,0.5))',
        transformStyle: 'preserve-3d',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id="coinGrad" cx="38%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#FFE066" />
            <stop offset="45%"  stopColor="#F7B731" />
            <stop offset="100%" stopColor="#B8780A" />
          </radialGradient>
          <radialGradient id="coinShine" cx="30%" cy="28%" r="55%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="coinShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* Coin body */}
        <circle cx="100" cy="100" r="92" fill="url(#coinGrad)" filter="url(#coinShadow)" />
        {/* Rim */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#B8780A" strokeWidth="4" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        {/* Shine overlay */}
        <circle cx="100" cy="100" r="92" fill="url(#coinShine)" />
        {/* Ð symbol */}
        <text
          x="100" y="120"
          textAnchor="middle"
          fontSize="80"
          fontWeight="700"
          fill="rgba(255,255,255,0.92)"
          fontFamily="Arial, sans-serif"
          style={{ letterSpacing: '-2px' }}
        >
          Ð
        </text>
      </svg>
    </div>
  );
}

/** World map dots + animated network lines in hero */
function WorldMap() {
  return (
    <div
      className="world-map absolute inset-0 pointer-events-none flex items-center justify-center"
      style={{ opacity: 0 }}
    >
      <svg
        viewBox="0 0 960 480"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: 1100 }}
      >
        {/* Dots */}
        {MAP_DOTS.map(([x, y], i) => (
          <circle
            key={i}
            cx={x} cy={y} r="2.2"
            fill="#00E5FF"
            opacity="0.35"
          />
        ))}

        {/* Node circles */}
        {NODES.map(([x, y], i) => (
          <g key={`node-${i}`}>
            <circle cx={x} cy={y} r="5" fill="#F7B731" opacity="0.9" />
            <circle cx={x} cy={y} r="10" fill="none" stroke="#F7B731" strokeWidth="1" opacity="0.4" />
          </g>
        ))}

        {/* Animated connection lines between nodes */}
        {NODES.slice(0, -1).map(([x1, y1], i) => {
          const [x2, y2] = NODES[i + 1];
          const len = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={`line-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#F7B731"
              strokeWidth="1"
              strokeDasharray="6 8"
              strokeDashoffset="0"
              opacity="0.5"
              style={{
                animation: `dash-flow ${2.5 + i * 0.5}s linear infinite`,
                strokeDasharray: `6 ${Math.max(8, len / 15)}`,
              }}
            />
          );
        })}
        {/* Extra cross-link */}
        <line
          x1={NODES[0][0]} y1={NODES[0][1]}
          x2={NODES[4][0]} y2={NODES[4][1]}
          stroke="#00E5FF" strokeWidth="0.8"
          strokeDasharray="4 12" opacity="0.3"
          style={{ animation: 'dash-flow 4s linear infinite 1.2s' }}
        />
      </svg>
    </div>
  );
}

/** Recharts tooltip */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload: { price: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs" style={{ background: 'rgba(10,13,26,0.97)' }}>
      <p style={{ color: 'rgba(255,255,255,0.45)' }} className="mb-1">{label}</p>
      <p style={{ color: '#F7B731' }} className="font-space-mono">${payload[0].payload.price.toFixed(5)}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [priceChart, setPriceChart] = useState<PricePoint[]>([]);
  const [investment, setInvestment] = useState(100);
  const [navOpen, setNavOpen] = useState(false);

  // Fallback active-miner count — random 847–1200, generated client-side to avoid hydration mismatch
  const [fallbackMiners, setFallbackMiners] = useState(0);
  useEffect(() => {
    setFallbackMiners(847 + Math.floor(Math.random() * 354));
  }, []);

  // Mined-count animation — client-side only
  const [minedCount, setMinedCount] = useState(0);
  useEffect(() => {
    const target = 4182937;
    const step = Math.ceil(target / 60);
    let current = target - step * 60;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setMinedCount(current);
      if (current >= target) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, []);

  // Market data
  useEffect(() => {
    async function load() {
      try {
        const [mktRes, chartRes] = await Promise.all([
          fetch('/api/market'),
          fetch('https://api.coingecko.com/api/v3/coins/dogecoin/market_chart?vs_currency=usd&days=7'),
        ]);
        if (mktRes.ok) setMarket(await mktRes.json());
        if (chartRes.ok) {
          const d = await chartRes.json();
          setPriceChart(
            (d.prices as number[][]).map((p) => ({
              date: new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: parseFloat(p[1].toFixed(6)),
            }))
          );
        }
      } catch { /* use defaults */ }
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const dogePrice = market?.dogePrice ?? 0.08;
  const priceUp = (market?.priceChange24h ?? 0) >= 0;
  const dailyROI = (investment / (dogePrice * 30)) * 17.28 * dogePrice;
  // Use real count when > 0, otherwise show the client-side fallback (0 before useEffect fires)
  const displayMiners = (market?.activeMiners && market.activeMiners > 0)
    ? market.activeMiners.toLocaleString()
    : fallbackMiners > 0 ? fallbackMiners.toLocaleString() : '';

  return (
    <div style={{ background: '#050810', minHeight: '100vh', color: '#ffffff' }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: 'rgba(5,8,16,0.82)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(247,183,49,0.08)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <DogeCoinIcon size={28} />
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.5px',
            }}
          >
            <span style={{ color: '#F7B731' }}>ChainForge</span><span style={{ color: '#00FFB2' }}>X</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div
          className="hidden md:flex items-center gap-8 text-sm"
          style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
        >
          {['#features', '#pricing', '#faq'].map((href) => (
            <a key={href} href={href} className="hover:text-white transition-colors capitalize">
              {href.slice(1)}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 glow-gold"
            style={{ background: '#F7B731', color: '#050810' }}
          >
            Start Mining
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setNavOpen(!navOpen)}
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {navOpen ? <XIcon size={20} /> : <span style={{ fontSize: 20 }}>☰</span>}
        </button>
      </nav>

      {/* Mobile menu */}
      {navOpen && (
        <div
          className="fixed top-[65px] left-0 right-0 z-40 flex flex-col gap-4 p-5 md:hidden"
          style={{ background: 'rgba(5,8,16,0.97)', borderBottom: '1px solid rgba(247,183,49,0.1)' }}
        >
          {['#features', '#pricing', '#faq'].map((h) => (
            <a key={h} href={h} className="py-2 text-sm font-medium capitalize" style={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setNavOpen(false)}>{h.slice(1)}</a>
          ))}
          <Link href="/login" className="py-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Sign In</Link>
          <Link href="/signup" className="py-3 text-sm font-bold text-center rounded-full" style={{ background: '#F7B731', color: '#050810' }}>
            Start Mining
          </Link>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-6">

        {/* Radial glow behind headline */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '15%', left: '50%', transform: 'translateX(-50%)',
            width: 700, height: 500,
            background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.07) 0%, transparent 70%)',
          }}
        />

        {/* World map */}
        <WorldMap />

        {/* Particles */}
        <FloatingParticles />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">

            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7"
                style={{
                  background: 'rgba(247,183,49,0.1)',
                  border: '1px solid rgba(247,183,49,0.25)',
                  color: '#F7B731',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#00FF94', boxShadow: '0 0 6px #00FF94' }}
                />
                Live network · {displayMiners || '…'} active miners
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 800,
                  fontSize: 'clamp(48px, 8vw, 88px)',
                  lineHeight: 1.05,
                  letterSpacing: '-2px',
                  marginBottom: 24,
                }}
              >
                Mine.{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #F7B731 30%, #FFE066)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Earn.
                </span>
                {' '}Repeat.
              </h1>

              <p
                className="text-base md:text-lg leading-relaxed max-w-xl mb-10"
                style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}
              >
                Cloud-based Dogecoin mining powered by real network data. Start for free, scale to Elite, and earn DOGE around the clock — no hardware required.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="px-8 py-4 rounded-full font-bold text-base transition-all hover:-translate-y-1 glow-gold"
                  style={{ background: '#F7B731', color: '#050810', fontFamily: 'var(--font-space-grotesk)' }}
                >
                  Start Mining Free →
                </Link>
                <a
                  href="#pricing"
                  className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:-translate-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  View Plans
                </a>
              </div>
            </div>

            {/* Right: Dogecoin coin */}
            <div className="flex-shrink-0 hidden sm:flex items-center justify-center" style={{ perspective: 800 }}>
              <DogeCoin size={200} />
            </div>
          </div>

          {/* ── Live stats pill bar ── */}
          <div className="flex flex-wrap justify-center gap-3 mt-14">
            {[
              {
                label: 'DOGE Price',
                value: `$${dogePrice.toFixed(5)}`,
                sub: `${priceUp ? '▲' : '▼'} ${Math.abs(market?.priceChange24h ?? 0).toFixed(2)}%`,
                subColor: priceUp ? '#00FF94' : '#FF4555',
                dot: true,
              },
              {
                label: 'Active Miners',
                value: displayMiners,
                dot: true,
                mintDot: true,
              },
              {
                label: 'Network Hash',
                value: `${(market?.networkHashrate ?? 800).toFixed(0)} TH/s`,
              },
              {
                label: 'Total DOGE Mined',
                value: minedCount.toLocaleString(),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {s.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0${'mintDot' in s && s.mintDot ? ' pulse-dot' : ''}`}
                    style={
                      'mintDot' in s && s.mintDot
                        ? { background: '#00FFB2', boxShadow: '0 0 6px #00FFB2' }
                        : { background: '#00FF94', boxShadow: '0 0 5px #00FF94' }
                    }
                  />
                )}
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {s.label}
                </span>
                <span
                  className="text-sm font-bold font-space-mono"
                  style={{ color: '#F7B731' }}
                >
                  {s.value}
                </span>
                {s.sub && (
                  <span className="text-xs font-space-mono" style={{ color: s.subColor }}>
                    {s.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Ticker ── */}
      <LiveTicker />

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-1px' }}
          >
            Why ChainForgeX?
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Everything you need to mine smarter
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Globe size={20} />, color: '#00E5FF', title: 'Real Network Data', desc: 'Live DOGE price, difficulty, and network hashrate from CoinGecko and Dogechain — refreshed every 60 seconds.' },
            { icon: <Zap size={20} />, color: '#F7B731', title: 'Instant Payouts', desc: 'Request withdrawals anytime. Processed within 3–5 business days directly to your DOGE wallet.' },
            { icon: <Users size={20} />, color: '#00FF94', title: 'Referral Rewards', desc: 'Earn up to 50% mining bonus by referring friends. Bronze → Silver → Gold → Diamond tiers.' },
            { icon: <Cpu size={20} />, color: '#7B61FF', title: 'Multiple Plans', desc: 'From Free (45 MH/s) to Elite (1,850 MH/s). Scale your hashrate as your strategy grows.' },
            { icon: <Clock size={20} />, color: '#FF4D8D', title: '24/7 Mining', desc: 'Your virtual miners run around the clock. Log in anytime to check earnings and adjust settings.' },
            { icon: <Shield size={20} />, color: '#FF4555', title: 'Secure Platform', desc: 'bcrypt password hashing, JWT sessions, and encrypted data. Your account is always protected.' },
          ].map((f) => (
            <div key={f.title} className="card-feature p-6 transition-all duration-200">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}14` }}
              >
                <span style={{ color: f.color }}>{f.icon}</span>
              </div>
              <h3
                className="text-base mb-2"
                style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700 }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-1px' }}
          >
            Choose Your Plan
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            All plans include real-time data and referral rewards
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="card p-6 flex flex-col relative transition-all duration-200 hover:-translate-y-1"
              style={
                plan.popular
                  ? { border: '1px solid rgba(247,183,49,0.45)', boxShadow: '0 0 40px rgba(247,183,49,0.1)' }
                  : {}
              }
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #F7B731, #FFE066)',
                    color: '#050810',
                    fontFamily: 'var(--font-space-grotesk)',
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <h3
                className="text-lg mb-1"
                style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
              >
                {plan.name}
              </h3>
              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>${plan.price}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>/mo</span>
                  </>
                )}
              </div>
              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-bold font-space-mono" style={{ color: '#F7B731' }}>
                  {plan.hashrate.toLocaleString()} MH/s
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  ~{plan.dogePerDay} DOGE/day · ${(plan.dogePerDay * dogePrice).toFixed(3)}/day
                </p>
              </div>
              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ color: '#00FF94', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full py-3 rounded-full text-sm font-bold text-center transition-all hover:-translate-y-0.5"
                style={
                  plan.popular
                    ? { background: '#F7B731', color: '#050810', fontFamily: 'var(--font-space-grotesk)' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }
                }
              >
                {plan.price === 0 ? 'Start Free' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live chart ── */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-xl mb-1"
                style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
              >
                DOGE / USD — 7 Days
              </h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Real data from CoinGecko
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-space-mono" style={{ color: '#F7B731' }}>
                ${dogePrice.toFixed(5)}
              </p>
              <p className={`text-sm font-space-mono ${priceUp ? 'text-[#00FF94]' : 'text-[#FF4555]'}`}>
                {priceUp ? '▲' : '▼'} {Math.abs(market?.priceChange24h ?? 0).toFixed(2)}%
              </p>
            </div>
          </div>
          {priceChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={priceChart}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F7B731" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F7B731" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="price" stroke="#F7B731" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <TrendingUp size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section className="py-8 px-6 max-w-2xl mx-auto">
        <div className="card p-6">
          <h2
            className="text-xl mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
          >
            ROI Calculator
          </h2>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Estimated returns on the Pro plan
          </p>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Investment (USD)
            </label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl text-sm font-space-mono"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#ffffff',
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Daily',   value: `$${dailyROI.toFixed(3)}` },
              { label: 'Monthly', value: `$${(dailyROI * 30).toFixed(2)}` },
              { label: 'Yearly',  value: `$${(dailyROI * 365).toFixed(2)}` },
            ].map((r) => (
              <div key={r.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(247,183,49,0.06)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{r.label}</p>
                <p className="font-bold font-space-mono text-sm" style={{ color: '#F7B731' }}>{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2
          className="text-center mb-12"
          style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.5px' }}
        >
          What Our Miners Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={`https://ui-avatars.com/api/?name=${t.avatar}&background=0A0D1A&color=F7B731&bold=true&size=40`}
                  alt={t.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{t.handle}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                "{t.quote}"
              </p>
              <div className="flex gap-0.5 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: '#F7B731', fontSize: 13 }}>★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto">
        <h2
          className="text-center mb-12"
          style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.5px' }}
        >
          Frequently Asked Questions
        </h2>
        <FAQAccordion />
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DogeCoinIcon size={22} />
                <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: 17 }}>
                  <span style={{ color: '#F7B731' }}>ChainForge</span><span style={{ color: '#00FFB2' }}>X</span>
                </span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Mine smarter with real Dogecoin network data. Cloud-based simulation platform.
              </p>
            </div>
            <div className="flex gap-14">
              <div>
                <p
                  className="text-xs font-bold mb-3 uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Platform
                </p>
                <div className="flex flex-col gap-2">
                  {[['Start Mining', '/signup'], ['Pricing', '#pricing'], ['Sign In', '/login']].map(([label, href]) => (
                    <Link key={label} href={href} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p
                  className="text-xs font-bold mb-3 uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Connect
                </p>
                <div className="flex gap-2">
                  {[<XIcon key="x" size={15} />, <Send key="s" size={15} />].map((icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="p-2 rounded-lg hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2026 ChainForgeX.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service'].map((l) => (
                <a key={l} href="#" className="text-xs hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Tiny inline coin icon for nav / footer ──
function DogeCoinIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <radialGradient id="navCoin" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#F7B731" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#navCoin)" />
      <circle cx="16" cy="16" r="14" fill="none" stroke="#B8780A" strokeWidth="1" />
      <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill="rgba(255,255,255,0.9)" fontFamily="Arial">Ð</text>
    </svg>
  );
}
