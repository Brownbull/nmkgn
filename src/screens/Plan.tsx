import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { DocBadge } from '../components/DocBadge';
import { AppShell, CaseContextStrip, Toggle, ProgressBar, PrototypeNotice } from '../components/shared';
import { LensTag } from '../components/Lenses';
import { useNav } from '../components/NavContext';

function PlanGroupHeader({ icon, title, sub, count, on, accent = 'var(--accent)' }: {
  icon: string; title: string; sub: string; count: string; on: boolean; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: on ? 'var(--accent-soft)' : 'var(--paper-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}>
        <Icon name={icon} size={18} color={on ? accent : 'var(--ink-faint)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.01 }}>{title}</span>
          <span className="num" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{count}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={on} />
    </div>
  );
}

function Criterion({ on = true, title, sub, status, finding, refOnly }: {
  on?: boolean; title: string; sub: string; status?: string; finding?: string; refOnly?: boolean;
}) {
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isQueued = status === 'queued';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      opacity: on ? 1 : 0.5,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5, flex: '0 0 auto',
        background: status ? (isDone ? (finding ? 'var(--red-soft)' : 'var(--accent-soft)') : isRunning ? '#fff' : 'var(--paper-2)') : (on ? '#fff' : 'var(--paper-2)'),
        border: status ? (isDone ? 'none' : isRunning ? '1.5px solid var(--accent)' : '1px solid var(--line)') : (on ? '1.5px solid var(--accent)' : '1px solid var(--line-2)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {status ? (
          isDone ? <Icon name={finding ? 'x' : 'check'} size={11} color={finding ? 'var(--red)' : 'var(--accent)'} strokeWidth={2.5} /> :
          isRunning ? <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} /> : null
        ) : (
          on ? <Icon name="check" size={11} color="var(--accent)" strokeWidth={2.5} /> : null
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{title} {refOnly && <span className="pill" style={{ fontSize: 9.5, marginLeft: 4, padding: '1px 6px' }}>solo referencia</span>}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
      </div>
      {status && (
        isDone ? (finding ? <span className="pill pill-red" style={{ fontSize: 10.5 }}>{finding}</span> : <span className="pill pill-green" style={{ fontSize: 10.5 }}>OK</span>) :
        isRunning ? <span className="pill pill-accent" style={{ fontSize: 10.5 }}>analizando…</span> :
        isQueued ? <span className="pill" style={{ fontSize: 10.5 }}>en cola</span> : null
      )}
    </div>
  );
}

