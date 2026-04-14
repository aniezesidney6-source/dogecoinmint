'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';

function DogeCoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-grad-fp" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-grad-fp)" />
      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success — never reveal whether email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: '#050810' }}
    >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(247,183,49,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <DogeCoinIcon />
            <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800 }}>
              <span style={{ color: '#F7B731' }}>Dogecoin</span>
              <span style={{ color: '#00FFB2' }}>Mint</span>
            </span>
          </Link>
        </div>

        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#00FFB2' }} />
              <h2 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Check your inbox
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                If this email exists in our system, a password reset link has been sent. Check your spam folder if you don't see it.
              </p>
              <Link
                href="/login"
                className="text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: '#F7B731' }}
              >
                ← Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Forgot password?
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                    onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#F7B731', color: '#050810', fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm mt-6">
                <Link
                  href="/login"
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: '#F7B731' }}
                >
                  ← Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
