// Direction D extras — Email-to-bank output, History dashboard, Mobile detection.

const D_EmailDraft = () => (
  <Web>
    <AppBarWithBadge
      badge={<DocTypeBadge icon="bank" label="Crédito de consumo" market="Chile · CMF" confidence="high"/>}
    />
    <div className="hand-h2">Email para el banco</div>
    <div className="scribble" style={{ marginTop:2 }}>Redactado con base en los 4 hallazgos. Edítalo antes de enviar.</div>

    <div className="row gap-12" style={{ marginTop:12, height:'calc(100% - 110px)' }}>
      {/* Left: editable email */}
      <div className="hb-soft" style={{ flex:1.4, padding:14, background:'#fff', display:'flex', flexDirection:'column' }}>
        <div className="col gap-4" style={{ paddingBottom:8, borderBottom:'1px dashed var(--rule)' }}>
          <div className="row gap-4"><span className="micro" style={{ width:56 }}>Para</span><span style={{ fontSize:12 }}>ejecutivo@bancoplaceholder.cl</span></div>
          <div className="row gap-4"><span className="micro" style={{ width:56 }}>CC</span><span style={{ fontSize:12 }}>maria.lopez@gmail.com</span></div>
          <div className="row gap-4"><span className="micro" style={{ width:56 }}>Asunto</span><span style={{ fontSize:12, fontWeight:700 }}>Consultas sobre el contrato de mutuo N° 4471-2025-ZZ</span></div>
        </div>

        <div style={{ paddingTop:10, fontSize:13, lineHeight:1.55, color:'var(--ink)', fontFamily:'var(--hand)', overflow:'auto' }}>
          <p style={{ margin:'0 0 8px' }}>Estimado/a,</p>
          <p style={{ margin:'0 0 8px' }}>
            Antes de firmar el contrato de mutuo en referencia, me gustaría aclarar los siguientes puntos:
          </p>
          <p style={{ margin:'0 0 4px' }}>
            <b>1.</b> En la simulación inicial el plazo era de <b>60 cuotas</b>; el contrato indica <span style={{ background:'#fde4dd', padding:'0 2px' }}>68 cuotas</span> en la cláusula 4.2. ¿Pueden enviarme la tabla de amortización a 60 cuotas para comparar?
          </p>
          <p style={{ margin:'0 0 4px' }}>
            <b>2.</b> La <b>CAE de 24.8%</b> es <b>4.2 puntos sobre el promedio de mercado</b> de marzo 2025 para mi perfil (CMF). ¿Existe espacio para ajustarla?
          </p>
          <p style={{ margin:'0 0 4px' }}>
            <b>3.</b> El seguro de desgravamen (cláusula 9) está vinculado a la compañía del banco. Conforme al <b>Art. 17 H Ley 19.496</b>, solicito poder contratarlo con otra aseguradora.
          </p>
          <p style={{ margin:'0 0 4px' }}>
            <b>4.</b> La cláusula 12.3 establece aceleración por <b>1 cuota</b> impaga; el estándar de mercado es 3. ¿Pueden modificarla?
          </p>
          <p style={{ margin:'10px 0 0' }}>
            Quedo atento a su respuesta. Saluda atentamente, <br/>
            Juan R.
          </p>
        </div>
      </div>

      {/* Right: based-on sidebar */}
      <div className="col gap-8" style={{ width:240 }}>
        <div className="small">Basado en estos hallazgos</div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot hi" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>Plazo:</b> 68 vs. 60 cuotas</div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot hi" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>CAE:</b> 24.8% (mercado 20.6%)</div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot mid" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>Seguro</b> vinculado</div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot mid" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>Mora:</b> aceleración a 1 cuota</div></div>
        </div>

        <div className="row gap-6" style={{ marginTop:'auto' }}>
          <button className="btn" style={{ flex:1, padding:'6px', fontSize:12 }}>Editar tono</button>
          <button className="btn btn-primary" style={{ flex:1, padding:'6px', fontSize:12 }}>Enviar</button>
        </div>
        <button className="btn btn-ghost" style={{ padding:'4px', fontSize:11 }}>Copiar al portapapeles</button>
      </div>
    </div>
  </Web>
);

