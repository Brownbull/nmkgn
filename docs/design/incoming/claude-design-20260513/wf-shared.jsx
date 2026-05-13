// Shared sketchy primitives for the wireframes
// Loaded as a Babel script. Components exported to window.

const GoogleG = ({ size = 18 }) => (
  // Simple sketchy "G" mark — not the Google logo. A circle with a hand-drawn G glyph.
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1f1b16" strokeWidth="1.5"/>
    <path d="M 16 11.5 L 12 11.5 L 12 13.5 L 14.2 13.5 C 13.8 14.8 12.9 15.5 11.5 15.5 C 9.5 15.5 8 14 8 12 C 8 10 9.5 8.5 11.5 8.5 C 12.4 8.5 13.2 8.8 13.8 9.4"
      fill="none" stroke="#1f1b16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Logo = ({ inverted } = {}) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="3" width="20" height="26" rx="2" fill="none" stroke={inverted ? '#fbf8f1' : '#1f1b16'} strokeWidth="1.75"/>
      <path d="M 8 9 L 20 9 M 8 13 L 18 13 M 8 17 L 20 17 M 8 21 L 14 21" stroke={inverted ? '#fbf8f1' : '#1f1b16'} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="23" cy="22" r="5" fill={inverted ? '#1f1b16' : '#fbf8f1'} stroke={inverted ? '#fbf8f1' : '#1f1b16'} strokeWidth="1.75"/>
      <path d="M 21 22 L 22.5 23.5 L 25 21" fill="none" stroke={inverted ? '#fbf8f1' : '#1f1b16'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:18, color: inverted ? 'var(--paper)' : 'var(--ink)' }}>
      LetraChica
    </div>
  </div>
);

// Hand-drawn arrow between points
const Squiggle = ({ width = 60, height = 18, style }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style} aria-hidden="true">
    <path d={`M 2 ${height/2} Q ${width*0.25} 2, ${width*0.5} ${height/2} T ${width-2} ${height/2}`}
      stroke="#1f1b16" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

// App bar (web)
const AppBar = ({ title, right }) => (
  <div className="between" style={{ marginBottom:18, paddingBottom:10, borderBottom:'1.5px solid var(--rule)' }}>
    <Logo />
    {title ? <div className="hand-h3" style={{ color:'var(--ink-soft)' }}>{title}</div> : null}
    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
      {right || (
        <>
          <span className="small">Mis documentos</span>
          <span className="small">Ayuda</span>
          <div className="hb" style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:11, background:'#fff' }}>JR</div>
        </>
      )}
    </div>
  </div>
);

const PhoneStatusBar = () => (
  <div className="phone-status">
    <span>9:41</span>
    <span>•••</span>
  </div>
);

// A row of placeholder lines
const PhLines = ({ rows = 3 }) => (
  <div className="col gap-6" style={{ width:'100%' }}>
    {Array.from({length:rows}).map((_,i)=> (
      <div key={i} className={`ph-line ${i===rows-1?'short':i%2?'mid':'full'}`}></div>
    ))}
  </div>
);

// A flag list row item (severity, title, where)
const FlagRow = ({ sev, title, where, savings }) => (
  <div className="hb-soft" style={{ padding:'10px 12px', display:'flex', gap:10, alignItems:'flex-start' }}>
    <span className={`dot ${sev}`} style={{ marginTop:6 }}></span>
    <div className="grow">
      <div style={{ fontWeight:700, fontSize:15, lineHeight:1.2 }}>{title}</div>
      <div className="micro" style={{ marginTop:3 }}>{where}</div>
    </div>
    {savings ? <span className="flag mid" style={{ alignSelf:'center' }}>{savings}</span> : null}
  </div>
);

