import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { DocBadge } from '../components/DocBadge';
import { AppShell, CaseContextStrip, ProgressBar, PrototypeNotice } from '../components/shared';
import { useNav, type NavState } from '../components/NavContext';

type DetectionScenario = NonNullable<NavState['detectionScenario']>;

const SCENARIO_STEP: Record<DetectionScenario, string> = {
  ready: 'detect',
  low_confidence: 'detect-low',
  unsupported: 'detect-unsupported',
  failed: 'detect-failed',
};

const RESULT_COPY: Record<DetectionScenario, {
  pillClass: string;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  badgeConfidence?: 'high' | 'low';
  primary: string;
  secondary: string;
}> = {
  ready: {
    pillClass: 'pill-green',
    icon: 'check-circle',
    eyebrow: 'Identificado con alta confianza',
    title: 'Este es un credito de consumo.',
    body: 'Lo vamos a revisar contra fuentes locales, referencias de mercado y las comparaciones que subas para este mismo caso.',
    badgeConfidence: 'high',
    primary: 'Personalizar plan',
    secondary: 'No es esto, cambiar tipo',
  },
  low_confidence: {
    pillClass: 'pill-amber',
    icon: 'shield-check',
    eyebrow: 'Confianza baja',
    title: 'Parece credito de consumo, pero necesita confirmacion.',
    body: 'El prototipo encontro senales mixtas. Antes de analizar, el usuario debe confirmar el tipo de documento o reemplazar el archivo.',
    badgeConfidence: 'low',
    primary: 'Confirmar y personalizar plan',
    secondary: 'Cambiar documento',
  },
  unsupported: {
    pillClass: 'pill-amber',
    icon: 'x',
    eyebrow: 'Tipo no soportado',
    title: 'Este documento queda fuera del v0.',
    body: 'El caso guardado sigue siendo de credito de consumo. Este resultado simulado muestra como bloqueamos otros tipos hasta tener schemas y agentes propios.',
    primary: 'Volver a subir',
    secondary: 'Ver estado de credito',
  },
  failed: {
    pillClass: 'pill-red',
    icon: 'x',
    eyebrow: 'Lectura fallida',
    title: 'No pudimos leer el documento.',
    body: 'Este estado cubre PDFs danados, imagenes ilegibles o archivos sin texto suficiente. No hay analisis hasta reemplazar el archivo.',
    primary: 'Reintentar subida',
    secondary: 'Ver estado listo demo',
  },
};

function Step({ done, running, queued, label, detail }: {
  done: boolean; running: boolean; queued?: boolean; label: string; detail: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: done ? 'var(--accent)' : running ? '#fff' : 'var(--paper-2)',
        border: done ? '1px solid var(--accent)' : running ? '1.5px solid var(--accent)' : '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}>
        {done ? <Icon name="check" size={12} color="#fff" strokeWidth={2.5} /> :
         running ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> : null}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: done || running ? 600 : 500, color: queued ? 'var(--ink-faint)' : 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{detail}</div>
      </div>
      {running && <span className="pill pill-accent" style={{ fontSize: 10.5 }}>en curso</span>}
    </div>
  );
}

export function DetectProcessing() {
  const nav = useNav();
  const [pct, setPct] = useState(nav.interactive ? 0 : 92);
  const [phase, setPhase] = useState(0);
  const scenario = nav.state.detectionScenario ?? 'ready';

  useEffect(() => {
    if (!nav.interactive) return;
    const t1 = setInterval(() => setPct(p => p < 100 ? p + 4 : p), 80);
    const t2 = setTimeout(() => setPhase(1), 600);
    const t3 = setTimeout(() => setPhase(2), 1400);
    const t4 = setTimeout(() => setPhase(3), 2100);
    const t5 = setTimeout(() => nav.go(SCENARIO_STEP[scenario]), 2700);
    return () => { clearInterval(t1); [t2, t3, t4, t5].forEach(clearTimeout); };
  }, [nav.interactive, nav, scenario]);

  return (
    <AppShell>
      <div className="detection-page" style={{ padding: '40px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div className="label">Paso 2 de 4</div>
        <h1 className="display" style={{ fontSize: 32, margin: '8px 0 6px', letterSpacing: -0.025 }}>Leyendo tu documento…</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Primero identificamos qué tipo es. Solo analizamos los que conocemos a fondo.</div>

        <div style={{ marginTop: 18 }}>
          <CaseContextStrip />
        </div>

        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 60, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="file" size={20} color="var(--ink-faint)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{nav.state.fileName ?? 'contrato.pdf'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>6 páginas · 412 KB · subido hace 4 seg</div>
            </div>
            <span className="pill pill-accent">{pct}%</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <ProgressBar pct={pct} accent="var(--accent)" />
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Step done={phase >= 1} running={phase === 0} label="OCR · texto extraído" detail="6 páginas leídas en 8.2s" />
            <Step done={phase >= 2} running={phase === 1} queued={phase < 1} label="Detectando tipo de documento" detail={scenario === 'low_confidence' ? 'Credito de consumo · 58% confianza' : scenario === 'unsupported' ? 'Arriendo · no soportado' : scenario === 'failed' ? 'Texto insuficiente' : 'Credito de consumo · 92% confianza'} />
            <Step done={phase >= 3} running={phase === 2} queued={phase < 2} label="Cargando estándares y benchmarks" detail="CMF marzo 2025 · Ley 19.496" />
            <Step done={false} running={phase === 3} queued={phase < 3} label="Preparando estado de prototipo" detail={RESULT_COPY[scenario].eyebrow} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <PrototypeNotice compact />
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 14, textAlign: 'center' }}>
          Esto suele tomar 20–40 segundos · te avisamos cuando termine.
        </div>
      </div>
    </AppShell>
  );
}

