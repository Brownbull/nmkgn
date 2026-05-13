// letra. — flow screens: Login, Upload, Detection states

// Supported types — shared across upload/picker/unsupported screens
const SUPPORTED_TYPES = [
  { icon:'bank',      label:'Crédito bancario',   sub:'Consumo · Hipotecario · Automotriz', count:'5.412' },
  { icon:'house',     label:'Arriendo',           sub:'Vivienda · Comercial',              count:'1.840' },
  { icon:'shield',    label:'Seguro',             sub:'Vida · Auto · Salud',               count:'920' },
  { icon:'briefcase', label:'Contrato laboral',   sub:'Indefinido · Plazo fijo',           count:'2.110' },
  { icon:'wrench',    label:'Cotización taller',  sub:'Reparación · Mantención',           count:'430' },
  { icon:'hammer',    label:'Propuesta obra',     sub:'Remodelación · Construcción',       count:'215' },
];

// ===== 1. Login =====
const LT_Login = () => {
  const nav = useNav();
  const tw = (window.useLetraTweaks ? window.useLetraTweaks() : { heroCopy:'Lee la letra chica por ti.', heroAccent:'chica', ctaCopy:'Continuar con Google' });
  // Render heroCopy with heroAccent word highlighted (case-insensitive, first occurrence)
  const renderHero = () => {
    const text = tw.heroCopy || 'Lee la letra chica por ti.';
    const accentWord = (tw.heroAccent || '').trim();
    if (!accentWord) return text;
    const idx = text.toLowerCase().indexOf(accentWord.toLowerCase());
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + accentWord.length);
    const after = text.slice(idx + accentWord.length);
    return <>{before}<span style={{ color:'var(--accent)' }}>{match}</span>{after}</>;
  };
  return (
  <div className="lt" style={{ background:'var(--paper)' }}>
    {/* Decorative paper grid lines, very faint */}
    <div style={{
      position:'absolute', inset:0,
      backgroundImage: 'linear-gradient(to right, rgba(26,29,36,0.025) 1px, transparent 1px)',
      backgroundSize: '64px 100%',
      pointerEvents:'none',
    }}/>

    {/* Top nav */}
    <div style={{ padding:'24px 40px', display:'flex', alignItems:'center', position:'relative' }}>
      <Logo size={22}/>
      <div style={{ flex:1 }}/>
      <span style={{ fontSize:13.5, color:'var(--ink-soft)', marginRight:18 }}>Precios</span>
      <span style={{ fontSize:13.5, color:'var(--ink-soft)', marginRight:18 }}>Cómo funciona</span>
      <span style={{ fontSize:13.5, color:'var(--ink-soft)' }}>Ayuda</span>
    </div>

    {/* Hero */}
    <div style={{ padding:'64px 40px 0', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:60, position:'relative' }}>
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:999, background:'var(--accent-soft)', color:'var(--accent)', fontSize:12, fontWeight:600 }}>
          <Icon name="sparkle" size={14}/> Para Chile · más países pronto
        </div>
        <h1 className="display" style={{
          fontSize: 64, margin:'18px 0 0', letterSpacing:-0.035, lineHeight:1.02,
        }}>
          {renderHero()}
        </h1>
        <p style={{ fontSize:18, color:'var(--ink-soft)', marginTop:20, lineHeight:1.5, maxWidth:480 }}>
          Sube un crédito, contrato o cotización. Te marcamos lo abusivo, lo escondido y lo que está sobre el mercado <em>antes</em> de que firmes.
        </p>

        <div style={{ marginTop:32, display:'flex', alignItems:'center', gap:14 }}>
          <button className="btn btn-primary" style={{ padding:'12px 20px', fontSize:15 }} onClick={() => nav.go(nav.state.seenWelcome ? 'upload' : 'welcome')}>
            <GoogleG size={18}/> {tw.ctaCopy || 'Continuar con Google'}
          </button>
          <span style={{ fontSize:12.5, color:'var(--ink-faint)' }}>
            Sin tarjeta · 1 documento gratis al mes
          </span>
        </div>

        <div style={{ marginTop:42, display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--ink-soft)' }}>
            <Icon name="shield-check" size={16} color="var(--accent)"/> Tus PDFs se borran a las 72h
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--ink-soft)' }}>
            <Icon name="scale" size={16} color="var(--accent)"/> Comparado con CMF y Ley 19.496
          </div>
        </div>
      </div>

      {/* Right — preview card */}
      <div style={{ position:'relative' }}>
        <div className="card" style={{
          padding:'18px 20px',
          boxShadow:'0 24px 40px -16px rgba(26,29,36,0.18), 0 8px 16px -8px rgba(26,29,36,0.08)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <DocBadge compact />
            <div style={{ flex:1 }}/>
            <span className="pill pill-red">3 hallazgos</span>
          </div>

          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--line)' }}>
            <div className="label">Tu crédito</div>
            <div className="display num" style={{ fontSize:32, color:'var(--red)', marginTop:6, lineHeight:1 }}>+$1.4M de más</div>
            <div style={{ fontSize:12.5, color:'var(--ink-faint)', marginTop:6 }}>vs. lo esperado para tu perfil</div>
          </div>

          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            <Finding sev="hi" title="68 cuotas, no 60" where="Cláusula 4.2"/>
            <Finding sev="hi" title="CAE 4.2 pts sobre mercado" where="Cláusula 3"/>
            <Finding sev="mid" title="Seguro vinculado al banco" where="Cláusula 9"/>
          </div>
        </div>

        {/* Floating chip */}
        <div className="card" style={{
          position:'absolute', top:-14, right:-14,
          padding:'8px 12px',
          background:'var(--ink)', color:'var(--paper)', borderColor:'var(--ink)',
          display:'flex', alignItems:'center', gap:8,
          fontSize:12, fontWeight:600,
          transform:'rotate(2deg)',
        }}>
          <Icon name="check" size={14} color="var(--accent-2)"/> Análisis listo en 2 min
        </div>
      </div>
    </div>

    {/* Bottom strip — example doc types */}
    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 40px', borderTop:'1px solid var(--line)', background:'var(--paper-2)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
        <span className="label">Tipos soportados hoy</span>
        {SUPPORTED_TYPES.slice(0,5).map(t => (
          <span key={t.label} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--ink-soft)' }}>
            <Icon name={t.icon} size={14}/> {t.label}
          </span>
        ))}
        <span style={{ fontSize:13, color:'var(--ink-faint)' }}>+ 1 más</span>
      </div>
    </div>
  </div>
  );
};

