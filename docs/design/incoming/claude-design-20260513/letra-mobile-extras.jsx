// letra. — Mobile screens (extras): Welcome, Upload, Processing,
// Detect-ready, Unsupported, Failed, Running, Email, Compare,
// History, History-empty, Settings, Finding detail, Share.
// These are reference mockups (sit in the design canvas).

// ───── Shared mobile chrome ─────
const MTop = ({ title, sub, onBack }) => (
  <div style={{ padding:'10px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--line)', background:'var(--paper)' }}>
    {onBack !== false ? (
      <span style={{ fontSize:18, color:'var(--ink-soft)', cursor:'pointer', padding:'2px 6px 2px 0' }}>‹</span>
    ) : null}
    <Logo size={16}/>
    {title ? <span style={{ fontSize:13, color:'var(--ink-soft)', marginLeft:6 }}>{title}</span> : null}
    <div style={{ flex:1 }}/>
    <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:10, fontWeight:600 }}>JR</div>
  </div>
);

const MStepBar = ({ current }) => (
  <div style={{ padding:'8px 18px', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid var(--line)' }}>
    {['Subir','Identificar','Plan','Análisis'].map((s, i) => (
      <React.Fragment key={s}>
        {i > 0 ? <span style={{ width:8, height:1, background: i <= current ? 'var(--accent)' : 'var(--line-2)' }}/> : null}
        <span style={{
          padding:'3px 7px', borderRadius:999, fontSize:9.5, fontWeight:600,
          background: i === current ? 'var(--accent-soft)' : 'transparent',
          color: i === current ? 'var(--accent)' : i < current ? 'var(--ink)' : 'var(--ink-faint)',
          border: i === current ? '1px solid var(--accent)' : '1px solid var(--line)',
        }}>{s}</span>
      </React.Fragment>
    ))}
  </div>
);

// ===== Mobile Welcome =====
const LT_M_Welcome = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <div style={{ padding:'24px 22px', height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Logo size={16}/>
        <span style={{ fontSize:12, color:'var(--ink-faint)', cursor:'pointer' }} onClick={() => { nav.set({ seenWelcome:true }); nav.go('upload'); }}>Saltar →</span>
      </div>

      <div style={{ marginTop:36, flex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:'var(--accent-soft)', color:'var(--accent)', fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:0.06 }}>
          01 · qué hace letra.
        </div>
        <h1 className="display" style={{ fontSize:30, margin:'14px 0 0', letterSpacing:-0.025, lineHeight:1.1 }}>
          Lee tu contrato como si lo revisara <span style={{ color:'var(--accent)' }}>un abogado y un banquero</span>.
        </h1>
        <p style={{ fontSize:14, color:'var(--ink-soft)', marginTop:14, lineHeight:1.55 }}>
          Subes un PDF, en 2 minutos te decimos qué te conviene firmar, negociar, y rechazar.
        </p>

        {/* visual */}
        <div className="card" style={{ marginTop:24, padding:'14px 16px', boxShadow:'0 20px 30px -16px rgba(26,29,36,0.15)' }}>
          <DocBadge compact/>
          <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--line)' }}>
            <div className="label">Cláusula 4.2</div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>
              "…en <span style={{ background:'var(--red-soft)', color:'var(--red)', fontWeight:600, padding:'1px 4px', borderRadius:3 }}>68 cuotas</span> mensuales y sucesivas…"
            </div>
          </div>
          <div style={{ marginTop:10, padding:'8px 10px', background:'var(--red-soft)', borderRadius:8, fontSize:11.5, color:'var(--red)', fontWeight:600 }}>
            +8 cuotas sobre lo simulado
          </div>
        </div>
      </div>

      {/* dots */}
      <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center', marginTop:18, marginBottom:14 }}>
        <span style={{ width:24, height:6, borderRadius:3, background:'var(--accent)' }}/>
        <span style={{ width:6, height:6, borderRadius:3, background:'var(--paper-3)' }}/>
        <span style={{ width:6, height:6, borderRadius:3, background:'var(--paper-3)' }}/>
      </div>

      <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15 }}
        onClick={() => { nav.set({ seenWelcome:true }); nav.go('upload'); }}>
        Empezar <Icon name="arrow-r" size={14}/>
      </button>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Upload =====
const LT_M_Upload = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack/>
    <MStepBar current={0}/>
    <div style={{ padding:'18px 22px' }}>
      <div className="label">Paso 1 de 4</div>
      <h1 className="display" style={{ fontSize:26, margin:'6px 0 4px', letterSpacing:-0.02 }}>¿Qué vamos a revisar?</h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)' }}>Elige un tipo o suelta el PDF directo.</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
        {SUPPORTED_TYPES.slice(0,4).map((t, i) => (
          <div key={t.label} className="card" style={{
            padding:'12px 12px',
            background: i === 0 ? 'var(--accent-soft)' : '#fff',
            borderColor: i === 0 ? 'var(--accent)' : 'var(--line)',
          }}>
            <div style={{ width:30, height:30, borderRadius:7, background: i === 0 ? '#fff' : 'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={t.icon} size={15} color={i === 0 ? 'var(--accent)' : 'var(--ink)'}/>
            </div>
            <div style={{ fontSize:12.5, fontWeight:700, marginTop:8 }}>{t.label}</div>
            <div style={{ fontSize:10.5, color:'var(--ink-faint)', marginTop:2 }}>{t.sub.split(' ·')[0]}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-small" style={{ width:'100%', justifyContent:'center', marginTop:10, color:'var(--ink-faint)' }}>Ver los 6 tipos →</button>

      {/* Drop zone */}
      <div className="card" style={{
        marginTop:14, padding:'28px 18px',
        background: 'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)',
        border:'1.5px dashed var(--line-2)',
        textAlign:'center',
      }}>
        <div style={{ width:44, height:44, borderRadius:11, background:'#fff', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="upload" size={20} color="var(--accent)"/>
        </div>
        <div style={{ fontSize:14, fontWeight:700, marginTop:10 }}>Suelta tu PDF acá</div>
        <div style={{ fontSize:11.5, color:'var(--ink-soft)', marginTop:3 }}>o <span style={{ color:'var(--accent)', fontWeight:600, textDecoration:'underline' }}>elige del teléfono</span></div>
      </div>

      <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14.5, marginTop:18 }}
        onClick={() => nav.go('process')}>
        Continuar <Icon name="arrow-r" size={13}/>
      </button>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Processing =====
const LT_M_Processing = () => {
  const nav = useNav();
  React.useEffect(() => {
    if (!nav.interactive) return;
    const target = nav.state.detectResult === 'low' ? 'low'
                  : nav.state.detectResult === 'unsupported' ? 'unsupported'
                  : nav.state.detectResult === 'failed' ? 'failed'
                  : 'detect';
    const t = setTimeout(() => nav.go(target), 2400);
    return () => clearTimeout(t);
  }, [nav.interactive]);
  return (
  <PhoneShell>
    <MTop/>
    <MStepBar current={1}/>
    <div style={{ padding:'20px 22px' }}>
      <div className="label">Paso 2 de 4</div>
      <h1 className="display" style={{ fontSize:24, margin:'6px 0 4px', letterSpacing:-0.02 }}>Leyendo tu documento…</h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)' }}>Primero identificamos qué tipo es.</div>

      <div className="card" style={{ padding:16, marginTop:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:46, background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="file" size={16} color="var(--ink-faint)"/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700 }}>contrato.pdf</div>
            <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>6 pág · 412 KB</div>
          </div>
          <span className="pill pill-accent" style={{ fontSize:11 }}>72%</span>
        </div>
        <div style={{ marginTop:12 }}>
          <ProgressBar pct={72} accent="var(--accent)"/>
        </div>
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { d:true, l:'OCR · texto extraído' },
            { d:true, l:'Detectando tipo' },
            { d:false, l:'Cargando benchmarks' },
            { d:false, q:true, l:'Listo para mostrarte' },
          ].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                background: s.d ? 'var(--accent)' : '#fff',
                border: s.d ? 'none' : '1.5px solid ' + (s.q ? 'var(--line)' : 'var(--accent)'),
                display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto',
              }}>
                {s.d ? <Icon name="check" size={10} color="#fff" strokeWidth={3}/> : (!s.q ? <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/> : null)}
              </span>
              <span style={{ fontSize:12.5, color: s.q ? 'var(--ink-faint)' : 'var(--ink)' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize:11, color:'var(--ink-faint)', textAlign:'center', marginTop:18 }}>20-40 segundos · te avisamos cuando termine</div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Detect-ready =====
const LT_M_DetectReady = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop/>
    <MStepBar current={1}/>
    <div style={{ padding:'18px 22px' }}>
      <div className="label">Paso 2 de 4</div>
      <span className="pill pill-green" style={{ marginTop:8, fontSize:11 }}>
        <Icon name="check-circle" size={11}/> Alta confianza
      </span>
      <h1 className="display" style={{ fontSize:24, margin:'12px 0 4px', letterSpacing:-0.02, lineHeight:1.15 }}>
        Es un <span style={{ color:'var(--accent)' }}>Crédito de consumo</span>.
      </h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.5 }}>
        Lo vamos a revisar contra los estándares CMF y la Ley 19.496.
      </div>

      <div style={{ marginTop:14 }}>
        <DocBadge confidence="high" compact/>
      </div>

      <div className="card" style={{ marginTop:14, padding:'14px 16px' }}>
        <div className="label">Qué vamos a revisar</div>
        <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:10 }}>
          {[
            'Plazo y cantidad de cuotas',
            'CAE vs. promedio CMF',
            'Seguros vinculados al banco',
            'Cláusulas abusivas (Art. 16)',
            'Aceleración y prepago',
          ].map(c => (
            <div key={c} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5 }}>
              <Icon name="check" size={12} color="var(--accent)" strokeWidth={2.5}/> {c}
            </div>
          ))}
          <span style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:4 }}>+ 6 más</span>
        </div>
      </div>

      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14, marginTop:18 }}
        onClick={() => nav.go('plan')}>
        Personalizar plan <Icon name="arrow-r" size={13}/>
      </button>
      <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', padding:'10px', fontSize:13, color:'var(--ink-faint)', marginTop:8 }}
        onClick={() => nav.go('upload')}>
        No es esto, cambiar tipo
      </button>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Unsupported =====
