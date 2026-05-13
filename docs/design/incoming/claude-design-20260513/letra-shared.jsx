// letra. — shared design primitives

// ===== NavCtx — navigation context for the prototype =====
// When provided, components render interactive buttons that drive state machine.
// When not provided (design canvas), useNav returns no-op handlers and components stay static.
const NavCtx = React.createContext(null);
const NO_OP_NAV = {
  interactive: false,
  state: {},
  go: () => {},
  back: () => {},
  set: () => {},
  toggle: () => {},
  reset: () => {},
  notify: () => {},
};
const useNav = () => React.useContext(NavCtx) ?? NO_OP_NAV;

// Track viewport width — for desktop/mobile screen swap in the prototype
function useViewport() {
  const [w, setW] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  React.useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return { width: w, isMobile: w < 720 };
}

// Step progress indicator — shown in the AppShell when prototype is active
const ProtoStepIndicator = ({ steps, current }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
    {steps.map((s, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={s.id}>
          {i > 0 ? <span style={{ width:14, height:1, background: done ? 'var(--accent)' : 'var(--line)' }}/> : null}
          <span style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding:'4px 9px', borderRadius:999,
            fontSize:10.5, fontWeight:600,
            background: active ? 'var(--accent-soft)' : done ? '#fff' : 'transparent',
            color: active ? 'var(--accent)' : done ? 'var(--ink)' : 'var(--ink-faint)',
            border: active ? '1px solid var(--accent)' : done ? '1px solid var(--accent)' : '1px solid var(--line)',
          }}>
            <span style={{
              width:14, height:14, borderRadius:'50%',
              background: done ? 'var(--accent)' : active ? '#fff' : 'transparent',
              border: active ? '1.5px solid var(--accent)' : 'none',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontFamily:'JetBrains Mono', fontSize:9, fontWeight:700,
              color: done ? '#fff' : active ? 'var(--accent)' : 'var(--ink-faint)',
            }}>
              {done ? <Icon name="check" size={9} color="#fff" strokeWidth={3}/> : (i+1)}
            </span>
            {s.label}
          </span>
        </React.Fragment>
      );
    })}
  </div>
);

// Wordmark
const Logo = ({ size = 22, inverted }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <svg width={size+5} height={size+5} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" rx="6" fill={inverted ? 'var(--paper)' : 'var(--ink)'}/>
      <path
        d="M 9 8 L 9 19 M 13 12 L 13 19 M 13 12 Q 13 8 17 8 M 17 19 L 17 14 Q 17 12 19 12 M 21 16 L 21 18"
        stroke={inverted ? 'var(--ink)' : 'var(--paper)'} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
    <span className="display" style={{
      fontSize: size, letterSpacing: -0.03, lineHeight: 1,
      color: inverted ? 'var(--paper)' : 'var(--ink)',
    }}>letra<span style={{ color: 'var(--accent)' }}>.</span></span>
  </div>
);

