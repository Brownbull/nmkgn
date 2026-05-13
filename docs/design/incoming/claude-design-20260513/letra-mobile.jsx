// letra. — Mobile screens

const PhoneShell = ({ children }) => {
  const nav = useNav();
  // When running inside the live prototype, the real viewport IS the device —
  // skip the bezel/notch/status row so we don't double up on chrome.
  if (nav.interactive) {
    return (
      <div className="lt" style={{ background:'var(--paper)', minHeight:'100vh' }}>
        {children}
      </div>
    );
  }
  return (
  <div className="lt-phone">
    <div className="lt-phone-screen">
      <div className="lt-phone-notch"/>
      <div className="lt-phone-status">
        <span>9:41</span>
        <span style={{ letterSpacing:2 }}>•••</span>
      </div>
      <div className="lt" style={{ background:'transparent', height:'calc(100% - 36px)', overflow:'auto' }}>
        {children}
      </div>
    </div>
  </div>
  );
};

// ===== Mobile Login =====
const LT_M_Login = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <div style={{ padding:'24px 22px 16px', height:'100%', display:'flex', flexDirection:'column' }}>
      <Logo />

      <div style={{ marginTop:48 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:'var(--accent-soft)', color:'var(--accent)', fontSize:11, fontWeight:600 }}>
          <Icon name="sparkle" size={12}/> Para Chile
        </div>
        <h1 className="display" style={{
          fontSize:38, margin:'18px 0 0', letterSpacing:-0.03, lineHeight:1.05,
        }}>
          Lee la letra<br/>
          <span style={{ color:'var(--accent)' }}>chica</span> por ti.
        </h1>
        <div style={{ fontSize:15, color:'var(--ink-soft)', marginTop:14, lineHeight:1.5 }}>
          Sube un crédito o contrato. Te marcamos lo abusivo y lo escondido antes de que firmes.
        </div>
      </div>

      {/* Preview card */}
      <div className="card" style={{
        marginTop:30, padding:'14px 16px',
        boxShadow:'0 20px 32px -16px rgba(26,29,36,0.15)',
      }}>
        <DocBadge compact/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid var(--line)' }}>
          <div>
            <div className="label">Tu crédito</div>
            <div className="display num" style={{ fontSize:24, color:'var(--red)', lineHeight:1, marginTop:4 }}>+$1.4M de más</div>
          </div>
          <span className="pill pill-red">3 hallazgos</span>
        </div>
      </div>

      <div style={{ flex:1 }}/>

      <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px 18px', fontSize:15 }}
        onClick={() => nav.go(nav.state.seenWelcome ? 'upload' : 'welcome')}>
        <GoogleG size={18}/> Continuar con Google
      </button>
      <div style={{ fontSize:11.5, color:'var(--ink-faint)', textAlign:'center', marginTop:10 }}>
        Sin tarjeta · 1 documento gratis al mes
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Coach =====
const LT_M_Coach = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    {/* Top bar */}
    <div style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--line)', background:'var(--paper)' }}>
      <Logo size={18}/>
      <div style={{ flex:1 }}/>
      <Icon name="search" size={18} color="var(--ink-soft)"/>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:10, fontWeight:600 }}>JR</div>
    </div>

    <div style={{ padding:'18px 18px 24px' }}>
      <DocBadge compact/>

      <h1 className="display" style={{ fontSize:24, margin:'14px 0 6px', letterSpacing:-0.025, lineHeight:1.15 }}>
        Estás pagando <span style={{ color:'var(--red)' }}>$1.4M de más</span>.
      </h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>
        contrato.pdf · BancoPlaceholder · 14 mar 2025
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
        <MStat label="Cuotas" value="68"     delta="+8 vs. 60" sev="hi"/>
        <MStat label="CAE"    value="24.8%"  delta="+4.2 pts"  sev="hi"/>
        <MStat label="Costo"  value="$23.9M" delta="+$1.4M"    sev="hi"/>
        <MStat label="Monto"  value="$18.0M" delta="—"         sev="ok"/>
      </div>

      {/* Lens mini-scorecard — perspective at a glance */}
      <div style={{ marginTop:16 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
          <span className="label">Por perspectiva</span>
          <span style={{ fontSize:10.5, color:'var(--ink-faint)' }}>4 lentes</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <MLensMini lens="ley"      status="strong"    headline="Cumple"           sub="5 / 5 OK"/>
          <MLensMini lens="mercado"  status="weak"      headline="Sobre el promedio" sub="2 / 4 alerta"/>
          <MLensMini lens="comparar" status="weak"      headline="−$1.2M peor"      sub="vs. María"/>
          <MLensMini lens="intl"     status="ref"       headline="3 obs."           sub="solo referencia"/>
        </div>
      </div>

      {/* Section: market */}
      <div className="card" style={{ padding:16, marginTop:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
          <h3 className="display" style={{ fontSize:15, margin:0 }}>vs. mercado</h3>
          <span style={{ fontSize:10, color:'var(--ink-faint)' }}>CMF · mar 2025</span>
        </div>
        <MBar label="CAE" you={24.8} market={20.6} sev="hi"/>
        <MBar label="Tasa" you={18.4} market={15.9} sev="hi"/>
      </div>

      {/* Action plan */}
      <h2 className="display" style={{ fontSize:16, margin:'18px 0 8px', letterSpacing:-0.015 }}>Qué hacer ahora</h2>
      <MAction n="1" sev="hi"  title="Cotiza con 2 bancos más" savings="−$1.1M"/>
      <MAction n="2" sev="hi"  title="Pide la tabla a 60 cuotas" savings="−$300k"/>
      <MAction n="3" sev="mid" title="Cambia el seguro" savings="−$320k"/>

      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', marginTop:16 }}
        onClick={() => nav.go('email')}>
        <Icon name="mail" size={14}/> Redactar email al banco
      </button>

      <div className="card-soft" style={{ padding:'10px 12px', marginTop:14, display:'flex', alignItems:'center', gap:8 }}>
        <Icon name="globe" size={14} color="var(--accent)"/>
        <span style={{ fontSize:11.5, color:'var(--ink-soft)' }}>Contexto internacional disponible</span>
        <div style={{ flex:1 }}/>
        <Icon name="chevron-r" size={14} color="var(--ink-faint)"/>
      </div>
    </div>
  </PhoneShell>
  );
};

const MStat = ({ label, value, delta, sev }) => {
  const color = sev==='hi'?'var(--red)':sev==='ok'?'var(--green)':sev==='mid'?'var(--amber)':'var(--ink)';
  const cls = sev==='hi'?'pill-red':sev==='ok'?'pill-green':sev==='mid'?'pill-amber':'pill';
  return (
    <div className="card" style={{ padding:'12px 14px' }}>
      <div className="label">{label}</div>
      <div className="num display" style={{ fontSize:20, color, marginTop:4, lineHeight:1, letterSpacing:-0.015 }}>{value}</div>
      <div style={{ marginTop:6 }}>
        <span className={`pill ${cls}`} style={{ fontSize:10, padding:'1px 6px' }}>{delta}</span>
      </div>
    </div>
  );
};

const MBar = ({ label, you, market, sev }) => {
  const max = Math.max(you, market) * 1.18;
  const color = sev==='hi'?'var(--red)':sev==='mid'?'var(--amber)':'var(--green)';
  return (
    <div style={{ marginTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
        <span style={{ fontWeight:600 }}>{label}</span>
        <span className="num" style={{ color }}>{you>market?'+':''}{(you-market).toFixed(1)} pts</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ width:40, fontSize:9, color:'var(--ink-faint)' }}>Tú</span>
        <div style={{ flex:1, height:6, background:'var(--paper-2)', borderRadius:3 }}>
          <div style={{ width:`${you/max*100}%`, height:'100%', background: color, borderRadius:3 }}/>
        </div>
        <span className="num" style={{ width:40, fontSize:11, textAlign:'right' }}>{you}%</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
        <span style={{ width:40, fontSize:9, color:'var(--ink-faint)' }}>Mkt</span>
        <div style={{ flex:1, height:6, background:'var(--paper-2)', borderRadius:3 }}>
          <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ink-soft)', borderRadius:3 }}/>
        </div>
        <span className="num" style={{ width:40, fontSize:11, textAlign:'right' }}>{market}%</span>
      </div>
    </div>
  );
};

const MAction = ({ n, sev, title, savings }) => {
  const color = sev==='hi'?'var(--red)':'var(--amber)';
  const bg = sev==='hi'?'var(--red-soft)':'var(--amber-soft)';
  return (
    <div className="card" style={{ padding:'12px 14px', marginTop:8, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ width:22, height:22, borderRadius:'50%', background: bg, color, fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center' }}>{n}</span>
      <span style={{ fontSize:13, fontWeight:600, flex:1, lineHeight:1.3 }}>{title}</span>
      <span className="num" style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>{savings}</span>
    </div>
  );
};

// ===== Mobile Plan =====
const LT_M_Plan = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <div style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--line)', background:'var(--paper)' }}>
      <Icon name="arrow-l" size={18}/>
      <span style={{ fontSize:14, fontWeight:600 }}>Plan de análisis</span>
      <div style={{ flex:1 }}/>
      <span style={{ fontSize:11, color:'var(--ink-faint)' }}>3 de 4</span>
    </div>

    <div style={{ padding:'16px 18px 24px' }}>
      <DocBadge compact/>

      <h1 className="display" style={{ fontSize:22, margin:'14px 0 4px', letterSpacing:-0.025 }}>
        ¿Qué revisamos?
      </h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)' }}>Elige los criterios. Activa o desactiva grupos.</div>

      {/* Presets */}
      <div style={{ display:'flex', gap:6, marginTop:14, overflowX:'auto' }}>
        <span style={{ padding:'6px 12px', borderRadius:8, background:'var(--ink)', color:'var(--paper)', fontSize:11.5, fontWeight:700, flex:'0 0 auto' }}>Completo</span>
        <span style={{ padding:'6px 12px', borderRadius:8, background:'#fff', border:'1px solid var(--line)', fontSize:11.5, fontWeight:600, flex:'0 0 auto' }}>Solo legal</span>
        <span style={{ padding:'6px 12px', borderRadius:8, background:'#fff', border:'1px solid var(--line)', fontSize:11.5, fontWeight:600, flex:'0 0 auto' }}>Solo mercado</span>
      </div>

      {/* Groups */}
      <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
        <MGroup icon="scale"   title="Ley en Chile"      sub="Ley 19.496 · CMF · SERNAC" count="5 / 5" on/>
        <MGroup icon="chart"   title="Mercado · CMF"     sub="Benchmarks marzo 2025"     count="4 / 4" on/>
        <MGroup icon="compare" title="Otras ofertas"     sub="1 disponible"              count="1 / 1" on/>
        <MGroup icon="globe"   title="Internacional"     sub="Referencia · no alertas"    count="2 / 4" on={false} muted/>
      </div>

      <div className="card-soft" style={{ padding:'12px 14px', marginTop:16, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <div className="label">12 criterios</div>
          <div className="num" style={{ fontSize:16, fontWeight:700, marginTop:2 }}>~ 2 min</div>
        </div>
        <span className="pill pill-green"><Icon name="check" size={11}/> Listo</span>
      </div>

      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', marginTop:14 }}
        onClick={() => nav.go('running')}>
        Empezar análisis <Icon name="arrow-r" size={14}/>
      </button>
    </div>
  </PhoneShell>
  );
};

const MGroup = ({ icon, title, sub, count, on, muted }) => (
  <div className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, background: muted ? 'var(--paper-2)' : '#fff' }}>
    <div style={{ width:32, height:32, borderRadius:8, background: on ? 'var(--accent-soft)' : 'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon name={icon} size={16} color={on ? 'var(--accent)' : 'var(--ink-faint)'}/>
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <span style={{ fontSize:13.5, fontWeight:700 }}>{title}</span>
        <span className="num" style={{ fontSize:10.5, color:'var(--ink-faint)' }}>{count}</span>
      </div>
      <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:2 }}>{sub}</div>
    </div>
    <Toggle on={on} size={26}/>
  </div>
);

