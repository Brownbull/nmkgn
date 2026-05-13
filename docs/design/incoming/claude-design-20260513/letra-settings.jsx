// letra. — Settings / account screens

const SETTINGS_SECTIONS = [
  { id:'profile',    label:'Perfil',                icon:'briefcase' },
  { id:'markets',    label:'Países y mercados',     icon:'globe' },
  { id:'plan',       label:'Plan y facturación',    icon:'sparkle' },
  { id:'notifs',     label:'Notificaciones',        icon:'mail' },
  { id:'privacy',    label:'Privacidad y datos',    icon:'shield' },
];

const LT_Settings = () => {
  const nav = useNav();
  const [section, setSection] = React.useState('profile');

  return (
  <AppShell activeNav="Configuración">
    <div style={{ padding:'28px 32px', display:'grid', gridTemplateColumns:'260px 1fr', gap:28, maxWidth:1280, margin:'0 auto' }}>
      {/* Sidebar */}
      <div>
        <div className="label">Configuración</div>
        <h1 className="display" style={{ fontSize:24, margin:'6px 0 18px', letterSpacing:-0.02 }}>Tu cuenta</h1>

        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {SETTINGS_SECTIONS.map(s => {
            const on = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px',
                borderRadius:9,
                background: on ? 'var(--paper-2)' : 'transparent',
                border:'none', cursor:'pointer',
                textAlign:'left', fontFamily:'Manrope',
                color: on ? 'var(--ink)' : 'var(--ink-soft)',
                fontSize:13.5, fontWeight: on ? 600 : 500,
                transition:'background .15s',
              }}>
                <Icon name={s.icon} size={15} color={on ? 'var(--accent)' : 'var(--ink-soft)'}/>
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="card-soft" style={{ marginTop:18, padding:'12px 14px' }}>
          <div className="label" style={{ fontSize:9.5 }}>Conectado como</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--paper-3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600 }}>JR</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Juan R.</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)' }}>juan@gmail.com</div>
            </div>
          </div>
          <button className="btn btn-xs btn-ghost" style={{ marginTop:10, color:'var(--ink-faint)', padding:0 }}
            onClick={() => nav.go('login')}>
            Cerrar sesión →
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ minWidth:0 }}>
        {section === 'profile'  ? <SectionProfile/>  : null}
        {section === 'markets'  ? <SectionMarkets/>  : null}
        {section === 'plan'     ? <SectionPlan/>     : null}
        {section === 'notifs'   ? <SectionNotifs/>   : null}
        {section === 'privacy'  ? <SectionPrivacy/>  : null}
      </div>
    </div>
  </AppShell>
  );
};

// ===== Section wrappers =====
const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom:18 }}>
    <h2 className="display" style={{ fontSize:24, margin:0, letterSpacing:-0.02 }}>{title}</h2>
    {sub ? <div style={{ fontSize:13.5, color:'var(--ink-soft)', marginTop:4, maxWidth:560 }}>{sub}</div> : null}
  </div>
);

const SettingRow = ({ label, sub, right, children }) => (
  <div style={{
    display:'flex', alignItems: children ? 'flex-start' : 'center', gap:18,
    padding:'16px 20px',
    borderTop:'1px solid var(--line)',
  }}>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:13.5, fontWeight:600 }}>{label}</div>
      {sub ? <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4, lineHeight:1.5 }}>{sub}</div> : null}
      {children}
    </div>
    {right}
  </div>
);

