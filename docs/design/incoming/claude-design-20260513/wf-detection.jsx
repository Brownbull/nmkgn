// Detection section — document-type identification states
// Identification is a first-class concept surfaced on every screen.

// 1. Processing / identifying
const Det_Processing = () => (
  <Web>
    <AppBar title="Procesando…" />
    <div className="col" style={{ height:'calc(100% - 60px)', alignItems:'center', justifyContent:'center', textAlign:'center', gap:14, padding:'0 40px' }}>
      <div className="hand-h1" style={{ fontSize:24 }}>Leyendo tu documento…</div>
      <div className="scribble" style={{ maxWidth:380 }}>
        Primero identificamos qué tipo es. Solo analizamos tipos que conocemos a fondo.
      </div>

      <div className="hb-soft" style={{ padding:14, background:'#fff', width:'100%', maxWidth:440 }}>
        <div className="row gap-8" style={{ alignItems:'center' }}>
          <Glyph name="file" size={22}/>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontWeight:700, fontSize:14 }}>contrato.pdf</div>
            <div className="micro">6 páginas · 412 KB</div>
          </div>
          <span className="pill" style={{ fontSize:9 }}>92%</span>
        </div>
        <div style={{ height:6, background:'#efe9d6', borderRadius:3, marginTop:10, overflow:'hidden' }}>
          <div style={{ width:'92%', height:'100%', background:'var(--ink)' }}></div>
        </div>

        <div className="col gap-6" style={{ marginTop:14, textAlign:'left' }}>
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span className="dot ok"></span>
            <span style={{ fontSize:13 }}>OCR completado</span>
          </div>
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span className="dot ok"></span>
            <span style={{ fontSize:13 }}>Detectando tipo de documento…</span>
          </div>
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span className="dot" style={{ background:'#cdc6b6' }}></span>
            <span style={{ fontSize:13, color:'var(--ink-faint)' }}>Cargar estándares y benchmarks</span>
          </div>
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span className="dot" style={{ background:'#cdc6b6' }}></span>
            <span style={{ fontSize:13, color:'var(--ink-faint)' }}>Marcar hallazgos</span>
          </div>
        </div>
      </div>

      <div className="micro">Esto suele tomar 20–40 segundos.</div>
    </div>

    <div className="stickynote" style={{ position:'absolute', top:42, right:18, maxWidth:170 }}>
      Identificar el tipo es paso 1, no un detalle.
    </div>
  </Web>
);

// 2. High confidence — show badge prominently, transitions to analysis
const Det_HighConfidence = () => (
  <Web>
    <AppBar title="Listo para analizar" />

    <div className="col" style={{ alignItems:'center', textAlign:'center', gap:10, marginTop:20 }}>
      <span className="flag ok">Identificado con alta confianza</span>
      <div className="hand-h1" style={{ fontSize:28 }}>Este es un <u>Crédito bancario</u>.</div>
      <div className="scribble" style={{ maxWidth:480 }}>
        Vamos a revisarlo contra los estándares de la <b>CMF</b>, la <b>Ley del Consumidor</b> y benchmarks de mercado de marzo 2025.
      </div>

      <div style={{ marginTop:10 }}>
        <DocTypeBadge icon="bank" label="Crédito de consumo" market="Chile · CMF" confidence="high"/>
      </div>

      <div className="hb-soft" style={{ marginTop:12, padding:12, background:'#fff', maxWidth:480, width:'100%' }}>
        <div className="small">Qué vamos a revisar</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8, textAlign:'left' }}>
          <div style={{ fontSize:12 }}>✓ Plazo y cuotas</div>
          <div style={{ fontSize:12 }}>✓ CAE vs. mercado</div>
          <div style={{ fontSize:12 }}>✓ Tasa de interés</div>
          <div style={{ fontSize:12 }}>✓ Comisiones</div>
          <div style={{ fontSize:12 }}>✓ Seguros vinculados</div>
          <div style={{ fontSize:12 }}>✓ Cláusulas de mora</div>
          <div style={{ fontSize:12 }}>✓ Prepago</div>
          <div style={{ fontSize:12 }}>✓ Aceleración</div>
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop:14 }}>
        <button className="btn">No es esto, cambiar tipo</button>
        <button className="btn btn-primary">Analizar →</button>
      </div>
    </div>
  </Web>
);

