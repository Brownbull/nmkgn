import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { AppShell, CaseContextStrip } from '../components/shared';
import { useNav } from '../components/NavContext';
import {
  listAnalysisRuns,
  startAnalysis,
  type AnalysisRun,
  type AnalysisFinding,
  type AnalysisEvidence,
  type FindingSeverity,
} from '../api/analysis';

const SEV_STYLE: Record<FindingSeverity, { bg: string; color: string; label: string }> = {
  critical: { bg: 'var(--red-soft)', color: 'var(--red)', label: 'critico' },
  high: { bg: 'var(--red-soft)', color: 'var(--red)', label: 'alto' },
  medium: { bg: 'var(--amber-soft)', color: 'var(--amber)', label: 'medio' },
  low: { bg: 'var(--paper-2)', color: 'var(--ink-faint)', label: 'bajo' },
};

type AsGroup = 'discrepancies' | 'escalation' | 'missing_context';

const AS_GROUP_META: Record<AsGroup, { icon: string; title: string; subtitle: string }> = {
  discrepancies: {
    icon: 'chart',
    title: 'Posibles inconsistencias',
    subtitle: 'Diferencias detectadas entre los terminos del contrato firmado.',
  },
  escalation: {
    icon: 'search',
    title: 'Vias de consulta',
    subtitle: 'Opciones disponibles para solicitar aclaracion o escalar la situacion.',
  },
  missing_context: {
    icon: 'info',
    title: 'Documentos de comparacion pendientes',
    subtitle: 'Adjuntar estos documentos permite comparar las condiciones firmadas con lo ofrecido.',
  },
};

function classifyAsFinding(f: AnalysisFinding): AsGroup {
  if (f.finding_key.startsWith('as_question_')) return 'escalation';
  if (f.finding_key.startsWith('as_missing_')) return 'missing_context';
  return 'discrepancies';
}

function groupAsFindings(findings: AnalysisFinding[]): { group: AsGroup; findings: AnalysisFinding[] }[] {
  const order: AsGroup[] = ['discrepancies', 'escalation', 'missing_context'];
  const buckets = new Map<AsGroup, AnalysisFinding[]>();
  for (const g of order) buckets.set(g, []);
  for (const f of findings) {
    const g = classifyAsFinding(f);
    buckets.get(g)!.push(f);
  }
  return order
    .filter(g => (buckets.get(g)?.length ?? 0) > 0)
    .map(g => ({ group: g, findings: buckets.get(g)! }));
}

type BsGroup = 'questions' | 'key_terms' | 'missing_info';

const BS_GROUP_META: Record<BsGroup, { icon: string; title: string; subtitle: string }> = {
  questions: {
    icon: 'search',
    title: 'Preguntas de negociacion',
    subtitle: 'Puntos que vale la pena consultar con la institucion financiera antes de firmar.',
  },
  key_terms: {
    icon: 'chart',
    title: 'Condiciones clave del credito',
    subtitle: 'Comparacion de las condiciones del contrato con referencias de mercado.',
  },
  missing_info: {
    icon: 'info',
    title: 'Informacion pendiente',
    subtitle: 'Datos que no pudimos confirmar del documento. Puedes agregarlos para mejorar el analisis.',
  },
};

function classifyBsFinding(f: AnalysisFinding): BsGroup {
  if (f.finding_key.startsWith('bs_question_')) return 'questions';
  if (f.finding_key.startsWith('bs_missing_')) return 'missing_info';
  return 'key_terms';
}

function groupBsFindings(findings: AnalysisFinding[]): { group: BsGroup; findings: AnalysisFinding[] }[] {
  const order: BsGroup[] = ['questions', 'key_terms', 'missing_info'];
  const buckets = new Map<BsGroup, AnalysisFinding[]>();
  for (const g of order) buckets.set(g, []);
  for (const f of findings) {
    const g = classifyBsFinding(f);
    buckets.get(g)!.push(f);
  }
  return order
    .filter(g => (buckets.get(g)?.length ?? 0) > 0)
    .map(g => ({ group: g, findings: buckets.get(g)! }));
}

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