function DetectionResult({ scenario }: { scenario: DetectionScenario }) {
  const nav = useNav();
  const copy = RESULT_COPY[scenario];
  const canContinue = scenario === 'ready' || scenario === 'low_confidence';
  const isBlocked = !canContinue;
  const docLabel = scenario === 'unsupported' ? 'Arriendo' : (nav.state.docLabel ?? 'Crédito de consumo');

  function primaryAction() {
    if (canContinue) {
      nav.set({ detectionScenario: scenario });
      nav.go('plan');
      return;
    }
    nav.go('upload');
  }

  function secondaryAction() {
    if (scenario === 'ready' || scenario === 'low_confidence') {
      nav.go('upload');
      return;
    }
    nav.set({ detectionScenario: 'ready', docType: 'bank', docLabel: 'Crédito bancario' });
    nav.go('detect');
  }

  return (
    <AppShell>
      <div className="detection-page" style={{ padding: '40px 40px', maxWidth: 880, margin: '0 auto' }}>
        <div className="label">Paso 2 de 4</div>
        <div style={{ marginTop: 14 }}>
          <CaseContextStrip />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span className={`pill ${copy.pillClass}`}><Icon name={copy.icon} size={13} /> {copy.eyebrow}</span>
          <span className="pill pill-amber">Prototipo</span>
        </div>
        <h1 className="display" style={{ fontSize: 38, margin: '14px 0 6px', letterSpacing: -0.025 }}>
          {scenario === 'ready' ? (
            <>Este es un <span style={{ color: 'var(--accent)' }}>{docLabel}</span>.</>
          ) : copy.title}
        </h1>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: 600, lineHeight: 1.55 }}>
          {copy.body}
        </div>

        {copy.badgeConfidence && (
          <div style={{ marginTop: 22 }}>
            <DocBadge confidence={copy.badgeConfidence} label={docLabel} icon={nav.state.docType ?? 'bank'} />
          </div>
        )}

        <div className="card" style={{ marginTop: 22, padding: '18px 22px' }}>
          <div className="label">{isBlocked ? 'Por que se bloquea' : 'Qué vamos a revisar'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px', marginTop: 14 }}>
            {(isBlocked ? [
              'No hay schema estable para este resultado',
              'No se generaran hallazgos de confianza',
              'El caso persistido no cambia de tipo',
              'El usuario debe reemplazar o confirmar el documento',
            ] : [
              'Plazo y cantidad de cuotas',
              'CAE vs. promedio CMF',
              'Tasa de interés nominal',
              'Comisión inicial vs. mercado',
              'Seguros vinculados al banco',
              'Cláusulas de mora y aceleración',
              'Prepago y costo de prepago',
              'Cláusulas abusivas (Art. 16)',
            ]).map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                <Icon name={isBlocked ? 'x' : 'check'} size={14} color={isBlocked ? 'var(--amber)' : 'var(--accent)'} strokeWidth={2} /> {c}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <PrototypeNotice compact />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
          <button className="btn btn-ghost" style={{ color: 'var(--ink-soft)' }} onClick={secondaryAction}>{copy.secondary}</button>
          <button className="btn btn-accent" onClick={primaryAction}>{copy.primary} <Icon name="arrow-r" size={14} /></button>
        </div>
      </div>
    </AppShell>
  );
}

export function DetectReady() {
  return <DetectionResult scenario="ready" />;
}

export function DetectLowConfidence() {
  return <DetectionResult scenario="low_confidence" />;
}

export function DetectUnsupported() {
  return <DetectionResult scenario="unsupported" />;
}

export function DetectFailed() {
  return <DetectionResult scenario="failed" />;
}