// Small finding row used in preview card
const Finding = ({ sev, title, where }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
    <span style={{
      width:8, height:8, borderRadius:'50%',
      background: sev==='hi'?'var(--red)':sev==='mid'?'var(--amber)':'var(--green)',
      marginTop:7, flex:'0 0 auto',
    }}/>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13.5, fontWeight:600 }}>{title}</div>
      <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:1 }}>{where}</div>
    </div>
  </div>
);

// ===== 2. Upload =====
const LT_Upload = () => {
  const nav = useNav();
  const selectedType = nav.state.docType ?? 'bank';
  const scenario = nav.state.detectResult ?? 'ready';
  const [dragOver, setDragOver] = React.useState(false);
  const [received, setReceived] = React.useState(false);

  const handleDrop = React.useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    setReceived(true);
    setTimeout(() => nav.go('process'), 700);
  }, [nav]);

  const handleClick = () => {
    if (!nav.interactive || received) return;
    setReceived(true);
    setTimeout(() => nav.go('process'), 700);
  };
  return (
  <AppShell activeNav="Análisis">
    <div style={{ padding:'32px 40px', maxWidth:1100, margin:'0 auto' }}>
      <div className="label">Paso 1 de 4</div>
      <h1 className="display" style={{ fontSize:36, margin:'8px 0 6px', letterSpacing:-0.025 }}>¿Qué vamos a revisar?</h1>
      <div style={{ fontSize:14.5, color:'var(--ink-soft)' }}>Elige un tipo o suelta el PDF directo — lo detectamos solo.</div>

      {/* Type grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:24 }}>
        {SUPPORTED_TYPES.map((t,i) => {
          const isSelected = t.icon === selectedType;
          return (
          <div key={t.label} className="card" style={{
            padding:'16px 18px',
            cursor:'pointer',
            background: isSelected ? 'var(--accent-soft)' : '#fff',
            borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
            transition: 'background .15s, border-color .15s',
          }}
          onClick={() => nav.set({ docType: t.icon, docLabel: t.label })}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background: isSelected ? '#fff' : 'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={t.icon} size={18} color={isSelected ? 'var(--accent)' : 'var(--ink)'}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14.5, fontWeight:700 }}>{t.label}</div>
                <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:2 }}>{t.sub}</div>
              </div>
              {isSelected ? <Icon name="check-circle" size={18} color="var(--accent)"/> : null}
            </div>
          </div>
          );
        })}
      </div>

      {/* Drop zone */}
      <div className="card" style={{
        marginTop:18,
        padding:'34px 24px',
        background: received
          ? 'var(--accent-soft)'
          : dragOver
            ? 'var(--accent-soft)'
            : 'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)',
        border: dragOver || received ? '1.5px solid var(--accent)' : '1.5px dashed var(--line-2)',
        textAlign:'center',
        position:'relative',
        cursor: nav.interactive ? 'pointer' : 'default',
        transition:'background .2s, border-color .2s, transform .2s',
        transform: received ? 'scale(0.99)' : 'scale(1)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}>
        <div style={{
          width:56, height:56, borderRadius:14, background:'#fff', margin:'0 auto',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: dragOver ? '0 8px 24px -4px rgba(36,106,91,0.3)' : '0 4px 12px -4px rgba(26,29,36,0.1)',
          transition:'box-shadow .2s, transform .25s',
          transform: dragOver ? 'translateY(-4px)' : received ? 'scale(1.1)' : 'translateY(0)',
        }}>
          <Icon name={received ? 'check' : 'upload'} size={26} color="var(--accent)" strokeWidth={2.5}/>
        </div>
        <div style={{ fontSize:18, fontWeight:700, marginTop:14, letterSpacing:-0.01 }}>
          {received ? '¡Listo! Empezamos a leerlo…' : dragOver ? 'Suelta para analizar' : 'Arrastra tus PDFs aquí'}
        </div>
        <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:4 }}>
          {received ? 'contrato.pdf · 412 KB' :
            dragOver ? '1 archivo detectado · alta resolución' :
            <>o <span style={{ color:'var(--accent)', textDecoration:'underline', cursor:'pointer', fontWeight:600 }}>haz click para elegirlos</span> · hasta 10 archivos · soportamos escaneados</>
          }
        </div>
        {!received ? (
          <div style={{ marginTop:14, display:'inline-flex', gap:10, alignItems:'center', fontSize:11.5, color:'var(--ink-faint)' }}>
            <span className="pill" style={{ fontSize:11 }}>.pdf</span>
            <span className="pill" style={{ fontSize:11 }}>.jpg / .png</span>
            <span className="pill" style={{ fontSize:11 }}>hasta 25 MB</span>
          </div>
        ) : null}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24 }}>
        <button className="btn btn-ghost" style={{ color:'var(--ink-faint)' }} onClick={() => nav.go('login')}>← Volver</button>
        <button className="btn btn-primary" onClick={() => nav.go('process')}>Continuar <Icon name="arrow-r" size={14}/></button>
      </div>

      {/* Scenario picker — only visible in the interactive prototype */}
      {nav.interactive ? (
        <div style={{
          marginTop:28, padding:'14px 16px',
          borderRadius:10, background:'var(--paper-2)',
          border:'1px dashed var(--line-2)',
          display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
        }}>
          <span className="label" style={{ fontSize:10 }}>Demo · simular escenario de detección</span>
          {[
            { id:'ready',       label:'Alta confianza',  hint:'identificado' },
            { id:'low',         label:'Baja confianza',  hint:'pedir confirmación' },
            { id:'unsupported', label:'No soportado',    hint:'rechazar amable' },
            { id:'failed',      label:'Error de lectura', hint:'falla al 38%' },
          ].map(s => {
            const on = scenario === s.id;
            return (
              <button key={s.id}
                onClick={() => nav.set({ detectResult: s.id })}
                className="btn btn-xs"
                style={{
                  background: on ? 'var(--ink)' : '#fff',
                  color: on ? 'var(--paper)' : 'var(--ink-soft)',
                  borderColor: on ? 'var(--ink)' : 'var(--line)',
                  fontFamily:'JetBrains Mono', fontSize:11,
                }}>
                {on ? '●' : '○'} {s.label}
              </button>
            );
          })}
          <span style={{ fontSize:11, color:'var(--ink-faint)', marginLeft:'auto' }}>
            siguiente paso → <b>{
              scenario === 'ready' ? 'identificación lograda' :
              scenario === 'low' ? 'pedir confirmación' :
              scenario === 'unsupported' ? 'no soportado' :
              'lectura falló'
            }</b>
          </span>
        </div>
      ) : null}
    </div>
  </AppShell>
  );
};

