import { Icon } from '../components/Icon';
import { AppShell } from '../components/shared';
import { useNav } from '../components/NavContext';

const SUPPORTED_TYPES = [
  { icon: 'bank', label: 'Crédito bancario', sub: 'Consumo · Hipotecario · Automotriz' },
  { icon: 'house', label: 'Arriendo', sub: 'Vivienda · Comercial' },
  { icon: 'shield', label: 'Seguro', sub: 'Vida · Auto · Salud' },
  { icon: 'briefcase', label: 'Contrato laboral', sub: 'Indefinido · Plazo fijo' },
  { icon: 'wrench', label: 'Cotización taller', sub: 'Reparación · Mantención' },
  { icon: 'hammer', label: 'Propuesta obra', sub: 'Remodelación · Construcción' },
];

export function Upload() {
  const nav = useNav();
  const selectedType = nav.state.docType ?? 'bank';
  const hasPersisted = Boolean(nav.state.caseId);
  const requiresPrototypeAck = hasPersisted && !nav.state.mockAnalysisAcknowledged;

  function continueToProcess() {
    if (requiresPrototypeAck) return;
    nav.go('process');
  }

  return (
    <AppShell activeNav="Análisis">
      <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="label">Paso 1 de 4</div>
        <h1 className="display" style={{ fontSize: 36, margin: '8px 0 6px', letterSpacing: -0.025 }}>¿Qué vamos a revisar?</h1>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>Elige un tipo o suelta el PDF directo — lo detectamos solo.</div>

        {nav.state.caseId && (
          <div className="card" style={{
            marginTop: 18,
            padding: '14px 16px',
            borderColor: requiresPrototypeAck ? 'var(--amber)' : 'var(--line)',
            background: requiresPrototypeAck ? 'var(--amber-soft)' : '#fff',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Icon name="shield-check" size={18} color={requiresPrototypeAck ? 'var(--amber)' : 'var(--accent)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>Vista prototipo despues de subir</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.45 }}>
                  Este caso ya esta guardado. Los pasos de lectura, plan y resultados que vienen despues usan datos simulados hasta conectar carga real, OCR, agentes y procedencia.
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(nav.state.mockAnalysisAcknowledged)}
                    onChange={event => nav.set({ mockAnalysisAcknowledged: event.target.checked })}
                  />
                  Entiendo que los siguientes hallazgos no son analisis real todavia.
                </label>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
          {SUPPORTED_TYPES.map(t => {
            const isSelected = t.icon === selectedType;
            const isLocked = hasPersisted && t.icon !== 'bank';
            return (
              <div key={t.label} className="card" style={{
                padding: '16px 18px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                background: isSelected ? 'var(--accent-soft)' : '#fff',
                borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
                transition: 'background .15s, border-color .15s',
                opacity: isLocked ? 0.45 : 1,
              }}
              onClick={() => !isLocked && nav.set({ docType: t.icon, docLabel: t.label })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? '#fff' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={t.icon} size={18} color={isSelected ? 'var(--accent)' : 'var(--ink)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{t.sub}</div>
                  </div>
                  {isSelected && <Icon name="check-circle" size={18} color="var(--accent)" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{
          marginTop: 18,
          padding: '34px 24px',
          background: 'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)',
          border: '1.5px dashed var(--line-2)',
          textAlign: 'center',
          cursor: nav.interactive ? 'pointer' : 'default',
        }}
        onClick={() => nav.interactive && continueToProcess()}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -4px rgba(26,29,36,0.1)' }}>
            <Icon name="upload" size={26} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 14, letterSpacing: -0.01 }}>Arrastra tus PDFs aquí</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            o <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>haz click para elegirlos</span> · hasta 10 archivos · soportamos escaneados
          </div>
          <div style={{ marginTop: 14, display: 'inline-flex', gap: 10, alignItems: 'center', fontSize: 11.5, color: 'var(--ink-faint)' }}>
            <span className="pill" style={{ fontSize: 11 }}>.pdf</span>
            <span className="pill" style={{ fontSize: 11 }}>.jpg / .png</span>
            <span className="pill" style={{ fontSize: 11 }}>hasta 25 MB</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <button className="btn btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={() => nav.go('login')}>
            <Icon name="arrow-l" size={14} /> Volver
          </button>
          <button
            className="btn btn-primary"
            disabled={requiresPrototypeAck}
            onClick={continueToProcess}
            style={{ opacity: requiresPrototypeAck ? 0.55 : 1 }}
          >
            Continuar <Icon name="arrow-r" size={14} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
