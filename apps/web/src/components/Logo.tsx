export function Logo({ size = 48 }: { size?: number }) {
  return (
    <div
      className="relative rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 50% 50%, #14171f 0 26%, transparent 27%), conic-gradient(from 90deg, #f4cb55, #b07b1c, #f6d877, #c89320, #f4cb55)',
      }}
    >
      <span
        className="absolute rounded-full"
        style={{ inset: 6, background: 'radial-gradient(circle at 50% 35%, #1a1d28 0 55%, transparent 56%)' }}
      />
      <svg className="relative z-10" width={size * 0.4} height={size * 0.46} viewBox="0 0 22 26" fill="none">
        <rect x="9.5" y="0" width="3" height="26" rx="1" fill="#e7b53a" />
        <rect x="3" y="8" width="16" height="3" rx="1" fill="#e7b53a" />
      </svg>
    </div>
  );
}
