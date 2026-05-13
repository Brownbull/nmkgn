// Main app — wires every direction into the DesignCanvas.
// Order reflects priorities: Brief → Detection (cross-cutting) → D (chosen) → A/B/C (explored alternatives).

const { DesignCanvas, DCSection, DCArtboard, PostIt } = window;

const App = () => (
  <DesignCanvas>
    {/* ===== Intro / framing ===== */}
    <DCSection
      id="intro"
      title="Wireframe study · Contract analyzer"
      subtitle="Direction D chosen. Document-type identification is now a first-class, persistent element."
    >
      <DCArtboard id="brief" label="Brief" width={520} height={500}>
        <div className="wf" style={{ background:'#fffdf6' }}>
          <div className="wf-edge" style={{ borderStyle:'dashed' }}></div>
          <div className="wf-inner" style={{ padding:24 }}>
            <div className="small">El problema</div>
            <div className="hand-h1" style={{ fontSize:28, marginTop:4 }}>"Lo firmé porque tenía urgencia, pero ahora son 68 cuotas en vez de 60."</div>

            <div className="hand-h3" style={{ marginTop:18 }}>Casos que el producto resuelve</div>
            <div className="bullet-list" style={{ marginTop:8 }}>
              <div className="bullet-row">
                <span className="dot hi" style={{ marginTop:7, flex:'0 0 auto' }}></span>
                <div className="scribble">Crédito en Chile: CAE alta, cuotas extra, seguros vinculados.</div>
              </div>
              <div className="bullet-row">
                <span className="dot hi" style={{ marginTop:7, flex:'0 0 auto' }}></span>
                <div className="scribble">Cotización del taller con cargos que no se mencionaron.</div>
              </div>
              <div className="bullet-row">
                <span className="dot mid" style={{ marginTop:7, flex:'0 0 auto' }}></span>
                <div className="scribble">Contrato de arriendo con cláusulas abusivas escondidas.</div>
              </div>
              <div className="bullet-row">
                <span className="dot mid" style={{ marginTop:7, flex:'0 0 auto' }}></span>
                <div className="scribble">Comparación entre dos ofertas que "se ven iguales".</div>
              </div>
            </div>

            <div className="hand-h3" style={{ marginTop:18 }}>Dirección elegida</div>
            <div className="scribble" style={{ marginTop:4 }}>
              <b>D · Coach + comparación.</b> Benchmark vs. mercado, plan de acción, comparar ofertas. Las 3 direcciones alternativas (A, B, C) quedan abajo como referencia.
            </div>
          </div>
        </div>
      </DCArtboard>

      <DCArtboard id="login" label="Login · Google" width={520} height={500}>
        <A_Login />
      </DCArtboard>
    </DCSection>

    {/* ===== Entry: doc picker / upload ===== */}
    <DCSection
      id="entry"
      title="1 · Subir documento"
      subtitle="Picker explícito + zona de arrastre. Lista lo que sí podemos analizar antes de pedir el PDF."
    >
      <DCArtboard id="picker-a" label="Doc picker" width={520} height={500}>
        <A_Picker />
      </DCArtboard>
    </DCSection>

    {/* ===== Identificación de documento — cross-cutting ===== */}
    <DCSection
      id="detection"
      title="2 · Identificación de documento"
      subtitle="Decimos qué tipo es antes de analizar. Si no lo soportamos, lo decimos. La 'firma de identificación' es persistente en cada pantalla."
    >
      <DCArtboard id="det-processing" label="1. Procesando · identificando" width={620} height={520}>
        <Det_Processing />
      </DCArtboard>
      <DCArtboard id="det-high" label="2. Identificado · alta confianza" width={620} height={520}>
        <Det_HighConfidence />
      </DCArtboard>
      <DCArtboard id="det-low" label="3. Confianza baja · confirma" width={680} height={520}>
        <Det_LowConfidence />
      </DCArtboard>
      <DCArtboard id="det-unsupported" label="4. Tipo no soportado" width={680} height={520}>
        <Det_Unsupported />
      </DCArtboard>
      <DCArtboard id="det-mixed" label="5. Lote mixto" width={680} height={520}>
        <Det_MixedBatch />
      </DCArtboard>
      <DCArtboard id="det-mobile" label="Detección · mobile" width={290} height={580}>
        <Det_Mobile />
      </DCArtboard>
    </DCSection>

    {/* ===== Plan of analysis ===== */}
    <DCSection
      id="plan"
      title="3 · Plan de análisis"
      subtitle="Una vez identificado el tipo, mostramos qué criterios vamos a revisar — agrupados por fuente (ley local, mercado, otras ofertas, referencias internacionales). El usuario puede activar/desactivar."
    >
      <DCArtboard id="plan-hero" label="Plan · selección de criterios" width={820} height={560}>
        <Plan_Hero />
      </DCArtboard>
      <DCArtboard id="plan-running" label="Plan · análisis en curso" width={820} height={560}>
        <Plan_Running />
      </DCArtboard>
      <DCArtboard id="plan-mobile" label="Plan · mobile" width={290} height={580}>
        <Plan_Mobile />
      </DCArtboard>
    </DCSection>

    {/* ===== Direction D — chosen ===== */}
    <DCSection
      id="dir-d"
      title="4 · Coach + comparación  ⭐"
      subtitle="Dashboard con benchmark de mercado, plan de acción, comparación de ofertas, generación de email al banco, e historial."
    >
      <DCArtboard id="d-hero" label="Dashboard · benchmark + plan" width={760} height={640}>
        <D_Hero />
      </DCArtboard>
      <DCArtboard id="d-compare" label="Comparar 2 ofertas" width={760} height={520}>
        <D_Compare />
      </DCArtboard>
      <DCArtboard id="d-email" label="Email al banco" width={760} height={520}>
        <D_EmailDraft />
      </DCArtboard>
      <DCArtboard id="d-history" label="Mis documentos · historial" width={760} height={520}>
        <D_History />
      </DCArtboard>
      <DCArtboard id="d-mobile" label="Coach · mobile" width={290} height={580}>
        <D_Mobile />
      </DCArtboard>
    </DCSection>

    {/* ===== Alternatives — A / B / C explored but not chosen ===== */}
    <DCSection
      id="alt"
      title="Alternativas exploradas (no elegidas)"
      subtitle="Quedan para referencia o para mezclar elementos sueltos."
    >
      <DCArtboard id="a-report" label="A · Informe-primero" width={760} height={520}>
        <A_Report />
      </DCArtboard>
      <DCArtboard id="b-hero" label="B · Doc anotado" width={760} height={520}>
        <B_Hero />
      </DCArtboard>
      <DCArtboard id="b-detail" label="B · Detalle de hallazgo" width={680} height={520}>
        <B_Detail />
      </DCArtboard>
      <DCArtboard id="c-hero" label="C · Conversación" width={760} height={520}>
        <C_Hero />
      </DCArtboard>
      <DCArtboard id="picker-c" label="Picker conversacional" width={520} height={500}>
        <C_Picker />
      </DCArtboard>
      <DCArtboard id="a-mobile" label="A · mobile" width={290} height={580}>
        <A_Mobile />
      </DCArtboard>
      <DCArtboard id="b-mobile" label="B · mobile" width={290} height={580}>
        <B_Mobile />
      </DCArtboard>
      <DCArtboard id="c-mobile" label="C · mobile" width={290} height={580}>
        <C_Mobile />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
