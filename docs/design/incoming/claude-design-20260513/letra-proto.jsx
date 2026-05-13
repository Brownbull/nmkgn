// letra. — Prototype state machine
// Provides NavCtx to wrap interactive screens, routes step → screen,
// and persists state to sessionStorage so refreshes don't break the demo.

const STORAGE_KEY = 'letra-proto-state-v1';

const INITIAL_STATE = {
  step: 'login',
  history: [],
  docType: 'bank',          // selected icon name
  docLabel: 'Crédito bancario',
  fileName: 'contrato.pdf',
  // Which detection branch processing should route to: 'ready' | 'low' | 'unsupported' | 'failed'
  detectResult: 'ready',
  // First-run gate: Login routes to welcome until this flips true.
  seenWelcome: false,
  // Treat history list as empty (for demo of empty state)
  emptyHistory: false,
  // Selected finding for detail screen
  findingId: 'plazo',
  // Transient toast message, cleared by the toast component itself
  toast: null,
};

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch { return INITIAL_STATE; }
}
function saveState(s) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const SCREEN_BY_STEP = {
  login:        () => <LT_Login/>,
  welcome:      () => <LT_Welcome/>,
  upload:       () => <LT_Upload/>,
  process:      () => <LT_DetectProcessing/>,
  detect:       () => <LT_DetectReady/>,
  low:          () => <LT_DetectLow/>,
  unsupported:  () => <LT_DetectUnsupported/>,
  failed:       () => <LT_AnalysisFailed/>,
  plan:         () => <LT_Plan/>,
  running:      () => <LT_PlanRunning/>,
  coach:        () => <LT_Coach/>,
  detail:       () => <LT_FindingDetail/>,
  share:        () => <LT_Share/>,
  compare:      () => <LT_Compare/>,
  email:        () => <LT_Email/>,
  history:      () => {
    const nav = useNav();
    return nav.state.emptyHistory ? <LT_HistoryEmpty/> : <LT_History/>;
  },
  settings:     () => <LT_Settings/>,
};

// Mobile equivalents — used when viewport < 720px in the live prototype.
// Any step not in this map falls back to the desktop component.
const SCREEN_BY_STEP_MOBILE = {
  login:        () => <LT_M_Login/>,
  welcome:      () => <LT_M_Welcome/>,
  upload:       () => <LT_M_Upload/>,
  process:      () => <LT_M_Processing/>,
  detect:       () => <LT_M_DetectReady/>,
  low:          () => <LT_M_Detect/>,
  unsupported:  () => <LT_M_Unsupported/>,
  failed:       () => <LT_M_Failed/>,
  plan:         () => <LT_M_Plan/>,
  running:      () => <LT_M_Running/>,
  coach:        () => <LT_M_Coach/>,
  detail:       () => <LT_M_FindingDetail/>,
  share:        () => <LT_M_Share/>,
  compare:      () => <LT_M_Compare/>,
  email:        () => <LT_M_Email/>,
  history:      () => {
    const nav = useNav();
    return nav.state.emptyHistory ? <LT_M_HistoryEmpty/> : <LT_M_History/>;
  },
  settings:     () => <LT_M_Settings/>,
};

const STEP_ORDER = [
  'login','welcome','upload','process','detect','low','unsupported','failed',
  'plan','running','coach','detail','share','compare','email','history','settings',
];