const LT_M_Unsupported = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop/>
    <div style={{ padding:'18px 22px' }}>
      <span className="pill pill-red" style={{ fontSize:11 }}>
        <Icon name="x" size={10}/> No soportado
      </span>
      <h1 className="display" style={{ fontSize:24, margin:'12px 0 4px', letterSpacing:-0.02, lineHeight:1.15 }}>
        Aún no analizamos este tipo.
      </h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.55 }}>
        Detectamos que <b>terminos-servicio.pdf</b> parece ser <b>Términos y Condiciones</b>. Para no darte un análisis equivocado, no lo procesamos.
      </div>

      <div className="card" style={{ marginTop:14, padding:14, background:'var(--red-soft)', borderColor:'transparent' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--red)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flex:'0 0 auto' }}>!</div>
          <div style={{ fontSize:12, lineHeight:1.55 }}>
            <b>Por qué no.</b> Cada tipo necesita reglas y benchmarks propios. Sin ellos podríamos pasar por alto cosas importantes o marcar como peligroso algo que es normal.
          </div>
        </div>
      </div>

      <h2 className="display" style={{ fontSize:14, margin:'22px 0 10px' }}>Lo que sí podemos</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {SUPPORTED_TYPES.slice(0,4).map(t => (
          <div key={t.label} className="card" style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <Icon name={t.icon} size={16}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{t.label}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{t.sub.split(' ·')[0]}</div>
            </div>
            <span className="num" style={{ fontSize:10.5, color:'var(--ink-faint)' }}>{t.count}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:18 }}>
        <button className="btn" style={{ width:'100%', justifyContent:'center' }}
          onClick={() => nav.notify('Te avisaremos por email')}>
          <Icon name="mail" size={13}/> Avisarme cuando esté listo
        </button>
        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px' }}
          onClick={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}>
          Subir otro documento
        </button>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Failed =====
const LT_M_Failed = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop/>
    <div style={{ padding:'18px 22px' }}>
      <span className="pill pill-red" style={{ fontSize:11 }}>
        <Icon name="x" size={10}/> No pudimos leerlo
      </span>
      <h1 className="display" style={{ fontSize:24, margin:'12px 0 4px', letterSpacing:-0.02, lineHeight:1.15 }}>
        Algo salió mal leyendo tu documento.
      </h1>
      <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.55 }}>
        Llegamos hasta el 38% y no pudimos seguir. <b>No te vamos a cobrar este análisis.</b>
      </div>

      <div className="card" style={{ marginTop:14, padding:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:46, background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <Icon name="file" size={16} color="var(--red)"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:700 }}>contrato.pdf</div>
            <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>fallo en página 3</div>
          </div>
          <span className="pill pill-red" style={{ fontSize:10 }}>38%</span>
        </div>
      </div>

      <h2 className="display" style={{ fontSize:14, margin:'20px 0 10px' }}>Lo que pudo pasar</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          { ic:'search', t:'El escaneo está borroso', s:'Vuelve a tomar la foto con mejor luz.' },
          { ic:'shield', t:'El PDF tiene protección', s:'Pide al banco el archivo sin bloqueo.' },
          { ic:'file', t:'El archivo está corrupto', s:'Pide el original al banco.' },
        ].map((r, i) => (
          <div key={i} className="card" style={{ padding:'10px 12px', display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
              <Icon name={r.ic} size={14}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12.5, fontWeight:700 }}>{r.t}</div>
              <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2, lineHeight:1.5 }}>{r.s}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:18 }}>
        <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', padding:'13px' }}
          onClick={() => { nav.set({ detectResult:'ready' }); nav.go('process'); }}>
          <Icon name="arrow-r" size={13}/> Reintentar
        </button>
        <button className="btn" style={{ width:'100%', justifyContent:'center' }}
          onClick={() => nav.notify('Te contactaremos por email')}>
          <Icon name="mail" size={13}/> Contactar a soporte
        </button>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Running =====