// Generic icon glyphs — stroke based, restrained
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => {
  const s = size;
  const sw = strokeWidth;
  const common = { fill:'none', stroke:color, strokeWidth: sw, strokeLinecap:'round', strokeLinejoin:'round' };
  switch (name) {
    case 'bank':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 10 L12 4 L21 10 M5 10 L5 18 M9 10 L9 18 M15 10 L15 18 M19 10 L19 18 M3 20 L21 20" {...common}/></svg>;
    case 'house':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 11 L12 4 L20 11 L20 20 L4 20 Z M10 20 L10 14 L14 14 L14 20" {...common}/></svg>;
    case 'shield':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 V6 Z" {...common}/></svg>;
    case 'briefcase':
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5" {...common}/><path d="M9 7 V5 H15 V7" {...common}/></svg>;
    case 'wrench':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 3 A5 5 0 0 0 9 11 L3 17 L7 21 L13 15 A5 5 0 0 0 21 10 L17 14 L13 10 Z" {...common}/></svg>;
    case 'hammer':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 4 L20 10 L17 13 L11 7 Z M11 7 L4 14 L7 17 L14 10" {...common}/></svg>;
    case 'file':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 3 L15 3 L20 8 L20 21 L6 21 Z M15 3 L15 8 L20 8" {...common}/></svg>;
    case 'plus':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" {...common}/></svg>;
    case 'upload':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 17 V5 M6 11 L12 5 L18 11 M4 19 H20" {...common}/></svg>;
    case 'send':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 12 L21 4 L15 21 L12 13 Z" {...common}/></svg>;
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 12 L10 17 L19 7" {...common}/></svg>;
    case 'check-circle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...common}/><path d="M8 12 L11 15 L16 9" {...common}/></svg>;
    case 'x':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" {...common}/></svg>;
    case 'chevron-r':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 5 L16 12 L9 19" {...common}/></svg>;
    case 'chevron-d':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 9 L12 16 L19 9" {...common}/></svg>;
    case 'arrow-r':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 12 H20 M14 6 L20 12 L14 18" {...common}/></svg>;
    case 'arrow-l':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M20 12 H4 M10 6 L4 12 L10 18" {...common}/></svg>;
    case 'sparkle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L13.5 9 L20 10.5 L13.5 12 L12 18 L10.5 12 L4 10.5 L10.5 9 Z" {...common}/></svg>;
    case 'shield-check':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 V6 Z M8 12 L11 15 L16 10" {...common}/></svg>;
    case 'globe':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...common}/><path d="M3 12 H21 M12 3 C15 6 16.5 9 16.5 12 C16.5 15 15 18 12 21 C9 18 7.5 15 7.5 12 C7.5 9 9 6 12 3" {...common}/></svg>;
    case 'scale':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 4 V20 M5 20 H19 M7 8 L4 14 H10 L7 8 Z M17 8 L14 14 H20 L17 8 Z M12 5 L7 8 M12 5 L17 8" {...common}/></svg>;
    case 'chart':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 20 V4 M4 20 H20 M8 16 V12 M12 16 V8 M16 16 V14" {...common}/></svg>;
    case 'compare':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M9 4 H4 V20 H9 M15 4 H20 V20 H15 M9 8 V16 M15 8 V16 M12 4 V20" {...common}/></svg>;
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 20 H8 L18 10 L14 6 L4 16 Z M14 6 L18 10" {...common}/></svg>;
    case 'mail':
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" {...common}/><path d="M3 7 L12 13 L21 7" {...common}/></svg>;
    case 'sliders':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 7 H20 M4 12 H20 M4 17 H20" {...common}/><circle cx="9" cy="7" r="2.2" fill="#fff" {...common}/><circle cx="15" cy="12" r="2.2" fill="#fff" {...common}/><circle cx="7" cy="17" r="2.2" fill="#fff" {...common}/></svg>;
    case 'search':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" {...common}/><path d="M16 16 L20 20" {...common}/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" {...common}/></svg>;
  }
};

// Google "G" — schematic, not the real Google mark
const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21.6 12.2 C21.6 11.4 21.5 10.7 21.4 10 H12 V13.9 H17.4 C17.2 15.2 16.4 16.3 15.3 17 V19.5 H18.6 C20.5 17.8 21.6 15.2 21.6 12.2 Z" fill="#4285F4"/>
    <path d="M12 22 C14.7 22 17 21.1 18.6 19.5 L15.3 17 C14.4 17.6 13.3 18 12 18 C9.4 18 7.2 16.3 6.4 13.9 H3 V16.4 C4.6 19.7 8 22 12 22 Z" fill="#34A853"/>
    <path d="M6.4 13.9 C6.2 13.3 6.1 12.7 6.1 12 C6.1 11.3 6.2 10.7 6.4 10.1 V7.6 H3 C2.4 8.9 2 10.4 2 12 C2 13.6 2.4 15.1 3 16.4 L6.4 13.9 Z" fill="#FBBC05"/>
    <path d="M12 6 C13.5 6 14.8 6.5 15.8 7.5 L18.7 4.7 C17 3.1 14.7 2 12 2 C8 2 4.6 4.3 3 7.6 L6.4 10.1 C7.2 7.7 9.4 6 12 6 Z" fill="#EA4335"/>
  </svg>
);

