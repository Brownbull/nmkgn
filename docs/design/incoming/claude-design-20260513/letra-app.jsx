// letra. — Main flow canvas

const { DesignCanvas, DCSection, DCArtboard } = window;

const NotesCard = () => (
  <div style={{
    width:'100%', height:'100%',
    background:'#fffdf6',
    padding:'30px 32px',
    boxSizing:'border-box',
    border:'1px dashed #2b2620',
    borderRadius:6,
    fontFamily:'Manrope', color:'#1a1a1a',
    display:'flex', flexDirection:'column', gap:12,
    overflow:'hidden',
  }}>
    <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:0.08, color:'#8a8278', textTransform:'uppercase' }}>letra. · main flow · hi-fi</div>
    <h1 style={{ fontSize:24, fontWeight:700, margin:0, letterSpacing:-0.02, lineHeight:1.1 }}>The full flow in the chosen visual language.</h1>
    <div style={{ fontSize:13, color:'#4a423a', lineHeight:1.6 }}>
      Login → Upload → Detection (3 states) → Plan (select + running) → Coach → Compare → Email → History. Plus 4 mobile screens.
    </div>
    <div style={{ height:1, background:'#e6e0cf', margin:'6px 0' }}/>
    <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:12.5, color:'#4a423a', lineHeight:1.5 }}>
      <div><b>Type:</b> Manrope + JetBrains Mono · numbers tabular, headings -0.025em</div>
      <div><b>Palette:</b> warm off-white paper, ink, single deep-teal accent, semantic red/amber/green for severity</div>
      <div><b>Components:</b> rounded soft cards (14px), pill labels, persistent DocBadge, four-step nav</div>
      <div><b>Voice:</b> direct, plain Spanish, named numbers ("$1.4M de más"), no jargon</div>
    </div>
    <div style={{ height:1, background:'#e6e0cf', margin:'6px 0' }}/>
    <div style={{ fontSize:12, color:'#8a8278', lineHeight:1.5 }}>
      The doc-type badge stays visible across every analysis screen — that's the persistent "we know what this is" signal. International references are styled as soft beige cards (not red/amber) so they never read as alerts.
    </div>
  </div>
);

