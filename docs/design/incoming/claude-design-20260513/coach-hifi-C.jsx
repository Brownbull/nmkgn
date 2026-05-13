// Hi-fi treatment C · "Marcado"
// Data-precise archival. Space Grotesk + IBM Plex Mono. Charcoal panels, electric orange accent.
// Trust through precision — feels like a research tool / archival database.

const MarcadoWordmark = ({ size=20, inverted }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <svg width={size+2} height={size+2} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" fill={inverted ? '#f3f1ec' : '#15171b'}/>
      <rect x="6" y="6" width="12" height="3" fill={inverted ? '#15171b' : '#e85a1f'}/>
      <rect x="6" y="11" width="9"  height="2" fill={inverted ? '#15171b' : '#f3f1ec'}/>
      <rect x="6" y="15" width="12" height="2" fill={inverted ? '#15171b' : '#f3f1ec'}/>
    </svg>
    <span className="display" style={{
      fontSize:size, fontWeight:700, letterSpacing:0.04,
      textTransform:'uppercase', lineHeight:1,
      color: inverted ? 'var(--paper)' : 'var(--ink)',
    }}>MARCADO</span>
  </div>
);

const MarcadoDocBadge = ({ inverted }) => (
  <div style={{
    display:'inline-flex', alignItems:'stretch',
    border:`1px solid ${inverted ? 'rgba(243,241,236,0.25)' : 'var(--line)'}`,
    borderRadius:2,
    overflow:'hidden',
    background: inverted ? 'rgba(243,241,236,0.04)' : '#fff',
    color: inverted ? 'var(--paper)' : 'var(--ink)',
  }}>
    <div style={{ padding:'8px 12px', borderRight:`1px solid ${inverted ? 'rgba(243,241,236,0.25)' : 'var(--line)'}`, display:'flex', alignItems:'center', gap:8 }}>
      <span className="label" style={{ color: inverted ? 'var(--accent-2)' : 'var(--accent)' }}>TYPE / 01</span>
    </div>
    <div style={{ padding:'8px 14px' }}>
      <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:14, letterSpacing:-0.01, lineHeight:1.1 }}>Crédito de consumo</div>
      <div style={{ fontFamily:'IBM Plex Mono', fontSize:10, color: inverted ? 'rgba(243,241,236,0.6)' : 'var(--ink-faint)', marginTop:3 }}>CL · CMF · MAR 2025</div>
    </div>
    <div style={{ padding:'8px 12px', borderLeft:`1px solid ${inverted ? 'rgba(243,241,236,0.25)' : 'var(--line)'}`, display:'flex', alignItems:'center', gap:8 }}>
      <span className="num" style={{ fontSize:14, color: inverted ? 'var(--accent-2)' : 'var(--accent)' }}>0.92</span>
      <span className="label" style={{ color: inverted ? 'rgba(243,241,236,0.6)' : 'var(--ink-faint)' }}>conf.</span>
    </div>
    <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', borderLeft:`1px solid ${inverted ? 'rgba(243,241,236,0.25)' : 'var(--line)'}` }}>
      <span className="label" style={{ cursor:'pointer' }}>[CHANGE]</span>
    </div>
  </div>
);

const MarcadoStat = ({ idx, label, value, sub, sev }) => {
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : sev==='mid' ? 'var(--amber)' : 'var(--ink)';
  return (
    <div style={{ flex:1, minWidth:0, padding:'18px 18px 16px', borderRight:'1px solid var(--line)', position:'relative' }}>
      <div className="label">{idx} · {label}</div>
      <div className="num display" style={{ fontSize:36, fontWeight:700, marginTop:14, lineHeight:1, color, letterSpacing:-0.02 }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
        {sev ? <span style={{ width:8, height:8, background: color }}/> : null}
        <span style={{ fontSize:12, color:'var(--ink-soft)' }}>{sub}</span>
      </div>
    </div>
  );
};

const MarcadoBar = ({ idx, label, you, market, sev }) => {
  const max = Math.max(you, market) * 1.2;
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : 'var(--amber)';
  return (
    <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid var(--line)' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          <span className="label">{idx}</span>
          <span style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:14 }}>{label}</span>
        </div>
        <span className="num" style={{ fontSize:13, color, fontWeight:600 }}>
          DELTA {you > market ? '+' : ''}{(you-market).toFixed(1)} pts
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 60px', alignItems:'center', columnGap:14, rowGap:6, fontSize:12 }}>
        <span className="label">YOU</span>
        <div style={{ height:14, background:'var(--paper)', border:'1px solid var(--line)' }}>
          <div style={{ width:`${you/max*100}%`, height:'100%', background: color }}/>
        </div>
        <span className="num" style={{ fontSize:13, textAlign:'right' }}>{you}%</span>

        <span className="label">MKT</span>
        <div style={{ height:14, background:'var(--paper)', border:'1px solid var(--line)' }}>
          <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ink)' }}/>
        </div>
        <span className="num" style={{ fontSize:13, textAlign:'right' }}>{market}%</span>
      </div>
    </div>
  );
};