// Doc-type badge — persistent across screens
const DocBadge = ({ icon='bank', label='Crédito de consumo', market='Chile · CMF',
                    confidence='high', compact=false }) => {
  const isLow = confidence === 'low';
  const isUnsupported = confidence === 'unsupported';
  const accent = isUnsupported ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--accent)';
  const accentBg = isUnsupported ? 'var(--red-soft)' : isLow ? 'var(--amber-soft)' : 'var(--accent-soft)';
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap: compact?8:12,
      padding: compact ? '5px 9px 5px 5px' : '7px 10px 7px 7px',
      background:'#fff',
      border:'1px solid var(--line)',
      borderRadius: 12,
    }}>
      <div style={{
        width: compact?28:34, height: compact?28:34,
        borderRadius: compact?7:9, background: accentBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        flex:'0 0 auto',
      }}>
        <Icon name={icon} size={compact?15:18} color={accent}/>
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="label" style={{ fontSize: compact?9:10 }}>
            {isUnsupported ? 'No soportado' : 'Identificado'}
          </span>
          <ConfidenceDots confidence={confidence} accent={accent}/>
        </div>
        <div style={{
          fontWeight:700, fontSize: compact?13:14, letterSpacing:-0.01, marginTop:2, lineHeight:1.1,
        }}>
          {label}{' '}
          <span style={{ color:'var(--ink-faint)', fontWeight:500 }}>· {market}</span>
        </div>
      </div>
      {!compact ? (
        <>
          <span style={{ width:1, height:24, background:'var(--line)' }}/>
          <button className="btn btn-small">Cambiar</button>
        </>
      ) : null}
    </div>
  );
};

const ConfidenceDots = ({ confidence, accent }) => {
  const filled = confidence === 'high' ? 3 : confidence === 'low' ? 2 : confidence === 'unsupported' ? 0 : 1;
  return (
    <span style={{ display:'inline-flex', gap:3 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:5, height:5, borderRadius:'50%',
          background: i < filled ? accent : 'rgba(0,0,0,0.12)',
        }}/>
      ))}
    </span>
  );
};

// App shell — top bar shared across logged-in screens
const PROTO_STEPS = [
  { id:'upload',    label:'Subir' },
  { id:'process',   label:'Identificar' },
  { id:'plan',      label:'Plan' },
  { id:'coach',     label:'Análisis' },
];
const PROTO_STEP_INDEX = {
  welcome: 0,
  upload: 0,
  process: 1, detect: 1, low: 1, unsupported: 1, failed: 1,
  plan: 2, running: 2,
  coach: 3, detail: 3, share: 3, email: 3, compare: 3, history: 3,
};

function AvatarMenu({ nav }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position:'relative', marginLeft:6 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:32, height:32, borderRadius:'50%',
        background:'var(--paper-2)',
        border: open ? '1.5px solid var(--accent)' : '1.5px solid transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600,
        cursor:'pointer', padding:0,
        transition:'border-color .15s',
      }}>JR</button>
      {open ? (
        <>
          <div style={{
            position:'fixed', inset:0, zIndex:40,
          }} onClick={() => setOpen(false)}/>
          <div className="card" style={{
            position:'absolute', top:42, right:0, zIndex:50,
            minWidth:220, padding:6,
            boxShadow:'0 18px 36px -10px rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--line)' }}>
              <div style={{ fontSize:12.5, fontWeight:700 }}>Juan R.</div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', fontFamily:'JetBrains Mono', marginTop:2 }}>juan@gmail.com</div>
            </div>
            <MenuItem icon="briefcase" label="Configuración"
              onClick={() => { setOpen(false); nav.go('settings'); }}/>
            <MenuItem icon="file" label="Mis documentos"
              onClick={() => { setOpen(false); nav.go('history'); }}/>
            <div style={{ height:1, background:'var(--line)', margin:'4px 0' }}/>
            <MenuItem icon="x" label="Cerrar sesión"
              onClick={() => { setOpen(false); nav.go('login'); }}/>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'8px 12px', width:'100%',
      background:'transparent', border:'none', cursor:'pointer',
      borderRadius:6, textAlign:'left',
      fontFamily:'Manrope', fontSize:13, color:'var(--ink)',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon name={icon} size={14} color="var(--ink-soft)"/>
      {label}
    </button>
  );
}