// ===== 3. Detection · processing =====
const LT_DetectProcessing = () => {
  const nav = useNav();
  const [pct, setPct] = React.useState(nav.interactive ? 0 : 92);
  const [phase, setPhase] = React.useState(0); // 0..3 step index

  React.useEffect(() => {
    if (!nav.interactive) return;
    const target = nav.state.detectResult === 'low' ? 'low'
                  : nav.state.detectResult === 'unsupported' ? 'unsupported'
                  : nav.state.detectResult === 'failed' ? 'failed'
                  : 'detect';
    // If failed, stop progress at 38% (matches the failed screen narrative)
    const ceiling = nav.state.detectResult === 'failed' ? 38 : 100;
    let t1 = setInterval(() => setPct(p => p < ceiling ? p + 4 : p), 80);
    let t2 = setTimeout(() => setPhase(1), 600);
    let t3 = setTimeout(() => setPhase(2), 1400);
    let t4 = setTimeout(() => setPhase(3), 2100);
    let t5 = setTimeout(() => nav.go(target), 2700);
    return () => { clearInterval(t1); [t2,t3,t4,t5].forEach(clearTimeout); };
  }, [nav.interactive]);

  return (
  <AppShell>
    <div style={{ padding:'40px 40px', maxWidth:900, margin:'0 auto' }}>
      <div className="label">Paso 2 de 4</div>
      <h1 className="display" style={{ fontSize:32, margin:'8px 0 6px', letterSpacing:-0.025 }}>Leyendo tu documento…</h1>
      <div style={{ fontSize:14, color:'var(--ink-soft)' }}>Primero identificamos qué tipo es. Solo analizamos los que conocemos a fondo.</div>

      <div className="card" style={{ padding:24, marginTop:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:60, background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="file" size={20} color="var(--ink-faint)"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{nav.state.fileName ?? 'contrato.pdf'}</div>
            <div style={{ fontSize:12.5, color:'var(--ink-faint)', marginTop:3 }}>6 páginas · 412 KB · subido hace 4 seg</div>
          </div>
          <span className="pill pill-accent">{pct}%</span>
        </div>

        <div style={{ marginTop:18 }}>
          <ProgressBar pct={pct} accent="var(--accent)"/>
        </div>

        <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:12 }}>
          <Step done={phase>=1} running={phase===0} label="OCR · texto extraído" detail="6 páginas leídas en 8.2s"/>
          <Step done={phase>=2} running={phase===1} queued={phase<1} label="Detectando tipo de documento" detail="Crédito de consumo · 92% confianza"/>
          <Step done={phase>=3} running={phase===2} queued={phase<2} label="Cargando estándares y benchmarks" detail="CMF marzo 2025 · Ley 19.496"/>
          <Step done={false}    running={phase===3} queued={phase<3} label="Listo para mostrarte resultados" detail="11 criterios"/>
        </div>
      </div>

      <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:14, textAlign:'center' }}>
        Esto suele tomar 20–40 segundos · te avisamos cuando termine.
      </div>
    </div>
  </AppShell>
  );
};