const MarcadoActionRow = ({ idx, sev, title, body, savings }) => {
  const color = sev==='hi' ? 'var(--red)' : 'var(--amber)';
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'40px 1fr auto',
      padding:'14px 16px',
      borderBottom:'1px solid var(--line-dark)',
      alignItems:'flex-start', gap:12,
    }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6 }}>
        <span className="num" style={{ fontSize:18, fontWeight:700, color:'var(--paper)' }}>{idx}</span>
        <span style={{ width:24, height:3, background: color }}/>
      </div>
      <div>
        <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:14, letterSpacing:-0.005, color:'var(--paper)' }}>{title}</div>
        <div style={{ fontSize:12.5, color:'rgba(243,241,236,0.65)', marginTop:5, lineHeight:1.5 }}>{body}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="label" style={{ color:'rgba(243,241,236,0.5)' }}>ahorro</div>
        <div className="num" style={{ fontSize:14, color:'var(--accent-2)', fontWeight:600, marginTop:2 }}>{savings}</div>
      </div>
    </div>
  );
};

const Marcado_Dashboard = () => (
  <div className="hf marcado" style={{ display:'flex', flexDirection:'column' }}>
    {/* Top bar — charcoal */}
    <div className="panel" style={{ padding:'14px 28px', display:'flex', alignItems:'center', gap:24, borderRadius:0 }}>
      <MarcadoWordmark inverted />
      <span className="label" style={{ color:'rgba(243,241,236,0.5)', marginLeft:18 }}>SESIÓN / JR · MARZO 2025</span>
      <div style={{ flex:1 }}/>
      <span className="label" style={{ color:'var(--paper)' }}>DOCUMENTOS</span>
      <span className="label" style={{ color:'var(--paper)' }}>COMPARAR</span>
      <span className="label" style={{ color:'var(--paper)' }}>EXPORTAR</span>
      <div style={{ width:30, height:30, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'IBM Plex Mono', fontSize:11, color:'#fff', fontWeight:700 }}>JR</div>
    </div>

    {/* Page header strip */}
    <div style={{ padding:'18px 28px 12px', display:'flex', alignItems:'center', gap:14, borderBottom:'1px solid var(--line)' }}>
      <div className="label">ANÁLISIS · 4471-2025-ZZ</div>
      <span style={{ width:4, height:4, background:'var(--ink)' }}/>
      <div className="label">11 CRITERIOS · 4 HALLAZGOS</div>
      <span style={{ width:4, height:4, background:'var(--ink)' }}/>
      <div className="label">14:23 · 14 MAR 2025</div>
      <div style={{ flex:1 }}/>
      <MarcadoDocBadge />
    </div>

    {/* Title row */}
    <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid var(--line)' }}>
      <h1 className="display" style={{ fontSize:36, fontWeight:700, margin:0, letterSpacing:-0.025, lineHeight:1.05 }}>
        <span style={{ background:'var(--accent)', color:'#fff', padding:'2px 10px' }}>4 hallazgos</span> en tu crédito de consumo.
      </h1>
      <div style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:'var(--ink-soft)', marginTop:10 }}>
        SRC: contrato.pdf · BANCOPLACEHOLDER · 6PP · SHA: 8f3a…b21d
      </div>
    </div>

    {/* Stats strip */}
    <div style={{ display:'flex', borderBottom:'1px solid var(--line)', background:'#fff' }}>
      <MarcadoStat idx="01" label="MONTO" value="$18.0M" sub="solicitado" />
      <MarcadoStat idx="02" label="CUOTAS" value="68" sub="DELTA +8 vs. simulación" sev="hi" />
      <MarcadoStat idx="03" label="CAE" value="24.8%" sub="DELTA +4.2 pts vs. mkt" sev="hi" />
      <MarcadoStat idx="04" label="COSTO TOTAL" value="$23.9M" sub="DELTA +$1.4M vs. esperado" sev="hi" />
      <div style={{ flex:1, minWidth:0, padding:'18px', display:'flex', flexDirection:'column', justifyContent:'space-between', background:'var(--paper)' }}>
        <div className="label">RIESGO GLOBAL</div>
        <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:36, color:'var(--red)', lineHeight:1, letterSpacing:-0.02 }}>62<span style={{ fontSize:16, color:'var(--ink-soft)' }}>/100</span></div>
        <div style={{ height:6, background:'var(--paper)', border:'1px solid var(--line)' }}>
          <div style={{ width:'62%', height:'100%', background:'var(--red)' }}/>
        </div>
      </div>
    </div>

    {/* Main */}
    <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', flex:1 }}>
      {/* Benchmark */}
      <div style={{ padding:'24px 28px', borderRight:'1px solid var(--line)' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div>
            <div className="label">SECCIÓN 02</div>
            <h2 className="display" style={{ fontSize:22, margin:'6px 0 0', letterSpacing:-0.015 }}>Mercado · benchmark CMF</h2>
          </div>
          <span className="label">N=3 / MAR 2025</span>
        </div>
        <MarcadoBar idx="02.A" label="CAE"             you={24.8} market={20.6} sev="hi" />
        <MarcadoBar idx="02.B" label="Tasa de interés" you={18.4} market={15.9} sev="hi" />
        <MarcadoBar idx="02.C" label="Comisión"        you={2.1}  market={1.4}  sev="mid" />
      </div>

      {/* Plan — charcoal panel */}
      <div className="panel" style={{ padding:'22px 0 12px', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 22px 14px', borderBottom:'1px solid var(--line-dark)' }}>
          <div className="label" style={{ color:'rgba(243,241,236,0.5)' }}>SECCIÓN 03</div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:6 }}>
            <h2 className="display" style={{ fontSize:22, margin:0, letterSpacing:-0.015, color:'var(--paper)' }}>Plan de acción</h2>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span className="label" style={{ color:'rgba(243,241,236,0.5)' }}>POT. AHORRO</span>
              <span className="num" style={{ fontSize:18, color:'var(--accent-2)', fontWeight:700 }}>$1.7M</span>
            </div>
          </div>
        </div>
        <MarcadoActionRow idx="01" sev="hi" title="Cotizar con 2 bancos más"
          body="Perfil crediticio permite apuntar a CAE ≈ 20%. Pide simulación a Banco X y Banco Y."
          savings="$1.1M" />
        <MarcadoActionRow idx="02" sev="hi" title="Pedir tabla a 60 cuotas"
          body="La simulación inicial decía 60. Argumento bajo Ley 19.496 si los términos cambiaron sin nuevo consentimiento."
          savings="$300k" />
        <MarcadoActionRow idx="03" sev="mid" title="Cambiar seguro de desgravamen"
          body="Art. 17 H Ley 19.496 — derecho a contratar con compañía externa."
          savings="$320k" />
      </div>
    </div>

    {/* International context */}
    <div style={{ background:'var(--paper)', padding:'18px 28px', borderTop:'1px solid var(--line)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span className="label">REFERENCIA · NO ALERTA</span>
        <div style={{ height:1, background:'var(--line)', flex:1 }}/>
        <span className="label" style={{ color:'var(--ink-faint)' }}>EN OTRAS JURISDICCIONES</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {[
          { tag:'FCRA / USA',     body:'Exigiría notificarte el uso del informe crediticio. En Chile: no obligatorio.' },
          { tag:'CFPB / UDAAP',   body:'El cambio de 60→68 cuotas podría calificar como práctica engañosa.' },
          { tag:'EU / CCD-ESIS',  body:'Hoja estándar de una página con costo total. En Chile: no existe equivalente.' },
        ].map((r,i)=>(
          <div key={i} style={{ paddingLeft:12, borderLeft:'2px solid var(--accent)' }}>
            <span className="tag" style={{ color:'var(--accent)' }}>{r.tag}</span>
            <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:8, lineHeight:1.5 }}>{r.body}</div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA bar */}
    <div style={{ padding:'16px 28px', display:'flex', alignItems:'center', gap:10, borderTop:'1px solid var(--line)', background:'#fff' }}>
      <span className="label">EOF · ANÁLISIS COMPLETO</span>
      <div style={{ flex:1 }}/>
      <button className="btn">[EXPORTAR PDF]</button>
      <button className="btn">[COMPARAR]</button>
      <button className="btn btn-accent">[REDACTAR EMAIL] →</button>
    </div>
  </div>
);

window.Marcado_Dashboard = Marcado_Dashboard;
