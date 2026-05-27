import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { AnalysisFinding, AnalysisEvidence, FindingSeverity } from '../api/analysis';

const SEV_STYLE: Record<FindingSeverity, { bg: string; color: string; label: string }> = {
  critical: { bg: 'var(--red-soft)', color: 'var(--red)', label: 'critico' },
  high: { bg: 'var(--red-soft)', color: 'var(--red)', label: 'alto' },
  medium: { bg: 'var(--amber-soft)', color: 'var(--amber)', label: 'medio' },
  low: { bg: 'var(--paper-2)', color: 'var(--ink-faint)', label: 'bajo' },
};

const EVIDENCE_LABELS: Record<string, string> = {
  fact: 'Hecho confirmado',
  calculation: 'Calculo deterministico',
  reference: 'Referencia oficial',
  inference: 'Inferencia del agente',
};

const CLAIM_LABELS: Record<string, string> = {
  fact: 'Basado en hechos',
  calculation: 'Basado en calculo',
  reference: 'Basado en referencia',
  inference: 'Basado en inferencia',
};

const UNCERTAINTY_LABELS: Record<string, { label: string; color: string }> = {
  supported: { label: 'Soportado', color: 'var(--green)' },
  uncertain: { label: 'Incierto', color: 'var(--amber)' },
  missing_context: { label: 'Falta contexto', color: 'var(--red)' },
};

function EvidenceItem({ ev }: { ev: AnalysisEvidence }) {
  const label = EVIDENCE_LABELS[ev.evidence_type] ?? ev.evidence_type;

  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--paper-2)',
      borderRadius: 8,
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon
          name={ev.evidence_type === 'fact' ? 'check-circle' : ev.evidence_type === 'calculation' ? 'chart' : ev.evidence_type === 'reference' ? 'globe' : 'search'}
          size={14}
          color="var(--ink-soft)"
        />
        <span style={{ fontWeight: 600 }}>{label}</span>
        {ev.evidence_type === 'inference' && ev.model_name && (
          <span className="pill" style={{ fontSize: 10 }}>{ev.model_name}</span>
        )}
      </div>
      {ev.excerpt && (
        <div style={{ marginTop: 6, color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "{ev.excerpt}"
        </div>
      )}
      {ev.inference_summary && (
        <div style={{ marginTop: 6, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          {ev.inference_summary}
        </div>
      )}
      {ev.citation && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="globe" size={12} color="var(--accent)" />
          <a
            href={ev.citation.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'underline' }}
          >
            {ev.citation.label}
          </a>
          {ev.citation.reference_key && (
            <span className="pill" style={{ fontSize: 10 }}>{ev.citation.reference_key}</span>
          )}
        </div>
      )}
      {ev.calculation_key && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-faint)' }}>
          Calculo: {ev.calculation_key}
        </div>
      )}
    </div>
  );
}