const Step = ({ done, running, queued, label, detail }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
    <span style={{
      width:22, height:22, borderRadius:'50%',
      background: done ? 'var(--accent)' : running ? '#fff' : 'var(--paper-2)',
      border: done ? '1px solid var(--accent)' : running ? '1.5px solid var(--accent)' : '1px solid var(--line)',
      display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto',
    }}>
      {done ? <Icon name="check" size={12} color="#fff" strokeWidth={2.5}/> :
       running ? <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)' }}/> : null}
    </span>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:14, fontWeight: done||running ? 600 : 500, color: queued ? 'var(--ink-faint)' : 'var(--ink)' }}>{label}</div>
      <div style={{ fontSize:12, color: 'var(--ink-faint)', marginTop:2 }}>{detail}</div>
    </div>
    {running ? <span className="pill pill-accent" style={{ fontSize:10.5 }}>en curso</span> : null}
  </div>
);

// ===== 4. Detection · high confidence (ready to analyze) =====
const LT_DetectReady = () => {
  const nav = useNav();
  return (
  <AppShell>
    <div style={{ padding:'40px 40px', maxWidth:880, margin:'0 auto' }}>
      <div className="label">Paso 2 de 4</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
        <span className="pill pill-green"><Icon name="check-circle" size={13}/> Identificado con alta confianza</span>
      </div>
      <h1 className="display" style={{ fontSize:38, margin:'14px 0 6px', letterSpacing:-0.025 }}>
        Este es un <span style={{ color:'var(--accent)' }}>{nav.state.docLabel ?? 'Crédito de consumo'}</span>.
      </h1>
      <div style={{ fontSize:15, color:'var(--ink-soft)', maxWidth:600, lineHeight:1.55 }}>
        Lo vamos a revisar contra los estándares de la <b>CMF</b>, la <b>Ley del Consumidor</b> (19.496) y los benchmarks de mercado de marzo 2025.
      </div>

      <div style={{ marginTop:22, animation: nav.interactive ? 'badgeIn .55s cubic-bezier(.2,.7,.3,1.2)' : 'none', transformOrigin:'left center' }}>
        <DocBadge confidence="high" label={nav.state.docLabel ?? 'Crédito de consumo'} icon={nav.state.docType ?? 'bank'}/>
      </div>

      <style>{`
        @keyframes badgeIn {
          0%   { opacity: 0; transform: scale(0.85) translateY(8px); }
          60%  { opacity: 1; transform: scale(1.04) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div className="card" style={{ marginTop:22, padding:'18px 22px' }}>
        <div className="label">Qué vamos a revisar</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px 24px', marginTop:14 }}>
          {[
            'Plazo y cantidad de cuotas',
            'CAE vs. promedio CMF',
            'Tasa de interés nominal',
            'Comisión inicial vs. mercado',
            'Seguros vinculados al banco',
            'Cláusulas de mora y aceleración',
            'Prepago y costo de prepago',
            'Cláusulas abusivas (Art. 16)',
          ].map(c => (
            <div key={c} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13.5 }}>
              <Icon name="check" size={14} color="var(--accent)" strokeWidth={2}/> {c}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:26 }}>
        <button className="btn btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.go('upload')}>No es esto, cambiar tipo</button>
        <button className="btn btn-accent" onClick={() => nav.go('plan')}>Personalizar plan <Icon name="arrow-r" size={14}/></button>
      </div>
    </div>
  </AppShell>
  );
};

// ===== 5. Detection · low confidence =====
const LT_DetectLow = () => {
  const nav = useNav();
  const [selected, setSelected] = React.useState('bank');
  const candidates = [
    { id:'bank',     icon:'bank', label:'Crédito bancario', pct:62, hint:'Coincide: CAE, plazo, cuotas, banco emisor' },
    { id:'mutuo',    icon:'file', label:'Pagaré / mutuo',   pct:28, hint:'Coincide: monto, plazo, deudor' },
    { id:'generic',  icon:'file', label:'Otro · genérico',  pct:10, hint:'Revisión menos profunda' },
  ];
  const selectedLabel = candidates.find(c => c.id === selected)?.label ?? 'Crédito bancario';
  return (
  <AppShell>
    <div style={{ padding:'40px 40px', maxWidth:1000, margin:'0 auto' }}>
      <div className="label">Paso 2 de 4</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
        <span className="pill pill-amber"><Icon name="search" size={13}/> Confianza baja</span>
      </div>
      <h1 className="display" style={{ fontSize:34, margin:'14px 0 6px', letterSpacing:-0.025 }}>
        No estamos del todo seguros de qué tipo es.
      </h1>
      <div style={{ fontSize:14.5, color:'var(--ink-soft)', maxWidth:600 }}>
        Tu documento tiene rasgos de varios tipos que sí analizamos. ¿Cuál es el correcto?
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, marginTop:24 }}>
        {candidates.map((c,i) => (
          <CandidateCard key={c.id}
            top={selected === c.id}
            icon={c.icon} label={c.label} pct={c.pct} hint={c.hint}
            onClick={() => setSelected(c.id)}/>
        ))}
      </div>

      <div className="card" style={{ marginTop:18, padding:18 }}>
        <div className="label">Vista previa del documento</div>
        <div style={{ display:'flex', gap:18, marginTop:12, alignItems:'flex-start' }}>
          <div style={{ width:90, height:120, background:'var(--paper-2)', border:'1px solid var(--line)', borderRadius:4, padding:9, fontSize:6.5, lineHeight:1.4, color:'var(--ink-soft)' }}>
            <div style={{ fontWeight:700, textAlign:'center', fontSize:7 }}>CONTRATO DE MUTUO</div>
            <div style={{ height:1, background:'var(--line-2)', margin:'4px 0' }}/>
            <div>En Santiago de Chile…</div>
            <div style={{ marginTop:3 }}>$18.000.000 · 60 cuotas</div>
            <div style={{ marginTop:6, height:30, background:'var(--paper)', border:'1px dashed var(--line-2)' }}/>
          </div>
          <div style={{ flex:1, fontSize:13, color:'var(--ink-soft)', lineHeight:1.55 }}>
            <div style={{ color:'var(--ink)', fontWeight:600, fontSize:13.5 }}>Frases que encontramos</div>
            <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
              {['"mutuo"','"tasa de interés"','"plazo de 60 meses"','"obligación pagadera"','"deudor"','"CAE"'].map(p => (
                <span key={p} className="pill" style={{ fontSize:11 }}>{p}</span>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
              La estructura coincide con créditos, pero faltan algunos encabezados típicos de banco. Confirma el tipo para usar las reglas correctas.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24 }}>
        <button className="btn btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.go('upload')}>← Subir otro</button>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn" onClick={() => nav.go('upload')}>Ver todos los tipos</button>
          <button className="btn btn-accent" onClick={() => {
            nav.set({ docType: selected === 'bank' ? 'bank' : 'file', docLabel: selectedLabel, detectResult: 'ready' });
            nav.go('detect');
          }}>Continuar con {selectedLabel} <Icon name="arrow-r" size={14}/></button>
        </div>
      </div>
    </div>
  </AppShell>
  );
};

const CandidateCard = ({ icon, label, pct, hint, top, onClick }) => (
  <div className="card" style={{
    padding:'16px 18px',
    background: top ? '#fff' : '#fff',
    borderColor: top ? 'var(--amber)' : 'var(--line)',
    borderWidth: top ? 1.5 : 1,
    position:'relative',
    cursor: onClick ? 'pointer' : 'default',
    transition:'border-color .15s, transform .08s',
  }}
  onClick={onClick}>
    {top ? <span className="pill pill-amber" style={{ position:'absolute', top:-10, left:14, padding:'2px 8px', fontSize:10 }}>seleccionado</span> : null}
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <Icon name={icon} size={22}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14.5, fontWeight:700 }}>{label}</div>
      </div>
      <div className="num" style={{ fontSize:18, fontWeight:600, color: top ? 'var(--amber)' : 'var(--ink-faint)' }}>{pct}%</div>
    </div>
    <div style={{ height:6, background:'var(--paper-2)', borderRadius:3, marginTop:12, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background: top ? 'var(--amber)' : 'var(--ink-faint)' }}/>
    </div>
    <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:10, lineHeight:1.45 }}>{hint}</div>
  </div>
);

// ===== 6. Detection · unsupported =====
const LT_DetectUnsupported = () => {
  const nav = useNav();
  return (
  <AppShell>
    <div style={{ padding:'40px 40px', maxWidth:980, margin:'0 auto' }}>
      <div className="label">Paso 2 de 4</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
        <span className="pill pill-red"><Icon name="x" size={12}/> No soportado</span>
      </div>
      <h1 className="display" style={{ fontSize:32, margin:'14px 0 6px', letterSpacing:-0.025 }}>
        Aún no analizamos este tipo de documento.
      </h1>
      <div style={{ fontSize:14.5, color:'var(--ink-soft)', maxWidth:680, lineHeight:1.55 }}>
        Detectamos que <b>terminos-servicio.pdf</b> parece ser <b>Términos y Condiciones de un servicio</b>. Para no darte un análisis equivocado, no lo vamos a procesar.
      </div>

      <div className="card" style={{ marginTop:22, padding:18, background:'var(--red-soft)', borderColor:'transparent' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--red)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, flex:'0 0 auto' }}>!</div>
          <div style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.55 }}>
            <b>Por qué no lo analizamos.</b> Cada tipo necesita reglas, estándares y benchmarks propios. Si te damos un análisis sin tenerlos, podríamos pasar por alto cosas importantes — o peor, marcar como peligroso algo que es normal.
          </div>
        </div>
      </div>

      <h2 className="display" style={{ fontSize:18, marginTop:28, marginBottom:12 }}>Lo que sí podemos analizar hoy</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        {SUPPORTED_TYPES.map(t => (
          <div key={t.label} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Icon name={t.icon} size={18}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600 }}>{t.label}</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>{t.sub}</div>
            </div>
            <span className="num" style={{ fontSize:10.5, color:'var(--ink-faint)' }}>{t.count}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24, flexWrap:'wrap', gap:12 }}>
        <span style={{ fontSize:13, color:'var(--ink-soft)' }}>¿Lo necesitas?</span>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn" onClick={() => nav.notify('Pedido registrado · te avisaremos por email')}>
            <Icon name="plus" size={14}/> Pedir este tipo
          </button>
          <button className="btn" onClick={() => nav.notify('Listo · te avisaremos cuando lo soportemos')}>
            <Icon name="mail" size={14}/> Avisarme cuando esté listo
          </button>
          <button className="btn btn-primary" onClick={() => { nav.set({ detectResult: 'ready' }); nav.go('upload'); }}>
            Subir otro documento
          </button>
        </div>
      </div>
    </div>
  </AppShell>
  );
};

Object.assign(window, {
  SUPPORTED_TYPES,
  LT_Login, LT_Upload, LT_DetectProcessing, LT_DetectReady, LT_DetectLow, LT_DetectUnsupported,
});