const AppShell = ({ children, activeNav='Análisis', rightExtra }) => {
  const nav = useNav();
  const showProtoBar = nav.interactive;
  return (
  <div className="lt">
    <div style={{
      padding:'14px 32px',
      display:'flex', alignItems:'center', gap:6,
      borderBottom:'1px solid var(--line)',
      background: 'var(--paper)',
    }}>
      <Logo />
      {showProtoBar ? (
        <div style={{ marginLeft:24 }}>
          <ProtoStepIndicator steps={PROTO_STEPS} current={PROTO_STEP_INDEX[nav.state.step] ?? 0}/>
        </div>
      ) : (
        <div style={{ display:'flex', gap:2, marginLeft:28 }}>
          {['Análisis','Mis documentos','Comparar','Ayuda'].map(n => (
            <span key={n} style={{
              padding:'7px 12px', borderRadius:8,
              fontSize:13.5, fontWeight:500,
              background: n===activeNav ? 'var(--paper-2)' : 'transparent',
              color: n===activeNav ? 'var(--ink)' : 'var(--ink-soft)',
              cursor:'pointer',
            }}>{n}</span>
          ))}
        </div>
      )}
      <div style={{ flex:1 }}/>
      {rightExtra}
      {showProtoBar ? (
        <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-soft)', marginLeft:8 }} onClick={() => nav.reset()}>
          ↻ Reiniciar
        </button>
      ) : (
        <button className="btn btn-small" style={{ marginLeft:8 }}>
          <Icon name="plus" size={14}/> Nuevo
        </button>
      )}
      {nav.interactive ? (
        <AvatarMenu nav={nav}/>
      ) : (
        <div style={{
          width:32, height:32, borderRadius:'50%',
          background:'var(--paper-2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600,
          marginLeft:6,
        }}>JR</div>
      )}
    </div>
    <div style={{ position:'absolute', top:61, left:0, right:0, bottom:0, overflow:'auto' }}>
      {children}
    </div>
  </div>
  );
};

// Stat card
const StatCard = ({ label, value, sub, delta, sev }) => {
  const valColor = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : sev==='mid' ? 'var(--amber)' : 'var(--ink)';
  const pillCls  = sev==='hi' ? 'pill-red' : sev==='ok' ? 'pill-green' : sev==='mid' ? 'pill-amber' : 'pill-accent';
  return (
    <div className="card" style={{ padding:'18px 20px', flex:1, minWidth:0 }}>
      <div className="label">{label}</div>
      <div className="num display" style={{
        fontSize:30, marginTop:8, color: valColor, lineHeight:1, letterSpacing:-0.02,
      }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
        {delta ? <span className={`pill ${pillCls}`} style={{ padding:'2px 7px', fontSize:11 }}>{delta}</span> : null}
        <span style={{ fontSize:12, color:'var(--ink-faint)' }}>{sub}</span>
      </div>
    </div>
  );
};

// Toggle
const Toggle = ({ on=true, size=30 }) => {
  const h = Math.round(size*0.6);
  const knob = h - 6;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      width: size, height: h,
      borderRadius: 999,
      background: on ? 'var(--accent)' : 'var(--paper-3)',
      padding: 3, boxSizing:'border-box',
      transition:'background .15s',
      flex:'0 0 auto', cursor:'pointer',
    }}>
      <span style={{
        width: knob, height: knob, borderRadius:'50%', background:'#fff',
        transform: on ? `translateX(${size - knob - 6}px)` : 'translateX(0)',
        transition:'transform .15s',
        boxShadow:'0 1px 2px rgba(0,0,0,.15)',
      }}/>
    </span>
  );
};

// Progress
const ProgressBar = ({ pct, accent }) => (
  <div style={{ height:6, background:'var(--paper-2)', borderRadius:3, overflow:'hidden' }}>
    <div style={{ width:`${pct}%`, height:'100%', background: accent || 'var(--ink)', borderRadius:3, transition:'width .3s ease' }}/>
  </div>
);

// Sectioned card — used a lot
const SectionCard = ({ title, subtitle, right, children, padding=22 }) => (
  <div className="card" style={{ padding }}>
    {(title || right) ? (
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: subtitle ? 4 : 16 }}>
        <h2 className="display" style={{ fontSize:18, margin:0, letterSpacing:-0.015 }}>{title}</h2>
        {right}
      </div>
    ) : null}
    {subtitle ? <div style={{ fontSize:12.5, color:'var(--ink-faint)', marginBottom:16 }}>{subtitle}</div> : null}
    {children}
  </div>
);