function Proto() {
  const [state, setState] = React.useState(() => loadState());
  const [transitionKey, setTransitionKey] = React.useState(0);

  React.useEffect(() => { saveState(state); }, [state]);

  const go = React.useCallback((nextStep) => {
    setState(prev => ({
      ...prev,
      step: nextStep,
      history: prev.step ? [...prev.history, prev.step].slice(-20) : prev.history,
    }));
    setTransitionKey(k => k + 1);
    // Scroll the screen container to top
    requestAnimationFrame(() => {
      const el = document.getElementById('proto-screen');
      if (el) el.scrollTop = 0;
    });
  }, []);

  const back = React.useCallback(() => {
    setState(prev => {
      const h = prev.history.slice();
      const prevStep = h.pop();
      return { ...prev, step: prevStep ?? 'login', history: h };
    });
    setTransitionKey(k => k + 1);
  }, []);

  const set = React.useCallback((patch) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = React.useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
    setTransitionKey(k => k + 1);
  }, []);

  const notify = React.useCallback((toast) => {
    setState(prev => ({ ...prev, toast }));
    setTimeout(() => setState(prev => prev.toast === toast ? { ...prev, toast: null } : prev), 3200);
  }, []);

  const nav = React.useMemo(() => ({
    interactive: true,
    state, go, back, set, reset, notify,
  }), [state, go, back, set, reset, notify]);

  const Screen = SCREEN_BY_STEP[state.step] ?? SCREEN_BY_STEP.login;
  const MobileScreen = SCREEN_BY_STEP_MOBILE[state.step];
  const stepIdx = STEP_ORDER.indexOf(state.step);
  const { isMobile } = useViewport();
  const ActiveScreen = (isMobile && MobileScreen) ? MobileScreen : Screen;

  return (
    <NavCtx.Provider value={nav}>
      <div style={{
        position:'fixed', inset:0,
        background:'var(--paper)',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
      }}>
        {/* Tiny floating debug toolbar — bottom right */}
        <FloatingDebug state={state} stepIdx={stepIdx} go={go} back={back} reset={reset}/>

        {/* Transient toast for confirmations (email sent etc.) */}
        <Toast toast={state.toast}/>

        {/* Tweaks panel — toggled via the host toolbar */}
        {window.LetraTweaks ? <window.LetraTweaks/> : null}

        {/* Screen container with fade transition */}
        <div key={transitionKey} id="proto-screen" style={{
          flex:1, minHeight:0, overflow:'auto',
          animation: 'protoFade .35s cubic-bezier(.2,.6,.2,1)',
        }}>
          <ActiveScreen/>
        </div>
      </div>

      <style>{`
        @keyframes protoFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </NavCtx.Provider>
  );
}

// Small dev toolbar so you can jump between steps without clicking through
function FloatingDebug({ state, stepIdx, go, back, reset }) {
  const [open, setOpen] = React.useState(false);
  const setKey = (patch) => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const cur = raw ? JSON.parse(raw) : INITIAL_STATE;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
      window.location.reload();
    } catch {}
  };
  return (
    <div style={{
      position:'fixed', bottom:16, right:16, zIndex:9999,
      fontFamily:'JetBrains Mono', fontSize:11,
    }}>
      {open ? (
        <div style={{
          background:'#1a1d24', color:'#fafaf7',
          borderRadius:12, padding:'10px 12px',
          boxShadow:'0 12px 32px -8px rgba(0,0,0,0.35)',
          display:'flex', flexDirection:'column', gap:6, minWidth:220,
          maxHeight:'80vh', overflowY:'auto',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ color:'#8b91a0', textTransform:'uppercase', letterSpacing:0.1 }}>Saltar a paso</span>
            <span style={{ cursor:'pointer', color:'#8b91a0' }} onClick={() => setOpen(false)}>×</span>
          </div>
          {STEP_ORDER.map((s,i) => (
            <button key={s}
              onClick={() => go(s)}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'5px 8px', borderRadius:6,
                background: s === state.step ? '#246a5b' : 'transparent',
                color: s === state.step ? '#fff' : '#fafaf7',
                border:'none', textAlign:'left', cursor:'pointer',
                fontFamily:'JetBrains Mono', fontSize:11,
              }}>
              <span style={{ width:18, opacity:0.6 }}>{String(i+1).padStart(2,'0')}.</span>
              <span>{s}</span>
            </button>
          ))}

          <div style={{ height:1, background:'rgba(255,255,255,0.1)', margin:'4px 0' }}/>
          <span style={{ color:'#8b91a0', textTransform:'uppercase', letterSpacing:0.1, fontSize:10 }}>Variantes</span>
          <DebugToggle label="Historial vacío" on={!!state.emptyHistory}
            onClick={() => setKey({ emptyHistory: !state.emptyHistory })}/>
          <DebugToggle label="Mostrar onboarding" on={!state.seenWelcome}
            onClick={() => setKey({ seenWelcome: !!state.seenWelcome ? false : true })}/>

          <div style={{ height:1, background:'rgba(255,255,255,0.1)', margin:'4px 0' }}/>
          <button onClick={reset} style={{
            padding:'5px 8px', borderRadius:6, background:'transparent', color:'#fafaf7',
            border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer',
            fontFamily:'JetBrains Mono', fontSize:10.5,
          }}>↻ Reset al inicio</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{
          background:'#1a1d24', color:'#fafaf7',
          border:'none', borderRadius:999, padding:'8px 14px',
          fontFamily:'JetBrains Mono', fontSize:11,
          boxShadow:'0 6px 16px -4px rgba(0,0,0,0.3)',
          cursor:'pointer',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#246a5b' }}/>
          {state.step}  ·  {stepIdx+1}/{STEP_ORDER.length}
        </button>
      )}
    </div>
  );
}

function DebugToggle({ label, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'5px 8px', borderRadius:6,
      background:'transparent', border:'none', cursor:'pointer',
      fontFamily:'JetBrains Mono', fontSize:11, color:'#fafaf7',
      textAlign:'left',
    }}>
      <span style={{
        width:12, height:12, borderRadius:3,
        background: on ? '#5fa093' : 'transparent',
        border: on ? '1px solid #5fa093' : '1px solid rgba(255,255,255,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:9, color:'#0e1015', fontWeight:700,
      }}>{on ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
  );
}

// Toast — shown for ~3.2s after notify()
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      zIndex: 10000,
      background:'#1a1d24', color:'#fafaf7',
      borderRadius:10, padding:'10px 18px',
      fontFamily:'Manrope', fontSize:13.5, fontWeight:500,
      boxShadow:'0 12px 32px -8px rgba(0,0,0,0.35)',
      display:'flex', alignItems:'center', gap:10,
      animation:'toastIn .25s ease-out',
    }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:'#5fa093' }}/>
      {toast}
      <style>{`@keyframes toastIn { from { opacity:0; transform: translate(-50%, 8px); } to { opacity:1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}

window.Proto = Proto;
ReactDOM.createRoot(document.getElementById('root')).render(<Proto/>);
