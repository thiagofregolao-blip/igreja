import { useMemo } from 'react';

export function Confetti({ count = 24 }: { count?: number }) {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 4,
      rotate: Math.random() * 360,
      color: ['#f5b800', '#fff3a8', '#d49d00', '#ffd700'][Math.floor(Math.random() * 4)],
      size: 6 + Math.random() * 10,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-sm"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: c.size,
            height: c.size * 1.6,
            background: c.color,
            transform: `rotate(${c.rotate}deg)`,
            animation: `float ${c.duration}s ease-in-out ${c.delay}s infinite`,
            opacity: 0.55,
          }}
        />
      ))}
    </div>
  );
}