// ===== 1. Perfil =====
const SectionProfile = () => {
  const nav = useNav();
  const [name, setName] = React.useState('Juan R.');
  const [income, setIncome] = React.useState('1m-2m');
  const [age, setAge] = React.useState('30-45');
  const [employment, setEmployment] = React.useState('indefinido');
  return (
    <>
      <SectionHead
        title="Perfil"
        sub="Lo usamos para comparar tu documento contra documentos de personas con perfil similar — nunca lo compartimos."/>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <SettingRow label="Nombre" right={
          <input value={name} onChange={e => setName(e.target.value)} style={{
            width:200, padding:'8px 12px', border:'1px solid var(--line)', borderRadius:8,
            fontFamily:'Manrope', fontSize:13.5,
          }}/>
        } />
        <SettingRow label="Email" sub="Conectado vía Google · no se puede cambiar aquí" right={
          <span style={{ fontSize:13, color:'var(--ink-soft)', fontFamily:'JetBrains Mono' }}>juan@gmail.com</span>
        } />
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 12px', letterSpacing:-0.01 }}>Perfil económico</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <SettingRow label="Ingreso mensual aproximado" sub="Usado para comparar la CAE contra tu segmento CMF" />
        <div style={{ padding:'0 20px 16px', display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['lt-500k','< $500k'],
            ['500k-1m','$500k – $1M'],
            ['1m-2m','$1M – $2M'],
            ['2m-4m','$2M – $4M'],
            ['gt-4m','> $4M'],
          ].map(([id,label]) => (
            <SegBtn key={id} on={income===id} onClick={()=>setIncome(id)}>{label}</SegBtn>
          ))}
        </div>

        <SettingRow label="Edad" />
        <div style={{ padding:'0 20px 16px', display:'flex', gap:8, flexWrap:'wrap' }}>
          {['18-30','30-45','45-60','60+'].map(id => (
            <SegBtn key={id} on={age===id} onClick={()=>setAge(id)}>{id}</SegBtn>
          ))}
        </div>

        <SettingRow label="Tipo de empleo" />
        <div style={{ padding:'0 20px 18px', display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['indefinido','Contrato indefinido'],
            ['plazo','Plazo fijo'],
            ['independiente','Independiente / honorarios'],
            ['jubilado','Jubilado'],
            ['otro','Otro'],
          ].map(([id,label]) => (
            <SegBtn key={id} on={employment===id} onClick={()=>setEmployment(id)}>{label}</SegBtn>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18, gap:10 }}>
        <button className="btn">Descartar cambios</button>
        <button className="btn btn-accent" onClick={() => nav.notify('Perfil actualizado')}>Guardar cambios</button>
      </div>
    </>
  );
};

const SegBtn = ({ on, onClick, children }) => (
  <button onClick={onClick} className="btn btn-small" style={{
    background: on ? 'var(--ink)' : '#fff',
    color: on ? 'var(--paper)' : 'var(--ink)',
    borderColor: on ? 'var(--ink)' : 'var(--line)',
  }}>{children}</button>
);

// ===== 2. Países y mercados =====
const SectionMarkets = () => {
  const nav = useNav();
  const [primary, setPrimary] = React.useState('cl');
  const [refs, setRefs] = React.useState(new Set(['us','eu']));
  const toggleRef = (id) => setRefs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const COUNTRIES = [
    { id:'cl', flag:'🇨🇱', name:'Chile',     status:'live',    sub:'CMF · Ley 19.496 · 5.412 docs analizados' },
    { id:'mx', flag:'🇲🇽', name:'México',    status:'preview', sub:'CONDUSEF · LFPC · 240 docs' },
    { id:'co', flag:'🇨🇴', name:'Colombia',  status:'preview', sub:'SFC · Ley 1480 · pronto' },
    { id:'pe', flag:'🇵🇪', name:'Perú',      status:'soon',    sub:'SBS · próximamente' },
    { id:'ar', flag:'🇦🇷', name:'Argentina', status:'soon',    sub:'BCRA · próximamente' },
  ];
  const REFS = [
    { id:'us', name:'Estados Unidos · CFPB / FCRA', sub:'Solo referencia internacional' },
    { id:'eu', name:'Unión Europea · CRD IV',       sub:'Solo referencia internacional' },
    { id:'uk', name:'Reino Unido · FCA',            sub:'Solo referencia internacional' },
  ];

  return (
    <>
      <SectionHead
        title="Países y mercados"
        sub="Define dónde estás — analizamos tu documento contra esa regulación y benchmark. Las referencias internacionales nunca activan alertas, solo dan contexto."/>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:10, background:'var(--paper)' }}>
          <Icon name="globe" size={18} color="var(--accent)"/>
          <span style={{ fontSize:14, fontWeight:700 }}>País principal</span>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>Solo uno · define qué ley aplica</span>
        </div>
        {COUNTRIES.map((c,i) => {
          const isSelected = primary === c.id;
          const disabled = c.status === 'soon';
          return (
            <div key={c.id}
              onClick={() => { if (!disabled) setPrimary(c.id); }}
              style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'14px 20px',
                borderTop:'1px solid var(--line)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                background: isSelected ? 'var(--accent-soft)' : 'transparent',
                transition:'background .15s',
              }}>
              <span style={{ fontSize:22, lineHeight:1 }}>{c.flag}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                  {c.name}
                  {c.status === 'preview' ? <span className="pill pill-amber" style={{ fontSize:10 }}>preview</span> : null}
                  {c.status === 'soon' ? <span className="pill" style={{ fontSize:10 }}>pronto</span> : null}
                </div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:2 }}>{c.sub}</div>
              </div>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                border: isSelected ? '5.5px solid var(--accent)' : '1.5px solid var(--line-2)',
                background:'#fff',
              }}/>
            </div>
          );
        })}
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 12px', letterSpacing:-0.01 }}>Referencias internacionales</h3>
      <div className="card-soft" style={{ padding:'12px 16px', fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.55, marginBottom:10 }}>
        <Icon name="sparkle" size={12} color="var(--accent)"/> Aparecen como contexto al final del análisis. <b>Nunca</b> generan alertas — las costumbres internacionales no son ley acá.
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {REFS.map((r,i) => {
          const on = refs.has(r.id);
          return (
            <div key={r.id} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'14px 20px',
              borderTop: i===0 ? 'none' : '1px solid var(--line)',
              cursor:'pointer',
            }} onClick={() => toggleRef(r.id)}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{r.name}</div>
                <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:2 }}>{r.sub}</div>
              </div>
              <Toggle on={on} size={28}/>
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <button className="btn btn-accent" onClick={() => nav.notify('Países y referencias actualizados')}>Guardar cambios</button>
      </div>
    </>
  );
};

