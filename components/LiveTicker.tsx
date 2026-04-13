'use client';

import { useEffect, useState } from 'react';

const NAMES = [
  'User ***421', 'User ***089', 'User ***774', 'User ***312',
  'User ***901', 'User ***543', 'User ***228', 'User ***667', 'User ***193',
];

function makeEvent(): string {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const amount = (0.001 + Math.random() * 0.009).toFixed(4);
  return `🟢 ${name} mined ${amount} DOGE`;
}

export function LiveTicker() {
  // Start empty — populated client-side only to avoid hydration mismatch
  const [events, setEvents] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Generate initial batch after mount
    setEvents(Array.from({ length: 18 }, makeEvent));
    setReady(true);

    const id = setInterval(() => {
      setEvents((prev) => [...prev.slice(1), makeEvent()]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (!ready || events.length === 0) {
    return (
      <div
        className="w-full py-3 overflow-hidden"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      />
    );
  }

  const doubled = [...events, ...events];

  return (
    <div
      className="overflow-hidden w-full py-3"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(247,183,49,0.02)',
      }}
    >
      <div
        className="flex gap-10 ticker-scroll whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {doubled.map((event, i) => (
          <span key={i} className="text-xs font-space-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {event}
            <span className="mx-5" style={{ color: 'rgba(247,183,49,0.2)' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