function EvidenceChain({ evidence }: { evidence: AnalysisEvidence[] }) {
  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
      {evidence.map(ev => (
        <EvidenceItem key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

export function QuestionCard({ finding }: { finding: AnalysisFinding }) {
  const [expanded, setExpanded] = useState(false);
  const refEvidence = finding.evidence.filter(e => e.evidence_type === 'reference');

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>
      <div
        style={{ padding: '14px 18px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="search" size={16} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 700, flex: 1, letterSpacing: -0.01 }}>
            {finding.title}
          </span>
          <Icon name={expanded ? 'chevron-down' : 'chevron-r'} size={14} color="var(--ink-faint)" />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 26 }}>
          {finding.summary}
        </div>
        {refEvidence.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 26 }}>
            {refEvidence.map(ev => ev.citation && (
              <a
                key={ev.id}
                href={ev.citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pill"
                style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Icon name="globe" size={10} color="var(--accent)" />
                {ev.citation.label}
              </a>
            ))}
          </div>
        )}
      </div>
      {expanded && finding.evidence.length > 0 && (
        <EvidenceChain evidence={finding.evidence} />
      )}
    </div>
  );
}

export function MissingInfoCard({ finding, pillText }: { finding: AnalysisFinding; pillText: string }) {
  return (
    <div className="card" style={{
      padding: '14px 18px', marginBottom: 12,
      borderLeft: '3px solid var(--amber)',
      background: 'var(--amber-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="info" size={16} color="var(--amber)" />
        <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>
          {finding.title}
        </span>
        <span className="pill" style={{ fontSize: 10, background: '#fff', color: 'var(--amber)' }}>
          {pillText}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 26 }}>
        {finding.summary}
      </div>
    </div>
  );
}

export function TermCard({ finding, borderColor, showCalcPreview, showReferenceKey }: {
  finding: AnalysisFinding;
  borderColor?: string;
  showCalcPreview?: boolean;
  showReferenceKey?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLE[finding.severity] ?? SEV_STYLE.low;
  const refEvidence = finding.evidence.filter(e => e.evidence_type === 'reference');
  const calcEvidence = finding.evidence.filter(e => e.evidence_type === 'calculation');

  return (
    <div className="card" style={{
      padding: 0, marginBottom: 12,
      ...(borderColor ? { borderLeft: `3px solid ${borderColor}` } : {}),
    }}>
      <div
        style={{ padding: '14px 18px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: sev.color, flex: '0 0 auto',
          }} />
          <span style={{ fontSize: 15, fontWeight: 700, flex: 1, letterSpacing: -0.01 }}>
            {finding.title}
          </span>
          <span className="pill" style={{ fontSize: 10.5, background: sev.bg, color: sev.color }}>
            {sev.label}
          </span>
          <Icon name={expanded ? 'chevron-down' : 'chevron-r'} size={14} color="var(--ink-faint)" />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 20 }}>
          {finding.summary}
        </div>
        {refEvidence.length > 0 && (
          <div style={{
            marginTop: 8, marginLeft: 20, padding: '8px 12px',
            background: 'var(--accent-soft)', borderRadius: 6, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="globe" size={12} color="var(--accent)" />
            <span style={{ color: 'var(--ink-soft)' }}>
              Referencia: {refEvidence.map(e => e.citation?.label).filter(Boolean).join(', ') || 'Catalogo normativo'}
            </span>
            {showReferenceKey && refEvidence[0]?.citation?.reference_key && (
              <span className="pill" style={{ fontSize: 9, marginLeft: 'auto' }}>
                {refEvidence[0].citation.reference_key}
              </span>
            )}
          </div>
        )}
        {showCalcPreview && !expanded && calcEvidence.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 20 }}>
            <span className="pill" style={{ fontSize: 10 }}>Basado en calculo</span>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {finding.evidence.length} evidencia{finding.evidence.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      {expanded && finding.evidence.length > 0 && (
        <EvidenceChain evidence={finding.evidence} />
      )}
    </div>
  );
}

export function FindingCard({ finding }: { finding: AnalysisFinding }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLE[finding.severity] ?? SEV_STYLE.low;
  const uncertainty = UNCERTAINTY_LABELS[finding.uncertainty_state] ?? UNCERTAINTY_LABELS.supported;
  const claimLabel = CLAIM_LABELS[finding.claim_type] ?? finding.claim_type;

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12 }}>
      <div
        style={{ padding: '14px 18px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: sev.color, flex: '0 0 auto',
          }} />
          <span style={{ fontSize: 15, fontWeight: 700, flex: 1, letterSpacing: -0.01 }}>
            {finding.title}
          </span>
          <span className="pill" style={{ fontSize: 10.5, background: sev.bg, color: sev.color }}>
            {sev.label}
          </span>
          <Icon name={expanded ? 'chevron-down' : 'chevron-r'} size={14} color="var(--ink-faint)" />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 20 }}>
          {finding.summary}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 20 }}>
          <span className="pill" style={{ fontSize: 10 }}>{claimLabel}</span>
          <span className="pill" style={{ fontSize: 10, color: uncertainty.color }}>
            {uncertainty.label}
          </span>
          {finding.confidence !== null && (
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {Math.round(finding.confidence * 100)}% confianza
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 'auto' }}>
            {finding.evidence.length} evidencia{finding.evidence.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {expanded && finding.evidence.length > 0 && (
        <EvidenceChain evidence={finding.evidence} />
      )}
    </div>
  );
}

export function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { cls: string; label: string }> = {
    completed: { cls: 'pill-green', label: 'Completado' },
    running: { cls: 'pill-accent', label: 'En curso' },
    pending: { cls: '', label: 'Pendiente' },
    failed: { cls: 'pill-red', label: 'Fallido' },
  };
  const s = styles[status] ?? styles.pending;
  return <span className={`pill ${s.cls}`} style={{ fontSize: 10.5 }}>{s.label}</span>;
}