function BsQuestionCard({ finding }: { finding: AnalysisFinding }) {
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
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
          {finding.evidence.map(ev => (
            <EvidenceItem key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function BsKeyTermCard({ finding }: { finding: AnalysisFinding }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLE[finding.severity] ?? SEV_STYLE.low;
  const refEvidence = finding.evidence.filter(e => e.evidence_type === 'reference');
  const calcEvidence = finding.evidence.filter(e => e.evidence_type === 'calculation');

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
            {refEvidence[0]?.citation?.reference_key && (
              <span className="pill" style={{ fontSize: 9, marginLeft: 'auto' }}>
                {refEvidence[0].citation.reference_key}
              </span>
            )}
          </div>
        )}
        {!expanded && calcEvidence.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingLeft: 20 }}>
            <span className="pill" style={{ fontSize: 10 }}>Basado en calculo</span>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {finding.evidence.length} evidencia{finding.evidence.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      {expanded && finding.evidence.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
          {finding.evidence.map(ev => (
            <EvidenceItem key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function BsMissingInfoCard({ finding }: { finding: AnalysisFinding }) {
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
          Falta contexto
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 26 }}>
        {finding.summary}
      </div>
    </div>
  );
}

function AsDiscrepancyCard({ finding }: { finding: AnalysisFinding }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_STYLE[finding.severity] ?? SEV_STYLE.low;
  const refEvidence = finding.evidence.filter(e => e.evidence_type === 'reference');

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12, borderLeft: '3px solid var(--red)' }}>
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
          </div>
        )}
      </div>
      {expanded && finding.evidence.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
          {finding.evidence.map(ev => (
            <EvidenceItem key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function AsEscalationCard({ finding }: { finding: AnalysisFinding }) {
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
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
          {finding.evidence.map(ev => (
            <EvidenceItem key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function AsMissingContextCard({ finding }: { finding: AnalysisFinding }) {
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
          Pendiente
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5, paddingLeft: 26 }}>
        {finding.summary}
      </div>
    </div>
  );
}

function AsFindingCard({ finding }: { finding: AnalysisFinding }) {
  const group = classifyAsFinding(finding);
  if (group === 'escalation') return <AsEscalationCard finding={finding} />;
  if (group === 'missing_context') return <AsMissingContextCard finding={finding} />;
  return <AsDiscrepancyCard finding={finding} />;
}

function AsGroupSection({ group, findings }: { group: AsGroup; findings: AnalysisFinding[] }) {
  const meta = AS_GROUP_META[group];
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Icon name={meta.icon} size={16} color="var(--ink-soft)" />
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: -0.01 }}>
          {meta.title}
        </h2>
        <span className="pill" style={{ fontSize: 10 }}>{findings.length}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12, paddingLeft: 26 }}>
        {meta.subtitle}
      </div>
      {findings.map(f => (
        <AsFindingCard key={f.id} finding={f} />
      ))}
    </div>
  );
}

function BsFindingCard({ finding }: { finding: AnalysisFinding }) {
  const group = classifyBsFinding(finding);
  if (group === 'questions') return <BsQuestionCard finding={finding} />;
  if (group === 'missing_info') return <BsMissingInfoCard finding={finding} />;
  return <BsKeyTermCard finding={finding} />;
}

function BsGroupSection({ group, findings }: { group: BsGroup; findings: AnalysisFinding[] }) {
  const meta = BS_GROUP_META[group];
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Icon name={meta.icon} size={16} color="var(--ink-soft)" />
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: -0.01 }}>
          {meta.title}
        </h2>
        <span className="pill" style={{ fontSize: 10 }}>{findings.length}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12, paddingLeft: 26 }}>
        {meta.subtitle}
      </div>
      {findings.map(f => (
        <BsFindingCard key={f.id} finding={f} />
      ))}
    </div>
  );
}

