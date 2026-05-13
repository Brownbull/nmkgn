// Direction B — Annotated document (side-by-side)
// The doc is sacred; flags pin to clauses in the margin.

const B_Doc = ({ scale = 1 }) => (
  <div className="doc-page" style={{ flex:1, padding:12, fontFamily:'serif', fontSize: 9 * scale, lineHeight:1.5, color:'#2a241e', overflow:'hidden' }}>
    <div style={{ textAlign:'center', fontWeight:700, fontSize: 11 * scale, marginBottom:6 }}>
      CONTRATO DE MUTUO DE DINERO
    </div>
    <div style={{ textAlign:'right', fontSize:8*scale, color:'#8a8278' }}>N° 4471-2025-ZZ</div>
    <p style={{ marginTop:8 }}>
      En Santiago de Chile, a 14 de marzo de 2025, comparecen, por una parte, BANCO PLACEHOLDER S.A.,
      en adelante "el Banco", y por otra, don JUAN R., cédula …, en adelante "el Deudor"…
    </p>
    <p><b>PRIMERO · Monto.</b> El Banco otorga al Deudor un mutuo por la suma de $18.000.000 …</p>
    <p>
      <b>TERCERO · Costo total.</b> La <span className="highlight-hi">CAE aplicable será de 24,8% anual</span>,
      considerando intereses, comisiones y gastos. Tasa de interés nominal …
    </p>
    <p>
      <b>CUARTO · Plazo.</b> El Deudor pagará el mutuo en <span className="highlight-hi">68 (sesenta y ocho) cuotas</span> mensuales,
      iguales y sucesivas, venciendo la primera el quinto día …
    </p>
    <p>
      <b>NOVENO · Productos asociados.</b> El Deudor contrata, conjuntamente con el presente mutuo, un
      <span className="highlight-mid"> seguro de desgravamen con la compañía relacionada al Banco</span>, cuya prima …
    </p>
    <p>
      <b>DOCE · Mora.</b> El no pago oportuno de <span className="highlight-mid">una sola cuota</span> facultará al Banco para …
    </p>
  </div>
);

const Pin = ({ sev, n }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:18, height:18, borderRadius:'50%',
    border:'1.25px solid var(--rule)',
    background: sev==='hi'?'#fde4dd':sev==='mid'?'#fbeccf':'#dceede',
    fontFamily:'var(--mono)', fontSize:10, fontWeight:600,
  }}>{n}</span>
);

const Annotation = ({ n, sev, title, body, suggestion }) => (
  <div className="hb-soft" style={{ padding:'8px 10px' }}>
    <div className="row gap-6" style={{ alignItems:'center' }}>
      <Pin sev={sev} n={n} />
      <span className={`flag ${sev}`} style={{ padding:'1px 6px' }}>{sev==='hi'?'Alto':sev==='mid'?'Atención':'OK'}</span>
      <span className="grow"></span>
      <span className="micro">cl. {n===1?'3':n===2?'4.2':n===3?'9':'12.3'}</span>
    </div>
    <div style={{ fontWeight:700, fontSize:13, marginTop:4 }}>{title}</div>
    <div className="scribble" style={{ fontSize:12, marginTop:2 }}>{body}</div>
    {suggestion ? (
      <div style={{ marginTop:6, fontFamily:'var(--mono)', fontSize:10, padding:'4px 6px', background:'#fff7da', border:'1px dashed var(--rule)' }}>
        💡 {suggestion}
      </div>
    ) : null}
  </div>
);

const B_Hero = () => (
  <Web>
    <AppBar title={<span>contrato.pdf · pág. 1/6</span>} right={
      <div className="row gap-6">
        <span className="pill">Buscar</span>
        <span className="pill">Exportar</span>
      </div>
    }/>
    <div className="row gap-12" style={{ height:'calc(100% - 60px)' }}>
      {/* Left: document viewer */}
      <div className="col" style={{ flex:1.2, minWidth:0 }}>
        <div className="row gap-6" style={{ marginBottom:6 }}>
          <span className="pill">◀</span><span className="pill">1 / 6</span><span className="pill">▶</span>
          <span className="grow"></span>
          <span className="pill">— 100% +</span>
        </div>
        <B_Doc />
      </div>

      {/* Right: annotations rail */}
      <div className="col gap-8" style={{ width:280 }}>
        <div className="between">
          <div className="hand-h3">Anotaciones · 4</div>
          <span className="flag hi">2 alto</span>
        </div>
        <Annotation n={1} sev="hi" title="CAE 24,8% — alta para tu perfil"
          body="El promedio del mercado en marzo era 20,6%."
          suggestion="Pide cotización a 2 bancos más antes de firmar." />
        <Annotation n={2} sev="hi" title="68 cuotas (no 60)"
          body="El plazo es 8 meses más largo que la simulación inicial."
          suggestion="Solicita la tabla de amortización a 60 cuotas." />
        <Annotation n={3} sev="mid" title="Seguro de desgravamen vinculado"
          body="Puedes contratar el seguro con otra compañía." />
        <Annotation n={4} sev="mid" title="Aceleración por 1 cuota impaga"
          body="Estándar de mercado: 3 cuotas." />
      </div>
    </div>

    <div className="stickynote" style={{ position:'absolute', top:10, right:18, maxWidth:170 }}>
      El documento queda visible — los pins remiten a la cláusula.
    </div>
  </Web>
);

