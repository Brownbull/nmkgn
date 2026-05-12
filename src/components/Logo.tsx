interface LogoProps {
  size?: number;
  inverted?: boolean;
}

export function Logo({ size = 22, inverted }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size + 5} height={size + 5} viewBox="0 0 28 28" aria-hidden="true">
        <rect x="3" y="3" width="22" height="22" rx="6" fill={inverted ? 'var(--paper)' : 'var(--ink)'} />
        <path
          d="M 9 8 L 9 19 M 13 12 L 13 19 M 13 12 Q 13 8 17 8 M 17 19 L 17 14 Q 17 12 19 12 M 21 16 L 21 18"
          stroke={inverted ? 'var(--ink)' : 'var(--paper)'} strokeWidth="1.6" fill="none" strokeLinecap="round"
        />
      </svg>
      <span className="display" style={{
        fontSize: size, letterSpacing: -0.03, lineHeight: 1,
        color: inverted ? 'var(--paper)' : 'var(--ink)',
      }}>letra<span style={{ color: 'var(--accent)' }}>.</span></span>
    </div>
  );
}
