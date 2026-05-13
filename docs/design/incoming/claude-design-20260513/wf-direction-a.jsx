// Direction A — Report-first
// "Upload → big risk report." The analysis IS the product.

const A_Login = () => (
  <Web>
    <div className="col" style={{ height:'100%', alignItems:'center', justifyContent:'center', textAlign:'center', gap:18 }}>
      <Logo />
      <div className="hand-h1" style={{ maxWidth:420 }}>Lee la letra chica<br/>antes de firmar.</div>
      <div className="scribble" style={{ maxWidth:380 }}>
        Sube un crédito, contrato o cotización. Te marcamos lo raro, lo abusivo y lo escondido.
      </div>
      <button className="btn" style={{ marginTop:6 }}>
        <GoogleG /> Continuar con Google
      </button>
      <div className="micro">Sin tarjeta · Tus documentos quedan privados</div>

      <div className="stickynote" style={{ position:'absolute', top:42, right:38, maxWidth:170 }}>
        Login simple — un solo botón. Sin formularios.
      </div>
    </div>
  </Web>
);

const A_Picker = () => (
  <Web>
    <AppBar title="¿Qué vamos a revisar?" />
    <div className="hand-h2">Elige el tipo de documento</div>
    <div className="scribble" style={{ marginTop:4 }}>Esto ajusta los estándares con los que comparamos.</div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:18 }}>
      <DocTile icon={<Glyph name="bank" />} label="Crédito bancario" sub="Consumo · Hipotecario" selected />
      <DocTile icon={<Glyph name="house" />} label="Arriendo" sub="Vivienda · Comercial" />
      <DocTile icon={<Glyph name="shield" />} label="Seguro" sub="Vida · Auto · Salud" />
      <DocTile icon={<Glyph name="briefcase" />} label="Contrato laboral" sub="Indefinido · Plazo fijo" />
      <DocTile icon={<Glyph name="wrench" />} label="Cotización" sub="Taller · Servicio" />
      <DocTile icon={<Glyph name="hammer" />} label="Propuesta obra" sub="Remodelación" />
      <DocTile icon={<Glyph name="file" />} label="Otro contrato" sub="Plantilla genérica" />
      <DocTile icon={<Glyph name="plus" />} label="Más tipos…" sub="" />
    </div>

    <div className="hb-dashed center" style={{ marginTop:18, padding:'22px 16px', flexDirection:'column', gap:8 }}>
      <Glyph name="upload" size={28} />
      <div className="hand-h3">Arrastra tus PDFs aquí</div>
      <div className="micro">o haz click · hasta 10 archivos · soportamos escaneados</div>
    </div>

    <div className="between" style={{ marginTop:14 }}>
      <span className="small">Paso 1 de 2</span>
      <button className="btn btn-primary">Analizar →</button>
    </div>
  </Web>
);