const B_Detail = () => (
  <Web>
    <AppBar title="Detalle de hallazgo" right={<span className="pill">← Volver al informe</span>} />
    <div className="row gap-16" style={{ height:'calc(100% - 60px)' }}>
      <div className="col" style={{ flex:1.1, gap:10 }}>
        <span className="flag hi">Riesgo alto · Cláusula 4.2</span>
        <div className="hand-h1" style={{ fontSize:26 }}>El plazo del crédito es 68 cuotas, no 60.</div>
        <div className="scribble" style={{ maxWidth:440 }}>
          La simulación en la sucursal indicaba 60 cuotas mensuales. El contrato final establece 68 cuotas. La diferencia equivale a ~$1.4M en intereses adicionales.
        </div>

        <div className="hb-soft" style={{ padding:12, marginTop:6 }}>
          <div className="small">Cita textual</div>
          <div style={{ fontFamily:'serif', fontSize:13, marginTop:6, lineHeight:1.45 }}>
            "…el Deudor pagará el mutuo en <span className="highlight-hi">68 (sesenta y ocho) cuotas</span> mensuales,
            iguales y sucesivas…"
          </div>
        </div>

        <div className="hand-h3" style={{ marginTop:10 }}>Qué preguntar al banco</div>
        <div className="col gap-6">
          <div className="hb" style={{ padding:'8px 10px', background:'#fff', fontSize:13 }}>¿Por qué la simulación inicial decía 60 y el contrato final 68?</div>
          <div className="hb" style={{ padding:'8px 10px', background:'#fff', fontSize:13 }}>¿Pueden enviarme la tabla de amortización a 60 cuotas para comparar?</div>
          <div className="hb" style={{ padding:'8px 10px', background:'#fff', fontSize:13 }}>¿Hay penalidad por prepago?</div>
        </div>
      </div>

      <div className="col gap-8" style={{ width:240 }}>
        <div className="small">Impacto estimado</div>
        <div className="hb-soft" style={{ padding:12, background:'#fff' }}>
          <div className="micro">Intereses extra</div>
          <div className="hand-h1" style={{ fontSize:28, color:'var(--hi)' }}>+$1.4M</div>
          <div className="micro">vs. plazo 60 cuotas</div>
        </div>
        <div className="hb-soft" style={{ padding:12, background:'#fff' }}>
          <div className="micro">Cuota mensual</div>
          <div className="hand-h2">$352.400</div>
          <div className="micro">a 68 cuotas</div>
          <div style={{ height:6 }}></div>
          <div className="micro">$391.100 a 60 cuotas</div>
        </div>
      </div>
    </div>
  </Web>
);

const B_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:6 }}>
      <span className="pill" style={{ fontSize:9 }}>◀ Vista doc</span>
      <span className="small">2/4</span>
    </div>
    <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
      <div className="row gap-6" style={{ alignItems:'center' }}>
        <Pin sev="hi" n={2} />
        <span className="flag hi" style={{ padding:'1px 5px', fontSize:9 }}>Alto</span>
        <span className="grow"></span>
        <span className="micro">cl. 4.2</span>
      </div>
      <div style={{ fontWeight:700, fontSize:14, marginTop:6 }}>68 cuotas, no 60</div>
      <div className="scribble" style={{ fontSize:12, marginTop:3 }}>
        El plazo es 8 meses más largo que la simulación inicial.
      </div>
    </div>

    <div className="hand-h3" style={{ marginTop:10 }}>Cita</div>
    <div className="hb" style={{ padding:8, background:'#fffdf6', fontFamily:'serif', fontSize:11, marginTop:4 }}>
      "…en <span className="highlight-hi">68 (sesenta y ocho) cuotas</span> mensuales…"
    </div>

    <div className="hand-h3" style={{ marginTop:10 }}>Impacto</div>
    <div className="row gap-6" style={{ marginTop:4 }}>
      <div className="hb-soft" style={{ flex:1, padding:8, background:'#fff' }}>
        <div className="micro">Extra</div>
        <div className="hand-h2" style={{ color:'var(--hi)' }}>+$1.4M</div>
      </div>
      <div className="hb-soft" style={{ flex:1, padding:8, background:'#fff' }}>
        <div className="micro">Cuota</div>
        <div className="hand-h2">$352k</div>
      </div>
    </div>

    <div style={{ flex:1 }}></div>
    <div className="row gap-6">
      <button className="btn" style={{ flex:1, padding:'8px 10px', fontSize:13 }}>◀ Anterior</button>
      <button className="btn btn-primary" style={{ flex:1, padding:'8px 10px', fontSize:13 }}>Siguiente ▶</button>
    </div>
  </Phone>
);

Object.assign(window, { B_Hero, B_Detail, B_Mobile });