// Doc type tile (a card with an icon)
const DocTile = ({ icon, label, sub, selected }) => (
  <div className="hb-soft" style={{
    padding:'14px 14px 12px',
    background: selected ? '#fff3d8' : '#fff',
    boxShadow: selected ? '3px 3px 0 var(--rule)' : '2px 2px 0 rgba(0,0,0,.06)',
    cursor:'pointer',
    minHeight: 90,
    display:'flex', flexDirection:'column', justifyContent:'space-between',
  }}>
    <div style={{ fontSize:22, lineHeight:1 }}>{icon}</div>
    <div>
      <div style={{ fontWeight:700, fontSize:15 }}>{label}</div>
      <div className="micro" style={{ marginTop:2 }}>{sub}</div>
    </div>
  </div>
);

// A simple icon glyph drawn with SVG strokes — used in tiles
const Glyph = ({ name, size = 22 }) => {
  const s = size;
  const stroke = "#1f1b16";
  const sw = 1.75;
  switch (name) {
    case 'bank':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 10 L12 4 L21 10 M5 10 L5 18 M9 10 L9 18 M15 10 L15 18 M19 10 L19 18 M3 20 L21 20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case 'house':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 11 L12 4 L20 11 L20 20 L4 20 Z M10 20 L10 14 L14 14 L14 20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case 'shield':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 V6 Z" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case 'briefcase':
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5" fill="none" stroke={stroke} strokeWidth={sw}/><path d="M9 7 V5 H15 V7" fill="none" stroke={stroke} strokeWidth={sw}/></svg>;
    case 'wrench':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 3 A5 5 0 0 0 9 11 L3 17 L7 21 L13 15 A5 5 0 0 0 21 10 L17 14 L13 10 Z" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case 'hammer':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M14 4 L20 10 L17 13 L11 7 Z M11 7 L4 14 L7 17 L14 10" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case 'file':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 3 L15 3 L20 8 L20 21 L6 21 Z M15 3 L15 8 L20 8" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case 'plus':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case 'upload':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 17 V5 M6 11 L12 5 L18 11 M4 19 H20" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'send':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 12 L21 4 L15 21 L12 13 Z" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" fill="none" stroke={stroke} strokeWidth={sw}/></svg>;
  }
};

// Frame: a desktop artboard wrapper
const Web = ({ children }) => (
  <div className="wf">
    <div className="wf-edge"></div>
    <div className="wf-inner">{children}</div>
  </div>
);

// Phone frame
const Phone = ({ children }) => (
  <div className="phone">
    <div className="phone-screen">
      <div className="phone-notch"></div>
      <PhoneStatusBar />
      <div style={{ position:'absolute', inset:0, paddingTop:36, paddingLeft:14, paddingRight:14, paddingBottom:14, boxSizing:'border-box', display:'flex', flexDirection:'column' }}>
        {children}
      </div>
    </div>
  </div>
);

Object.assign(window, {
  GoogleG, Logo, Squiggle, AppBar, PhoneStatusBar, PhLines, FlagRow, DocTile, Glyph, Web, Phone,
  DocTypeBadge, ConfidenceMeter, SupportedTypesList, UnsupportedBanner, AppBarWithBadge,
});

// ===== Document-type identification primitives =====
// The kind of document is a first-class concept — surfaced on every screen.
// Confidence: 'high' | 'low' | 'unknown' | 'unsupported'

function ConfidenceMeter({ confidence }) {
  const filled =
    confidence === 'high' ? 3 :
    confidence === 'low' ? 2 :
    confidence === 'unknown' ? 1 : 0;
  const color =
    confidence === 'high' ? 'var(--ok)' :
    confidence === 'low' ? 'var(--mid)' :
    'var(--hi)';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2 }} aria-label={`confianza ${confidence}`}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 4, height: 10 + i*2, borderRadius: 1,
          background: i < filled ? color : 'rgba(0,0,0,.12)',
          border: '1px solid var(--rule)',
          display: 'inline-block',
        }}/>
      ))}
    </span>
  );
}

