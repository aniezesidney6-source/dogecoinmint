'use client';

interface MiningRingProps {
  hashrate: number;
  maxHashrate: number;
  plan: string;
  color: string;
  miningActive: boolean;
}

export function MiningRing({ hashrate, maxHashrate, plan, color, miningActive }: MiningRingProps) {
  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(hashrate / maxHashrate, 1);
  const dashOffset = circumference * (1 - progress);
  const outerRadius = radius + 18;

  const activeColor = '#00FFB2';
  const arcColor = miningActive ? activeColor : 'rgba(255,255,255,0.15)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>
      {/* Rotating outer ring */}
      <svg
        className="absolute ring-rotate"
        width={size + 40}
        height={size + 40}
        style={{ top: 0, left: 0 }}
      >
        <circle
          cx={(size + 40) / 2}
          cy={(size + 40) / 2}
          r={outerRadius}
          fill="none"
          stroke={miningActive ? activeColor : 'rgba(255,255,255,0.15)'}
          strokeWidth="1.5"
          strokeDasharray="6 14"
          opacity="0.5"
        />
      </svg>

      {/* Main SVG */}
      <svg width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease',
            filter: miningActive ? `drop-shadow(0 0 8px ${activeColor}90)` : 'none',
          }}
        />
        {/* Hashrate value */}
        <text
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="22"
          fontFamily="'Space Mono', monospace"
          fontWeight="700"
        >
          {hashrate.toFixed(1)}
        </text>
        {/* MH/s label */}
        <text
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="11"
          fontFamily="'Space Mono', monospace"
        >
          MH/s
        </text>
        {/* Plan label */}
        <text
          x={size / 2}
          y={size / 2 + 30}
          textAnchor="middle"
          fill={color}
          fontSize="12"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="700"
          style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
        >
          {plan}
        </text>
      </svg>
    </div>
  );
}
