'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'How does DogecoinMint work?',
    a: 'DogecoinMint simulates cloud mining by allocating virtual hashrate to your account. We use real Dogecoin network data to make earnings feel authentic. Your simulated miners run 24/7 in the cloud.',
  },
  {
    q: 'How are earnings calculated?',
    a: "Earnings scale with your plan's hashrate relative to the real Dogecoin network. Higher network difficulty slightly reduces yield. Each referral adds 5% bonus, up to 50% total.",
  },
  {
    q: 'When can I withdraw?',
    a: 'Request a withdrawal of any amount above 10 DOGE at any time. Processed within 3–5 business days to your DOGE wallet. A 0.5 DOGE network fee applies.',
  },
  {
    q: 'Is my account secure?',
    a: 'Yes. Passwords are hashed with bcrypt and we use secure session tokens. We never store payment details. All data is encrypted in transit.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes — switch plans at any time from your dashboard. Upgrades take effect immediately. No contracts or lock-in periods.',
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: isOpen
                ? '1px solid rgba(247,183,49,0.25)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              backdropFilter: 'blur(12px)',
              transition: 'border-color 0.2s',
            }}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span
                className="text-sm font-semibold pr-4"
                style={{ color: isOpen ? '#ffffff' : 'rgba(255,255,255,0.85)' }}
              >
                {faq.q}
              </span>
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg font-light leading-none select-none transition-transform duration-200"
                style={{
                  color: '#F7B731',
                  background: 'rgba(247,183,49,0.1)',
                  border: '1px solid rgba(247,183,49,0.2)',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
                  fontFamily: 'monospace',
                  fontSize: 18,
                }}
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {/* Animated panel */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: isOpen ? '24rem' : '0px' }}
            >
              <div className="px-5 pb-5">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