const D_History = () => (
  <Web>
    <AppBar title="Mis documentos" right={
      <div className="row gap-6">
        <span className="pill">Filtros</span>
        <span className="pill">+ Nuevo</span>
        <div className="hb" style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:11, background:'#fff' }}>JR</div>
      </div>
    } />

    <div className="row gap-12" style={{ marginTop:4 }}>
      <StatCard label="Documentos" value="7" sub="analizados este año" />
      <StatCard label="Ahorro estimado" value="$2.4M" sub="por negociar 3 ofertas" sev="ok" />
      <StatCard label="Pendientes" value="2" sub="esperan tu firma" sev="mid" />
    </div>

    <div className="hand-h3" style={{ marginTop:16 }}>Historial</div>
    <div className="col gap-6" style={{ marginTop:6 }}>
      {[
        { icon:'bank', name:'Crédito BancoPlaceholder',   tag:'Crédito de consumo', date:'14 mar 2025', score:62, sev:'hi', meta:'68 cuotas · CAE 24.8%' },
        { icon:'bank', name:'Crédito María · OtroBanco',  tag:'Crédito de consumo', date:'14 mar 2025', score:88, sev:'ok', meta:'60 cuotas · CAE 19.4%' },
        { icon:'wrench', name:'Cotización Taller Reyes',    tag:'Cotización taller', date:'02 mar 2025', score:74, sev:'mid', meta:'5 ítems · 2 sin detalle' },
        { icon:'house',  name:'Arriendo depto. Providencia', tag:'Arriendo vivienda', date:'18 feb 2025', score:91, sev:'ok', meta:'1 año · UF 18' },
        { icon:'file',   name:'Términos del banco',          tag:'No soportado',      date:'14 mar 2025', score:null, sev:null, meta:'No analizado' },
      ].map((r,i)=>(
        <div key={i} className="hb-soft" style={{ padding:'8px 10px', background:'#fff', display:'flex', alignItems:'center', gap:10 }}>
          <Glyph name={r.icon} size={20}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="row gap-6" style={{ alignItems:'center' }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{r.name}</div>
              <span className={`pill`} style={{ fontSize:9, padding:'1px 6px', background: r.tag==='No soportado'?'#fde4dd':'#fff', borderColor: r.tag==='No soportado'?'var(--hi)':'var(--rule)' }}>{r.tag}</span>
            </div>
            <div className="micro" style={{ marginTop:2 }}>{r.date} · {r.meta}</div>
          </div>
          {r.score !== null ? (
            <>
              <div style={{ width:50, height:50, position:'relative' }}>
                <svg width="50" height="50" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#e6dfcd" strokeWidth="4"/>
                  <circle cx="25" cy="25" r="20" fill="none"
                    stroke={r.sev==='hi'?'var(--hi)':r.sev==='mid'?'var(--mid)':'var(--ok)'}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(r.score/100)*2*Math.PI*20} ${2*Math.PI*20}`}
                    transform="rotate(-90 25 25)"/>
                  <text x="25" y="29" textAnchor="middle" fontFamily="var(--hand)" fontWeight="700" fontSize="14">{r.score}</text>
                </svg>
              </div>
            </>
          ) : (
            <span className="flag hi">—</span>
          )}
          <button className="btn btn-ghost" style={{ padding:'4px 8px', fontSize:11 }}>Abrir →</button>
        </div>
      ))}
    </div>
  </Web>
);

const Det_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:8 }}>
      <Logo />
      <span className="micro">Detección</span>
    </div>

    <div className="col" style={{ alignItems:'center', textAlign:'center', gap:8, marginTop:10 }}>
      <span className="flag mid">Confianza baja</span>
      <div className="hand-h3">¿Cuál es este<br/>documento?</div>
      <div className="scribble" style={{ fontSize:12 }}>
        Detectamos varias opciones. Confirma para seguir.
      </div>
    </div>

    <div className="col gap-6" style={{ marginTop:14 }}>
      <div className="hb-soft" style={{ padding:10, background:'#fff7da', borderColor:'var(--mid)', borderWidth:1.5 }}>
        <div className="row gap-8" style={{ alignItems:'center' }}>
          <Glyph name="bank" size={18}/>
          <div style={{ flex:1, fontSize:13, fontWeight:700 }}>Crédito bancario</div>
          <span className="flag mid" style={{ fontSize:9 }}>62%</span>
        </div>
      </div>
      <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
        <div className="row gap-8" style={{ alignItems:'center' }}>
          <Glyph name="file" size={18}/>
          <div style={{ flex:1, fontSize:13, fontWeight:700 }}>Pagaré / mutuo</div>
          <span className="pill" style={{ fontSize:9 }}>28%</span>
        </div>
      </div>
      <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
        <div className="row gap-8" style={{ alignItems:'center' }}>
          <Glyph name="file" size={18}/>
          <div style={{ flex:1, fontSize:13, fontWeight:700 }}>Otro</div>
          <span className="pill" style={{ fontSize:9 }}>10%</span>
        </div>
      </div>
    </div>

    <div style={{ flex:1 }}></div>
    <div className="col gap-6">
      <button className="btn btn-primary" style={{ width:'100%' }}>Continuar con Crédito</button>
      <button className="btn btn-ghost" style={{ width:'100%', fontSize:12, boxShadow:'none' }}>Ver todos los tipos</button>
    </div>
  </Phone>
);

Object.assign(window, { D_EmailDraft, D_History, Det_Mobile });