const LT_M_Running = () => {
  const nav = useNav();
  React.useEffect(() => {
    if (!nav.interactive) return;
    const t = setTimeout(() => nav.go('coach'), 4200);
    return () => clearTimeout(t);
  }, [nav.interactive]);
  return (
  <PhoneShell>
    <MTop/>
    <MStepBar current={3}/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">Paso 4 de 4</div>
      <h1 className="display" style={{ fontSize:24, margin:'4px 0 4px', letterSpacing:-0.02 }}>Analizando…</h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>7 de 11 listos · puedes mirar parciales abajo.</div>

      <div className="card" style={{ padding:'12px 14px', marginTop:12 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div className="label" style={{ fontSize:9.5 }}>Progreso</div>
          <span className="num" style={{ fontSize:12, fontWeight:600 }}>64% · 18s</span>
        </div>
        <div style={{ marginTop:8 }}><ProgressBar pct={64} accent="var(--accent)"/></div>
      </div>

      {/* Tabs: Criterios | Hallazgos */}
      <div style={{ display:'flex', gap:4, marginTop:14, padding:3, background:'var(--paper-2)', borderRadius:9 }}>
        <span style={{ flex:1, textAlign:'center', padding:'6px', fontSize:12, fontWeight:600, background:'#fff', borderRadius:7, boxShadow:'0 1px 2px rgba(26,29,36,0.05)' }}>
          Criterios <span style={{ color:'var(--ink-faint)' }}>11</span>
        </span>
        <span style={{ flex:1, textAlign:'center', padding:'6px', fontSize:12, fontWeight:500, color:'var(--ink-soft)' }}>
          Hallazgos <span className="pill pill-red" style={{ marginLeft:4, fontSize:9.5, padding:'1px 6px' }}>3</span>
        </span>
      </div>

      <div className="card" style={{ marginTop:10, padding:0, overflow:'hidden' }}>
        {[
          { d:true, t:'CAE informada coincide', s:'Coincide', f:null },
          { d:true, t:'Cláusula de aceleración', s:'Cl. 12.3 · alerta', f:'1' },
          { d:true, t:'CAE vs. promedio segmento', s:'+4.2 pts', f:'alerta' },
          { r:true, t:'Tasa vs. mediana banca', s:'estimando…', f:null },
          { q:true, t:'Comisión inicial', s:'esperando', f:null },
        ].map((c, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderTop: i===0 ? 'none' : '1px solid var(--line)' }}>
            <span style={{
              width:16, height:16, borderRadius:4, flex:'0 0 auto',
              background: c.d ? (c.f ? 'var(--red-soft)' : 'var(--accent-soft)') : c.r ? '#fff' : 'var(--paper-2)',
              border: c.d ? 'none' : c.r ? '1.5px solid var(--accent)' : '1px solid var(--line)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {c.d ? <Icon name={c.f ? 'x' : 'check'} size={9} color={c.f ? 'var(--red)' : 'var(--accent)'} strokeWidth={2.5}/> : null}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight: c.d || c.r ? 600 : 500, color: c.q ? 'var(--ink-faint)' : 'var(--ink)' }}>{c.t}</div>
              <div style={{ fontSize:10.5, color:'var(--ink-faint)', marginTop:1 }}>{c.s}</div>
            </div>
            {c.f ? <span className="pill pill-red" style={{ fontSize:9.5 }}>{c.f}</span> : null}
            {c.r ? <span className="pill pill-accent" style={{ fontSize:9.5 }}>•••</span> : null}
          </div>
        ))}
      </div>

      <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', color:'var(--ink-faint)', marginTop:14, fontSize:12 }}
        onClick={() => nav.go('plan')}>
        Cancelar análisis
      </button>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Email composer =====
const LT_M_Email = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop/>
    <div style={{ padding:'14px 22px 0' }}>
      <div className="label">Acción</div>
      <h1 className="display" style={{ fontSize:22, margin:'4px 0 4px', letterSpacing:-0.02 }}>Email al banco</h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>Editado en base a 4 hallazgos.</div>

      {/* Tone selector */}
      <div style={{ marginTop:12, display:'flex', gap:5, padding:3, background:'var(--paper-2)', borderRadius:8, fontSize:11.5 }}>
        {['Cordial','Firme','Asertivo','Directo'].map((t, i) => (
          <span key={t} style={{
            flex:1, textAlign:'center', padding:'5px 6px', borderRadius:6,
            background: i === 1 ? '#fff' : 'transparent',
            color: i === 1 ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: i === 1 ? 700 : 500,
            boxShadow: i === 1 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}>{t}</span>
        ))}
      </div>

      <div className="card" style={{ marginTop:12, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:4, fontSize:11.5, color:'var(--ink-soft)' }}>
          <div><span className="label" style={{ fontSize:9, marginRight:8 }}>Para</span>ejecutivo@bp.cl</div>
          <div style={{ fontWeight:700, color:'var(--ink)' }}>Consultas sobre contrato N° 4471-2025</div>
        </div>
        <div style={{ padding:'14px 16px', fontSize:13, lineHeight:1.6 }}>
          <p style={{ margin:'0 0 10px' }}>Estimado/a,</p>
          <p style={{ margin:'0 0 10px' }}>Antes de firmar el contrato necesito que revisemos:</p>
          <ol style={{ margin:0, padding:'0 0 0 18px', display:'flex', flexDirection:'column', gap:8, fontSize:12.5 }}>
            <li>La simulación mostraba <b>60 cuotas</b>. El contrato indica <span style={{ background:'var(--red-soft)', color:'var(--red)', padding:'1px 4px', borderRadius:3 }}>68 cuotas</span> (Cl. 4.2)…</li>
            <li>La <b>CAE de 24.8%</b> supera en <b>4.2 pts</b> la mediana CMF…</li>
            <li>El seguro vinculado al banco — <b>Art. 17 H</b>…</li>
          </ol>
        </div>
      </div>

      {/* Findings rail collapsed → tap to expand */}
      <div className="card-soft" style={{ marginTop:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <Icon name="sliders" size={14}/>
        <span style={{ fontSize:12, flex:1 }}>4 de 4 hallazgos activos</span>
        <span style={{ fontSize:11.5, color:'var(--accent)', fontWeight:600 }}>Editar →</span>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:14, marginBottom:14 }}>
        <button className="btn btn-small" style={{ flex:1, justifyContent:'center' }}
          onClick={() => nav.notify('Texto copiado')}>Copiar</button>
        <button className="btn btn-accent btn-small" style={{ flex:1, justifyContent:'center' }}
          onClick={() => { nav.notify('Email enviado'); nav.go('history'); }}>
          <Icon name="send" size={12}/> Enviar
        </button>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Compare =====
const LT_M_Compare = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">2 ofertas</div>
      <h1 className="display" style={{ fontSize:22, margin:'4px 0 4px', letterSpacing:-0.02, lineHeight:1.15 }}>Tu crédito vs. el de María</h1>

      {/* Verdict */}
      <div className="card" style={{ marginTop:12, padding:'14px 16px', background:'linear-gradient(180deg, var(--red-soft) 0%, var(--paper) 70%)', borderColor:'transparent' }}>
        <div className="label" style={{ color:'var(--red)', fontSize:9.5 }}>Veredicto</div>
        <div className="display" style={{ fontSize:18, marginTop:6, lineHeight:1.2 }}>
          María queda <span style={{ color:'var(--green)' }}>$1.2M mejor</span> a lo largo del plazo.
        </div>
      </div>

      {/* Stacked offer cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:'var(--red-soft)', display:'flex', alignItems:'center', gap:8 }}>
            <span className="label" style={{ color:'var(--red)', fontSize:9.5 }}>EL TUYO</span>
            <div style={{ flex:1 }}/>
            <span className="pill pill-red" style={{ fontSize:9.5 }}>Peor</span>
          </div>
          <div style={{ padding:'10px 14px 4px' }}>
            <div style={{ fontSize:13, fontWeight:700 }}>BancoPlaceholder</div>
          </div>
          <div style={{ padding:'0 14px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
            <CompareRow k="Cuotas" v="68"/>
            <CompareRow k="CAE" v="24.8%" sev="hi"/>
            <CompareRow k="Cuota" v="$352.400"/>
            <CompareRow k="Total" v="$23.9M" sev="hi"/>
          </div>
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:'var(--green-soft)', display:'flex', alignItems:'center', gap:8 }}>
            <span className="label" style={{ color:'var(--green)', fontSize:9.5 }}>EL DE MARÍA</span>
            <div style={{ flex:1 }}/>
            <span className="pill pill-green" style={{ fontSize:9.5 }}>Mejor</span>
          </div>
          <div style={{ padding:'10px 14px 4px' }}>
            <div style={{ fontSize:13, fontWeight:700 }}>OtroBanco</div>
          </div>
          <div style={{ padding:'0 14px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
            <CompareRow k="Cuotas" v="60"/>
            <CompareRow k="CAE" v="19.4%" sev="ok"/>
            <CompareRow k="Cuota" v="$378.200"/>
            <CompareRow k="Total" v="$22.7M" sev="ok"/>
          </div>
        </div>
      </div>

      <button className="btn" style={{ width:'100%', justifyContent:'center', marginTop:14 }}
        onClick={() => nav.notify('Añadir oferta · sube un segundo PDF')}>
        <Icon name="plus" size={13}/> Añadir otra oferta
      </button>
    </div>
  </PhoneShell>
  );
};

const CompareRow = ({ k, v, sev }) => {
  const color = sev === 'hi' ? 'var(--red)' : sev === 'ok' ? 'var(--green)' : 'var(--ink)';
  return (
    <div>
      <div style={{ fontSize:10, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:0.06 }}>{k}</div>
      <div className="num" style={{ fontSize:13.5, fontWeight:600, color, marginTop:2 }}>{v}</div>
    </div>
  );
};

// ===== Mobile History =====
const LT_M_History = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack={false}/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">Historial</div>
      <h1 className="display" style={{ fontSize:24, margin:'4px 0 4px', letterSpacing:-0.02 }}>Mis documentos</h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>7 documentos · este año</div>

      {/* Stat strip — 2 col */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="label" style={{ fontSize:9.5 }}>Ahorro</div>
          <div className="num display" style={{ fontSize:22, color:'var(--green)', marginTop:6, lineHeight:1 }}>$2.4M</div>
          <div style={{ fontSize:10, color:'var(--ink-faint)', marginTop:6 }}>por 3 ofertas negociadas</div>
        </div>
        <div className="card" style={{ padding:'12px 14px' }}>
          <div className="label" style={{ fontSize:9.5 }}>Pendientes</div>
          <div className="num display" style={{ fontSize:22, color:'var(--amber)', marginTop:6, lineHeight:1 }}>2</div>
          <div style={{ fontSize:10, color:'var(--ink-faint)', marginTop:6 }}>esperan tu firma</div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding:'8px 12px', marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
        <Icon name="search" size={14} color="var(--ink-faint)"/>
        <span style={{ fontSize:13, color:'var(--ink-faint)', flex:1 }}>Buscar por nombre o banco</span>
        <Icon name="sliders" size={14} color="var(--ink-faint)"/>
      </div>

      {/* List */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
        {[
          { icon:'bank', name:'Crédito BancoPlaceholder', tag:'Consumo', date:'14 mar', score:62, sev:'hi', meta:'68 cuotas · 24.8%' },
          { icon:'bank', name:'Crédito María', tag:'Consumo', date:'14 mar', score:88, sev:'ok', meta:'60 cuotas · 19.4%' },
          { icon:'wrench', name:'Cotización Taller', tag:'Cotización', date:'02 mar', score:74, sev:'mid', meta:'2 ítems sin detalle' },
          { icon:'house', name:'Arriendo Providencia', tag:'Arriendo', date:'18 feb', score:91, sev:'ok', meta:'UF 18 / mes' },
        ].map((r, i) => (
          <div key={i} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
            onClick={() => { nav.set({ docType: r.icon, docLabel: r.tag, fileName: r.name + '.pdf' }); nav.go('coach'); }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
              <Icon name={r.icon} size={15}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>{r.date} · {r.meta}</div>
            </div>
            <MiniScore score={r.score} sev={r.sev}/>
          </div>
        ))}
      </div>

      {/* FAB-style new */}
      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', padding:'13px', marginTop:14 }}
        onClick={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}>
        <Icon name="plus" size={14}/> Nuevo análisis
      </button>
    </div>
  </PhoneShell>
  );
};

const MiniScore = ({ score, sev }) => {
  const color = sev==='hi' ? 'var(--red)' : sev==='mid' ? 'var(--amber)' : 'var(--green)';
  const r = 12, c = 2*Math.PI*r;
  return (
    <div style={{ width:30, height:30, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ position:'absolute', inset:0 }}>
        <circle cx="15" cy="15" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="2.5"/>
        <circle cx="15" cy="15" r={r} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${score/100*c} ${c}`} transform="rotate(-90 15 15)"/>
      </svg>
      <span className="num" style={{ fontSize:10.5, fontWeight:700, color }}>{score}</span>
    </div>
  );
};

// ===== Mobile History · empty =====
const LT_M_HistoryEmpty = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack={false}/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">Historial</div>
      <h1 className="display" style={{ fontSize:24, margin:'4px 0 4px', letterSpacing:-0.02 }}>Mis documentos</h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)' }}>Aún no has analizado nada.</div>

      <div className="card" style={{
        marginTop:20, padding:'32px 22px',
        background:'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)',
        border:'1.5px dashed var(--line-2)',
        textAlign:'center',
      }}>
        <div style={{ width:54, height:54, borderRadius:14, background:'#fff', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 16px -4px rgba(26,29,36,0.08)' }}>
          <Icon name="file" size={24} color="var(--accent)"/>
        </div>
        <h2 className="display" style={{ fontSize:18, margin:'14px 0 4px', letterSpacing:-0.015 }}>Sube tu primer documento</h2>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.5, maxWidth:240, margin:'0 auto' }}>
          Un crédito, contrato o cotización. En 2 minutos te decimos qué firmar.
        </div>
        <button className="btn btn-accent" style={{ marginTop:16, padding:'10px 16px', fontSize:13 }}
          onClick={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}>
          <Icon name="upload" size={13}/> Subir documento
        </button>
      </div>

      <div className="card-soft" style={{ marginTop:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
        onClick={() => { nav.set({ detectResult:'ready', fileName:'ejemplo-credito.pdf' }); nav.go('process'); }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
          <Icon name="sparkle" size={13} color="var(--accent)"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:700 }}>¿Sin documentos a mano?</div>
          <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>Prueba con un crédito de ejemplo.</div>
        </div>
        <Icon name="chevron-r" size={14} color="var(--ink-faint)"/>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Settings =====
const LT_M_Settings = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">Configuración</div>
      <h1 className="display" style={{ fontSize:24, margin:'4px 0 12px', letterSpacing:-0.02 }}>Tu cuenta</h1>

      {/* Profile card */}
      <div className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:13, fontWeight:600 }}>JR</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>Juan R.</div>
          <div style={{ fontSize:11.5, color:'var(--ink-faint)', fontFamily:'JetBrains Mono' }}>juan@gmail.com</div>
        </div>
        <Icon name="chevron-r" size={15} color="var(--ink-faint)"/>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        {[
          { ic:'globe', t:'Países y mercados', s:'Chile · + 2 referencias intl.' },
          { ic:'sparkle', t:'Plan y facturación', s:'Gratis · 3/1 docs este mes', tag:'sobre cupo' },
          { ic:'mail', t:'Notificaciones', s:'3 activas' },
          { ic:'shield', t:'Privacidad y datos', s:'PDFs se borran a las 72h' },
        ].map((row, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
              <Icon name={row.ic} size={14} color="var(--ink-soft)"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600 }}>{row.t}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>{row.s}</div>
            </div>
            {row.tag ? <span className="pill pill-amber" style={{ fontSize:10, padding:'2px 7px' }}>{row.tag}</span> : null}
            <Icon name="chevron-r" size={14} color="var(--ink-faint)"/>
          </div>
        ))}
      </div>

      <div className="card-soft" style={{ padding:'12px 16px' }}>
        <div className="label" style={{ fontSize:9.5 }}>Cuenta</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:8 }}>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>Ayuda y soporte</span>
          <span style={{ fontSize:13, color:'var(--ink-soft)' }}>Términos · Privacidad</span>
          <span style={{ fontSize:13, color:'var(--red)', marginTop:6, cursor:'pointer' }} onClick={() => nav.go('login')}>Cerrar sesión</span>
        </div>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Finding detail =====
const LT_M_FindingDetail = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack/>
    <div style={{ padding:'14px 22px' }}>
      <div style={{ fontSize:11, color:'var(--ink-faint)' }}>Cláusula 4.2 · pág. 3</div>
      <div style={{ display:'flex', gap:6, marginTop:8 }}>
        <span className="pill pill-red" style={{ fontSize:10 }}>Alto</span>
        <LensTag id="ley"/>
      </div>
      <h1 className="display" style={{ fontSize:22, margin:'12px 0 6px', letterSpacing:-0.02, lineHeight:1.15 }}>
        Plazo: 68 cuotas vs. 60 simuladas
      </h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.55 }}>
        El contrato suma 8 cuotas que no estaban en la simulación.
      </div>

      {/* Impact callout */}
      <div className="card" style={{ marginTop:14, padding:'14px 16px', background:'var(--accent-soft)', borderColor:'var(--accent)' }}>
        <div className="label" style={{ fontSize:9.5, color:'var(--accent)' }}>Impacto si lo arreglas</div>
        <div className="display num" style={{ fontSize:26, color:'var(--accent)', marginTop:6, lineHeight:1 }}>−$890.000</div>
        <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:6 }}>Costo total a lo largo del crédito</div>
      </div>

      {/* Clause text */}
      <div className="card" style={{ marginTop:12, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--line)' }}>
          <div className="label" style={{ fontSize:9.5 }}>Texto original</div>
        </div>
        <div style={{ padding:'12px 14px', fontSize:12.5, lineHeight:1.65, fontStyle:'italic', color:'var(--ink)' }}>
          "CUARTA · Plazo. El deudor pagará en <span style={{ background:'var(--red-soft)', color:'var(--red)', padding:'1px 5px', borderRadius:3, fontWeight:600 }}>sesenta y ocho (68) cuotas</span> mensuales… venciendo el último el <span style={{ background:'var(--amber-soft)', color:'var(--amber)', padding:'1px 5px', borderRadius:3, fontWeight:600 }}>14 de noviembre de 2030</span>."
        </div>
      </div>

      {/* Methodology */}
      <div className="card" style={{ marginTop:10, padding:'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Icon name="sparkle" size={13} color="var(--accent)"/>
          <h3 className="display" style={{ fontSize:13.5, margin:0 }}>Cómo lo evaluamos</h3>
        </div>
        <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:8, lineHeight:1.55 }}>
          Comparamos contra la simulación pre-contractual que el banco te entregó y las prácticas CMF de transparencia.
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14, marginBottom:14 }}>
        <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', padding:'12px' }}
          onClick={() => nav.go('email')}>
          <Icon name="mail" size={13}/> Negociar este punto
        </button>
        <button className="btn" style={{ width:'100%', justifyContent:'center' }}
          onClick={() => nav.notify('Marcado como aceptable')}>Marcar como aceptable</button>
      </div>
    </div>
  </PhoneShell>
  );
};

// ===== Mobile Share =====
const LT_M_Share = () => {
  const nav = useNav();
  return (
  <PhoneShell>
    <MTop onBack/>
    <div style={{ padding:'14px 22px' }}>
      <div className="label">Compartir</div>
      <h1 className="display" style={{ fontSize:22, margin:'4px 0 4px', letterSpacing:-0.02, lineHeight:1.15 }}>Compartir este análisis</h1>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.5 }}>
        Para que tu abogado o familia revise lo mismo que tú.
      </div>

      {/* Recipients */}
      <div className="card" style={{ marginTop:12, padding:'12px 14px' }}>
        <div className="label" style={{ fontSize:9.5 }}>Con quién</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          <span className="pill" style={{ background:'var(--accent-soft)', color:'var(--accent)', fontSize:11.5 }}>
            maria.lopez@gmail.com ×
          </span>
        </div>
        <div style={{ marginTop:8, padding:'7px 10px', border:'1px dashed var(--line-2)', borderRadius:7, fontSize:11.5, color:'var(--ink-faint)' }}>
          + agregar email…
        </div>
      </div>

      {/* Permissions */}
      <div className="card" style={{ marginTop:10, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--line)' }}>
          <div className="label" style={{ fontSize:9.5 }}>Permisos</div>
        </div>
        {[
          { id:'read', t:'Solo ver el análisis', on:true },
          { id:'comment', t:'Ver y comentar' },
          { id:'edit', t:'Co-editar · útil para abogados' },
        ].map((p, i) => (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
            <span style={{
              width:16, height:16, borderRadius:'50%',
              border: p.on ? '5px solid var(--accent)' : '1.5px solid var(--line-2)',
              background:'#fff', flex:'0 0 auto',
            }}/>
            <span style={{ fontSize:13, fontWeight: p.on ? 600 : 500 }}>{p.t}</span>
          </div>
        ))}
      </div>

      {/* Link */}
      <div className="card-soft" style={{ marginTop:10, padding:'10px 14px' }}>
        <div className="label" style={{ fontSize:9.5 }}>Link directo</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
          <span style={{ flex:1, fontFamily:'JetBrains Mono', fontSize:11.5, color:'var(--ink-soft)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>letra.cl/a/9b3f-revisar</span>
          <button className="btn btn-xs">Copiar</button>
        </div>
      </div>

      <button className="btn btn-accent" style={{ width:'100%', justifyContent:'center', padding:'12px', marginTop:14 }}
        onClick={() => { nav.notify('Compartido'); nav.go('coach'); }}>
        <Icon name="send" size={13}/> Enviar invitaciones
      </button>

      {/* Re-analyze */}
      <div className="card" style={{ marginTop:18, padding:'14px 16px', background:'linear-gradient(180deg, var(--paper-2) 0%, #fff 100%)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="sparkle" size={16} color="var(--accent)"/>
          <span style={{ fontSize:13, fontWeight:700, flex:1 }}>¿Mandaron nueva versión?</span>
        </div>
        <div style={{ fontSize:11.5, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>
          Súbela. Te marcamos solo lo que cambió.
        </div>
        <button className="btn btn-small" style={{ width:'100%', justifyContent:'center', marginTop:10 }}
          onClick={() => { nav.set({ detectResult:'ready', fileName:'contrato-v2.pdf' }); nav.go('upload'); }}>
          <Icon name="upload" size={12}/> Re-analizar
        </button>
      </div>
    </div>
  </PhoneShell>
  );
};

Object.assign(window, {
  LT_M_Welcome, LT_M_Upload, LT_M_Processing, LT_M_DetectReady,
  LT_M_Unsupported, LT_M_Failed, LT_M_Running, LT_M_Email,
  LT_M_Compare, LT_M_History, LT_M_HistoryEmpty, LT_M_Settings,
  LT_M_FindingDetail, LT_M_Share,
});
