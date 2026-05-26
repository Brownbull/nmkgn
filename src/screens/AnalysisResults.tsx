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

  const findings = run?.findings ?? [];
  const sortedFindings = [...findings].sort((a, b) => a.display_order - b.display_order);
  const calculations = run?.calculations ?? [];
  const unsupported = run?.unsupported_outputs ?? [];
  const sevCounts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
        <div className="label">Analisis</div>
        <h1 className="display" style={{ fontSize: 30, margin: '6px 0 4px', letterSpacing: -0.025 }}>
          Resultados del analisis
        </h1>
        <div style={{ marginTop: 10 }}>
          <CaseContextStrip />
        </div>

        {loading && (
          <div className="card" style={{ padding: 24, marginTop: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>
            Cargando analisis...
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: 18, marginTop: 20, background: 'var(--red-soft)', color: 'var(--red)' }}>
            <Icon name="x" size={14} /> {error}
          </div>
        )}

        {!loading && !run && (
          <div className="card" style={{ padding: 28, marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 16 }}>
              No hay analisis previos para este caso.
            </div>
            <button
              className="btn btn-accent"
              disabled={starting}
              onClick={handleStartAnalysis}
            >
              {starting ? 'Iniciando...' : 'Iniciar analisis'}
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
                    <span className="pill">{findings.length} hallazgo{findings.length !== 1 ? 's' : ''}</span>
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

            {run.status === 'completed' && sortedFindings.length > 0 && (
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
                <div style={{ marginTop: 8, fontSize: 15 }}>No se detectaron discrepancias.</div>
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
                  {starting ? 'Iniciando...' : 'Volver a analizar'}
                </button>
                <button className="btn btn-ghost" onClick={() => nav.go('coach')}>
                  Ver vista prototipo
                </button>
              </div>
            )}

            {run.status === 'failed' && (
              <div style={{ marginTop: 20 }}>
                <button
                  className="btn btn-accent"
                  onClick={handleStartAnalysis}
                  disabled={starting}
                >
                  {starting ? 'Iniciando...' : 'Reintentar analisis'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
