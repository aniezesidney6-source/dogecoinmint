'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  iconColor: string;
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  mono?: boolean;
}

export function StatCard({ icon, iconColor, label, value, subValue, trend, mono = false }: StatCardProps) {
  return (
    <div className="card p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${iconColor}18` }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0 ? 'text-[#00FF94] bg-[#00FF94]/10' : 'text-[#FF4555] bg-[#FF4555]/10'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${mono ? 'font-mono-dm' : ''}`}
        style={{ color: '#ffffff' }}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
