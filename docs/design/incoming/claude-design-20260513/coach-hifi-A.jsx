// Hi-fi treatment A · "Pliego"
// Notarial / editorial. Serif typography, paper-cream palette, oxblood/sage/ochre accents.
// Trust through gravitas — looks like a high-end notarial / legal product.

const PliegoWordmark = ({ size=22 }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
    <svg width={size+2} height={size+2} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" fill="none" stroke="#1b1813" strokeWidth="1.5"/>
      <line x1="3" y1="9" x2="25" y2="9" stroke="#1b1813" strokeWidth="1"/>
      <line x1="7" y1="14" x2="21" y2="14" stroke="#1b1813" strokeWidth="0.7"/>
      <line x1="7" y1="17" x2="21" y2="17" stroke="#1b1813" strokeWidth="0.7"/>
      <line x1="7" y1="20" x2="18" y2="20" stroke="#1b1813" strokeWidth="0.7"/>
    </svg>
    <span className="display" style={{ fontSize:size, fontWeight:600, letterSpacing:-0.02, lineHeight:1 }}>Pliego</span>
  </div>
);

const PliegoDocBadge = () => (
  <div style={{
    display:'inline-flex', alignItems:'center', gap:14,
    padding:'8px 16px',
    background:'#fff',
    border:'1px solid rgba(43,38,32,.25)',
    borderRadius:2,
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10 L12 4 L21 10 M5 10 L5 18 M9 10 L9 18 M15 10 L15 18 M19 10 L19 18 M3 20 L21 20"
        fill="none" stroke="#1b1813" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    <div>
      <div className="label" style={{ fontSize:10, lineHeight:1 }}>identificado como</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:3 }}>
        <span style={{ fontSize:16, fontWeight:600, letterSpacing:-0.01 }}>Crédito de consumo</span>
        <span style={{ fontSize:12, fontStyle:'italic', color:'var(--ink-soft)' }}>· Chile, CMF</span>
      </div>
    </div>
    <div style={{ width:1, height:24, background:'rgba(43,38,32,.25)' }}/>
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      {[1,2,3].map(i=>(
        <span key={i} style={{
          width:6, height:6, borderRadius:'50%',
          background: i<=3 ? 'var(--sage)' : 'transparent',
          border:'1px solid var(--sage)',
        }}/>
      ))}
      <span className="label" style={{ fontSize:10, marginLeft:4 }}>confianza alta</span>
    </div>
    <button className="btn" style={{ padding:'4px 12px', fontSize:12, marginLeft:6 }}>cambiar</button>
  </div>
);

const PliegoStat = ({ label, value, sub, sev }) => (
  <div className="card" style={{ padding:'18px 20px', flex:1, position:'relative' }}>
    <div className="label" style={{ fontSize:10 }}>{label}</div>
    <div className="num display" style={{
      fontSize:34, fontWeight:600, marginTop:8, lineHeight:1,
      color: sev==='hi' ? 'var(--oxblood)' : sev==='ok' ? 'var(--sage)' : 'var(--ink)',
    }}>{value}</div>
    <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:8, fontStyle:'italic' }}>{sub}</div>
  </div>
);

const PliegoBar = ({ label, you, market, sev }) => {
  const max = Math.max(you, market) * 1.2;
  const color = sev==='hi' ? 'var(--oxblood)' : sev==='ok' ? 'var(--sage)' : 'var(--ochre)';
  return (
    <div style={{ marginTop:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <span style={{ fontSize:15, fontWeight:500 }}>{label}</span>
        <span className="num" style={{ fontSize:13, color }}>{you > market ? '+' : ''}{(you-market).toFixed(1)} pts</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center', fontSize:12 }}>
        <span className="label" style={{ fontSize:10, width:54 }}>tu crédito</span>
        <div style={{ height:8, background:'var(--paper-2)', position:'relative' }}>
          <div style={{ width:`${you/max*100}%`, height:'100%', background: color }}/>
        </div>
        <span className="num" style={{ fontSize:13, width:48, textAlign:'right' }}>{you}%</span>

        <span className="label" style={{ fontSize:10, width:54 }}>mercado</span>
        <div style={{ height:8, background:'var(--paper-2)', position:'relative' }}>
          <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ink-soft)' }}/>
        </div>
        <span className="num" style={{ fontSize:13, width:48, textAlign:'right' }}>{market}%</span>
      </div>
    </div>
  );
};

const PliegoAction = ({ n, sev, title, body }) => (
  <div style={{ display:'flex', gap:14, padding:'14px 0', borderTop:'1px solid rgba(43,38,32,.18)' }}>
    <div style={{
      width:32, height:32, borderRadius:'50%',
      background: sev==='hi' ? 'var(--oxblood)' : 'var(--ochre)',
      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'JetBrains Mono', fontSize:14, fontWeight:600, flex:'0 0 auto',
    }}>{n}</div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:16, fontWeight:600, letterSpacing:-0.01, lineHeight:1.2 }}>{title}</div>
      <div style={{ fontSize:14, color:'var(--ink-soft)', marginTop:5, lineHeight:1.45 }}>{body}</div>
    </div>
  </div>
);

const PliegoIntlRef = ({ source, body }) => (
  <div style={{ flex:1, padding:'14px 16px', background:'#fff', borderLeft:'2px solid var(--ochre)' }}>
    <div className="label" style={{ fontSize:10 }}>{source}</div>
    <div style={{ fontSize:13, fontStyle:'italic', color:'var(--ink-soft)', marginTop:6, lineHeight:1.45 }}>{body}</div>
  </div>
);

