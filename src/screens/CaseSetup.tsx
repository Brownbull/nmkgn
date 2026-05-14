import { type FormEvent, useMemo, useState } from 'react';
import { createCase, defaultAnalysisPlan, type CaseStage } from '../api/cases';
import { Icon } from '../components/Icon';
import { AppShell } from '../components/shared';
import { useNav } from '../components/NavContext';

interface ParseOptionalIntResult {
  value?: number;
  error?: string;
}

function parseOptionalPositiveInt(value: string, fieldLabel: string, max?: number): ParseOptionalIntResult {
  const trimmed = value.trim();
  if (!trimmed) return {};
  const normalized = Number(trimmed.replace(/\./g, '').replace(/,/g, ''));
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return { error: `${fieldLabel} debe ser un numero mayor a cero.` };
  }
  if (max !== undefined && normalized > max) {
    return { error: `${fieldLabel} debe estar entre 1 y ${max}.` };
  }
  return { value: normalized };
}

export function CaseSetup() {
  const nav = useNav();
  const [title, setTitle] = useState('Credito para construir casa');
  const [caseStage, setCaseStage] = useState<CaseStage>('before_signing');
  const [institutionName, setInstitutionName] = useState('Banco Demo');
  const [requestedAmount, setRequestedAmount] = useState('25000000');
  const [expectedTerm, setExpectedTerm] = useState('60');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const analysisPlan = useMemo(() => defaultAnalysisPlan(caseStage), [caseStage]);
  const canSubmit = !submitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !institutionName.trim()) {
      setError('El caso necesita un nombre y una institucion.');
      return;
    }

    const amount = parseOptionalPositiveInt(requestedAmount, 'Monto solicitado');
    if (amount.error) {
      setError(amount.error);
      return;
    }

    const term = parseOptionalPositiveInt(expectedTerm, 'Plazo esperado', 600);
    if (term.error) {
      setError(term.error);
      return;
    }

    try {
      setSubmitting(true);
      const created = await createCase({
        title: title.trim(),
        case_stage: caseStage,
        document_type: 'consumer_credit',
        analysis_plan: analysisPlan,
        institution_name: institutionName.trim(),
        requested_amount_clp: amount.value,
        expected_term_months: term.value,
      });
      nav.set({
        caseId: created.id,
        caseTitle: created.title,
        caseStage: created.case_stage,
        analysisPlan: created.analysis_plan,
        institutionName: created.institution_name,
        docType: 'bank',
        docLabel: 'Crédito bancario',
        detectionScenario: 'ready',
        mockAnalysisAcknowledged: false,
      });
      nav.go('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear el caso.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell activeNav="Análisis">
      <div className="case-flow-page" style={{ padding: '32px 40px', maxWidth: 1040, margin: '0 auto' }}>
        <div className="label">Nuevo caso</div>
        <h1 className="display" style={{ fontSize: 36, margin: '8px 0 6px', letterSpacing: 0 }}>
          Primero definamos el contexto.
        </h1>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', maxWidth: 680, lineHeight: 1.5 }}>
          Esta primera version solo crea casos de credito de consumo chileno. Los documentos vienen despues; aqui fijamos la etapa y los campos minimos para no analizar a ciegas.
        </div>

        <div className="case-flow-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, marginTop: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
          <div style={fieldGridStyle}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Nombre del caso</span>
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                maxLength={160}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Institucion</span>
              <input
                value={institutionName}
                onChange={event => setInstitutionName(event.target.value)}
                maxLength={160}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ ...fieldGridStyle, marginTop: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Etapa del caso</span>
              <select
                value={caseStage}
                onChange={event => setCaseStage(event.target.value as CaseStage)}
                style={inputStyle}
              >
                <option value="before_signing">Antes de firmar</option>
                <option value="after_signing">Despues de firmar</option>
              </select>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Plan de analisis</span>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: 'var(--paper-2)', color: 'var(--ink-soft)' }}>
                {analysisPlan === 'before_signing_review' ? 'Revision antes de firmar' : 'Discrepancias despues de firmar'}
              </div>
            </div>
          </div>

          <div style={{ ...fieldGridStyle, marginTop: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Monto solicitado (CLP, opcional)</span>
              <input
                inputMode="numeric"
                value={requestedAmount}
                onChange={event => setRequestedAmount(event.target.value)}
                aria-invalid={error?.startsWith('Monto solicitado') ? true : undefined}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className="label">Plazo esperado (meses, opcional)</span>
              <input
                inputMode="numeric"
                value={expectedTerm}
                onChange={event => setExpectedTerm(event.target.value)}
                aria-invalid={error?.startsWith('Plazo esperado') ? true : undefined}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <span className="pill pill-accent">Tipo: credito de consumo</span>
            <span className="pill">Usuario demo: demo-user</span>
            <span className="pill">PostgreSQL</span>
            <span className="pill">FastAPI</span>
          </div>

          {error && (
            <div style={{
              marginTop: 18,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--red-soft)',
              color: 'var(--red)',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={() => nav.go('login')}>
              <Icon name="arrow-l" size={14} /> Volver
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.55 }}>
              {submitting ? 'Creando caso...' : 'Crear caso y subir documentos'} <Icon name="arrow-r" size={14} />
            </button>
          </div>
        </form>

        <aside className="card-soft" style={{ padding: 18 }}>
          <div className="label">Ruta del caso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {[
              ['1', 'Caso', 'Campos fijos y etapa'],
              ['2', 'Documento', 'Credito de consumo'],
              ['3', 'Lectura', 'Estados simulados'],
              ['4', 'Plan', 'Criterios por fuente'],
            ].map(([n, titleText, sub]) => (
              <div key={n} style={{ display: 'flex', gap: 10 }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: n === '1' ? 'var(--accent)' : '#fff',
                  color: n === '1' ? '#fff' : 'var(--ink-soft)',
                  border: n === '1' ? '1px solid var(--accent)' : '1px solid var(--line)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  flex: '0 0 auto',
                }}>{n}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800 }}>{titleText}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
        </div>
      </div>
    </AppShell>
  );
}

const inputStyle = {
  height: 42,
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--ink)',
  padding: '0 12px',
  fontFamily: 'Manrope',
  fontSize: 14,
  outline: 'none',
} as const;

const fieldGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 18,
} as const;
