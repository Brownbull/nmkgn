// letra. — Onboarding + empty states + error states

// ===== Welcome / onboarding (first run after login) =====
const LT_Welcome = () => {
  const nav = useNav();
  const [step, setStep] = React.useState(0);
  const STEPS = [
    {
      tag:'qué hace letra.',
      title:<>Lee tu contrato como si lo revisara <span style={{ color:'var(--accent)' }}>un abogado y un banquero</span>.</>,
      body:'Subes un PDF, en 2 minutos te decimos qué te conviene firmar, qué te conviene negociar, y qué te conviene rechazar.',
      visual:'doc',
    },
    {
      tag:'4 perspectivas',
      title:<>Cada documento revisado por <span style={{ color:'var(--accent)' }}>4 lentes</span>.</>,
      body:'Ley chilena, mercado actual, comparado con otras ofertas que nos hayas mostrado, y referencias internacionales como contexto.',
      visual:'lenses',
    },
    {
      tag:'siempre tú decides',
      title:<>Te damos los argumentos. <span style={{ color:'var(--accent)' }}>Tú firmas</span>.</>,
      body:'No automatizamos decisiones. Te entregamos hallazgos con cláusula y benchmark; tú vas, comparas y eliges.',
      visual:'shield',
    },
  ];
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
  <div className="lt" style={{ background:'var(--paper)', overflow:'hidden' }}>
    {/* Faint vertical lines */}
    <div style={{
      position:'absolute', inset:0,
      backgroundImage:'linear-gradient(to right, rgba(26,29,36,0.02) 1px, transparent 1px)',
      backgroundSize:'64px 100%', pointerEvents:'none',
    }}/>

    <div style={{ padding:'24px 40px', display:'flex', alignItems:'center', position:'relative' }}>
      <Logo size={22}/>
      <div style={{ flex:1 }}/>
      <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-faint)' }}
        onClick={() => { nav.set({ seenWelcome:true }); nav.go('upload'); }}>
        Saltar →
      </button>
    </div>

    <div style={{
      padding:'40px 40px 0',
      display:'grid', gridTemplateColumns:'1.05fr 1fr', gap:60,
      position:'relative', alignItems:'center',
      maxWidth:1280, margin:'0 auto',
    }}>
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:999, background:'var(--accent-soft)', color:'var(--accent)', fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:0.06 }}>
          {String(step+1).padStart(2,'0')} · {s.tag}
        </div>
        <h1 key={step} className="display" style={{
          fontSize:54, margin:'18px 0 0', letterSpacing:-0.035, lineHeight:1.05,
        }}>{s.title}</h1>
        <p key={'p'+step} style={{
          fontSize:17, color:'var(--ink-soft)', marginTop:18, lineHeight:1.55, maxWidth:480,
        }}>
          {s.body}
        </p>

        <div style={{ marginTop:34, display:'flex', alignItems:'center', gap:14 }}>
          {!last ? (
            <button className="btn btn-primary" style={{ padding:'12px 22px', fontSize:15 }}
              onClick={() => setStep(s => s+1)}>
              Siguiente <Icon name="arrow-r" size={14}/>
            </button>
          ) : (
            <button className="btn btn-accent" style={{ padding:'12px 22px', fontSize:15 }}
              onClick={() => { nav.set({ seenWelcome:true }); nav.go('upload'); }}>
              Empezar <Icon name="arrow-r" size={14}/>
            </button>
          )}
          <button className="btn btn-ghost" style={{ color:'var(--ink-faint)' }}
            disabled={step===0}
            onClick={() => setStep(s => Math.max(0, s-1))}>
            ← Volver
          </button>
        </div>

        {/* Dot indicator */}
        <div style={{ marginTop:32, display:'flex', alignItems:'center', gap:8 }}>
          {STEPS.map((_,i)=>(
            <span key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 28 : 8,
              height:8, borderRadius:4,
              background: i === step ? 'var(--accent)' : 'var(--paper-3)',
              transition:'width .25s, background .25s',
              cursor:'pointer',
            }}/>
          ))}
          <span style={{ marginLeft:6, fontSize:11.5, color:'var(--ink-faint)', fontFamily:'JetBrains Mono' }}>
            {step+1} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* Right — visual placeholder per step */}
      <div key={'v'+step} style={{ position:'relative', height:480 }}>
        {s.visual === 'doc' ? <WelcomeVisualDoc/> :
         s.visual === 'lenses' ? <WelcomeVisualLenses/> :
         <WelcomeVisualShield/>}
      </div>
    </div>

    <style>{`
      @keyframes welcomeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
  );
};

// Inject welcome keyframes globally once so dynamic step changes can use them
(() => {
  if (typeof document === 'undefined' || document.getElementById('letra-welcome-kf')) return;
  const s = document.createElement('style');
  s.id = 'letra-welcome-kf';
  s.textContent = `@keyframes welcomeStepIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`;
  document.head.appendChild(s);
})();

// ----- visuals for welcome steps -----
const WelcomeVisualDoc = () => (
  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div className="card" style={{
      width:340, padding:'18px 20px',
      boxShadow:'0 30px 50px -20px rgba(26,29,36,0.18), 0 8px 16px -8px rgba(26,29,36,0.08)',
      transform:'rotate(-2deg)',
    }}>
      <DocBadge compact/>
      <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--line)' }}>
        <div className="label">Cláusula 4.2 · Plazo</div>
        <div style={{ fontSize:13, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>
          "El deudor pagará en <span style={{ background:'var(--red-soft)', color:'var(--red)', fontWeight:600, padding:'1px 4px', borderRadius:3 }}>68 cuotas</span> mensuales y sucesivas…"
        </div>
      </div>
      <div style={{ marginTop:12, padding:'10px 12px', background:'var(--red-soft)', borderRadius:10, fontSize:12.5, color:'var(--red)', lineHeight:1.5 }}>
        <b>+8 cuotas</b> sobre lo que simulaste · revisa antes de firmar
      </div>
    </div>
    <div className="card" style={{
      position:'absolute', right:0, top:80, padding:'10px 14px', transform:'rotate(3deg)',
      background:'var(--ink)', color:'var(--paper)', borderColor:'var(--ink)',
      fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:8,
    }}>
      <Icon name="sparkle" size={13} color="var(--accent-2)"/> 4 hallazgos
    </div>
  </div>
);

const WelcomeVisualLenses = () => {
  const lenses = ['ley','mercado','comparar','intl'];
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, width:380 }}>
        {lenses.map((id,i) => {
          const L = LENSES[id];
          return (
            <div key={id} className="card" style={{
              padding:'18px 16px', position:'relative', overflow:'hidden',
              animation:`lensIn .5s cubic-bezier(.2,.7,.3,1) ${i*0.08}s both`,
            }}>
              <div style={{ height:3, background:L.color, position:'absolute', top:0, left:0, right:0 }}/>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:L.softColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name={L.icon} size={17} color={L.color}/>
                </div>
                <span style={{ fontSize:13.5, fontWeight:700 }}>{L.label}</span>
              </div>
              <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:8, lineHeight:1.4 }}>
                {id==='ley' ? 'CMF · Ley 19.496 · jurisprudencia' :
                 id==='mercado' ? 'Promedios actualizados · marzo 2025' :
                 id==='comparar' ? 'Tus otras ofertas o cotizaciones' :
                 'FCRA, CFPB, UE · solo contexto'}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes lensIn { from { opacity: 0; transform: translateY(8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

const WelcomeVisualShield = () => (
  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ position:'relative', width:300, height:300 }}>
      {/* Big shield */}
      <div style={{ width:200, height:240, position:'absolute', top:20, left:50 }}>
        <svg viewBox="0 0 200 240" width="200" height="240">
          <defs>
            <linearGradient id="shg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--paper)"/>
              <stop offset="100%" stopColor="var(--accent-soft)"/>
            </linearGradient>
          </defs>
          <path d="M 100 10 L 190 40 V 120 C 190 175 150 215 100 230 C 50 215 10 175 10 120 V 40 Z"
            fill="url(#shg)" stroke="var(--accent)" strokeWidth="2"/>
          <path d="M 65 120 L 90 145 L 140 90" stroke="var(--accent)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Floating chips */}
      <div className="card" style={{ position:'absolute', top:30, right:-30, padding:'7px 12px', fontSize:11.5, fontWeight:600, transform:'rotate(4deg)' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', marginRight:6 }}/>
        Tú firmas
      </div>
      <div className="card" style={{ position:'absolute', bottom:40, left:-40, padding:'7px 12px', fontSize:11.5, fontWeight:600, transform:'rotate(-3deg)' }}>
        PDFs borrados a las 72h
      </div>
      <div className="card" style={{ position:'absolute', top:140, right:-20, padding:'7px 12px', fontSize:11.5, fontWeight:600, transform:'rotate(2deg)' }}>
        Sin recomendaciones automáticas
      </div>
    </div>
  </div>
);

// ===== Empty history =====
const LT_HistoryEmpty = () => {
  const nav = useNav();
  return (
  <AppShell activeNav="Mis documentos">
    <div style={{ padding:'28px 32px', maxWidth:880, margin:'0 auto' }}>
      <div className="label">Historial</div>
      <h1 className="display" style={{ fontSize:30, margin:'6px 0 4px', letterSpacing:-0.025 }}>Mis documentos</h1>
      <div style={{ fontSize:14, color:'var(--ink-soft)' }}>Aún no has analizado nada.</div>

      <div className="card" style={{
        marginTop:24, padding:'48px 40px',
        textAlign:'center',
        background:'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)',
        border:'1.5px dashed var(--line-2)',
      }}>
        <div style={{ width:72, height:72, borderRadius:18, background:'#fff', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 16px -4px rgba(26,29,36,0.08)' }}>
          <Icon name="file" size={32} color="var(--accent)"/>
        </div>
        <h2 className="display" style={{ fontSize:24, margin:'18px 0 4px', letterSpacing:-0.02 }}>Sube tu primer documento</h2>
        <div style={{ fontSize:14, color:'var(--ink-soft)', maxWidth:480, margin:'0 auto', lineHeight:1.55 }}>
          Un crédito, contrato o cotización. En 2 minutos te decimos qué firmar y qué negociar.
        </div>
        <button className="btn btn-accent" style={{ marginTop:22, padding:'12px 20px', fontSize:14.5 }}
          onClick={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}>
          <Icon name="upload" size={15}/> Subir documento
        </button>

        <div style={{ marginTop:30, display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8 }}>
          <span className="label" style={{ width:'100%', fontSize:10 }}>Soportamos</span>
          {SUPPORTED_TYPES.slice(0,6).map(t => (
            <span key={t.label} className="pill" style={{ fontSize:11, padding:'4px 10px', background:'#fff' }}>
              <Icon name={t.icon} size={11}/> {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Sample suggestion */}
      <div className="card-soft" style={{
        marginTop:14, padding:'14px 18px',
        display:'flex', alignItems:'center', gap:14,
      }}>
        <div style={{ width:36, height:36, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="sparkle" size={16} color="var(--accent)"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:700 }}>¿Sin documentos a mano?</div>
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:2 }}>Prueba el flujo con un crédito de ejemplo · 0 espacio en tu cuenta</div>
        </div>
        <button className="btn btn-small" onClick={() => { nav.set({ detectResult:'ready', fileName:'ejemplo-credito.pdf' }); nav.go('process'); }}>
          Probar con ejemplo
        </button>
      </div>
    </div>
  </AppShell>
  );
};

// ===== Analysis failed =====
const LT_AnalysisFailed = () => {
  const nav = useNav();
  return (
  <AppShell>
    <div style={{ padding:'40px 40px', maxWidth:900, margin:'0 auto' }}>
      <div className="label">Paso 2 de 4</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
        <span className="pill pill-red"><Icon name="x" size={12}/> No pudimos leerlo</span>
      </div>
      <h1 className="display" style={{ fontSize:32, margin:'14px 0 6px', letterSpacing:-0.025 }}>
        Algo salió mal leyendo tu documento.
      </h1>
      <div style={{ fontSize:14.5, color:'var(--ink-soft)', maxWidth:660, lineHeight:1.55 }}>
        Llegamos hasta el 38% y no pudimos seguir. No te vamos a cobrar este análisis.
      </div>

      {/* File row */}
      <div className="card" style={{ marginTop:22, padding:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:60, background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <Icon name="file" size={20} color="var(--red)"/>
            <span style={{ position:'absolute', bottom:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'var(--red)', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>!</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{nav.state.fileName ?? 'contrato.pdf'}</div>
            <div style={{ fontSize:12.5, color:'var(--ink-faint)', marginTop:3 }}>6 páginas · 412 KB · fallo en página 3</div>
          </div>
          <span className="pill pill-red">se detuvo al 38%</span>
        </div>
      </div>

      {/* Reasons */}
      <h2 className="display" style={{ fontSize:18, margin:'24px 0 12px', letterSpacing:-0.015 }}>Lo que pudo haber pasado</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <ReasonRow icon="search" title="El escaneo está borroso o torcido"
          body="Si lo escaneaste con el celular, probemos otra vez con mejor luz y el documento bien plano."
          action="Subir de nuevo" onAction={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}/>
        <ReasonRow icon="shield" title="El PDF tiene protección"
          body="Algunos contratos bancarios vienen bloqueados para copiar texto. Pide al banco una versión sin protección."
          action="Cómo hacerlo" onAction={() => nav.notify('Te enviamos las instrucciones por email')}/>
        <ReasonRow icon="file" title="El archivo está corrupto"
          body="Puede haberse dañado al descargar. Pide al banco el PDF original."
          action="Subir otro" onAction={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:28, flexWrap:'wrap', gap:12 }}>
        <button className="btn btn-ghost" style={{ color:'var(--ink-faint)' }} onClick={() => { nav.set({ detectResult:'ready' }); nav.go('upload'); }}>
          ← Volver a subir
        </button>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn" onClick={() => nav.notify('Hablaremos contigo por email · 1 hábil')}>
            <Icon name="mail" size={14}/> Contactar a soporte
          </button>
          <button className="btn btn-accent" onClick={() => { nav.set({ detectResult:'ready' }); nav.go('process'); }}>
            <Icon name="arrow-r" size={14}/> Reintentar
          </button>
        </div>
      </div>
    </div>
  </AppShell>
  );
};

const ReasonRow = ({ icon, title, body, action, onAction }) => (
  <div className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:14 }}>
    <div style={{ width:36, height:36, borderRadius:9, background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
      <Icon name={icon} size={18}/>
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
      <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:3, lineHeight:1.5 }}>{body}</div>
    </div>
    <button className="btn btn-xs" onClick={onAction}>{action}</button>
  </div>
);

Object.assign(window, { LT_Welcome, LT_HistoryEmpty, LT_AnalysisFailed });
