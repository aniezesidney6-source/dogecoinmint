'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'transparent', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#FF4555', width: '25%' };
  if (score <= 3) return { label: 'Fair', color: '#FFD60A', width: '55%' };
  return { label: 'Strong', color: '#00FF94', width: '100%' };
}

function DogeCoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-grad-s" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-grad-s)" />
      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

type Particle = { left: string; top: string; width: string; height: string; opacity: number; animationDelay: string; animationDuration: string };

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${2 + Math.random() * 3}px`,
        height: `${2 + Math.random() * 3}px`,
        opacity: 0.08 + Math.random() * 0.18,
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${6 + Math.random() * 8}s`,
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
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            background: i % 3 === 0 ? '#F7B731' : i % 3 === 1 ? '#00FFB2' : 'rgba(255,255,255,0.6)',
            opacity: p.opacity,
            animation: `float-up ${p.animationDuration} ease-in-out ${p.animationDelay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') ?? '',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(form.password);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    console.log('Submit clicked');
    e.preventDefault();
    console.log('Form submitted, calling signup...');
    if (form.password !== form.confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (!form.terms) {
      toast('Please accept the terms', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          referralCode: form.referralCode || undefined,
        }),
      });
      console.log('Signup response status:', res.status);
      const data = await res.json();
      console.log('Signup response data:', data);
      if (!res.ok) {
        toast(data.error ?? 'Signup failed', 'error');
        return;
      }
      toast('Account created! Welcome to DogecoinMint 🎉', 'success');
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup fetch error:', err);
      toast('Network error — please try again', 'error');
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
          top: '20%',
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
            Create your free account
          </p>
        </div>

        {/* Welcome bonus badge */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)' }}
        >
          <CheckCircle size={16} style={{ color: '#00FFB2', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#00FFB2' }}>
            You'll receive <strong>5 DOGE welcome bonus</strong> instantly on signup!
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                required
                placeholder="satoshi"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-12"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-space-grotesk)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                  onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
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
              {form.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Strength</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    form.confirmPassword && form.confirmPassword !== form.password
                      ? 'rgba(255,69,85,0.5)'
                      : 'rgba(255,255,255,0.08)'
                  }`,
                  color: '#ffffff',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Referral Code <span style={{ color: 'rgba(255,255,255,0.3)' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={form.referralCode}
                onChange={(e) => update('referralCode', e.target.value)}
                placeholder="e.g. AbCd1234"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all font-space-mono"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                }}
                onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={form.terms}
                onChange={(e) => update('terms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded"
                style={{ accentColor: '#F7B731' }}
              />
              <label htmlFor="terms" className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                I agree to the{' '}
                <a href="/terms" className="hover:opacity-80 transition-opacity" style={{ color: '#F7B731' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="hover:opacity-80 transition-opacity" style={{ color: '#F7B731' }}>Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: '#F7B731',
                color: '#050810',
                fontFamily: 'var(--font-space-grotesk)',
                boxShadow: '0 0 0 rgba(247,183,49,0)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(247,183,49,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 rgba(247,183,49,0)')}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" className="hover:opacity-80 transition-opacity font-medium" style={{ color: '#F7B731' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