function PresetChip({ active, label, sub }: { active?: boolean; label: string; sub: string }) {
  return (
    <div style={{
      padding: '8px 14px',
      border: active ? '1px solid var(--ink)' : '1px solid var(--line)',
      background: active ? 'var(--ink)' : '#fff',
      color: active ? 'var(--paper)' : 'var(--ink)',
      borderRadius: 10,
      cursor: 'pointer',
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SummaryLine({ icon, label, count, muted }: { icon: string; label: string; count: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={14} color={muted ? 'var(--ink-faint)' : 'var(--ink)'} />
      <span style={{ fontSize: 13, color: muted ? 'var(--ink-faint)' : 'var(--ink)' }}>{label}</span>
      <div style={{ flex: 1 }} />
      <span className="num" style={{ fontSize: 13, fontWeight: 600, color: muted ? 'var(--ink-faint)' : 'var(--ink)' }}>{count}</span>
    </div>
  );
}

export function PlanScreen() {
  const nav = useNav();

  return (
    <AppShell>
      <div className="plan-workspace" style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="label">Paso 3 de 4</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 12 }}>
            <div>
              <h1 className="display" style={{ fontSize: 30, margin: 0, letterSpacing: -0.025 }}>Plan de análisis</h1>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>
                Elige contra qué queremos comparar tu crédito. Puedes activar o desactivar cualquier criterio.
              </div>
            </div>
            <DocBadge compact />
          </div>

          <div style={{ marginTop: 14 }}>
            <CaseContextStrip />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <PresetChip active label="Completo" sub="todo · ~ 2 min" />
            <PresetChip label="Solo legal" sub="rápido" />
            <PresetChip label="Solo mercado" sub="benchmarks" />
            <PresetChip label="Personalizado" sub="el actual" />
            <div style={{ flex: 1 }} />
            <button className="btn btn-small"><Icon name="search" size={13} /> Buscar criterio</button>
          </div>

          <div className="scrollable" style={{ flex: 1, marginTop: 16, overflowY: 'auto', paddingRight: 6 }}>
            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="scale" title="Ley y prácticas en Chile" sub="Ley 19.496 · CMF · SERNAC" count="5 / 5" on />
              <div className="divider" />
              <Criterion title="Cláusulas abusivas (Art. 16 Ley 19.496)" sub="Listado SERNAC · vigencia 2024" />
              <Criterion title="CAE informada coincide con la real" sub="Reg. CMF · Circular 3.539" />
              <Criterion title="Costo total expresado en pesos" sub="Obligatorio · Art. 17 B" />
              <Criterion title="Productos financieros vinculados" sub="Derecho a contratar externos · Art. 17 H" />
              <Criterion title="Cláusula de aceleración de mora" sub="Estándar mercado: 3 cuotas" />
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="chart" title="Mercado chileno · marzo 2025" sub="Benchmarks CMF · datos públicos" count="4 / 4" on />
              <div className="divider" />
              <Criterion title="CAE vs. promedio del segmento" sub="Tu perfil: 20.6% promedio" />
              <Criterion title="Tasa de interés vs. mediana banca" sub="Datos CMF febrero" />
              <Criterion title="Comisión inicial vs. mercado" sub="Mediana: 1.4%" />
              <Criterion title="Costo del seguro de desgravamen" sub="Compañías externas disponibles" />
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="compare" title="Otras ofertas que subiste" sub="1 disponible · OtroBanco" count="1 / 1" on />
              <div className="divider" />
              <Criterion title="Comparar con crédito de María (OtroBanco)" sub="14 mar · CAE 19.4% · 60 cuotas" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px dashed var(--line)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px dashed var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={11} color="var(--ink-faint)" />
                </span>
                <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Subir otra oferta para comparar</span>
                <div style={{ flex: 1 }} />
                <span className="pill" style={{ fontSize: 10.5 }}>opcional</span>
              </div>
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="globe" title="Referencias internacionales" sub="Solo contexto comparativo · nunca genera alertas" count="2 / 4" on accent="var(--amber)" />
              <div className="divider" />
              <Criterion title="FCRA (EE.UU.) · uso de informe crediticio" sub="¿El banco cumpliría con FCRA?" refOnly />
              <Criterion title="CFPB · UDAAP y disclosure" sub="Prácticas engañosas según estándar CFPB" refOnly />
              <Criterion title="EU · Consumer Credit Directive (ESIS)" sub="Tabla estándar europea de costos" on={false} refOnly />
              <Criterion title="HIPAA / GDPR · privacidad de datos" sub="Aplica solo si comparte info médica" on={false} refOnly />
            </div>
          </div>
        </div>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="label">Resumen</div>
            <div className="display num" style={{ fontSize: 38, marginTop: 4, lineHeight: 1, letterSpacing: -0.02 }}>12</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>criterios activos</div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SummaryLine icon="scale" label="Ley local" count="5" />
              <SummaryLine icon="chart" label="Mercado" count="4" />
              <SummaryLine icon="compare" label="Otras ofertas" count="1" />
              <SummaryLine icon="globe" label="Internacional" count="2" muted />
            </div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Tiempo estimado</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 600 }}>~ 2 min</span>
            </div>
          </div>

          <button className="btn btn-accent" style={{ justifyContent: 'center', padding: '14px 18px' }} onClick={() => nav.go('running')}>
            Empezar análisis <Icon name="arrow-r" size={14} />
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'center', color: 'var(--ink-soft)' }}>
            Guardar como plantilla
          </button>

          <div className="card-soft" style={{ padding: 14, marginTop: 'auto', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}><Icon name="globe" size={12} /> Internacional</div>
            Aparece como contexto comparativo en el informe, nunca como alerta.
          </div>

          <PrototypeNotice compact />
        </div>
      </div>
    </AppShell>
  );
}

function PartialFinding({ sev, title, where, impact, lens }: {
  sev: string; title: string; where: string; impact: string; lens: string;
}) {
  const cls = sev === 'hi' ? 'pill-red' : sev === 'mid' ? 'pill-amber' : 'pill-green';
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: sev === 'hi' ? 'var(--red)' : sev === 'mid' ? 'var(--amber)' : 'var(--green)' }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{title}</span>
        <span className={`pill ${cls}`} style={{ fontSize: 10.5 }}>{impact}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 16 }}>
        {lens && <LensTag id={lens} />}
        <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{where}</span>
      </div>
    </div>
  );
}