const Pliego_Dashboard = () => (
  <div className="hf pliego">
    {/* Top bar */}
    <div style={{ padding:'18px 36px', display:'flex', alignItems:'center', gap:24, borderBottom:'1px solid rgba(43,38,32,.2)' }}>
      <PliegoWordmark />
      <div style={{ flex:1 }}/>
      <span style={{ fontSize:14 }}>Mis documentos</span>
      <span style={{ fontSize:14 }}>Comparar</span>
      <span style={{ fontSize:14 }}>Ayuda</span>
      <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--paper-2)', border:'1px solid var(--rule)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:12 }}>JR</div>
    </div>

    {/* Page header */}
    <div style={{ padding:'24px 36px 16px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
        <div>
          <div className="label" style={{ fontSize:11 }}>análisis · n.° 4471-2025-zz</div>
          <h1 className="display" style={{ fontSize:42, fontWeight:600, margin:'8px 0 0', letterSpacing:-0.02, lineHeight:1.05 }}>
            Tu crédito frente<br/>al mercado.
          </h1>
          <div style={{ fontSize:15, color:'var(--ink-soft)', marginTop:8, fontStyle:'italic' }}>
            BancoPlaceholder · 14 de marzo de 2025 · contrato.pdf · 6 páginas
          </div>
        </div>
        <PliegoDocBadge />
      </div>
      <div className="rule-double" style={{ marginTop:20 }}/>
    </div>

    {/* Stat strip */}
    <div style={{ padding:'0 36px', display:'flex', gap:14 }}>
      <PliegoStat label="monto" value="$18.0M" sub="solicitado" />
      <PliegoStat label="cuotas" value="68" sub="vs. 60 simuladas" sev="hi" />
      <PliegoStat label="cae" value="24.8%" sub="+4.2 pts sobre mercado" sev="hi" />
      <PliegoStat label="costo total" value="$23.9M" sub="$1.4M más que esperado" sev="hi" />
    </div>

    {/* Main two-column */}
    <div style={{ padding:'24px 36px 0', display:'grid', gridTemplateColumns:'1.25fr 1fr', gap:28 }}>
      {/* Left: benchmark */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <h2 className="display" style={{ fontSize:22, fontWeight:600, margin:0, letterSpacing:-0.01 }}>
            <em style={{ fontStyle:'italic', fontWeight:500 }}>vs.</em> el mercado, marzo 2025
          </h2>
          <span className="label" style={{ fontSize:10 }}>fuente — cmf</span>
        </div>
        <PliegoBar label="CAE" you={24.8} market={20.6} sev="hi" />
        <PliegoBar label="Tasa de interés" you={18.4} market={15.9} sev="hi" />
        <PliegoBar label="Comisión inicial" you={2.1} market={1.4} sev="mid" />
      </div>

      {/* Right: action plan */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <h2 className="display" style={{ fontSize:22, fontWeight:600, margin:0, letterSpacing:-0.01 }}>Lo que conviene hacer</h2>
          <span className="label" style={{ fontSize:10 }}>3 acciones</span>
        </div>
        <PliegoAction n={1} sev="hi" title="Pide cotización a dos bancos más"
          body="Con tu perfil crediticio es razonable apuntar a una CAE cercana a 20%. Hoy estás 4.2 puntos por sobre la mediana." />
        <PliegoAction n={2} sev="hi" title="Pregunta por qué son 68 cuotas y no 60"
          body="La simulación inicial decía 60. Tienes argumento bajo la Ley 19.496 si los términos cambiaron sin nuevo consentimiento." />
        <PliegoAction n={3} sev="mid" title="Cambia el seguro de desgravamen"
          body="El Art. 17 H te permite contratarlo con otra compañía. Estimación de ahorro: $320.000." />
      </div>
    </div>

    {/* International ref strip */}
    <div style={{ padding:'24px 36px 0' }}>
      <div className="rule" style={{ marginBottom:14 }}/>
      <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:10 }}>
        <h3 className="display" style={{ fontSize:15, fontWeight:600, margin:0, letterSpacing:0.04, textTransform:'uppercase' }}>Contexto comparativo</h3>
        <span style={{ fontSize:12, fontStyle:'italic', color:'var(--ink-soft)' }}>referencia internacional — no se considera alerta</span>
      </div>
      <div style={{ display:'flex', gap:14 }}>
        <PliegoIntlRef source="fcra — ee.uu." body="Te exigiría notificarte el uso de tu informe crediticio. Acá no es obligatorio." />
        <PliegoIntlRef source="cfpb · udaap" body="El cambio de 60 a 68 cuotas podría considerarse práctica engañosa bajo este estándar." />
        <PliegoIntlRef source="ue · ccd · esis" body="Existe una tabla estándar de una página con todos los costos. En Chile no existe." />
      </div>
    </div>

    {/* Footer CTAs */}
    <div style={{ position:'absolute', bottom:24, left:36, right:36, display:'flex', gap:12, alignItems:'center' }}>
      <span className="label" style={{ fontSize:10 }}>4 hallazgos · 11 criterios revisados · análisis terminado a las 14:23</span>
      <div style={{ flex:1 }}/>
      <button className="btn">Exportar informe</button>
      <button className="btn">Comparar con otra oferta</button>
      <button className="btn btn-primary">Redactar email al banco →</button>
    </div>
  </div>
);

window.Pliego_Dashboard = Pliego_Dashboard;
