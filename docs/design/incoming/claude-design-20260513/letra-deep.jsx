// letra. — Document detail (finding deep-dive) + Share / Re-analyze

// ===== Finding detail · drill into one criterion =====

// Findings dataset, expanded with full clause text + methodology + alternatives.
// Used both by the Email composer (already imports EMAIL_FINDINGS) and this detail view.
const DETAIL_FINDINGS = {
  plazo: {
    id:'plazo',
    title:'Plazo: 68 cuotas vs. 60 simuladas',
    sev:'hi', sevLabel:'Alto',
    lens:'ley',
    clauseRef:'Cláusula 4.2',
    docPage:'pág. 3',
    summary:'El contrato suma 8 cuotas que no estaban en la simulación inicial. La diferencia se traduce en intereses pagados durante 8 meses adicionales.',
    clauseFull:'CUARTA · Plazo. El deudor pagará el monto adeudado en sesenta y ocho (68) cuotas mensuales y sucesivas, venciendo la primera de ellas el día 14 de abril de 2025 y las restantes el mismo día de los meses subsiguientes. El último vencimiento será el día 14 de noviembre de 2030.',
    annotations: [
      { snippet:'sesenta y ocho (68) cuotas', note:'En la simulación pre-contractual el banco indicó 60 cuotas.', sev:'hi' },
      { snippet:'14 de noviembre de 2030', note:'8 meses después del final original.', sev:'mid' },
    ],
    methodology:{
      title:'Cómo lo evaluamos',
      body:'Comparamos el plazo del contrato firmado con (1) lo que aparece en la simulación pre-contractual del 8 de marzo de 2025 que el banco te entregó por email, y (2) las prácticas de plazo informado de la CMF — la simulación pre-contractual debe coincidir con el contrato salvo cambios expresamente acordados.',
      sources:[
        { label:'Simulación · 8 marzo 2025', kind:'doc' },
        { label:'CMF · Norma General N° 461 (transparencia)', kind:'norm' },
        { label:'Ley 19.496 · Art. 17 D', kind:'ley' },
      ],
    },
    impact:{
      label:'Si bajan a 60 cuotas',
      value:'−$890.000',
      sub:'Costo total CLP a lo largo del crédito',
    },
    alternatives:[
      { title:'Bajar a 60 cuotas', body:'Vuelve al plan original. La cuota mensual sube de $352k a $378k pero ahorras $890k totales.', delta:'−$890k' },
      { title:'Mantener 68 cuotas con tasa menor', body:'Negocia tasa: si baja 2 pts, el impacto del plazo extra se compensa.', delta:'−$420k' },
    ],
    inEmail: true,
  },
  cae: {
    id:'cae',
    title:'CAE: 24.8% — +4.2 pts sobre mercado',
    sev:'hi', sevLabel:'Alto',
    lens:'mercado',
    clauseRef:'Cláusula 3',
    docPage:'pág. 2',
    summary:'Tu CAE está 4.2 puntos sobre la mediana CMF para créditos de consumo de tu segmento de ingreso en marzo 2025.',
    clauseFull:'TERCERA · Tasa y CAE. La Carga Anual Equivalente (CAE) aplicable al presente crédito es de 24,8% anual. La tasa de interés nominal anual es de 18,4%, calculada sobre saldo insoluto.',
    annotations:[
      { snippet:'24,8% anual', note:'Mediana CMF marzo 2025 para tu segmento: 20.6% anual.', sev:'hi' },
    ],
    methodology:{
      title:'Cómo lo evaluamos',
      body:'Cruzamos tu CAE contra la base CMF de tasas mensuales publicadas, filtrando por tipo de producto (consumo), monto ($15-20M) y plazo (60-72 meses). Tomamos la mediana del segmento, no el promedio, para no inflar con outliers.',
      sources:[
        { label:'CMF · Tasas y comisiones · marzo 2025', kind:'norm' },
        { label:'7.402 contratos analizados en letra.', kind:'data' },
      ],
    },
    impact:{
      label:'Si igualan al mercado',
      value:'−$420.000',
      sub:'Diferencia frente a 20.6% CAE',
    },
    alternatives:[
      { title:'Pedir CAE de 20.6%', body:'El número mediano CMF. Justificable directamente con sus propios datos.', delta:'−$420k' },
      { title:'Pedir CAE de 22%', body:'Concesión intermedia. Útil si dicen que tu perfil tiene mayor riesgo.', delta:'−$210k' },
    ],
    inEmail: true,
  },
  seguro: {
    id:'seguro',
    title:'Seguro vinculado a la aseguradora del banco',
    sev:'mid', sevLabel:'Atención',
    lens:'ley',
    clauseRef:'Cláusula 9',
    docPage:'pág. 5',
    summary:'La cláusula obliga a contratar el seguro de desgravamen con Aseguradora Filial S.A., compañía vinculada al banco. El Art. 17 H Ley 19.496 te reconoce el derecho a elegir el proveedor.',
    clauseFull:'NOVENA · Seguro de desgravamen. El deudor contratará un seguro de desgravamen con Aseguradora Filial S.A., compañía vinculada al banco, por el monto total del crédito y vigente hasta el pago íntegro de la deuda. La prima mensual será descontada de la cuota.',
    annotations:[
      { snippet:'Aseguradora Filial S.A., compañía vinculada al banco', note:'El Art. 17 H Ley 19.496 te permite elegir tu propia aseguradora siempre que cumpla con los requisitos mínimos.', sev:'mid' },
    ],
    methodology:{
      title:'Cómo lo evaluamos',
      body:'Detectamos toda mención a aseguradoras vinculadas/filiales/del grupo del banco emisor, y la comparamos con tu derecho de elección bajo el Art. 17 H de la Ley del Consumidor. Si la cláusula impone proveedor, marcamos alerta.',
      sources:[
        { label:'Ley 19.496 · Art. 17 H', kind:'ley' },
        { label:'CMF · Circular 3.604 (seguros vinculados)', kind:'norm' },
      ],
    },
    impact:{
      label:'Con aseguradora externa',
      value:'−$90.000',
      sub:'Ahorro estimado en primas sobre el plazo del crédito',
    },
    alternatives:[
      { title:'Pedir cambio de aseguradora', body:'Modificar cláusula 9 para permitir aseguradora externa con cobertura mínima equivalente.', delta:'−$90k' },
      { title:'Cotizar prima con externa', body:'Cotiza con 3 aseguradoras y presenta la cotización al banco como contra-propuesta.', delta:'variable' },
    ],
    inEmail: true,
  },
};