export function PlanRunning() {
  const nav = useNav();
  const [pct, setPct] = useState(nav.interactive ? 0 : 58);

  useEffect(() => {
    if (!nav.interactive) return;
    const t = setInterval(() => setPct(p => p < 100 ? p + 3.5 : p), 90);
    const adv = setTimeout(() => nav.go('coach'), 3000);
    return () => { clearInterval(t); clearTimeout(adv); };
  }, [nav.interactive, nav]);

  return (
    <AppShell>
      <div className="plan-workspace" style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="label">Paso 4 de 4</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 12 }}>
            <div>
              <h1 className="display" style={{ fontSize: 30, margin: 0, letterSpacing: -0.025 }}>Analizando…</h1>
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>
                7 de 12 criterios listos · puedes ver los hallazgos parciales abajo.
              </div>
            </div>
            <DocBadge compact />
          </div>

          <div style={{ marginTop: 14 }}>
            <CaseContextStrip />
          </div>

          <div className="card" style={{ marginTop: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="label">Progreso global</div>
              <span className="num" style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(pct)}% · {Math.max(0, Math.round((100 - pct) * 0.9))} s restantes</span>
            </div>
            <div style={{ marginTop: 10 }}><ProgressBar pct={pct} accent="var(--accent)" /></div>
          </div>

          <div className="scrollable" style={{ flex: 1, marginTop: 14, overflowY: 'auto', paddingRight: 6 }}>
            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="scale" title="Ley y prácticas en Chile" sub="5 criterios" count="5 / 5" on />
              <div className="divider" />
              <Criterion title="Cláusulas abusivas (Art. 16)" sub="Sin coincidencias" status="done" />
              <Criterion title="CAE informada coincide con la real" sub="Coincide" status="done" />
              <Criterion title="Costo total en pesos" sub="Encontrado en cláusula 3" status="done" />
              <Criterion title="Productos financieros vinculados" sub="Cláusula 9 · alerta" status="done" finding="1 alerta" />
              <Criterion title="Cláusula de aceleración" sub="Cláusula 12.3 · 1 cuota (estándar: 3)" status="done" finding="1 alerta" />
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="chart" title="Mercado chileno · marzo 2025" sub="4 criterios" count="2 / 4" on />
              <div className="divider" />
              <Criterion title="CAE vs. promedio del segmento" sub="+4.2 pts" status="done" finding="alerta" />
              <Criterion title="Tasa de interés vs. mediana banca" sub="+2.5 pts" status="done" finding="alerta" />
              <Criterion title="Comisión inicial vs. mercado" sub="estimando…" status="running" />
              <Criterion title="Costo del seguro de desgravamen" sub="esperando" status="queued" />
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 12 }}>
              <PlanGroupHeader icon="globe" title="Referencias internacionales" sub="Solo contexto comparativo" count="0 / 2" on accent="var(--amber)" />
              <div className="divider" />
              <Criterion title="FCRA · uso de informe crediticio" sub="esperando" status="queued" refOnly />
              <Criterion title="CFPB · UDAAP y disclosure" sub="esperando" status="queued" refOnly />
            </div>
          </div>
        </div>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="label">Hallazgos parciales</div>
            <span className="pill pill-red">4</span>
          </div>
          <PartialFinding sev="hi" title="CAE sobre el mercado" where="Cláusula 3" impact="+4.2 pts" lens="mercado" />
          <PartialFinding sev="hi" title="Tasa sobre mediana banca" where="Cláusula 3.2" impact="+2.5 pts" lens="mercado" />
          <PartialFinding sev="mid" title="Seguro vinculado" where="Cláusula 9" impact="$890k" lens="ley" />
          <PartialFinding sev="mid" title="Aceleración a 1 cuota" where="Cláusula 12.3" impact="vs. 3" lens="ley" />
          <div style={{ flex: 1 }} />
          <PrototypeNotice compact />
          <button className="btn btn-ghost" style={{ justifyContent: 'center', color: 'var(--ink-soft)' }} onClick={() => nav.go('plan')}>
            Cancelar análisis
          </button>
        </div>
      </div>
    </AppShell>
  );
}
