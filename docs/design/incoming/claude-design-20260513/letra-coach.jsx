// letra. — Coach dashboard (the main analysis screen)

const LT_BarRow = ({ label, you, market, sev, unit='%' }) => {
  const max = Math.max(you, market) * 1.18;
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : 'var(--amber)';
  const cls = sev==='hi' ? 'pill-red' : sev==='ok' ? 'pill-green' : 'pill-amber';
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
        <span style={{ fontSize:14, fontWeight:600 }}>{label}</span>
        <span className={`pill ${cls}`} style={{ fontSize:11 }}>
          {you > market ? '+' : ''}{(you-market).toFixed(1)} pts vs. mercado
        </span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="label" style={{ width:54, fontSize:10 }}>Tú</span>
          <div style={{ flex:1, height:9, background:'var(--paper-2)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ width:`${you/max*100}%`, height:'100%', background: color, borderRadius:5 }}/>
          </div>
          <span className="num" style={{ fontSize:13, width:50, textAlign:'right' }}>{you}{unit}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="label" style={{ width:54, fontSize:10 }}>Mercado</span>
          <div style={{ flex:1, height:9, background:'var(--paper-2)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ink-soft)', borderRadius:5 }}/>
          </div>
          <span className="num" style={{ fontSize:13, width:50, textAlign:'right' }}>{market}{unit}</span>
        </div>
      </div>
    </div>
  );
};

const ActionItem = ({ n, sev, title, body, savings, clause, lenses=[], findingId }) => {
  const nav = useNav();
  const color = sev==='hi' ? 'var(--red)' : 'var(--amber)';
  const bg = sev==='hi' ? 'var(--red-soft)' : 'var(--amber-soft)';
  const goToDetail = findingId ? () => { nav.set({ findingId }); nav.go('detail'); } : null;
  return (
    <div className="card" style={{
      padding:'14px 16px', marginTop:10,
      cursor: goToDetail ? 'pointer' : 'default',
      transition: 'transform .08s, box-shadow .15s',
    }}
    onClick={goToDetail || undefined}
    onMouseEnter={goToDetail ? (e) => { e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(26,29,36,0.15)'; } : undefined}
    onMouseLeave={goToDetail ? (e) => { e.currentTarget.style.boxShadow = 'none'; } : undefined}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{
          width:24, height:24, borderRadius:'50%', background: bg, color,
          fontFamily:'JetBrains Mono', fontSize:12, fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto',
        }}>{n}</span>
        <span style={{ fontSize:14.5, fontWeight:700, letterSpacing:-0.01, flex:1 }}>{title}</span>
        {savings ? <span className="num" style={{ fontSize:13.5, color:'var(--green)', fontWeight:600 }}>{savings}</span> : null}
        {goToDetail ? <Icon name="chevron-r" size={14} color="var(--ink-faint)"/> : null}
      </div>
      {lenses.length ? (
        <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:34, marginTop:8, flexWrap:'wrap' }}>
          <span className="label" style={{ fontSize:9.5 }}>argumentado por</span>
          {lenses.map(id => <LensTag key={id} id={id}/>)}
        </div>
      ) : null}
      <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.55, paddingLeft:34, marginTop:lenses.length?8:6 }}>
        {body}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:34, marginTop:8 }}>
        <span className="pill" style={{ fontSize:10.5 }}>{clause}</span>
        <button className="btn btn-xs btn-ghost" style={{ color:'var(--ink-soft)', padding:'3px 6px' }}>
          Ver cláusula <Icon name="chevron-r" size={11}/>
        </button>
      </div>
    </div>
  );
};

const IntlRefCard = ({ tag, body, note }) => (
  <div className="card-soft" style={{ padding:'14px 16px', flex:1 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
      <span className="label" style={{ color:'var(--accent)', fontSize:10 }}>{tag}</span>
    </div>
    <div style={{ fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.55 }}>{body}</div>
    {note ? <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:6, fontStyle:'italic' }}>{note}</div> : null}
  </div>
);