const App = () => (
  <DesignCanvas>
    <DCSection
      id="notes"
      title="letra. · hi-fi main flow"
      subtitle="Open any artboard fullscreen to inspect. Drag to reorder. Each screen is a focal point of the user journey."
    >
      <DCArtboard id="notes-card" label="Notes" width={460} height={740}>
        <NotesCard />
      </DCArtboard>
      <DCArtboard id="login" label="1 · Login" width={1280} height={740}>
        <LT_Login />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="entry"
      title="Step 0 · Onboarding"
      subtitle="First-time visitors land here after Google login. 3-step intro, skippable. Sets seenWelcome=true."
    >
      <DCArtboard id="welcome" label="Onboarding (3 steps)" width={1280} height={780}>
        <LT_Welcome />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="entry-upload"
      title="Step 1 · Subir documento"
      subtitle="Type picker + drop zone. Type tiles surface what we can analyze; drag-and-drop accepts everything and lets us auto-detect."
    >
      <DCArtboard id="upload" label="Upload" width={1100} height={780}>
        <LT_Upload />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="detect"
      title="Step 2 · Identificación de documento"
      subtitle="Three states. The badge component appears on every screen after this point."
    >
      <DCArtboard id="d-processing" label="2a · Processing" width={1000} height={720}>
        <LT_DetectProcessing />
      </DCArtboard>
      <DCArtboard id="d-ready" label="2b · Identified (high confidence)" width={1000} height={720}>
        <LT_DetectReady />
      </DCArtboard>
      <DCArtboard id="d-low" label="2c · Low confidence" width={1100} height={760}>
        <LT_DetectLow />
      </DCArtboard>
      <DCArtboard id="d-unsupported" label="2d · Unsupported" width={1100} height={760}>
        <LT_DetectUnsupported />
      </DCArtboard>
      <DCArtboard id="d-failed" label="2e · Read failed" width={1100} height={820}>
        <LT_AnalysisFailed />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="plan"
      title="Step 3 · Plan de análisis"
      subtitle="Criteria selection + running progress. International references are clearly tagged as 'solo referencia'."
    >
      <DCArtboard id="plan-select" label="3a · Select criteria" width={1280} height={780}>
        <LT_Plan />
      </DCArtboard>
      <DCArtboard id="plan-running" label="3b · Running" width={1280} height={780}>
        <LT_PlanRunning />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="coach"
      title="Step 4 · Coach dashboard  ⭐"
      subtitle="The marquee screen. Doc-type badge + headline impact + KPIs + market chart + action plan + international context."
    >
      <DCArtboard id="coach" label="Coach dashboard" width={1280} height={1040}>
        <LT_Coach />
      </DCArtboard>
      <DCArtboard id="detail" label="Finding detail · drill-down" width={1280} height={920}>
        <LT_FindingDetail />
      </DCArtboard>
      <DCArtboard id="share" label="Compartir + Re-analizar" width={1280} height={920}>
        <LT_Share />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="after"
      title="Step 5 · Acciones posteriores"
      subtitle="Comparar dos ofertas, redactar email al banco, consultar el historial."
    >
      <DCArtboard id="compare" label="Compare two offers" width={1280} height={820}>
        <LT_Compare />
      </DCArtboard>
      <DCArtboard id="email" label="Email al banco" width={1280} height={820}>
        <LT_Email />
      </DCArtboard>
      <DCArtboard id="history" label="Mis documentos" width={1280} height={820}>
        <LT_History />
      </DCArtboard>
      <DCArtboard id="history-empty" label="Mis documentos · vacío" width={1100} height={780}>
        <LT_HistoryEmpty />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="settings"
      title="Configuración · perfil, países, plan, notificaciones, privacidad"
      subtitle="Accesible desde el menú del avatar. Sidebar de 5 secciones; cada una con sus propios controles."
    >
      <DCArtboard id="settings" label="Configuración" width={1280} height={1100}>
        <LT_Settings />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="mobile-entry"
      title="Mobile · Onboarding + entrada"
      subtitle="Pantallas iniciales adaptadas al teléfono. Persistent doc-type badge se compacta a una fila."
    >
      <DCArtboard id="m-welcome" label="01 · Welcome" width={360} height={760}>
        <LT_M_Welcome />
      </DCArtboard>
      <DCArtboard id="m-login" label="02 · Login" width={360} height={740}>
        <LT_M_Login />
      </DCArtboard>
      <DCArtboard id="m-upload" label="03 · Subir" width={360} height={760}>
        <LT_M_Upload />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="mobile-detect"
      title="Mobile · Identificación (4 estados)"
      subtitle="Procesando, alta confianza, baja confianza, no soportado, y error de lectura."
    >
      <DCArtboard id="m-processing" label="2a · Processing" width={360} height={760}>
        <LT_M_Processing />
      </DCArtboard>
      <DCArtboard id="m-detect" label="2b · Alta confianza" width={360} height={760}>
        <LT_M_DetectReady />
      </DCArtboard>
      <DCArtboard id="m-detect-low" label="2c · Baja confianza" width={360} height={740}>
        <LT_M_Detect />
      </DCArtboard>
      <DCArtboard id="m-unsupported" label="2d · No soportado" width={360} height={780}>
        <LT_M_Unsupported />
      </DCArtboard>
      <DCArtboard id="m-failed" label="2e · Error de lectura" width={360} height={780}>
        <LT_M_Failed />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="mobile-plan-coach"
      title="Mobile · Plan + análisis"
      subtitle="Plan selection, running con progreso parcial, Coach dashboard apilado verticalmente."
    >
      <DCArtboard id="m-plan" label="03 · Plan" width={360} height={740}>
        <LT_M_Plan />
      </DCArtboard>
      <DCArtboard id="m-running" label="04 · Running" width={360} height={760}>
        <LT_M_Running />
      </DCArtboard>
      <DCArtboard id="m-coach" label="04 · Coach" width={360} height={920}>
        <LT_M_Coach />
      </DCArtboard>
      <DCArtboard id="m-detail" label="Finding detail" width={360} height={760}>
        <LT_M_FindingDetail />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="mobile-after"
      title="Mobile · Acciones posteriores"
      subtitle="Email composer con selector de tono, compare apilado, share + re-analizar."
    >
      <DCArtboard id="m-email" label="Email al banco" width={360} height={780}>
        <LT_M_Email />
      </DCArtboard>
      <DCArtboard id="m-compare" label="Comparar 2 ofertas" width={360} height={780}>
        <LT_M_Compare />
      </DCArtboard>
      <DCArtboard id="m-share" label="Compartir + re-analizar" width={360} height={820}>
        <LT_M_Share />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="mobile-account"
      title="Mobile · Historial + cuenta"
      subtitle="Lista de documentos en stats compactos, vista vacía, hub de configuración."
    >
      <DCArtboard id="m-history" label="Mis documentos" width={360} height={780}>
        <LT_M_History />
      </DCArtboard>
      <DCArtboard id="m-history-empty" label="Historial · vacío" width={360} height={720}>
        <LT_M_HistoryEmpty />
      </DCArtboard>
      <DCArtboard id="m-settings" label="Configuración" width={360} height={780}>
        <LT_M_Settings />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
