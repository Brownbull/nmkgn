import { Icon } from '../components/Icon';
import { AppShell, Toggle } from '../components/shared';
import { LensTag } from '../components/Lenses';
import { useNav } from '../components/NavContext';

function EmailField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <span className="label" style={{ width: 50, fontSize: 10 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: bold ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'var(--red-soft)', padding: '1px 4px', borderRadius: 3, color: 'var(--red)', fontWeight: 600 }}>{children}</span>
  );
}

export function Email() {
  const nav = useNav();

  return (
    <AppShell>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <div className="label">Acción</div>
            <h1 className="display" style={{ fontSize: 28, margin: '6px 0 4px', letterSpacing: -0.025 }}>Redactar email al banco</h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Redactado con base en los 4 hallazgos. Edítalo antes de enviar.</div>
          </div>
          <button className="btn btn-small btn-ghost" style={{ color: 'var(--ink-soft)' }} onClick={() => nav.go('coach')}>← Volver</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper)' }}>
              <button className="btn btn-xs"><Icon name="edit" size={11} /> Cambiar tono</button>
              <span className="pill" style={{ fontSize: 10.5 }}>cordial · firme</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Idioma · ES-CL</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--line)' }}>
              <EmailField label="Para" value="ejecutivo@bancoplaceholder.cl" />
              <EmailField label="CC" value="maria.lopez@gmail.com" />
              <EmailField label="Asunto" value="Consultas sobre el contrato de mutuo N° 4471-2025-ZZ" bold />
            </div>
            <div style={{ padding: '18px 22px', fontSize: 14, lineHeight: 1.65, color: 'var(--ink)', fontFamily: 'Manrope' }}>
              <p style={{ margin: '0 0 14px' }}>Estimado/a,</p>
              <p style={{ margin: '0 0 14px' }}>Antes de firmar el contrato de mutuo en referencia, me gustaría aclarar los siguientes puntos:</p>
              <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>En la simulación inicial el plazo era de <b>60 cuotas</b>; el contrato indica <Highlight>68 cuotas</Highlight> en la cláusula 4.2. ¿Pueden enviarme la tabla de amortización a 60 cuotas para comparar?</li>
                <li>La <b>CAE de 24.8%</b> es <b>4.2 puntos sobre el promedio de mercado</b> de marzo 2025 para mi perfil (CMF). ¿Existe espacio para ajustarla?</li>
                <li>El seguro de desgravamen (cláusula 9) está vinculado a la compañía del banco. Conforme al <b>Art. 17 H Ley 19.496</b>, solicito poder contratarlo con otra aseguradora.</li>
                <li>La cláusula 12.3 establece aceleración por <b>1 cuota</b> impaga; el estándar de mercado es 3. ¿Pueden modificarla?</li>
              </ol>
              <p style={{ margin: '14px 0 0' }}>Quedo atento a su respuesta.</p>
              <p style={{ margin: '10px 0 0' }}>Saluda atentamente,<br />Juan R.</p>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-small btn-ghost" style={{ color: 'var(--ink-soft)' }}>
                <Icon name="file" size={13} /> Adjuntar análisis (PDF)
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-small">Copiar texto</button>
              <button className="btn btn-small btn-accent"><Icon name="send" size={13} /> Enviar</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="label">Basado en estos hallazgos</div>
            {[
              { sev: 'hi', title: 'Plazo', detail: '68 cuotas vs. 60 simuladas', clause: 'Cl. 4.2', lens: 'ley' },
              { sev: 'hi', title: 'CAE', detail: '24.8% — +4.2 pts vs. mercado', clause: 'Cl. 3', lens: 'mercado' },
              { sev: 'mid', title: 'Seguro', detail: 'Vinculado al banco', clause: 'Cl. 9 · Art. 17 H', lens: 'ley' },
              { sev: 'mid', title: 'Mora', detail: 'Aceleración a 1 cuota (estándar 3)', clause: 'Cl. 12.3', lens: 'mercado' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`pill ${f.sev === 'hi' ? 'pill-red' : 'pill-amber'}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                    {f.sev === 'hi' ? 'Alto' : 'Atención'}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{f.title}</span>
                  <Toggle on size={26} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <LensTag id={f.lens} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>{f.detail}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>{f.clause}</div>
              </div>
            ))}
            <div className="card-soft" style={{ padding: 14, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 'auto' }}>
              <Icon name="sparkle" size={12} /> Apaga un hallazgo para sacarlo del email. Re-generamos automáticamente.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