const A_Report = () => (
  <Web>
    <AppBar title={<span>Crédito · BancoPlaceholder · <span style={{color:'var(--ink-faint)'}}>contrato.pdf</span></span>} />

    {/* Header row: score + summary */}
    <div className="row gap-16" style={{ alignItems:'stretch' }}>
      <div className="hb-soft" style={{ width:200, padding:14, display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'#fff' }}>
        <div className="small">Riesgo</div>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#e6dfcd" strokeWidth="10"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--hi)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${0.62*2*Math.PI*48} ${2*Math.PI*48}`} transform="rotate(-90 60 60)"/>
          <text x="60" y="62" textAnchor="middle" fontFamily="var(--hand)" fontWeight="700" fontSize="32" fill="var(--ink)">62</text>
          <text x="60" y="80" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-faint)">/ 100</text>
        </svg>
        <span className="flag hi">Atención alta</span>
      </div>

      <div className="grow col gap-8">
        <div className="hand-h2">3 cosas que deberías saber antes de firmar</div>
        <div className="bullet-list">
          <div className="bullet-row">
            <span className="dot hi" style={{ marginTop:8, flex:'0 0 auto' }}></span>
            <div style={{ fontSize:15, lineHeight:1.45 }}><b>68 cuotas, no 60.</b> El plazo real es 8 meses más largo que lo conversado.</div>
          </div>
          <div className="bullet-row">
            <span className="dot hi" style={{ marginTop:8, flex:'0 0 auto' }}></span>
            <div style={{ fontSize:15, lineHeight:1.45 }}><b>CAE 24.8%</b> · 4.2 pts sobre el promedio del mercado para tu perfil.</div>
          </div>
          <div className="bullet-row">
            <span className="dot mid" style={{ marginTop:8, flex:'0 0 auto' }}></span>
            <div style={{ fontSize:15, lineHeight:1.45 }}><b>Seguro de desgravamen contratado por defecto</b> — agrega $890.000 al total.</div>
          </div>
        </div>
        <div className="row gap-8" style={{ marginTop:6 }}>
          <button className="btn btn-primary" style={{ padding:'6px 12px', fontSize:14 }}>Ver informe completo</button>
          <button className="btn" style={{ padding:'6px 12px', fontSize:14 }}>Preguntas para el banco</button>
          <button className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:14 }}>Exportar PDF</button>
        </div>
      </div>
    </div>

    {/* Flag list */}
    <div className="between" style={{ marginTop:18 }}>
      <div className="hand-h3">Hallazgos · 11 puntos revisados</div>
      <div className="row gap-6">
        <span className="flag hi">3 alto</span>
        <span className="flag mid">4 medio</span>
        <span className="flag ok">4 ok</span>
      </div>
    </div>

    <div className="col gap-6" style={{ marginTop:8 }}>
      <FlagRow sev="hi" title="Plazo: 68 cuotas (esperado 60)" where="Cláusula 4.2 · Tabla de amortización" savings="−$1.4M" />
      <FlagRow sev="hi" title="CAE sobre el promedio de mercado" where="Cláusula 3 · Costo total del crédito" savings="−0.8%" />
      <FlagRow sev="mid" title="Seguro desgravamen vinculado al banco" where="Cláusula 9 · Productos asociados" />
      <FlagRow sev="mid" title="Cláusula de aceleración por mora de 1 cuota" where="Cláusula 12.3 · Mora" />
    </div>

    <div className="stickynote blue" style={{ position:'absolute', bottom:18, right:24, maxWidth:180 }}>
      El informe lidera — todo lo demás es secundario.
    </div>
  </Web>
);

const A_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:8 }}>
      <Logo />
      <div className="hb" style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:10, background:'#fff' }}>JR</div>
    </div>

    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width="64" height="64" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#e6dfcd" strokeWidth="12"/>
        <circle cx="60" cy="60" r="48" fill="none" stroke="var(--hi)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${0.62*2*Math.PI*48} ${2*Math.PI*48}`} transform="rotate(-90 60 60)"/>
        <text x="60" y="68" textAnchor="middle" fontFamily="var(--hand)" fontWeight="700" fontSize="36">62</text>
      </svg>
      <div>
        <div className="hand-h3">Atención alta</div>
        <div className="micro">contrato.pdf · 11 puntos</div>
        <span className="flag hi" style={{ marginTop:4 }}>3 alto</span>
      </div>
    </div>

    <div className="hand-h3" style={{ marginTop:14 }}>Lo importante</div>
    <div className="col gap-6" style={{ marginTop:6 }}>
      <FlagRow sev="hi" title="68 cuotas, no 60" where="Cláusula 4.2" />
      <FlagRow sev="hi" title="CAE 24.8% (alto)" where="Cláusula 3" />
      <FlagRow sev="mid" title="Seguro por defecto" where="Cláusula 9" />
    </div>

    <div style={{ flex:1 }}></div>
    <button className="btn btn-primary" style={{ width:'100%', marginTop:10 }}>Ver informe completo</button>
  </Phone>
);

Object.assign(window, { A_Login, A_Picker, A_Report, A_Mobile });