// ===== 3. Plan y facturación =====
const SectionPlan = () => {
  const nav = useNav();
  return (
    <>
      <SectionHead
        title="Plan y facturación"
        sub="Sin tarjeta para empezar. Subes a un plan pagado solo si lo necesitas — y puedes bajar cuando quieras."/>

      {/* Current plan */}
      <div className="card" style={{ padding:'18px 22px', background:'var(--accent-soft)', borderColor:'var(--accent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span className="pill pill-accent" style={{ fontSize:10.5 }}>Plan actual</span>
          <span style={{ fontSize:18, fontWeight:700 }}>Gratis</span>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>1 documento por mes</span>
        </div>
        <div style={{ marginTop:14, display:'flex', alignItems:'baseline', gap:14 }}>
          <div style={{ flex:1 }}>
            <div className="num" style={{ fontSize:26, fontWeight:700 }}>3 / 1</div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:2 }}>documentos este mes · 2 sobre cupo</div>
          </div>
          <div style={{ width:1, height:36, background:'rgba(36,106,91,0.2)' }}/>
          <div style={{ flex:1 }}>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:'var(--green)' }}>$2.4M</div>
            <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:2 }}>ahorro estimado por usarnos</div>
          </div>
        </div>
        <div style={{ marginTop:14 }}>
          <ProgressBar pct={100} accent="var(--accent)"/>
          <div style={{ fontSize:11.5, color:'var(--ink-soft)', marginTop:6 }}>Renueva el 1 de abril · pasaste el cupo, considera subir de plan.</div>
        </div>
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 12px', letterSpacing:-0.01 }}>Subir de plan</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <PlanCard
          name="Plus" price="$5.990" sub="/mes · CLP"
          highlight
          features={[
            '20 documentos al mes',
            'Comparar 2 ofertas en paralelo',
            'Redacción de emails al banco',
            'Historial de 1 año',
          ]}
          cta="Activar Plus"
          onClick={() => nav.notify('Te llevaríamos a checkout · demo')}
        />
        <PlanCard
          name="Pro · Familia" price="$14.990" sub="/mes · hasta 4 personas"
          features={[
            'Documentos ilimitados',
            'Comparar varias ofertas',
            'Análisis para tu pareja, hijos y padres',
            'Soporte prioritario por chat',
            'Historial sin tope',
          ]}
          cta="Hablar con ventas"
          onClick={() => nav.notify('Te contactamos en 1 hábil')}
        />
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 12px', letterSpacing:-0.01 }}>Facturación</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <SettingRow label="Método de pago" sub="Sin método registrado · plan gratis" right={<button className="btn btn-small">Agregar</button>}/>
        <SettingRow label="Datos de boleta / factura" sub="Solo si activas un plan pagado" right={<button className="btn btn-small btn-ghost" style={{ color:'var(--ink-faint)' }}>Configurar →</button>}/>
        <SettingRow label="Historial de cobros" sub="Aún no hay cobros" right={<span style={{ fontSize:12, color:'var(--ink-faint)' }}>—</span>}/>
      </div>
    </>
  );
};

