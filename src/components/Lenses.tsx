import { Icon } from './Icon';

export interface LensData {
  id: string;
  label: string;
  short: string;
  icon: string;
  color: string;
  softColor: string;
}

export const LENSES: Record<string, LensData> = {
  ley: {
    id: 'ley',
    label: 'Ley · Chile',
    short: 'Ley',
    icon: 'scale',
    color: '#3b4a6b',
    softColor: '#e6eaf3',
  },
  mercado: {
    id: 'mercado',
    label: 'Mercado',
    short: 'Mercado',
    icon: 'chart',
    color: '#246a5b',
    softColor: '#d9e8e3',
  },
  comparar: {
    id: 'comparar',
    label: 'vs. otras ofertas',
    short: 'vs. otras',
    icon: 'compare',
    color: '#7a4b6f',
    softColor: '#f3e6ee',
  },
  intl: {
    id: 'intl',
    label: 'Internacional',
    short: 'Internacional',
    icon: 'globe',
    color: '#8a6f3d',
    softColor: '#f3ecd9',
  },
};

interface LensTagProps {
  id: string;
  size?: 'sm' | 'lg';
}

export function LensTag({ id, size = 'sm' }: LensTagProps) {
  const L = LENSES[id];
  if (!L) return null;
  const fs = size === 'lg' ? 11.5 : 10.5;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px',
      borderRadius: 999,
      background: L.softColor,
      color: L.color,
      fontSize: fs, fontWeight: 600, letterSpacing: 0.01,
      lineHeight: 1.2,
    }}>
      <Icon name={L.icon} size={fs + 2} color={L.color} strokeWidth={1.75} />
      {L.short}
    </span>
  );
}

interface LensScorecardCardProps {
  lens: string;
  status: 'strong' | 'weak' | 'attention' | 'ref';
  headline: string;
  summary: string;
  count: string;
}

function LensScorecardCard({ lens, status, headline, summary, count }: LensScorecardCardProps) {
  const L = LENSES[lens];
  const statusColor =
    status === 'strong' ? 'var(--green)' :
    status === 'weak' ? 'var(--red)' :
    status === 'attention' ? 'var(--amber)' :
    'var(--ink-faint)';
  const statusLabel =
    status === 'strong' ? 'Sólido' :
    status === 'weak' ? 'Débil' :
    status === 'attention' ? 'Atención' :
    'Referencia';
  const statusIcon =
    status === 'strong' ? 'check-circle' :
    status === 'ref' ? 'globe' :
    'sparkle';

  return (
    <div className="card" style={{
      padding: 0, flex: 1, minWidth: 0, overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ height: 3, background: L.color }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: L.softColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: '0 0 auto',
          }}>
            <Icon name={L.icon} size={16} color={L.color} />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: -0.01, flex: 1, minWidth: 0 }}>{L.label}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.06,
            color: statusColor,
          }}>
            <Icon name={statusIcon} size={11} color={statusColor} strokeWidth={2} />
            {statusLabel}
          </span>
        </div>
        <div className="num display" style={{
          fontSize: 22, marginTop: 12, letterSpacing: -0.025, lineHeight: 1,
          color: status === 'strong' ? 'var(--green)' : status === 'weak' ? 'var(--red)' : status === 'attention' ? 'var(--amber)' : 'var(--ink)',
        }}>{headline}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.45 }}>{summary}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <span className="num" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{count}</span>
        </div>
      </div>
    </div>
  );
}

interface LensScorecardProps {
  cards: LensScorecardCardProps[];
}

export function LensScorecard({ cards }: LensScorecardProps) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      {cards.map((c, i) => <LensScorecardCard key={i} {...c} />)}
    </div>
  );
}