// 3. Low confidence — ambiguous, must confirm
const Det_LowConfidence = () => (
  <Web>
    <AppBar title="Necesitamos confirmar el tipo" />
    <div className="col" style={{ alignItems:'center', textAlign:'center', gap:8, marginTop:14 }}>
      <span className="flag mid">Confianza baja — confirma</span>
      <div className="hand-h1" style={{ fontSize:26 }}>No estamos seguros de qué tipo es.</div>
      <div className="scribble" style={{ maxWidth:480 }}>
        Tu archivo tiene características de varios documentos que sí analizamos. ¿Cuál es el correcto?
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:18 }}>
      <div className="hb-soft" style={{ padding:14, background:'#fff7da', borderColor:'var(--mid)', borderWidth:1.5 }}>
        <Glyph name="bank" size={22}/>
        <div className="between" style={{ marginTop:6 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>Crédito bancario</div>
          <span className="flag mid">62%</span>
        </div>
        <div className="micro" style={{ marginTop:4 }}>Coincide: CAE, plazo, cuotas, banco emisor</div>
      </div>
      <div className="hb-soft" style={{ padding:14, background:'#fff' }}>
        <Glyph name="house" size={22}/>
        <div className="between" style={{ marginTop:6 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>Pagaré / mutuo</div>
          <span className="pill" style={{ fontSize:9 }}>28%</span>
        </div>
        <div className="micro" style={{ marginTop:4 }}>Coincide: monto, plazo, deudor</div>
      </div>
      <div className="hb-soft" style={{ padding:14, background:'#fff' }}>
        <Glyph name="file" size={22}/>
        <div className="between" style={{ marginTop:6 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>Otro · genérico</div>
          <span className="pill" style={{ fontSize:9 }}>10%</span>
        </div>
        <div className="micro" style={{ marginTop:4 }}>Revisión menos profunda</div>
      </div>
    </div>

    <div className="hb-dashed" style={{ marginTop:14, padding:'10px 14px' }}>
      <div className="small">Vista previa del documento</div>
      <div className="row gap-8" style={{ marginTop:8 }}>
        <div style={{ width:64, height:80, background:'#fffdf6', border:'1.5px solid var(--rule)', borderRadius:3, padding:6, fontSize:6, lineHeight:1.3, color:'var(--ink-soft)' }}>
          <div style={{ fontWeight:700, fontSize:6, textAlign:'center' }}>CONTRATO</div>
          <div style={{ height:1, background:'#cdc6b6', margin:'3px 0' }}></div>
          <div>Lorem ipsum dolor sit amet…</div>
          <div>$ 18.000.000 — 60 cuotas</div>
        </div>
        <div style={{ flex:1, fontSize:12 }} className="scribble">
          Frases detectadas: <b>"mutuo"</b>, <b>"tasa de interés"</b>, <b>"plazo de 60 meses"</b>, <b>"obligación pagadera"</b>.
          La estructura coincide con créditos pero falta encabezado típico de banco.
        </div>
      </div>
    </div>

    <div className="between" style={{ marginTop:14 }}>
      <span className="micro">contrato-revisado.pdf</span>
      <button className="btn btn-primary">Continuar con Crédito bancario →</button>
    </div>
  </Web>
);

// 4. Unsupported — type detected but we don't analyze it
const Det_Unsupported = () => (
  <Web>
    <AppBar title="Tipo no soportado" />
    <UnsupportedBanner detected="Términos y condiciones de un servicio" filename="terminos-servicio.pdf" />

    <div className="hand-h3" style={{ marginTop:16 }}>Por qué no lo analizamos</div>
    <div className="scribble" style={{ marginTop:4, maxWidth:560 }}>
      Cada tipo necesita reglas, estándares y benchmarks propios. Si te damos un análisis sin tenerlos,
      podríamos pasar por alto cosas importantes — o, peor, marcar como peligroso algo normal.
    </div>

    <div className="hand-h3" style={{ marginTop:16 }}>Lo que sí podemos analizar hoy</div>
    <div style={{ marginTop:6 }}>
      <SupportedTypesList />
    </div>

    <div className="row gap-8" style={{ marginTop:16, alignItems:'center', flexWrap:'wrap' }}>
      <span className="small">¿Lo necesitas?</span>
      <button className="btn" style={{ padding:'6px 12px', fontSize:13 }}>Pedir este tipo</button>
      <button className="btn" style={{ padding:'6px 12px', fontSize:13 }}>Avisar cuando esté listo</button>
      <span className="grow"></span>
      <button className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:13 }}>Subir otro documento</button>
    </div>

    <div className="stickynote" style={{ position:'absolute', bottom:20, right:24, maxWidth:180 }}>
      No analizar mal &gt; analizar todo. Establece la confianza del producto.
    </div>
  </Web>
);

// 5. Mixed batch — multiple docs uploaded, some supported some not
const Det_MixedBatch = () => (
  <Web>
    <AppBar title="3 documentos · 1 no soportado" />

    <div className="hand-h2">Antes de seguir, revisa qué se va a analizar</div>
    <div className="scribble" style={{ marginTop:2 }}>Procesaremos solo los que conocemos. El resto queda fuera.</div>

    <div className="col gap-8" style={{ marginTop:14 }}>
      <div className="hb-soft" style={{ padding:'10px 14px', background:'#fff' }}>
        <div className="row gap-10" style={{ alignItems:'center' }}>
          <Glyph name="bank" size={20}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>contrato-credito.pdf</div>
            <div className="micro">6 págs · identificado como Crédito de consumo</div>
          </div>
          <ConfidenceMeter confidence="high"/>
          <span className="flag ok">Se analiza</span>
        </div>
      </div>

      <div className="hb-soft" style={{ padding:'10px 14px', background:'#fff' }}>
        <div className="row gap-10" style={{ alignItems:'center' }}>
          <Glyph name="file" size={20}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>pagare.pdf</div>
            <div className="micro">1 pág · identificado como Pagaré (anexo del crédito)</div>
          </div>
          <ConfidenceMeter confidence="high"/>
          <span className="flag ok">Se analiza junto al crédito</span>
        </div>
      </div>

      <div className="hb-soft" style={{ padding:'10px 14px', background:'#fde4dd', borderColor:'var(--hi)', borderWidth:1.5 }}>
        <div className="row gap-10" style={{ alignItems:'center' }}>
          <Glyph name="file" size={20}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>terminos-banco.pdf</div>
            <div className="micro">22 págs · Términos y condiciones del banco</div>
          </div>
          <ConfidenceMeter confidence="unsupported"/>
          <span className="flag hi">No soportado</span>
        </div>
        <div className="row gap-6" style={{ marginTop:8, alignItems:'center' }}>
          <span className="micro" style={{ flex:1 }}>No tenemos reglas para T&amp;C aún. ¿Quieres que te avisemos cuando estén?</span>
          <button className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }}>Avisarme</button>
          <button className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }}>Quitar</button>
        </div>
      </div>
    </div>

    <div className="between" style={{ marginTop:18 }}>
      <span className="small">2 de 3 se analizarán como un solo paquete de crédito</span>
      <div className="row gap-8">
        <button className="btn">+ Agregar documento</button>
        <button className="btn btn-primary">Analizar →</button>
      </div>
    </div>
  </Web>
);

Object.assign(window, { Det_Processing, Det_HighConfidence, Det_LowConfidence, Det_Unsupported, Det_MixedBatch });
