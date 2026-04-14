'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function DogeCoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-grad-l" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-grad-l)" />
      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

type Particle = { left: string; top: string; size: string; opacity: number; delay: string; duration: string; color: string };

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    const colors = ['#F7B731', '#00FFB2', 'rgba(255,255,255,0.7)'];
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 3}px`,
        opacity: 0.06 + Math.random() * 0.14,
        delay: `${Math.random() * 8}s`,
        duration: `${7 + Math.random() * 9}s`,
        color: colors[i % colors.length],
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: p.opacity,
            animation: `float-up ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  function focusGold(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)';
  }
  function blurGold(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        toast('Invalid email or password', 'error');
      } else {
        toast('Welcome back!', 'success');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: '#050810' }}
    >
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(247,183,49,0.07) 0%, transparent 70%)',
        }}
      />
      <FloatingParticles />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <DogeCoinIcon />
            <span
              className="font-bold text-2xl tracking-tight"
              style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}
            >
              <span style={{ color: '#F7B731' }}>Dogecoin</span>
              <span style={{ color: '#00FFB2' }}>Mint</span>
            </span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={INPUT_STYLE}
                onFocus={focusGold}
                onBlur={blurGold}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs hover:opacity-80 transition-opacity"
                  style={{ color: '#F7B731' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-12"
                  style={INPUT_STYLE}
                  onFocus={focusGold}
                  onBlur={blurGold}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#F7B731' }}
              />
              <label htmlFor="remember" className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: '#F7B731',
                color: '#050810',
                fontFamily: 'var(--font-space-grotesk)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(247,183,49,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No account?{' '}
            <Link
              href="/signup"
              className="font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#F7B731' }}
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
