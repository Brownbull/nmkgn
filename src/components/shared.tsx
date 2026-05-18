import { type ReactNode } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { useNav } from './NavContext';

// Step progress indicator
const PROTO_STEPS = [
  { id: 'case', label: 'Caso' },
  { id: 'upload', label: 'Subir' },
  { id: 'process', label: 'Identificar' },
  { id: 'plan', label: 'Plan' },
  { id: 'coach', label: 'Análisis' },
];

const PROTO_STEP_INDEX: Record<string, number> = {
  case: 0,
  upload: 1,
  process: 2, detect: 2, 'detect-low': 2, 'detect-unsupported': 2, 'detect-failed': 2,
  plan: 3, running: 3,
  coach: 4, email: 4, compare: 4, history: 4,
};

function ProtoStepIndicator({ steps, current }: { steps: typeof PROTO_STEPS; current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span key={s.id} style={{ display: 'contents' }}>
            {i > 0 && <span style={{ width: 14, height: 1, background: done ? 'var(--accent)' : 'var(--line)' }} />}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 9px', borderRadius: 999,
              fontSize: 10.5, fontWeight: 600,
              background: active ? 'var(--accent-soft)' : done ? '#fff' : 'transparent',
              color: active ? 'var(--accent)' : done ? 'var(--ink)' : 'var(--ink-faint)',
              border: active ? '1px solid var(--accent)' : done ? '1px solid var(--accent)' : '1px solid var(--line)',
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: done ? 'var(--accent)' : active ? '#fff' : 'transparent',
                border: active ? '1.5px solid var(--accent)' : 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
                color: done ? '#fff' : active ? 'var(--accent)' : 'var(--ink-faint)',
              }}>
                {done ? <Icon name="check" size={9} color="#fff" strokeWidth={3} /> : (i + 1)}
              </span>
              {s.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// App shell
interface AppShellProps {
  children: ReactNode;
  activeNav?: string;
  rightExtra?: ReactNode;
}

export function AppShell({ children, activeNav = 'Análisis', rightExtra }: AppShellProps) {
  const nav = useNav();
  const showProtoBar = nav.interactive;

  return (
    <div className="lt">
      <div style={{
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 6,
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        <Logo />
        {showProtoBar ? (
          <div style={{ marginLeft: 24 }}>
            <ProtoStepIndicator steps={PROTO_STEPS} current={PROTO_STEP_INDEX[nav.state.step] ?? 0} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 2, marginLeft: 28 }}>
            {['Análisis', 'Mis documentos', 'Comparar', 'Ayuda'].map(n => (
              <span key={n} style={{
                padding: '7px 12px', borderRadius: 8,
                fontSize: 13.5, fontWeight: 500,
                background: n === activeNav ? 'var(--paper-2)' : 'transparent',
                color: n === activeNav ? 'var(--ink)' : 'var(--ink-soft)',
                cursor: 'pointer',
              }}>{n}</span>
            ))}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {rightExtra}
        {showProtoBar ? (
          <button className="btn btn-small btn-ghost" style={{ color: 'var(--ink-soft)', marginLeft: 8 }} onClick={() => nav.reset()}>
            ↻ Reiniciar
          </button>
        ) : (
          <button className="btn btn-small" style={{ marginLeft: 8 }}>
            <Icon name="plus" size={14} /> Nuevo
          </button>
        )}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--paper-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600,
          marginLeft: 6,
        }}>JR</div>
      </div>
      <div className="app-content-area" style={{ position: 'absolute', top: 61, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

export function CaseContextStrip() {
  const nav = useNav();
  if (!nav.state.caseId) return null;

  const stageLabel = nav.state.caseStage === 'after_signing'
    ? 'Despues de firmar'
    : 'Antes de firmar';
  const planLabel = nav.state.analysisPlan === 'after_signing_discrepancy'
    ? 'Discrepancias'
    : 'Revision previa';

  return (
    <div className="case-context-strip">
      <div className="case-context-main">
        <span className="pill pill-accent"><Icon name="bank" size={13} /> Caso guardado</span>
        <strong>{nav.state.caseTitle ?? 'Credito para construir casa'}</strong>
        <span>{nav.state.institutionName ?? 'Banco Demo'}</span>
      </div>
      <div className="case-context-meta">
        <span>{stageLabel}</span>
        <span>{planLabel}</span>
        <span>{nav.state.docLabel ?? 'Credito bancario'}</span>
        <span className="pill pill-amber">Prototipo</span>
      </div>
    </div>
  );
}

export function PrototypeNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'prototype-notice prototype-notice-compact' : 'prototype-notice'}>
      <Icon name="shield-check" size={16} color="var(--amber)" />
      <div>
        <strong>Estado simulado.</strong>{' '}
        Plan y resultados siguen siendo prototipo hasta conectar agentes, reglas verificadas y hallazgos con evidencia.
      </div>
    </div>
  );
}

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  delta?: string;
  sev?: string;
}

export function StatCard({ label, value, sub, delta, sev }: StatCardProps) {
  const valColor = sev === 'hi' ? 'var(--red)' : sev === 'ok' ? 'var(--green)' : sev === 'mid' ? 'var(--amber)' : 'var(--ink)';
  const pillCls = sev === 'hi' ? 'pill-red' : sev === 'ok' ? 'pill-green' : sev === 'mid' ? 'pill-amber' : 'pill-accent';

  return (
    <div className="card" style={{ padding: '18px 20px', flex: 1, minWidth: 0 }}>
      <div className="label">{label}</div>
      <div className="num display" style={{
        fontSize: 30, marginTop: 8, color: valColor, lineHeight: 1, letterSpacing: -0.02,
      }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        {delta && <span className={`pill ${pillCls}`} style={{ padding: '2px 7px', fontSize: 11 }}>{delta}</span>}
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{sub}</span>
      </div>
    </div>
  );
}

// Toggle
interface ToggleProps {
  on?: boolean;
  size?: number;
}

export function Toggle({ on = true, size = 30 }: ToggleProps) {
  const h = Math.round(size * 0.6);
  const knob = h - 6;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      width: size, height: h,
      borderRadius: 999,
      background: on ? 'var(--accent)' : 'var(--paper-3)',
      padding: 3, boxSizing: 'border-box',
      transition: 'background .15s',
      flex: '0 0 auto', cursor: 'pointer',
    }}>
      <span style={{
        width: knob, height: knob, borderRadius: '50%', background: '#fff',
        transform: on ? `translateX(${size - knob - 6}px)` : 'translateX(0)',
        transition: 'transform .15s',
        boxShadow: '0 1px 2px rgba(0,0,0,.15)',
      }} />
    </span>
  );
}

// Progress bar
interface ProgressBarProps {
  pct: number;
  accent?: string;
}

export function ProgressBar({ pct, accent }: ProgressBarProps) {
  return (
    <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: accent || 'var(--ink)', borderRadius: 3, transition: 'width .3s ease' }} />
    </div>
  );
}

// Section card
interface SectionCardProps {
  title?: ReactNode;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  padding?: number;
}

export function SectionCard({ title, subtitle, right, children, padding = 22 }: SectionCardProps) {
  return (
    <div className="card" style={{ padding }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: subtitle ? 4 : 16 }}>
          <h2 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: -0.015 }}>{title}</h2>
          {right}
        </div>
      )}
      {subtitle && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 16 }}>{subtitle}</div>}
      {children}
    </div>
  );
}
