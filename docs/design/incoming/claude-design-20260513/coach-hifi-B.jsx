// Hi-fi treatment B · "letra."
// Calm fintech. Manrope, soft pale palette, single deep-teal accent.
// Trust through restraint and competence — like Mercury, Linear, Wealthfront.

const LetraWordmark = ({ size=20 }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <svg width={size+4} height={size+4} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" rx="6" fill="#1a1d24"/>
      <path d="M 9 8 L 9 19 M 13 12 L 13 19 M 13 12 Q 13 8 17 8 M 17 19 L 17 14 Q 17 12 19 12 M 21 16 L 21 18"
        stroke="#fafaf7" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
    <span className="display" style={{ fontSize:size, letterSpacing:-0.03, lineHeight:1, fontWeight:700 }}>letra<span style={{ color:'var(--accent)' }}>.</span></span>
  </div>
);

const LetraNavItem = ({ children, active }) => (
  <span style={{
    padding:'7px 12px',
    borderRadius:8,
    fontSize:13.5, fontWeight:500,
    background: active ? 'var(--paper-2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-soft)',
    cursor:'pointer',
  }}>{children}</span>
);

const LetraDocBadge = () => (
  <div style={{
    display:'inline-flex', alignItems:'center', gap:12,
    padding:'7px 10px 7px 8px',
    background:'#fff',
    border:'1px solid var(--line)',
    borderRadius:12,
  }}>
    <div style={{ width:34, height:34, borderRadius:9, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 10 L12 4 L21 10 M5 10 L5 18 M9 10 L9 18 M15 10 L15 18 M19 10 L19 18 M3 20 L21 20" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round"/></svg>
    </div>
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span className="label">Identificado</span>
        <span style={{ display:'inline-flex', gap:2 }}>
          {[1,2,3].map(i=> <span key={i} style={{ width:5, height:5, borderRadius:'50%', background: 'var(--accent)' }}/>)}
        </span>
      </div>
      <div style={{ fontWeight:700, fontSize:14, letterSpacing:-0.01, marginTop:2, lineHeight:1.1 }}>Crédito de consumo <span style={{ color:'var(--ink-faint)', fontWeight:500 }}>· Chile</span></div>
    </div>
    <span style={{ width:1, height:24, background:'var(--line)' }}/>
    <button className="btn" style={{ padding:'5px 10px', fontSize:12, borderRadius:8 }}>Cambiar</button>
  </div>
);

const LetraStat = ({ label, value, sub, delta, sev }) => {
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : sev==='mid' ? 'var(--amber)' : 'var(--ink)';
  return (
    <div className="card" style={{ padding:'18px 20px', flex:1, minWidth:0 }}>
      <div className="label">{label}</div>
      <div className="num display" style={{ fontSize:30, marginTop:8, color, lineHeight:1, letterSpacing:-0.02 }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
        {delta ? (
          <span style={{
            fontSize:11, fontWeight:600,
            color, background: sev==='hi'?'#fbe7e1':sev==='mid'?'#fbeed3':'var(--accent-soft)',
            padding:'2px 7px', borderRadius:999,
          }}>{delta}</span>
        ) : null}
        <span style={{ fontSize:12, color:'var(--ink-faint)' }}>{sub}</span>
      </div>
    </div>
  );
};

const LetraBar = ({ label, you, market, sev }) => {
  const max = Math.max(you, market) * 1.2;
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : 'var(--amber)';
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:14, fontWeight:600 }}>{label}</span>
        <span className="num" style={{ fontSize:12, color, fontWeight:600 }}>
          {you > market ? '+' : ''}{(you-market).toFixed(1)} pts vs. mercado
        </span>
      </div>
      <div style={{ position:'relative', height:34, display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="label" style={{ width:50, fontSize:10 }}>Tú</span>
          <div style={{ flex:1, height:8, background:'var(--paper-2)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:`${you/max*100}%`, height:'100%', background: color, borderRadius:4 }}/>
          </div>
          <span className="num" style={{ fontSize:13, width:46, textAlign:'right' }}>{you}%</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="label" style={{ width:50, fontSize:10 }}>Mercado</span>
          <div style={{ flex:1, height:8, background:'var(--paper-2)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ink-soft)', borderRadius:4 }}/>
          </div>
          <span className="num" style={{ fontSize:13, width:46, textAlign:'right' }}>{market}%</span>
        </div>
      </div>
    </div>
  );
};

const LetraAction = ({ n, title, body, sev, savings }) => {
  const color = sev==='hi' ? 'var(--red)' : 'var(--amber)';
  const bg = sev==='hi' ? '#fbe7e1' : '#fbeed3';
  return (
    <div className="card" style={{ padding:'14px 16px', marginTop:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <span style={{
          width:22, height:22, borderRadius:'50%',
          background: bg, color, fontFamily:'JetBrains Mono', fontSize:12, fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>{n}</span>
        <span style={{ fontSize:14.5, fontWeight:700, letterSpacing:-0.01, flex:1 }}>{title}</span>
        {savings ? <span className="num" style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>{savings}</span> : null}
      </div>
      <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.5, paddingLeft:32 }}>{body}</div>
    </div>
  );
};

const Letra_Dashboard = () => (
  <div className="hf letra">
    {/* Top bar */}
    <div style={{ padding:'16px 32px', display:'flex', alignItems:'center', gap:24, borderBottom:'1px solid var(--line)' }}>
      <LetraWordmark />
      <div style={{ display:'flex', gap:4, marginLeft:24 }}>
        <LetraNavItem active>Análisis</LetraNavItem>
        <LetraNavItem>Mis documentos</LetraNavItem>
        <LetraNavItem>Comparar</LetraNavItem>
        <LetraNavItem>Ayuda</LetraNavItem>
      </div>
      <div style={{ flex:1 }}/>
      <span style={{ fontSize:12, color:'var(--ink-faint)', display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }}/> Guardado hace 2 min
      </span>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600 }}>JR</div>
    </div>

    {/* Page header */}
    <div style={{ padding:'28px 32px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <LetraDocBadge />
        <span className="pill"><span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/> Análisis completo</span>
        <span className="pill">11 criterios</span>
        <span className="pill" style={{ color:'var(--red)' }}>4 hallazgos</span>
      </div>
      <h1 className="display" style={{ fontSize:34, margin:0, letterSpacing:-0.025, lineHeight:1.1 }}>
        Estás pagando <span style={{ color:'var(--red)' }}>$1.4M de más</span> por este crédito.
      </h1>
      <div style={{ fontSize:14, color:'var(--ink-soft)', marginTop:8 }}>
        contrato.pdf · BancoPlaceholder · 14 mar 2025 · revisado contra estándares CMF y Ley 19.496
      </div>
    </div>

    {/* Stats */}
    <div style={{ padding:'0 32px', display:'flex', gap:14 }}>
      <LetraStat label="Monto" value="$18.0M" sub="solicitado" />
      <LetraStat label="Cuotas" value="68" delta="+8" sev="hi" sub="vs. 60 simuladas" />
      <LetraStat label="CAE" value="24.8%" delta="+4.2 pts" sev="hi" sub="vs. mercado" />
      <LetraStat label="Costo total" value="$23.9M" delta="+$1.4M" sev="hi" sub="vs. esperado" />
    </div>

    {/* Main */}
    <div style={{ padding:'24px 32px 0', display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:20 }}>
      {/* Benchmark */}
      <div className="card" style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <h2 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>Comparado con el mercado</h2>
          <span style={{ fontSize:11, color:'var(--ink-faint)' }}>Datos CMF · marzo 2025</span>
        </div>
        <LetraBar label="CAE" you={24.8} market={20.6} sev="hi" />
        <LetraBar label="Tasa de interés" you={18.4} market={15.9} sev="hi" />
        <LetraBar label="Comisión inicial" you={2.1} market={1.4} sev="mid" />
      </div>

      {/* Plan */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingLeft:4 }}>
          <h2 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>Qué hacer ahora</h2>
          <span style={{ fontSize:11, color:'var(--ink-faint)' }}>Ahorro potencial · <span className="num" style={{ color:'var(--green)' }}>$1.7M</span></span>
        </div>
        <LetraAction n="1" sev="hi" title="Cotiza con 2 bancos más" savings="−$1.1M"
          body="Con tu perfil crediticio es razonable apuntar a una CAE cerca de 20%." />
        <LetraAction n="2" sev="hi" title="Pregunta por las 8 cuotas extra" savings="−$300k"
          body="Tienes argumento legal si la simulación decía 60. Pide la tabla a 60 cuotas." />
        <LetraAction n="3" sev="mid" title="Cambia el seguro a una externa" savings="−$320k"
          body="El Art. 17 H Ley 19.496 te permite contratarlo con otra compañía." />
      </div>
    </div>

    {/* International context */}
    <div style={{ padding:'20px 32px 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style={{ fontSize:14 }}>🌎</span>
        <h3 className="display" style={{ fontSize:14, margin:0, letterSpacing:-0.005 }}>Contexto internacional</h3>
        <span className="pill" style={{ fontSize:10 }}>solo referencia · no genera alertas</span>
      </div>
      <div style={{ display:'flex', gap:12 }}>
        {[
          { tag:'FCRA · EE.UU.', body:'Te exigiría notificarte del uso de tu informe crediticio. En Chile no es obligatorio.' },
          { tag:'CFPB · UDAAP',  body:'El cambio de 60 a 68 cuotas podría considerarse práctica engañosa bajo este estándar.' },
          { tag:'UE · CCD ESIS', body:'Existiría una tabla de una página con todos los costos. En Chile no existe equivalente.' },
        ].map((r,i)=>(
          <div key={i} className="card" style={{ flex:1, padding:'12px 14px', background:'var(--paper-2)', borderColor:'transparent' }}>
            <div className="label" style={{ color:'var(--accent)' }}>{r.tag}</div>
            <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>{r.body}</div>
          </div>
        ))}
      </div>
    </div>

    {/* CTAs */}
    <div style={{ position:'absolute', bottom:22, left:32, right:32, display:'flex', gap:10, alignItems:'center' }}>
      <span style={{ fontSize:12, color:'var(--ink-faint)' }}>Análisis terminado · 14:23 · puedes volver cuando quieras</span>
      <div style={{ flex:1 }}/>
      <button className="btn">Exportar PDF</button>
      <button className="btn">Comparar</button>
      <button className="btn btn-accent">Redactar email al banco →</button>
    </div>
  </div>
);

window.Letra_Dashboard = Letra_Dashboard;
