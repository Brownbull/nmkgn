import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { GoogleG } from '../components/GoogleG';
import { DocBadge } from '../components/DocBadge';
import { useNav } from '../components/NavContext';

const SUPPORTED_TYPES = [
  { icon: 'bank', label: 'Crédito bancario', sub: 'Consumo · Hipotecario · Automotriz' },
  { icon: 'house', label: 'Arriendo', sub: 'Vivienda · Comercial' },
  { icon: 'shield', label: 'Seguro', sub: 'Vida · Auto · Salud' },
  { icon: 'briefcase', label: 'Contrato laboral', sub: 'Indefinido · Plazo fijo' },
  { icon: 'wrench', label: 'Cotización taller', sub: 'Reparación · Mantención' },
];

function Finding({ sev, title, where }: { sev: string; title: string; where: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: sev === 'hi' ? 'var(--red)' : sev === 'mid' ? 'var(--amber)' : 'var(--green)',
        marginTop: 7, flex: '0 0 auto',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{where}</div>
      </div>
    </div>
  );
}

export function Login() {
  const nav = useNav();

  return (
    <div className="lt" style={{ background: 'var(--paper)' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(to right, rgba(26,29,36,0.025) 1px, transparent 1px)',
        backgroundSize: '64px 100%',
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Logo size={22} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginRight: 18 }}>Precios</span>
        <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginRight: 18 }}>Cómo funciona</span>
        <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Ayuda</span>
      </div>

      <div style={{ padding: '64px 40px 0', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 60, position: 'relative' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
            <Icon name="sparkle" size={14} /> Para Chile · más países pronto
          </div>
          <h1 className="display" style={{
            fontSize: 64, margin: '18px 0 0', letterSpacing: -0.035, lineHeight: 1.02,
          }}>
            Lee la letra<br />
            <span style={{ color: 'var(--accent)' }}>chica</span> por ti.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-soft)', marginTop: 20, lineHeight: 1.5, maxWidth: 480 }}>
            Sube un crédito, contrato o cotización. Te marcamos lo abusivo, lo escondido y lo que está sobre el mercado <em>antes</em> de que firmes.
          </p>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn btn-primary" style={{ padding: '12px 20px', fontSize: 15 }} onClick={() => nav.go('upload')}>
              <GoogleG size={18} /> Continuar con Google
            </button>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              Sin tarjeta · 1 documento gratis al mes
            </span>
          </div>

          <div style={{ marginTop: 42, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-soft)' }}>
              <Icon name="shield-check" size={16} color="var(--accent)" /> Tus PDFs se borran a las 72h
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-soft)' }}>
              <Icon name="scale" size={16} color="var(--accent)" /> Comparado con CMF y Ley 19.496
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="card" style={{
            padding: '18px 20px',
            boxShadow: '0 24px 40px -16px rgba(26,29,36,0.18), 0 8px 16px -8px rgba(26,29,36,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DocBadge compact />
              <div style={{ flex: 1 }} />
              <span className="pill pill-red">3 hallazgos</span>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <div className="label">Tu crédito</div>
              <div className="display num" style={{ fontSize: 32, color: 'var(--red)', marginTop: 6, lineHeight: 1 }}>+$1.4M de más</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 6 }}>vs. lo esperado para tu perfil</div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Finding sev="hi" title="68 cuotas, no 60" where="Cláusula 4.2" />
              <Finding sev="hi" title="CAE 4.2 pts sobre mercado" where="Cláusula 3" />
              <Finding sev="mid" title="Seguro vinculado al banco" where="Cláusula 9" />
            </div>
          </div>
          <div className="card" style={{
            position: 'absolute', top: -14, right: -14,
            padding: '8px 12px',
            background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600,
            transform: 'rotate(2deg)',
          }}>
            <Icon name="check" size={14} color="var(--accent-2)" /> Análisis listo en 2 min
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 40px', borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <span className="label">Tipos soportados hoy</span>
          {SUPPORTED_TYPES.map(t => (
            <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
              <Icon name={t.icon} size={14} /> {t.label}
            </span>
          ))}
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>+ 1 más</span>
        </div>
      </div>
    </div>
  );
}