Object.assign(window, { Logo, Icon, GoogleG, DocBadge, ConfidenceDots, AppShell, StatCard, Toggle, ProgressBar, SectionCard, LENSES, LensTag, LensScorecard, LensScorecardCard, NavCtx, useNav, useViewport, ProtoStepIndicator });

// ===== LENSES — the 4 analytical perspectives =====
// Every finding/action carries one or more lens tags so the user can see
// from which perspective the document is strong or weak.

const LENSES = {
  ley: {
    id:'ley',
    label:'Ley · Chile',
    short:'Ley',
    icon:'scale',
    color:'#3b4a6b',        // slate blue
    softColor:'#e6eaf3',
  },
  mercado: {
    id:'mercado',
    label:'Mercado',
    short:'Mercado',
    icon:'chart',
    color:'#246a5b',        // teal (matches accent)
    softColor:'#d9e8e3',
  },
  comparar: {
    id:'comparar',
    label:'vs. otras ofertas',
    short:'vs. otras',
    icon:'compare',
    color:'#7a4b6f',        // plum
    softColor:'#f3e6ee',
  },
  intl: {
    id:'intl',
    label:'Internacional',
    short:'Internacional',
    icon:'globe',
    color:'#8a6f3d',        // warm tan
    softColor:'#f3ecd9',
  },
};

// Small tag chip attached to findings & actions
function LensTag({ id, size='sm' }) {
  const L = LENSES[id];
  if (!L) return null;
  const fs = size === 'lg' ? 11.5 : 10.5;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px',
      borderRadius:999,
      background: L.softColor,
      color: L.color,
      fontSize: fs, fontWeight:600, letterSpacing:0.01,
      lineHeight:1.2,
    }}>
      <Icon name={L.icon} size={fs+2} color={L.color} strokeWidth={1.75}/>
      {L.short}
    </span>
  );
}

// Single card in the scorecard — communicates strength/weakness per lens
function LensScorecardCard({ lens, status, headline, summary, count }) {
  // status: 'strong' | 'weak' | 'attention' | 'ref'
  const L = LENSES[lens];
  const statusColor =
    status === 'strong' ? 'var(--green)' :
    status === 'weak' ? 'var(--red)' :
    status === 'attention' ? 'var(--amber)' :
    'var(--ink-faint)';
  const statusLabel =
    status === 'strong' ? 'Sólido' :
    status === 'weak' ? 'Débil' :
    status === 'attention' ? 'Atención' :
    'Referencia';
  const statusIcon =
    status === 'strong' ? 'check-circle' :
    status === 'ref' ? 'globe' :
    'sparkle';

  return (
    <div className="card" style={{
      padding:0, flex:1, minWidth:0, overflow:'hidden',
      position:'relative',
    }}>
      {/* Accent strip at top */}
      <div style={{ height:3, background: L.color }}/>

      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background: L.softColor,
            display:'flex', alignItems:'center', justifyContent:'center',
            flex:'0 0 auto',
          }}>
            <Icon name={L.icon} size={16} color={L.color}/>
          </div>
          <span style={{ fontSize:13.5, fontWeight:700, letterSpacing:-0.01, flex:1, minWidth:0 }}>{L.label}</span>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:4,
            fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:0.06,
            color: statusColor,
          }}>
            <Icon name={statusIcon} size={11} color={statusColor} strokeWidth={2}/>
            {statusLabel}
          </span>
        </div>

        <div className="num display" style={{
          fontSize:22, marginTop:12, letterSpacing:-0.025, lineHeight:1,
          color: status==='strong' ? 'var(--green)' : status==='weak' ? 'var(--red)' : status==='attention' ? 'var(--amber)' : 'var(--ink)',
        }}>{headline}</div>
        <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:6, lineHeight:1.45 }}>{summary}</div>

        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
          <span className="num" style={{ fontSize:11, color:'var(--ink-faint)' }}>{count}</span>
        </div>
      </div>
    </div>
  );
}

// The full row of 4 lens cards — drop this on the coach dashboard
function LensScorecard({ cards }) {
  return (
    <div style={{ display:'flex', gap:14 }}>
      {cards.map((c,i)=>(
        <LensScorecardCard key={i} {...c}/>
      ))}
    </div>
  );
}