// ===== Mobile detection (low confidence) =====
const LT_M_Detect = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <div style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--line)', background:'var(--paper)' }}>
      <Icon name="arrow-l" size={18}/>
      <span style={{ fontSize:14, fontWeight:600 }}>Identificación</span>
      <div style={{ flex:1 }}/>
      <span style={{ fontSize:11, color:'var(--ink-faint)' }}>2 de 4</span>
    </div>

    <div style={{ padding:'18px 18px 24px' }}>
      <span className="pill pill-amber"><Icon name="search" size={12}/> Confianza baja</span>
      <h1 className="display" style={{ fontSize:22, margin:'14px 0 4px', letterSpacing:-0.025, lineHeight:1.2 }}>
        ¿Cuál es este documento?
      </h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>Detectamos varias opciones. Confirma para seguir.</div>

      <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
        <MCandidate icon="bank" label="Crédito bancario" pct={62} top/>
        <MCandidate icon="file" label="Pagaré / mutuo" pct={28}/>
        <MCandidate icon="file" label="Otro · genérico" pct={10}/>
      </div>

      <div style={{ flex:1, marginTop:18 }}>
        <span className="label">Frases detectadas</span>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
          {['"mutuo"','"tasa"','"60 meses"','"deudor"','"CAE"'].map(p=>(
            <span key={p} className="pill" style={{ fontSize:10.5 }}>{p}</span>
          ))}
        </div>
      </div>

      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', marginTop:20 }}
        onClick={() => { nav.set({ detectResult:'ready' }); nav.go('detect'); }}>
        Continuar con Crédito <Icon name="arrow-r" size={14}/>
      </button>
      <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:6, color:'var(--ink-soft)' }}
        onClick={() => nav.go('upload')}>
        Ver todos los tipos
      </button>
    </div>
  </PhoneShell>
  );
};

