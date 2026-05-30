import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { AppShell } from '../components/shared';
import { useNav } from '../components/NavContext';
import { listAnalysisRuns, type AnalysisFinding } from '../api/analysis';
import {
  exportFindings,
  generateDraft,
  type DraftResult,
  type ExportSummary,
} from '../api/export';

type Step = 'select' | 'preview' | 'draft';

const SEV_COLORS: Record<string, { pill: string; label: string }> = {
  critical: { pill: 'pill-red', label: 'Critico' },
  high: { pill: 'pill-red', label: 'Alto' },
  medium: { pill: 'pill-amber', label: 'Atencion' },
  low: { pill: '', label: 'Info' },
};

function sevMeta(sev: string) {
  return SEV_COLORS[sev] ?? { pill: '', label: sev };
}

export function Email() {
  const nav = useNav();
  const caseId = nav.state.caseId ?? '';

  const [findings, setFindings] = useState<AnalysisFinding[]>([]);
  const [loadingFindings, setLoadingFindings] = useState(true);

  useEffect(() => {
    if (!caseId) { setLoadingFindings(false); return; }
    listAnalysisRuns(caseId)
      .then(runs => {
        const completed = runs.find(r => r.status === 'completed');
        setFindings(completed?.findings ?? []);
      })
      .catch(() => setFindings([]))
      .finally(() => setLoadingFindings(false));
  }, [caseId]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionInit, setSelectionInit] = useState(false);

  useEffect(() => {
    if (!selectionInit && findings.length > 0) {
      setSelected(new Set(findings.filter(f => f.claim_type !== 'inference').map(f => f.id)));
      setSelectionInit(true);
    }
  }, [findings, selectionInit]);

  const [step, setStep] = useState<Step>('select');
  const [exportResult, setExportResult] = useState<ExportSummary | null>(null);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === findings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(findings.map(f => f.id)));
    }
  }

  async function handleExport() {
    if (!caseId || selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await exportFindings(caseId, [...selected]);
      setExportResult(result);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setLoading(false);
    }
  }

  async function handleDraft() {
    if (!caseId || selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateDraft(caseId, [...selected]);
      setDraftResult(result);
      setStep('draft');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar borrador');
    } finally {
      setLoading(false);
    }
  }

  function draftAsText(): string {
    if (!draftResult) return '';
    return draftResult.sections
      .map(s => `${s.heading}\n${'—'.repeat(s.heading.length)}\n\n${s.body}`)
      .join('\n\n');
  }

  async function handleCopy() {
    const text = draftAsText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar al portapapeles');
    }
  }

  function handleDownload() {
    const text = draftAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borrador-${caseId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div style={{ padding: '28px 32px', maxWidth: 960 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <div className="label">Exportar y redactar</div>
            <h1 className="display" style={{ fontSize: 28, margin: '6px 0 4px' }}>
              {step === 'select' && 'Seleccionar hallazgos'}
              {step === 'preview' && 'Vista previa de exportación'}
              {step === 'draft' && 'Borrador de comunicación'}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {step === 'select' && `${selected.size} de ${findings.length} hallazgo(s) seleccionado(s)`}
              {step === 'preview' && `${exportResult?.finding_count ?? 0} hallazgo(s) exportado(s)`}
              {step === 'draft' && 'Revisa y edita el borrador antes de copiar o descargar.'}
            </div>
          </div>
          <button
            className="btn btn-small btn-ghost"
            style={{ color: 'var(--ink-soft)' }}
            onClick={() => {
              if (step === 'draft') setStep('preview');
              else if (step === 'preview') setStep('select');
              else nav.go('findings');
            }}
          >
            ← {step === 'select' ? 'Volver' : 'Atrás'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ padding: '12px 16px', marginBottom: 16, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13 }}>
            <Icon name="info" size={13} /> {error}
          </div>
        )}

        {step === 'select' && (
          <SelectionStep
            findings={findings}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onExport={handleExport}
            onDraft={handleDraft}
            loading={loading}
          />
        )}

        {step === 'preview' && exportResult && (
          <PreviewStep
            exportResult={exportResult}
            onDraft={handleDraft}
            onBack={() => setStep('select')}
            loading={loading}
          />
        )}

        {step === 'draft' && draftResult && (
          <DraftStep
            draftResult={draftResult}
            onCopy={handleCopy}
            onDownload={handleDownload}
            copied={copied}
          />
        )}
      </div>
    </AppShell>
  );
}

