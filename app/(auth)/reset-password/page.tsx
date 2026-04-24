'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function DogeCoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-grad-rp" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-grad-rp)" />
      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#FF4555', '#F7B731', '#00E5FF', '#00FFB2'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score - 1] ?? 'rgba(255,255,255,0.3)' }}>
        {labels[score - 1] ?? 'Too short'}
      </p>
    </div>
  );
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!token) {
      toast('Invalid reset link — please request a new one', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Password updated successfully! Please sign in.', 'success');
        router.push('/login');
      } else {
        toast(data.error ?? 'Failed to reset password', 'error');
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
              <span style={{ color: '#F7B731' }}>ChainForge</span>
              <span style={{ color: '#00FFB2' }}>X</span>
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
          <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Set new password
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Choose a strong password for your ChainForgeX account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-12"
                  style={INPUT_STYLE}
                  onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                  onBlur={(e) => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all pr-12"
                  style={{
                    ...INPUT_STYLE,
                    border:
                      confirm && password !== confirm
                        ? '1px solid rgba(255,69,85,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.35)')}
                  onBlur={(e) => (e.currentTarget.style.border = confirm && password !== confirm ? '1px solid rgba(255,69,85,0.4)' : '1px solid rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs mt-1" style={{ color: '#FF4555' }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (!!confirm && password !== confirm)}
              className="w-full py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#F7B731', color: '#050810', fontFamily: 'var(--font-space-grotesk)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            <Link href="/login" className="hover:opacity-80 transition-opacity" style={{ color: '#F7B731' }}>
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
