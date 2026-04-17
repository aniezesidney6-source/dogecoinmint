'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function DogeCoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="coin-grad-v" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#B8780A" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="13" fill="url(#coin-grad-v)" />
      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial" fill="#7A4F00">Ð</text>
    </svg>
  );
}

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const { toast } = useToast();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-send code on first load
  useEffect(() => {
    if (email) handleResend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDigitChange(i: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputRefs.current[i + 1]?.focus();
    // Auto-submit when all filled
    if (ch && next.every((d) => d !== '') && next.join('').length === 6) {
      submitCode(next.join(''));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, idx) => {
      if (idx < 6) next[idx] = ch;
    });
    setDigits(next);
    const focus = Math.min(pasted.length, 5);
    inputRefs.current[focus]?.focus();
    if (next.every((d) => d !== '')) submitCode(next.join(''));
  }

  async function submitCode(code: string) {
    if (verifying || verified) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        toast('Email verified! Please sign in to continue.', 'success');
        setTimeout(() => router.push('/login?verified=1'), 1500);
      } else {
        toast(data.error ?? 'Invalid code. Please try again.', 'error');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { toast('Enter all 6 digits', 'error'); return; }
    await submitCode(code);
  }

  async function handleResend(silent = false) {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        if (!silent) toast('New code sent! Check your inbox.', 'success');
        setCooldown(RESEND_COOLDOWN);
      } else {
        const d = await res.json();
        if (!silent) toast(d.error ?? 'Could not resend code', 'error');
      }
    } finally {
      setResending(false);
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
          background: 'radial-gradient(ellipse at center, rgba(0,255,178,0.06) 0%, transparent 70%)',
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
          {verified ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#00FFB2' }} />
              <h2 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Email Verified!
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-xl mb-2 text-center" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Check your inbox
              </h2>
              {email ? (
                <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  We sent a 6-digit code to{' '}
                  <span style={{ color: '#F7B731', fontFamily: 'var(--font-space-mono)' }}>{email}</span>
                </p>
              ) : (
                <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Enter the 6-digit code from your email
                </p>
              )}

              <form onSubmit={handleVerify}>
                {/* OTP inputs */}
                <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: d ? '1px solid rgba(247,183,49,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: '#F7B731',
                        fontFamily: 'var(--font-space-mono)',
                        caretColor: '#F7B731',
                      }}
                      onFocus={(e) => (e.currentTarget.style.border = '1px solid rgba(247,183,49,0.5)')}
                      onBlur={(e) => (e.currentTarget.style.border = d ? '1px solid rgba(247,183,49,0.5)' : '1px solid rgba(255,255,255,0.1)')}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={verifying || digits.join('').length < 6}
                  className="w-full py-3 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: '#F7B731', color: '#050810', fontFamily: 'var(--font-space-grotesk)' }}
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : null}
                  {verifying ? 'Verifying…' : 'Verify Email'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => handleResend(false)}
                  disabled={resending || cooldown > 0}
                  className="text-sm transition-opacity disabled:cursor-not-allowed"
                  style={{ color: cooldown > 0 ? 'rgba(255,255,255,0.3)' : '#F7B731', opacity: resending ? 0.6 : 1 }}
                >
                  {resending
                    ? 'Sending…'
                    : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : 'Resend code'}
                </button>
              </div>

              <p className="text-center text-sm mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Wrong account?{' '}
                <a href="/login" className="hover:opacity-80 transition-opacity" style={{ color: '#F7B731' }}>
                  Sign in with a different account
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