// The badge. Sticky pill that shows "Identified as X · confidence" with a change action.
// Variants:
//   confidence='high'        — green confidence, normal pill
//   confidence='low'         — amber, asks user to confirm
//   confidence='unsupported' — red, "we don't support this type"
function DocTypeBadge({ icon='bank', label='Crédito de consumo', market='Chile · CMF',
                       confidence='high', onChange }) {
  const isUnsupported = confidence === 'unsupported';
  const bg =
    isUnsupported ? '#fde4dd' :
    confidence === 'low' ? '#fbeccf' :
    '#fff';
  const border =
    isUnsupported ? 'var(--hi)' :
    confidence === 'low' ? 'var(--mid)' :
    'var(--rule)';
  return (
    <div className="hb-soft" style={{
      display:'inline-flex', alignItems:'center', gap:10,
      padding:'5px 8px 5px 6px',
      background: bg, borderColor: border, borderWidth: 1.5,
      boxShadow:'2px 2px 0 rgba(0,0,0,.05)',
      maxWidth:'100%',
    }}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:26, height:26, borderRadius:4, background:'#fff', border:'1.25px solid var(--rule)' }}>
        <Glyph name={icon} size={16}/>
      </span>
      <div style={{ display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="small" style={{ fontSize:9 }}>{isUnsupported ? 'No soportado' : 'Identificado como'}</span>
          <ConfidenceMeter confidence={confidence}/>
        </div>
        <div style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:14, lineHeight:1.1 }}>
          {label} <span className="micro" style={{ fontWeight:400 }}>· {market}</span>
        </div>
      </div>
      <button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:11, marginLeft:4, boxShadow:'none' }}>
        Cambiar
      </button>
    </div>
  );
}

// AppBar variant that puts the doc-type badge inline. Used across every analysis screen.
function AppBarWithBadge({ badge, right }) {
  return (
    <div className="between" style={{ marginBottom:14, paddingBottom:10, borderBottom:'1.5px solid var(--rule)', gap:12 }}>
      <Logo />
      <div style={{ flex:1, display:'flex', justifyContent:'center', minWidth:0 }}>{badge}</div>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        {right || (
          <>
            <span className="small">Mis documentos</span>
            <div className="hb" style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:11, background:'#fff' }}>JR</div>
          </>
        )}
      </div>
    </div>
  );
}

const SUPPORTED_TYPES = [
  { icon:'bank',      label:'Crédito bancario',  sub:'Consumo · Hipotecario · Automotriz' },
  { icon:'house',     label:'Arriendo',          sub:'Vivienda · Comercial' },
  { icon:'shield',    label:'Seguro',            sub:'Vida · Auto · Salud' },
  { icon:'briefcase', label:'Contrato laboral',  sub:'Indefinido · Plazo fijo' },
  { icon:'wrench',    label:'Cotización taller', sub:'Reparación · Mantención' },
  { icon:'hammer',    label:'Propuesta obra',    sub:'Remodelación · Construcción' },
];

function SupportedTypesList({ compact }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(3, 1fr)', gap:8 }}>
      {SUPPORTED_TYPES.map((t,i)=>(
        <div key={i} className="hb-soft" style={{ padding:'8px 10px', background:'#fff', display:'flex', gap:8, alignItems:'center' }}>
          <Glyph name={t.icon} size={18}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, lineHeight:1.1 }}>{t.label}</div>
            <div className="micro" style={{ marginTop:2 }}>{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnsupportedBanner({ detected = "Términos y condiciones", filename = "tyc.pdf" }) {
  return (
    <div className="hb-soft" style={{ padding:'12px 14px', background:'#fde4dd', borderColor:'var(--hi)', borderWidth:1.5 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <span style={{ width:28, height:28, borderRadius:'50%', background:'var(--hi)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontWeight:700, flex:'0 0 auto' }}>!</span>
        <div style={{ flex:1, lineHeight:1.4 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Aún no analizamos este tipo de documento.</div>
          <div className="scribble" style={{ fontSize:13, marginTop:4 }}>
            Detectamos que <b>{filename}</b> parece ser <b>{detected}</b>. Para no darte un análisis equivocado, no lo vamos a procesar.
          </div>
        </div>
      </div>
    </div>
  );
}
