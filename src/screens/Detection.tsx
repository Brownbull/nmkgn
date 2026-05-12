import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { DocBadge } from '../components/DocBadge';
import { AppShell, ProgressBar } from '../components/shared';
import { useNav } from '../components/NavContext';

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

  useEffect(() => {
    if (!nav.interactive) return;
    const t1 = setInterval(() => setPct(p => p < 100 ? p + 4 : p), 80);
    const t2 = setTimeout(() => setPhase(1), 600);
    const t3 = setTimeout(() => setPhase(2), 1400);
    const t4 = setTimeout(() => setPhase(3), 2100);
    const t5 = setTimeout(() => nav.go('detect'), 2700);
    return () => { clearInterval(t1); [t2, t3, t4, t5].forEach(clearTimeout); };
  }, [nav.interactive, nav]);

  return (
    <AppShell>
      <div style={{ padding: '40px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div className="label">Paso 2 de 4</div>
        <h1 className="display" style={{ fontSize: 32, margin: '8px 0 6px', letterSpacing: -0.025 }}>Leyendo tu documento…</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Primero identificamos qué tipo es. Solo analizamos los que conocemos a fondo.</div>

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
            <Step done={phase >= 2} running={phase === 1} queued={phase < 1} label="Detectando tipo de documento" detail="Crédito de consumo · 92% confianza" />
            <Step done={phase >= 3} running={phase === 2} queued={phase < 2} label="Cargando estándares y benchmarks" detail="CMF marzo 2025 · Ley 19.496" />
            <Step done={false} running={phase === 3} queued={phase < 3} label="Listo para mostrarte resultados" detail="11 criterios" />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 14, textAlign: 'center' }}>
          Esto suele tomar 20–40 segundos · te avisamos cuando termine.
        </div>
      </div>
    </AppShell>
  );
}

export function DetectReady() {
  const nav = useNav();

  return (
    <AppShell>
      <div style={{ padding: '40px 40px', maxWidth: 880, margin: '0 auto' }}>
        <div className="label">Paso 2 de 4</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span className="pill pill-green"><Icon name="check-circle" size={13} /> Identificado con alta confianza</span>
        </div>
        <h1 className="display" style={{ fontSize: 38, margin: '14px 0 6px', letterSpacing: -0.025 }}>
          Este es un <span style={{ color: 'var(--accent)' }}>{nav.state.docLabel ?? 'Crédito de consumo'}</span>.
        </h1>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: 600, lineHeight: 1.55 }}>
          Lo vamos a revisar contra los estándares de la <b>CMF</b>, la <b>Ley del Consumidor</b> (19.496) y los benchmarks de mercado de marzo 2025.
        </div>

        <div style={{ marginTop: 22 }}>
          <DocBadge confidence="high" label={nav.state.docLabel ?? 'Crédito de consumo'} icon={nav.state.docType ?? 'bank'} />
        </div>

        <div className="card" style={{ marginTop: 22, padding: '18px 22px' }}>
          <div className="label">Qué vamos a revisar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px', marginTop: 14 }}>
            {[
              'Plazo y cantidad de cuotas',
              'CAE vs. promedio CMF',
              'Tasa de interés nominal',
              'Comisión inicial vs. mercado',
              'Seguros vinculados al banco',
              'Cláusulas de mora y aceleración',
              'Prepago y costo de prepago',
              'Cláusulas abusivas (Art. 16)',
            ].map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                <Icon name="check" size={14} color="var(--accent)" strokeWidth={2} /> {c}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
          <button className="btn btn-ghost" style={{ color: 'var(--ink-soft)' }} onClick={() => nav.go('upload')}>No es esto, cambiar tipo</button>
          <button className="btn btn-accent" onClick={() => nav.go('plan')}>Personalizar plan <Icon name="arrow-r" size={14} /></button>
        </div>
      </div>
    </AppShell>
  );
}