const LT_FindingDetail = () => {
  const nav = useNav();
  const findingId = nav.state.findingId || 'plazo';
  const f = DETAIL_FINDINGS[findingId] ?? DETAIL_FINDINGS.plazo;
  const [inEmail, setInEmail] = React.useState(f.inEmail);
  const [showDispute, setShowDispute] = React.useState(false);

  // Render clause text with inline annotation highlights
  const renderClause = () => {
    let text = f.clauseFull;
    const parts = [];
    let cursor = 0;
    f.annotations.forEach((a, i) => {
      const idx = text.indexOf(a.snippet, cursor);
      if (idx < 0) return;
      if (idx > cursor) parts.push({ kind:'text', value:text.slice(cursor, idx) });
      parts.push({ kind:'mark', value:a.snippet, sev:a.sev, note:a.note, n:i+1 });
      cursor = idx + a.snippet.length;
    });
    if (cursor < text.length) parts.push({ kind:'text', value:text.slice(cursor) });
    return parts.map((p, i) => {
      if (p.kind === 'text') return <span key={i}>{p.value}</span>;
      const sevColor = p.sev === 'hi' ? 'var(--red)' : p.sev === 'mid' ? 'var(--amber)' : 'var(--green)';
      const sevBg    = p.sev === 'hi' ? 'var(--red-soft)' : p.sev === 'mid' ? 'var(--amber-soft)' : 'var(--green-soft)';
      return (
        <span key={i} style={{
          background: sevBg, color: sevColor, padding:'2px 6px', borderRadius:4, fontWeight:600,
          position:'relative', display:'inline',
        }} title={p.note}>
          <sup style={{ fontFamily:'JetBrains Mono', fontSize:9, marginRight:3, opacity:0.7 }}>{p.n}</sup>
          {p.value}
        </span>
      );
    });
  };

  return (
  <AppShell>
    <div style={{ padding:'24px 32px', maxWidth:1280, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12.5, color:'var(--ink-faint)' }}>
        <span style={{ cursor:'pointer' }} onClick={() => nav.go('coach')}>← Volver al análisis</span>
        <span>/</span>
        <span>{f.clauseRef}</span>
        <span>·</span>
        <span>{f.docPage}</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:16, flexWrap:'wrap' }}>
        <span className={`pill ${f.sev==='hi'?'pill-red':'pill-amber'}`} style={{ fontSize:11 }}>
          {f.sevLabel}
        </span>
        <LensTag id={f.lens}/>
        <span className="pill">{f.clauseRef}</span>
      </div>
      <h1 className="display" style={{ fontSize:34, margin:'12px 0 8px', letterSpacing:-0.025, lineHeight:1.1 }}>
        {f.title}
      </h1>
      <div style={{ fontSize:15, color:'var(--ink-soft)', maxWidth:780, lineHeight:1.55 }}>
        {f.summary}
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:24, marginTop:24 }}>
        {/* Left — clause + annotations */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:10 }}>
              <div className="label" style={{ fontSize:10.5 }}>Texto original</div>
              <span className="pill" style={{ fontSize:10.5 }}>{f.clauseRef}</span>
              <div style={{ flex:1 }}/>
              <button className="btn btn-xs btn-ghost" style={{ color:'var(--ink-faint)' }}
                onClick={() => nav.notify('Abriendo PDF en ' + f.docPage)}>
                Ver en el PDF original →
              </button>
            </div>
            <div style={{
              padding:'22px 24px',
              fontFamily:'Manrope', fontSize:14.5, lineHeight:1.75,
              color:'var(--ink)',
              background:'linear-gradient(transparent, transparent 27px, var(--paper-2) 27px, var(--paper-2) 28px)',
              backgroundSize:'100% 28px',
            }}>
              <span style={{ fontStyle:'italic' }}>"{renderClause()}"</span>
            </div>

            {/* Annotations */}
            {f.annotations.length > 0 ? (
              <div style={{ padding:'0 24px 18px' }}>
                <div className="label" style={{ fontSize:10.5, marginTop:14, marginBottom:8 }}>
                  {f.annotations.length} {f.annotations.length === 1 ? 'observación' : 'observaciones'}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {f.annotations.map((a, i) => (
                    <div key={i} className="card-soft" style={{ padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{
                        width:22, height:22, borderRadius:'50%', flex:'0 0 auto',
                        background: a.sev==='hi'?'var(--red-soft)':'var(--amber-soft)',
                        color: a.sev==='hi'?'var(--red)':'var(--amber)',
                        fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>{i+1}</span>
                      <div style={{ flex:1, fontSize:13, color:'var(--ink)', lineHeight:1.55 }}>
                        <span style={{ fontWeight:600 }}>"{a.snippet}"</span>
                        <span style={{ color:'var(--ink-soft)' }}> — {a.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Methodology */}
          <div className="card" style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="sparkle" size={16} color="var(--accent)"/>
              <h2 className="display" style={{ fontSize:16, margin:0, letterSpacing:-0.01 }}>{f.methodology.title}</h2>
            </div>
            <div style={{ fontSize:13.5, color:'var(--ink-soft)', marginTop:10, lineHeight:1.6 }}>
              {f.methodology.body}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
              {f.methodology.sources.map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12.5 }}>
                  <SourceIcon kind={s.kind}/>
                  <span style={{ flex:1, color:'var(--ink)' }}>{s.label}</span>
                  <span style={{ fontSize:11, color:'var(--ink-faint)', textDecoration:'underline', cursor:'pointer' }}>abrir</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — impact + alternatives + actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Impact */}
          <div className="card" style={{ padding:'18px 20px', background:'var(--accent-soft)', borderColor:'var(--accent)' }}>
            <div className="label" style={{ fontSize:10.5, color:'var(--accent)' }}>Impacto si lo arreglas</div>
            <div className="display num" style={{ fontSize:34, color:'var(--accent)', marginTop:6, lineHeight:1 }}>
              {f.impact.value}
            </div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:6 }}>{f.impact.sub}</div>
          </div>

          {/* Alternatives */}
          <div className="card" style={{ padding:'18px 20px' }}>
            <div className="label" style={{ fontSize:10.5 }}>Caminos para negociarlo</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
              {f.alternatives.map((alt, i) => (
                <div key={i} style={{ padding:'10px 12px', borderRadius:9, background:'var(--paper-2)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, flex:1 }}>{alt.title}</span>
                    <span className="num" style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>{alt.delta}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:4, lineHeight:1.5 }}>{alt.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ padding:'14px 20px' }}>
            <div className="label" style={{ fontSize:10.5 }}>Qué hago con esto</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, flex:1 }}>Incluir en el email al banco</span>
                <span style={{ cursor:'pointer' }} onClick={() => { setInEmail(v => !v); nav.notify(inEmail ? 'Quitado del email' : 'Incluido en el email'); }}>
                  <Toggle on={inEmail}/>
                </span>
              </div>
              <button className="btn btn-small" style={{ justifyContent:'center' }}
                onClick={() => setShowDispute(true)}>
                Marcar como aceptable
              </button>
              <button className="btn btn-small btn-accent" style={{ justifyContent:'center' }}
                onClick={() => nav.go('email')}>
                <Icon name="mail" size={13}/> Ir al composer del email
              </button>
            </div>
          </div>

          {/* Other findings nav */}
          <div className="card-soft" style={{ padding:'12px 16px' }}>
            <div className="label" style={{ fontSize:10.5, marginBottom:8 }}>Otros hallazgos</div>
            {Object.values(DETAIL_FINDINGS).filter(o => o.id !== f.id).map(o => (
              <div key={o.id} onClick={() => nav.set({ findingId: o.id })} style={{
                padding:'8px 0', display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                borderTop:'1px solid var(--line)',
              }}>
                <span style={{
                  width:7, height:7, borderRadius:'50%', flex:'0 0 auto',
                  background: o.sev==='hi'?'var(--red)':'var(--amber)',
                }}/>
                <span style={{ fontSize:12.5, fontWeight:600, flex:1 }}>{o.title.split(':')[0]}</span>
                <Icon name="chevron-r" size={13} color="var(--ink-faint)"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispute modal */}
      {showDispute ? (
        <div style={{
          position:'fixed', inset:0, background:'rgba(26,29,36,0.5)', zIndex:200,
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'fadeBg .15s ease-out',
        }} onClick={() => setShowDispute(false)}>
          <div className="card" style={{ width:520, padding:'22px 26px', background:'#fff' }} onClick={e => e.stopPropagation()}>
            <h3 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>¿Por qué lo marcas como aceptable?</h3>
            <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:6 }}>
              Nos ayuda a mejorar el análisis para otros casos similares.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}>
              {[
                'Lo hablé con el banco y queda explicado',
                'Sabía del cambio antes de firmar',
                'No me importa esa diferencia',
                'El análisis está equivocado · disputar',
              ].map((r) => (
                <button key={r} className="btn btn-small" style={{ justifyContent:'flex-start' }}
                  onClick={() => { setShowDispute(false); nav.notify('Marcado como aceptable'); }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
              <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-faint)' }}
                onClick={() => setShowDispute(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`@keyframes fadeBg { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  </AppShell>
  );
};

const SourceIcon = ({ kind }) => {
  const map = {
    doc:  { ic:'file',    color:'var(--ink-soft)' },
    norm: { ic:'scale',   color:'#3b4a6b' },
    ley:  { ic:'scale',   color:'#3b4a6b' },
    data: { ic:'chart',   color:'var(--accent)' },
  };
  const m = map[kind] ?? map.doc;
  return (
    <span style={{ width:22, height:22, borderRadius:5, background:'var(--paper-2)', display:'inline-flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
      <Icon name={m.ic} size={13} color={m.color}/>
    </span>
  );
};

// ===== Share · Compartir análisis + Re-analizar =====
const LT_Share = () => {
  const nav = useNav();
  const [recipients, setRecipients] = React.useState(['maria.lopez@gmail.com']);
  const [permission, setPermission] = React.useState('read');
  const [includeOriginal, setIncludeOriginal] = React.useState(false);
  const [includeEmail, setIncludeEmail] = React.useState(true);
  const [newEmail, setNewEmail] = React.useState('');
  const linkRef = React.useRef(null);

  const addRecipient = () => {
    if (!newEmail.includes('@')) return;
    setRecipients(r => [...r, newEmail]);
    setNewEmail('');
  };
  const removeRecipient = (e) => setRecipients(r => r.filter(x => x !== e));

  return (
  <AppShell>
    <div style={{ padding:'24px 32px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12.5, color:'var(--ink-faint)' }}>
        <span style={{ cursor:'pointer' }} onClick={() => nav.go('coach')}>← Volver al análisis</span>
      </div>
      <h1 className="display" style={{ fontSize:30, margin:'12px 0 6px', letterSpacing:-0.025 }}>Compartir este análisis</h1>
      <div style={{ fontSize:14, color:'var(--ink-soft)' }}>
        Para que tu abogado, tu pareja, o quien te asesora pueda revisar lo mismo que estás viendo tú.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:24, marginTop:24 }}>
        {/* Main share form */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Recipients */}
          <div className="card" style={{ padding:'18px 22px' }}>
            <div className="label">Con quién</div>
            <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:8 }}>
              {recipients.map(r => (
                <span key={r} className="pill" style={{ fontSize:12, padding:'5px 12px', background:'var(--accent-soft)', color:'var(--accent)' }}>
                  <span style={{ marginRight:4 }}>{r}</span>
                  <span style={{ cursor:'pointer', fontWeight:700 }} onClick={() => removeRecipient(r)}>×</span>
                </span>
              ))}
              <input
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addRecipient(); }}
                placeholder="agregar email…"
                style={{
                  border:'none', outline:'none',
                  fontFamily:'Manrope', fontSize:13,
                  padding:'5px 4px', minWidth:180,
                  background:'transparent',
                }}/>
            </div>
            <div style={{ marginTop:14, display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="btn btn-xs" onClick={() => setRecipients(r => Array.from(new Set([...r, 'abogada@estudio.cl'])))}>
                + abogada
              </button>
              <button className="btn btn-xs" onClick={() => setRecipients(r => Array.from(new Set([...r, 'familia@gmail.com'])))}>
                + familia
              </button>
              <button className="btn btn-xs" onClick={() => setRecipients(r => Array.from(new Set([...r, 'asesor@ejemplo.cl'])))}>
                + asesor
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 22px', borderBottom:'1px solid var(--line)' }}>
              <div className="label">Permisos</div>
            </div>
            {[
              { id:'read', label:'Solo ver el análisis', sub:'Pueden leer hallazgos y cláusulas. No editan nada.' },
              { id:'comment', label:'Ver y comentar', sub:'Pueden dejar notas en cada hallazgo. No firman emails.' },
              { id:'edit', label:'Co-editar', sub:'Pueden activar/apagar hallazgos y editar el email. Útil para abogados.' },
            ].map((p, i) => {
              const on = permission === p.id;
              return (
                <div key={p.id}
                  onClick={() => setPermission(p.id)}
                  style={{
                    display:'flex', gap:14, alignItems:'flex-start',
                    padding:'14px 22px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                    cursor:'pointer',
                    background: on ? 'var(--paper-2)' : 'transparent',
                  }}>
                  <span style={{
                    width:18, height:18, borderRadius:'50%', flex:'0 0 auto', marginTop:2,
                    border: on ? '5.5px solid var(--accent)' : '1.5px solid var(--line-2)',
                    background:'#fff',
                  }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{p.label}</div>
                    <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3, lineHeight:1.5 }}>{p.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Include options */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 22px', borderBottom:'1px solid var(--line)' }}>
              <div className="label">Qué incluir</div>
            </div>
            <div style={{ padding:'14px 22px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
              onClick={() => setIncludeOriginal(v => !v)}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>El PDF original del contrato</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3 }}>contrato.pdf · 412 KB · expira a las 72h</div>
              </div>
              <Toggle on={includeOriginal} size={28}/>
            </div>
            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--line)', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
              onClick={() => setIncludeEmail(v => !v)}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>El borrador del email al banco</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3 }}>Para que lo revisen antes de enviarlo.</div>
              </div>
              <Toggle on={includeEmail} size={28}/>
            </div>
          </div>

          {/* Link */}
          <div className="card-soft" style={{ padding:'14px 18px' }}>
            <div className="label" style={{ fontSize:10.5 }}>Link directo · sin email</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
              <input readOnly ref={linkRef}
                value="https://letra.cl/a/9b3f-revisar"
                style={{
                  flex:1, padding:'8px 12px',
                  background:'#fff', border:'1px solid var(--line)', borderRadius:8,
                  fontFamily:'JetBrains Mono', fontSize:12, color:'var(--ink-soft)',
                }}/>
              <button className="btn btn-small" onClick={() => {
                linkRef.current?.select();
                nav.notify('Link copiado · expira en 7 días');
              }}>Copiar link</button>
            </div>
            <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:8 }}>
              Quien tenga el link verá el análisis con los permisos elegidos arriba. Expira a los 7 días.
            </div>
          </div>
        </div>

        {/* Right — preview + actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Preview */}
          <div className="card" style={{ padding:'18px 20px' }}>
            <div className="label" style={{ fontSize:10.5, marginBottom:12 }}>Esto es lo que recibirán</div>
            <div style={{ border:'1px solid var(--line)', borderRadius:10, padding:'14px 16px', background:'var(--paper)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Logo size={14}/>
              </div>
              <div style={{ fontSize:13, color:'var(--ink-soft)', lineHeight:1.5 }}>
                Juan R. te invitó a revisar el análisis de su crédito en <b>BancoPlaceholder</b>.
              </div>
              <div style={{ marginTop:12, padding:'10px 12px', background:'var(--red-soft)', borderRadius:8, fontSize:12, color:'var(--red)' }}>
                <b>$1.4M de más</b> en el costo total · 4 hallazgos
              </div>
              <div style={{ marginTop:10, fontSize:11.5, color:'var(--ink-faint)' }}>
                {recipients.length} {recipients.length === 1 ? 'destinatario' : 'destinatarios'} · permisos: <b>{permission === 'read' ? 'solo ver' : permission === 'comment' ? 'ver y comentar' : 'co-editar'}</b>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card" style={{ padding:'14px 20px' }}>
            <div className="label" style={{ fontSize:10.5, marginBottom:12 }}>Actividad reciente</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.55 }}>
              Aún nadie ha visto este análisis.
            </div>
          </div>

          {/* Submit */}
          <button className="btn btn-accent" style={{ justifyContent:'center', padding:'12px 18px' }}
            onClick={() => { nav.notify('Compartido con ' + recipients.length + ' personas'); nav.go('coach'); }}>
            <Icon name="send" size={14}/> Enviar invitaciones
          </button>
        </div>
      </div>

      {/* Re-analyze callout */}
      <div className="card" style={{ marginTop:32, padding:'22px 28px', background:'linear-gradient(180deg, var(--paper-2) 0%, var(--paper) 100%)', borderColor:'var(--line)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
          <div style={{ width:46, height:46, borderRadius:11, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px -4px rgba(26,29,36,0.1)' }}>
            <Icon name="sparkle" size={22} color="var(--accent)"/>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <h3 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>¿El banco te mandó una nueva versión?</h3>
            <div style={{ fontSize:13.5, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>
              Súbela y la comparamos contra el análisis original. Te marcamos solo lo que cambió.
            </div>
          </div>
          <button className="btn" onClick={() => { nav.set({ detectResult:'ready', fileName:'contrato-v2.pdf' }); nav.go('upload'); }}>
            <Icon name="upload" size={14}/> Re-analizar con la nueva versión
          </button>
        </div>
      </div>
    </div>
  </AppShell>
  );
};

Object.assign(window, { LT_FindingDetail, LT_Share, DETAIL_FINDINGS });