const PlanCard = ({ name, price, sub, features, highlight, cta, onClick }) => (
  <div className="card" style={{
    padding:'22px 22px',
    borderColor: highlight ? 'var(--ink)' : 'var(--line)',
    borderWidth: highlight ? 1.5 : 1,
    background: highlight ? '#fff' : 'var(--paper-2)',
    position:'relative',
  }}>
    {highlight ? <span className="pill" style={{ position:'absolute', top:-10, left:18, background:'var(--ink)', color:'var(--paper)', fontSize:10, padding:'3px 10px' }}>Recomendado</span> : null}
    <div style={{ fontSize:18, fontWeight:700 }}>{name}</div>
    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:8 }}>
      <span className="num display" style={{ fontSize:32, letterSpacing:-0.02 }}>{price}</span>
      <span style={{ fontSize:12.5, color:'var(--ink-faint)' }}>{sub}</span>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}>
      {features.map(f => (
        <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
          <Icon name="check" size={14} color="var(--accent)" strokeWidth={2.5}/> {f}
        </div>
      ))}
    </div>
    <button className={`btn ${highlight ? 'btn-accent' : ''}`} style={{ marginTop:18, width:'100%', justifyContent:'center' }} onClick={onClick}>
      {cta} <Icon name="arrow-r" size={13}/>
    </button>
  </div>
);

// ===== 4. Notificaciones =====
const SectionNotifs = () => {
  const nav = useNav();
  const DEFAULTS = {
    analysisReady: true,
    bankReplied: true,
    weeklyDigest: false,
    productUpdates: false,
    legalUpdates: true,
  };
  const [v, setV] = React.useState(DEFAULTS);
  const set = (k) => setV(s => ({...s, [k]: !s[k]}));

  return (
    <>
      <SectionHead
        title="Notificaciones"
        sub="Te escribimos lo justo. Por defecto: lo importante de tus documentos."/>

      <h3 className="display" style={{ fontSize:15, margin:'0 0 10px', letterSpacing:-0.01 }}>Sobre tus documentos</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <NotifRow on={v.analysisReady} onChange={() => set('analysisReady')}
          label="Cuando termine un análisis"
          sub="Email al instante que cerremos el análisis · suele ser 2–4 minutos."/>
        <NotifRow on={v.bankReplied} onChange={() => set('bankReplied')}
          label="Cuando responda el banco"
          sub="Si enviaste un email desde letra., te avisamos cuando responda."/>
        <NotifRow on={v.weeklyDigest} onChange={() => set('weeklyDigest')}
          label="Resumen semanal"
          sub="Domingos, 8am · cuánto te ahorraste y qué quedó pendiente."/>
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 10px', letterSpacing:-0.01 }}>De letra.</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <NotifRow on={v.legalUpdates} onChange={() => set('legalUpdates')}
          label="Cambios en la ley que te afectan"
          sub="Reformas de la Ley del Consumidor, nuevas circulares CMF que aplican a tus créditos."/>
        <NotifRow on={v.productUpdates} onChange={() => set('productUpdates')}
          label="Novedades del producto"
          sub="Cuando agregamos países, tipos de documento o features nuevos."/>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
        <button className="btn btn-accent" onClick={() => nav.notify('Preferencias guardadas')}>Guardar cambios</button>
      </div>
    </>
  );
};

