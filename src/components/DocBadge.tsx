import { Icon } from './Icon';

interface ConfidenceDotsProps {
  confidence: string;
  accent: string;
}

function ConfidenceDots({ confidence, accent }: ConfidenceDotsProps) {
  const filled = confidence === 'high' ? 3 : confidence === 'low' ? 2 : confidence === 'unsupported' ? 0 : 1;
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i < filled ? accent : 'rgba(0,0,0,0.12)',
        }} />
      ))}
    </span>
  );
}

interface DocBadgeProps {
  icon?: string;
  label?: string;
  market?: string;
  confidence?: string;
  compact?: boolean;
}

export function DocBadge({
  icon = 'bank',
  label = 'Crédito de consumo',
  market = 'Chile · CMF',
  confidence = 'high',
  compact = false,
}: DocBadgeProps) {
  const isLow = confidence === 'low';
  const isUnsupported = confidence === 'unsupported';
  const accent = isUnsupported ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--accent)';
  const accentBg = isUnsupported ? 'var(--red-soft)' : isLow ? 'var(--amber-soft)' : 'var(--accent-soft)';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: compact ? 8 : 12,
      padding: compact ? '5px 9px 5px 5px' : '7px 10px 7px 7px',
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 12,
    }}>
      <div style={{
        width: compact ? 28 : 34, height: compact ? 28 : 34,
        borderRadius: compact ? 7 : 9, background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 auto',
      }}>
        <Icon name={icon} size={compact ? 15 : 18} color={accent} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="label" style={{ fontSize: compact ? 9 : 10 }}>
            {isUnsupported ? 'No soportado' : 'Identificado'}
          </span>
          <ConfidenceDots confidence={confidence} accent={accent} />
        </div>
        <div style={{
          fontWeight: 700, fontSize: compact ? 13 : 14, letterSpacing: -0.01, marginTop: 2, lineHeight: 1.1,
        }}>
          {label}{' '}
          <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>· {market}</span>
        </div>
      </div>
      {!compact && (
        <>
          <span style={{ width: 1, height: 24, background: 'var(--line)' }} />
          <button className="btn btn-small">Cambiar</button>
        </>
      )}
    </div>
  );
}