const MCandidate = ({ icon, label, pct, top }) => (
  <div className="card" style={{
    padding:'12px 14px',
    background: top ? '#fff' : '#fff',
    borderColor: top ? 'var(--amber)' : 'var(--line)',
    borderWidth: top ? 1.5 : 1,
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <Icon name={icon} size={18}/>
      <span style={{ fontSize:13.5, fontWeight:700, flex:1 }}>{label}</span>
      <span className="num" style={{ fontSize:15, fontWeight:700, color: top ? 'var(--amber)' : 'var(--ink-faint)' }}>{pct}%</span>
    </div>
    <div style={{ height:5, background:'var(--paper-2)', borderRadius:3, marginTop:10, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background: top ? 'var(--amber)' : 'var(--ink-faint)' }}/>
    </div>
  </div>
);

const MLensMini = ({ lens, status, headline, sub }) => {
  const L = LENSES[lens];
  const color =
    status==='strong' ? 'var(--green)' :
    status==='weak'   ? 'var(--red)' :
    status==='attention' ? 'var(--amber)' :
    'var(--ink-faint)';
  return (
    <div className="card" style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Icon name={L.icon} size={13} color={L.color}/>
        <span style={{ fontSize:11.5, fontWeight:700, color: L.color, letterSpacing:-0.005, flex:1 }}>{L.short}</span>
        <span style={{ width:7, height:7, borderRadius:'50%', background: color }}/>
      </div>
      <div className="num display" style={{ fontSize:14, color, letterSpacing:-0.015, lineHeight:1 }}>{headline}</div>
      <div style={{ fontSize:10.5, color:'var(--ink-faint)' }}>{sub}</div>
    </div>
  );
};

Object.assign(window, { LT_M_Login, LT_M_Coach, LT_M_Plan, LT_M_Detect });