interface SelectionStepProps {
  findings: AnalysisFinding[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onExport: () => void;
  onDraft: () => void;
  loading: boolean;
}

function SelectionStep({ findings, selected, onToggle, onToggleAll, onExport, onDraft, loading }: SelectionStepProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selected.size === findings.length && findings.length > 0}
            onChange={onToggleAll}
          />
          Seleccionar todos
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {findings.map(f => {
          const meta = sevMeta(f.severity);
          return (
            <label
              key={f.id}
              className="card"
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                opacity: selected.has(f.id) ? 1 : 0.5,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(f.id)}
                onChange={() => onToggle(f.id)}
                style={{ marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`pill ${meta.pill}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{f.title}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{f.summary}</div>
                {f.claim_type === 'inference' && (
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                    ⚠ Tipo inferencia — será excluido de la exportación
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {loadingFindings && (
        <div className="card-soft" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
          Cargando hallazgos...
        </div>
      )}

      {!loadingFindings && findings.length === 0 && (
        <div className="card-soft" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
          No hay hallazgos disponibles. Ejecuta un análisis primero.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-small"
          onClick={onExport}
          disabled={selected.size === 0 || loading}
        >
          {loading ? 'Exportando...' : `Exportar ${selected.size} hallazgo(s)`}
        </button>
        <button
          className="btn btn-small btn-accent"
          onClick={onDraft}
          disabled={selected.size === 0 || loading}
        >
          <Icon name="edit" size={13} />
          {loading ? 'Generando...' : 'Generar borrador'}
        </button>
      </div>
    </>
  );
}

interface PreviewStepProps {
  exportResult: ExportSummary;
  onDraft: () => void;
  onBack: () => void;
  loading: boolean;
}

function PreviewStep({ exportResult, onDraft, onBack, loading }: PreviewStepProps) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {exportResult.findings.map(f => (
          <div key={f.finding_id} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`pill ${sevMeta(f.severity).pill}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                {sevMeta(f.severity).label}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{f.title}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 8 }}>{f.summary}</div>
            {f.evidence.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                Respaldo: {f.evidence.map(e => e.evidence_type).join(', ')}
                {f.evidence.some(e => e.citation_label) && (
                  <> — {f.evidence.filter(e => e.citation_label).map(e => e.citation_label).join(', ')}</>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {exportResult.rejected.length > 0 && (
        <div className="card-soft" style={{ padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--ink-soft)' }}>
          <strong>{exportResult.rejected.length} hallazgo(s) excluido(s):</strong>
          <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px' }}>
            {exportResult.rejected.map((r, i) => (
              <li key={i}>{r.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-small btn-ghost" onClick={onBack}>← Cambiar selección</button>
        <button
          className="btn btn-small btn-accent"
          onClick={onDraft}
          disabled={loading}
        >
          <Icon name="edit" size={13} />
          {loading ? 'Generando...' : 'Generar borrador'}
        </button>
      </div>
    </>
  );
}

interface DraftStepProps {
  draftResult: DraftResult;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

function DraftStep({ draftResult, onCopy, onDownload, copied }: DraftStepProps) {
  const [editableSections, setEditableSections] = useState(
    () => draftResult.sections.map(s => ({ ...s })),
  );

  function updateSection(index: number, body: string) {
    setEditableSections(prev =>
      prev.map((s, i) => (i === index ? { ...s, body } : s)),
    );
  }

  return (
    <>
      {draftResult.filtered_phrases.length > 0 && (
        <div className="card-soft" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--ink-soft)' }}>
          <Icon name="info" size={11} /> Filtro B4: {draftResult.filtered_phrases.length} frase(s) reemplazada(s) con lenguaje cauteloso.
        </div>
      )}

      {draftResult.warnings.length > 0 && (
        <div className="card-soft" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--ink-soft)' }}>
          {draftResult.warnings.map((w, i) => (
            <div key={i}><Icon name="info" size={11} /> {w}</div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {editableSections.map((section, i) => (
          <div key={i} style={{ borderBottom: i < editableSections.length - 1 ? '1px solid var(--line)' : undefined }}>
            <div style={{ padding: '10px 18px', background: 'var(--paper)', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {section.heading}
            </div>
            <textarea
              value={section.body}
              onChange={e => updateSection(i, e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                padding: '14px 18px',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'Manrope, sans-serif',
                color: 'var(--ink)',
                background: 'transparent',
                minHeight: 80,
                boxSizing: 'border-box',
              }}
              rows={Math.max(3, section.body.split('\n').length + 1)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-small" onClick={onCopy}>
          <Icon name="file" size={13} /> {copied ? '¡Copiado!' : 'Copiar texto'}
        </button>
        <button className="btn btn-small btn-accent" onClick={onDownload}>
          <Icon name="download" size={13} /> Descargar .txt
        </button>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
        Este borrador no constituye asesoría legal ni financiera. Revisa el contenido antes de enviar.
      </div>
    </>
  );
}