const NotifRow = ({ on, onChange, label, sub }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:14,
    padding:'14px 20px',
    borderTop: '1px solid var(--line)',
    cursor:'pointer',
  }} onClick={onChange}>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3, lineHeight:1.45 }}>{sub}</div>
    </div>
    <Toggle on={on} size={28}/>
  </div>
);

// ===== 5. Privacidad y datos =====
const SectionPrivacy = () => {
  const nav = useNav();
  const [retention, setRetention] = React.useState('72h');
  const [training, setTraining] = React.useState(false);

  return (
    <>
      <SectionHead
        title="Privacidad y datos"
        sub="Tu documento es tuyo. Te explicamos qué guardamos y por cuánto — y te damos control."/>

      <h3 className="display" style={{ fontSize:15, margin:'0 0 10px', letterSpacing:-0.01 }}>Retención de PDFs</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {[
          { id:'instant', label:'Borrar inmediatamente al terminar',
            sub:'Análisis se mantiene, el PDF original se elimina apenas cerramos el análisis. Lo más estricto.' },
          { id:'72h',     label:'Borrar a las 72 horas (recomendado)',
            sub:'Tiempo de gracia por si necesitas re-analizar el mismo PDF.' },
          { id:'30d',     label:'Mantener 30 días',
            sub:'Útil si vuelves a abrir el análisis muchas veces. El PDF queda cifrado.' },
        ].map((o,i) => {
          const on = retention === o.id;
          return (
            <div key={o.id} onClick={() => setRetention(o.id)} style={{
              display:'flex', alignItems:'flex-start', gap:14,
              padding:'14px 20px',
              borderTop: i===0 ? 'none' : '1px solid var(--line)',
              cursor:'pointer',
              background: on ? 'var(--paper-2)' : 'transparent',
            }}>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                border: on ? '5.5px solid var(--accent)' : '1.5px solid var(--line-2)',
                background:'#fff', flex:'0 0 auto', marginTop:2,
              }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{o.label}</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3, lineHeight:1.5 }}>{o.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 10px', letterSpacing:-0.01 }}>Datos y entrenamiento</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <NotifRow on={training} onChange={() => setTraining(t => !t)}
          label="Usar mis documentos para mejorar el modelo"
          sub="Si lo activas, podemos usar versiones anonimizadas (sin nombres, RUTs ni montos identificables) para mejorar la detección de cláusulas."/>
      </div>

      <h3 className="display" style={{ fontSize:15, margin:'28px 0 10px', letterSpacing:-0.01 }}>Tus derechos</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <SettingRow label="Descargar todos mis datos" sub="ZIP con tus análisis, emails y documentos · te lo enviamos por email." right={
          <button className="btn btn-small" onClick={() => nav.notify('Te enviamos el ZIP por email · 5 min')}>Solicitar</button>
        }/>
        <SettingRow label="Borrar mi cuenta" sub="Acción irreversible · todo se borra en 24 horas. Tus emails enviados al banco no podemos borrarlos." right={
          <button className="btn btn-small" style={{ color:'var(--red)', borderColor:'var(--red-soft)' }}
            onClick={() => nav.notify('Esto eliminaría tu cuenta · demo')}>Eliminar cuenta</button>
        }/>
      </div>

      <div className="card-soft" style={{ padding:'14px 18px', marginTop:18, display:'flex', gap:14, alignItems:'flex-start' }}>
        <Icon name="shield-check" size={18} color="var(--accent)"/>
        <div style={{ fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.55 }}>
          <b>Lo que <i>nunca</i> hacemos.</b> No vendemos tus datos. No compartimos tu documento con el banco. No usamos tu contrato para entrenar modelos públicos. Si firmas en otro lado, no nos enteramos.
        </div>
      </div>
    </>
  );
};

Object.assign(window, { LT_Settings });
