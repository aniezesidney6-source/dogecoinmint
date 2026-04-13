'use client';

import { useEffect, useState } from 'react';

interface Particle {
  left: string;
  top: string;
  size: string;
  opacity: number;
  delay: string;
  duration: string;
  color: string;
}

interface FloatingParticlesProps {
  count?: number;
  /** 0–1 multiplier on opacity; default 1 */
  opacity?: number;
}

const COLORS = ['#F7B731', '#00FFB2', 'rgba(255,255,255,0.7)'];

export function FloatingParticles({ count = 20, opacity = 1 }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 3}px`,
        opacity: (0.06 + Math.random() * 0.16) * opacity,
        delay: `${Math.random() * 8}s`,
        duration: `${7 + Math.random() * 9}s`,
        color: COLORS[i % COLORS.length],
      }))
    );
  }, [count, opacity]);

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
