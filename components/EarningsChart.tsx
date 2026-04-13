'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EarningsChartProps {
  dogePrice?: number;
}

function generateEarningsData(dogePrice: number) {
  const data = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const earned = 0.08 + Math.random() * 0.12;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      doge: parseFloat(earned.toFixed(4)),
      usd: parseFloat((earned * dogePrice).toFixed(4)),
    });
  }
  return data;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { doge: number; usd: number } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs rounded-xl"
      style={{
        background: 'rgba(13,17,23,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
      <p className="font-space-mono" style={{ color: '#00FFB2' }}>{payload[0].payload.doge} DOGE</p>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>${payload[0].payload.usd}</p>
    </div>
  );
}

export function EarningsChart({ dogePrice = 0.08 }: EarningsChartProps) {
  const data = generateEarningsData(dogePrice);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFB2" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00FFB2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="doge"
          stroke="#00FFB2"
          strokeWidth={2}
          fill="url(#earningsGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