// ===== Coach dashboard =====
const LT_Coach = () => {
  const nav = useNav();
  const tw = (window.useLetraTweaks ? window.useLetraTweaks() : { showIntl: true });
  return (
  <AppShell activeNav="Análisis" rightExtra={
    nav.interactive ? null : (
    <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-faint)' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }}/>
      Guardado hace 2 min
    </span>
    )
  }>
    {/* Header strip */}
    <div style={{ padding:'28px 32px 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <DocBadge />
        <span className="pill"><span className="dot-sm" style={{ background:'var(--accent)' }}/> Análisis completo</span>
        <span className="pill">11 criterios</span>
        <span className="pill pill-red">4 hallazgos</span>
        <div style={{ flex:1 }}/>
        <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.go('plan')}>← Volver al plan</button>
      </div>

      <h1 className="display" style={{ fontSize:34, margin:0, letterSpacing:-0.025, lineHeight:1.08 }}>
        Estás pagando <span style={{ color:'var(--red)' }}>$1.4M de más</span> por este crédito.
      </h1>
      <div style={{ fontSize:14, color:'var(--ink-soft)', marginTop:8 }}>
        contrato.pdf · BancoPlaceholder · 14 mar 2025 · revisado contra estándares CMF y Ley 19.496
      </div>
    </div>

    {/* Stats */}
    <div style={{ padding:'20px 32px 0', display:'flex', gap:14 }}>
      <StatCard label="Monto" value="$18.0M" sub="solicitado"/>
      <StatCard label="Cuotas" value="68" delta="+8" sev="hi" sub="vs. 60 simuladas"/>
      <StatCard label="CAE" value="24.8%" delta="+4.2 pts" sev="hi" sub="vs. mercado"/>
      <StatCard label="Costo total" value="$23.9M" delta="+$1.4M" sev="hi" sub="vs. esperado"/>
    </div>

    {/* Lens scorecard — strength/weakness by analytical perspective */}
    <div style={{ padding:'22px 32px 0' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
        <h2 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>Tu documento por perspectiva</h2>
        <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>4 lentes · 11 criterios revisados</span>
      </div>
      <LensScorecard cards={[
        { lens:'ley',      status:'strong',    headline:'Cumple', summary:'No hay cláusulas abusivas según el Art. 16 Ley 19.496.', count:'5 / 5 criterios OK' },
        { lens:'mercado',  status:'weak',      headline:'Sobre el promedio', summary:'CAE +4.2 pts y tasa +2.5 pts sobre la mediana CMF para tu perfil.', count:'2 / 4 con alerta' },
        { lens:'comparar', status:'weak',      headline:'−$1.2M peor', summary:'Frente al crédito de María: 8 cuotas más y 5.4 pts más de CAE.', count:'5 diferencias clave' },
        ...(tw.showIntl ? [{ lens:'intl', status:'ref', headline:'3 observaciones', summary:'Bajo CFPB el cambio de plazo podría ser práctica engañosa. No genera alertas.', count:'solo referencia' }] : []),
      ]}/>
    </div>

    {/* Main */}
    <div style={{ padding:'20px 32px 0', display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:18 }}>
      {/* Benchmark */}
      <SectionCard
        title={<span>Comparado con el mercado <LensTag id="mercado"/></span>}
        right={<span style={{ fontSize:11, color:'var(--ink-faint)' }}>Datos CMF · marzo 2025</span>}
      >
        <LT_BarRow label="CAE" you={24.8} market={20.6} sev="hi"/>
        <LT_BarRow label="Tasa de interés" you={18.4} market={15.9} sev="hi"/>
        <LT_BarRow label="Comisión inicial" you={2.1} market={1.4} sev="mid"/>
      </SectionCard>

      {/* Plan of action */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingLeft:4 }}>
          <h2 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>Qué hacer ahora</h2>
          <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>
            Ahorro potencial · <span className="num" style={{ color:'var(--green)', fontWeight:600 }}>$1.7M</span>
          </span>
        </div>

        {/* Lens filter chips */}
        <div style={{ display:'flex', gap:6, paddingLeft:4, marginTop:10, flexWrap:'wrap' }}>
          <span style={{ padding:'4px 10px', borderRadius:7, background:'var(--ink)', color:'var(--paper)', fontSize:11, fontWeight:600 }}>Todas · 3</span>
          <span style={{ padding:'4px 10px', borderRadius:7, background:'#fff', border:'1px solid var(--line)', fontSize:11, color:'var(--ink-soft)', cursor:'pointer' }}><Icon name="scale" size={11}/> Ley · 1</span>
          <span style={{ padding:'4px 10px', borderRadius:7, background:'#fff', border:'1px solid var(--line)', fontSize:11, color:'var(--ink-soft)', cursor:'pointer' }}><Icon name="chart" size={11}/> Mercado · 2</span>
          <span style={{ padding:'4px 10px', borderRadius:7, background:'#fff', border:'1px solid var(--line)', fontSize:11, color:'var(--ink-soft)', cursor:'pointer' }}><Icon name="compare" size={11}/> vs. otras · 2</span>
        </div>

        <ActionItem n="1" sev="hi" title="Cotiza con 2 bancos más" savings="−$1.1M"
          findingId="cae"
          lenses={['mercado','comparar']}
          body="Con tu perfil crediticio es razonable apuntar a una CAE cerca de 20%. Hoy estás 4.2 puntos por sobre la mediana, y María consiguió 19.4% en otro banco."
          clause="Sustenta: Cl. 3 + benchmark CMF"/>
        <ActionItem n="2" sev="hi" title="Pregunta por las 8 cuotas extra" savings="−$300k"
          findingId="plazo"
          lenses={['ley','comparar']}
          body="Tienes argumento legal si la simulación inicial decía 60 (Art. 17 B Ley 19.496). María firmó por 60 cuotas en otro banco — es factible."
          clause="Sustenta: Cl. 4.2 + Ley 19.496"/>
        <ActionItem n="3" sev="mid" title="Cambia el seguro a una externa" savings="−$320k"
          findingId="seguro"
          lenses={['ley','mercado']}
          body="El Art. 17 H Ley 19.496 te permite contratarlo con otra compañía. Hay aseguradoras externas con prima 30% menor."
          clause="Sustenta: Cl. 9 + Art. 17 H"/>
      </div>
    </div>

    {/* International context */}
    {tw.showIntl ? (
    <div style={{ padding:'20px 32px 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <Icon name="globe" size={16} color="var(--ink-soft)"/>
        <h3 className="display" style={{ fontSize:14, margin:0, letterSpacing:-0.005 }}>Contexto internacional</h3>
        <span className="pill" style={{ fontSize:10.5 }}>solo referencia · no genera alertas</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:11, color:'var(--ink-faint)' }}>¿Por qué? <span style={{ textDecoration:'underline' }}>Saber más</span></span>
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <IntlRefCard tag="FCRA · EE.UU." body="Te exigiría notificarte del uso de tu informe crediticio. En Chile no es obligatorio."/>
        <IntlRefCard tag="CFPB · UDAAP"  body="El cambio de 60 a 68 cuotas podría considerarse práctica engañosa bajo este estándar."/>
        <IntlRefCard tag="UE · CCD-ESIS" body="Existiría una tabla estándar de una página con todos los costos. En Chile no existe equivalente."/>
      </div>
    </div>
    ) : null}

    {/* Bottom action bar */}
    <div style={{
      position:'sticky', bottom:0, marginTop:24,
      padding:'14px 32px',
      borderTop:'1px solid var(--line)',
      background:'rgba(250,250,247,0.95)',
      backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', gap:10,
    }}>
      <span style={{ fontSize:12, color:'var(--ink-faint)' }}>
        Análisis terminado · 14:23 · te llevará 5 minutos revisar todo
      </span>
      <div style={{ flex:1 }}/>
      <button className="btn" onClick={() => nav.notify('PDF generado · revisa tus descargas')}><Icon name="file" size={14}/> Exportar PDF</button>
      <button className="btn" onClick={() => nav.go('compare')}><Icon name="compare" size={14}/> Comparar</button>
      <button className="btn" onClick={() => nav.go('share')}><Icon name="send" size={14}/> Compartir</button>
      <button className="btn btn-accent" onClick={() => nav.go('email')}><Icon name="mail" size={14}/> Redactar email al banco</button>
    </div>
  </AppShell>
  );
};

Object.assign(window, { LT_Coach, LT_BarRow, ActionItem, IntlRefCard });