function FindingCard({ finding }: { finding: AnalysisFinding }) {
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
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="label" style={{ fontSize: 11 }}>Cadena de evidencia</div>
          {finding.evidence.map(ev => (
            <EvidenceItem key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { cls: string; label: string }> = {
    completed: { cls: 'pill-green', label: 'Completado' },
    running: { cls: 'pill-accent', label: 'En curso' },
    pending: { cls: '', label: 'Pendiente' },
    failed: { cls: 'pill-red', label: 'Fallido' },
  };
  const s = styles[status] ?? styles.pending;
  return <span className={`pill ${s.cls}`} style={{ fontSize: 10.5 }}>{s.label}</span>;
}

export function AnalysisResults() {
  const nav = useNav();
  const { caseId } = nav.state;
  const navSet = nav.set;
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    listAnalysisRuns(caseId)
      .then(runs => {
        if (runs.length > 0) {
          setRun(runs[0]);
          navSet({ analysisRunId: runs[0].id });
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [caseId, navSet]);

  async function handleStartAnalysis() {
    if (!caseId) return;
    setStarting(true);
    setError(null);
    try {
      const newRun = await startAnalysis(caseId);
      setRun(newRun);
      navSet({ analysisRunId: newRun.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar analisis');
    } finally {
      setStarting(false);
    }
  }

  if (!caseId) {
    return (
      <AppShell>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-soft)' }}>
          <p>No hay caso seleccionado. Crea un caso primero.</p>
          <button className="btn btn-accent" onClick={() => nav.go('case')}>
            Crear caso
          </button>
        </div>
      </AppShell>
    );
  }

  const isBeforeSigning = nav.state.analysisPlan === 'before_signing_review';
  const isAfterSigning = nav.state.analysisPlan === 'after_signing_discrepancy';
  const findings = run?.findings ?? [];
  const sortedFindings = [...findings].sort((a, b) => a.display_order - b.display_order);
  const calculations = run?.calculations ?? [];
  const unsupported = run?.unsupported_outputs ?? [];
  const sevCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});
  const bsGroups = isBeforeSigning ? groupBsFindings(sortedFindings) : [];
  const asGroups = isAfterSigning ? groupAsFindings(sortedFindings) : [];

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
        <div className="label">{isBeforeSigning ? 'Revision pre-firma' : isAfterSigning ? 'Revision post-firma' : 'Analisis'}</div>
        <h1 className="display" style={{ fontSize: 30, margin: '6px 0 4px', letterSpacing: -0.025 }}>
          {isBeforeSigning ? 'Puntos a revisar antes de firmar' : isAfterSigning ? 'Revision del contrato firmado' : 'Resultados del analisis'}
        </h1>
        {isBeforeSigning && (
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.5 }}>
            Esta revision identifica condiciones del contrato, preguntas de negociacion
            y datos pendientes. No constituye asesoria financiera.
          </div>
        )}
        {isAfterSigning && (
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.5 }}>
            Esta revision compara los terminos del contrato firmado con los calculos disponibles.
            No constituye asesoria legal ni financiera.
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <CaseContextStrip />
        </div>

        {loading && (
          <div className="card" style={{ padding: 24, marginTop: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>
            {isBeforeSigning || isAfterSigning ? 'Cargando revision...' : 'Cargando analisis...'}
          </div>
        )}

        {error && (
          <div style={{
            padding: 18, marginTop: 20, borderRadius: 10,
            background: 'var(--red-soft)', color: 'var(--red)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Icon name="x" size={14} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              className="btn btn-small"
              style={{ color: 'var(--red)', border: '1px solid var(--red)', background: 'transparent' }}
              onClick={handleStartAnalysis}
              disabled={starting}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !run && (
          <div className="card" style={{ padding: 28, marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 16 }}>
              {isBeforeSigning || isAfterSigning
                ? 'No hay revisiones previas para este caso.'
                : 'No hay analisis previos para este caso.'}
            </div>
            <button
              className="btn btn-accent"
              disabled={starting}
              onClick={handleStartAnalysis}
            >
              {starting ? 'Iniciando...' : isBeforeSigning || isAfterSigning ? 'Iniciar revision' : 'Iniciar analisis'}
              <Icon name="arrow-r" size={14} />
            </button>
          </div>
        )}

        {run && (
          <>
            <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <RunStatusBadge status={run.status} />
                {run.status === 'completed' && (
                  <>
                    <span className="pill">
                      {findings.length} {isBeforeSigning ? 'punto' : 'hallazgo'}{findings.length !== 1 ? 's' : ''}
                    </span>
                    <span className="pill">{calculations.length} calculo{calculations.length !== 1 ? 's' : ''}</span>
                    {sevCounts.high && <span className="pill pill-red">{sevCounts.high} alto{(sevCounts.high ?? 0) > 1 ? 's' : ''}</span>}
                    {sevCounts.medium && <span className="pill pill-amber">{sevCounts.medium} medio{(sevCounts.medium ?? 0) > 1 ? 's' : ''}</span>}
                  </>
                )}
                {run.status === 'failed' && run.error_message && (
                  <span style={{ fontSize: 12, color: 'var(--red)' }}>{run.error_message}</span>
                )}
                <div style={{ flex: 1 }} />
                {run.latency_ms !== null && (
                  <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                    {run.latency_ms}ms
                  </span>
                )}
                {run.agent_provider && (
                  <span className="pill" style={{ fontSize: 10 }}>{run.agent_provider}</span>
                )}
              </div>
            </div>

            {run.status === 'completed' && sortedFindings.length > 0 && isBeforeSigning && (
              <>
                {bsGroups.map(({ group, findings: gFindings }) => (
                  <BsGroupSection key={group} group={group} findings={gFindings} />
                ))}
              </>
            )}

            {run.status === 'completed' && sortedFindings.length > 0 && isAfterSigning && (
              <>
                {asGroups.map(({ group, findings: gFindings }) => (
                  <AsGroupSection key={group} group={group} findings={gFindings} />
                ))}
              </>
            )}

            {run.status === 'completed' && sortedFindings.length > 0 && !isBeforeSigning && !isAfterSigning && (
              <div style={{ marginTop: 20 }}>
                <div className="label" style={{ marginBottom: 10 }}>
                  Hallazgos ({findings.length})
                </div>
                {sortedFindings.map(f => (
                  <FindingCard key={f.id} finding={f} />
                ))}
              </div>
            )}

            {run.status === 'completed' && findings.length === 0 && (
              <div className="card" style={{ padding: 24, marginTop: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>
                <Icon name="check-circle" size={20} color="var(--green)" />
                <div style={{ marginTop: 8, fontSize: 15 }}>
                  {isBeforeSigning
                    ? 'No se identificaron puntos a revisar antes de firmar.'
                    : isAfterSigning
                    ? 'No se detectaron inconsistencias en el contrato firmado.'
                    : 'No se detectaron discrepancias.'}
                </div>
              </div>
            )}

            {unsupported.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="label" style={{ marginBottom: 10 }}>
                  Salidas no soportadas ({unsupported.length})
                </div>
                {unsupported.map(u => (
                  <div key={u.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="x" size={13} color="var(--ink-faint)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{u.output_key}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, paddingLeft: 21 }}>
                      {u.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {run.status === 'completed' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-accent"
                  onClick={handleStartAnalysis}
                  disabled={starting}
                >
                  {starting ? 'Iniciando...' : isBeforeSigning || isAfterSigning ? 'Volver a revisar' : 'Volver a analizar'}
                </button>
                {!isBeforeSigning && (
                  <button className="btn btn-ghost" onClick={() => nav.go('coach')}>
                    Ver vista prototipo
                  </button>
                )}
              </div>
            )}

            {run.status === 'failed' && (
              <div style={{ marginTop: 20 }}>
                <button
                  className="btn btn-accent"
                  onClick={handleStartAnalysis}
                  disabled={starting}
                >
                  {starting ? 'Iniciando...' : isBeforeSigning || isAfterSigning ? 'Reintentar revision' : 'Reintentar analisis'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
