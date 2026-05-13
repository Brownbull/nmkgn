// Analysis plan — between detection and analysis.
// Shows the criteria we'll evaluate, grouped by source. User can toggle items.

// Sketchy toggle
const Toggle = ({ on=true, size=28 }) => (
  <span style={{
    display:'inline-flex', alignItems:'center',
    width:size, height:Math.round(size*0.6),
    borderRadius:999, border:'1.5px solid var(--rule)',
    background: on ? 'var(--ink)' : '#fff',
    padding:2, boxSizing:'border-box',
    transition:'background .15s',
    flex:'0 0 auto',
  }}>
    <span style={{
      width: Math.round(size*0.6) - 8, height: Math.round(size*0.6) - 8,
      background: on ? 'var(--paper)' : 'var(--ink)',
      borderRadius:'50%',
      transform: on ? `translateX(${size - Math.round(size*0.6) - 0}px)` : 'translateX(0)',
      transition:'transform .15s',
    }}/>
  </span>
);

const CriterionRow = ({ icon='✓', title, sub, on=true, status, finding }) => {
  // status (for running screen): 'done' | 'running' | 'queued'
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isQueued = status === 'queued';
  return (
    <div className="hb" style={{
      padding:'8px 10px', background: on ? '#fff' : '#f0ece0',
      display:'flex', alignItems:'center', gap:10,
      opacity: on ? 1 : .55,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, lineHeight:1.2 }}>{title}</div>
        <div className="micro" style={{ marginTop:2 }}>{sub}</div>
      </div>
      {status ? (
        isDone ? <span className={`flag ${finding ? 'hi':'ok'}`}>{finding || '✓'}</span>
        : isRunning ? <span className="pill" style={{ fontSize:9 }}>analizando…</span>
        : <span className="pill" style={{ fontSize:9, color:'var(--ink-faint)' }}>en cola</span>
      ) : (
        <Toggle on={on}/>
      )}
    </div>
  );
};

const CategoryHeader = ({ icon, title, sub, count, on=true, accent }) => (
  <div className="between" style={{ padding:'8px 10px 6px', borderBottom:'1.5px dashed var(--rule)' }}>
    <div className="row gap-8" style={{ alignItems:'center', minWidth:0 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:15, lineHeight:1.1 }}>{title}</div>
        <div className="micro" style={{ marginTop:2 }}>{sub}</div>
      </div>
    </div>
    <div className="row gap-8" style={{ alignItems:'center' }}>
      <span className="small" style={{ color: accent }}>{count}</span>
      <Toggle on={on}/>
    </div>
  </div>
);

const PresetChip = ({ active, label, sub }) => (
  <div className="hb" style={{
    padding:'6px 10px',
    background: active ? 'var(--ink)' : '#fff',
    color: active ? 'var(--paper)' : 'var(--ink)',
    boxShadow: active ? '2px 2px 0 var(--rule)' : 'none',
    cursor:'pointer',
  }}>
    <div style={{ fontWeight:700, fontSize:12 }}>{label}</div>
    <div className="micro" style={{ color: active?'rgba(255,255,255,.6)':'var(--ink-faint)' }}>{sub}</div>
  </div>
);

// === Main: Plan of Analysis (selection screen) ===
const Plan_Hero = () => (
  <Web>
    <AppBarWithBadge
      badge={<DocTypeBadge icon="bank" label="Crédito de consumo" market="Chile · CMF" confidence="high"/>}
    />
    <div className="between">
      <div>
        <div className="hand-h2">Plan de análisis</div>
        <div className="scribble" style={{ fontSize:13 }}>Elige contra qué queremos comparar tu crédito. Puedes cambiar cualquier criterio.</div>
      </div>
      <div className="row gap-6">
        <PresetChip label="Completo" sub="todo" active />
        <PresetChip label="Solo legal" sub="rápido" />
        <PresetChip label="Solo mercado" sub="benchmarks" />
        <PresetChip label="Personalizado" sub="el actual" />
      </div>
    </div>

    <div className="row gap-12" style={{ marginTop:14, height:'calc(100% - 150px)' }}>
      {/* Left: categories of criteria */}
      <div className="col gap-12" style={{ flex:1, overflow:'auto', paddingRight:4 }}>

        {/* Category 1 — local laws */}
        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="⚖️" title="Ley y prácticas en Chile" sub="Ley 19.496 · CMF · SERNAC" count="5 / 5" accent="var(--ok)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="Cláusulas abusivas (Art. 16 Ley 19.496)" sub="Listado SERNAC · vigencia 2024" />
            <CriterionRow title="CAE informada coincide con la real" sub="Reg. CMF · Circular 3.539" />
            <CriterionRow title="Costo total expresado en pesos" sub="Obligatorio · Art. 17B" />
            <CriterionRow title="Productos financieros vinculados" sub="Derecho a contratar externos · Art. 17H" />
            <CriterionRow title="Cláusula de aceleración de mora" sub="Estándar mercado: 3 cuotas" />
          </div>
        </div>

        {/* Category 2 — market */}
        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="📊" title="Mercado chileno · marzo 2025" sub="Benchmarks CMF · datos públicos" count="4 / 4" accent="var(--ok)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="CAE vs. promedio del segmento" sub="Tu perfil: 20.6% promedio" />
            <CriterionRow title="Tasa de interés vs. mediana banca" sub="Datos CMF febrero" />
            <CriterionRow title="Comisión inicial vs. mercado" sub="Mediana: 1.4%" />
            <CriterionRow title="Costo del seguro de desgravamen" sub="Compañías externas disponibles" />
          </div>
        </div>

        {/* Category 3 — other offers user has uploaded */}
        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="🆚" title="Otras ofertas que subiste" sub="1 disponible · OtroBanco" count="1 / 1" accent="var(--ok)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="Comparar con crédito de María (OtroBanco)" sub="14 mar · CAE 19.4% · 60 cuotas" />
            <div className="hb-dashed" style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <Glyph name="plus" size={16}/>
              <span style={{ fontSize:12 }}>Subir otra oferta para comparar</span>
              <span className="grow"></span>
              <span className="micro">opcional</span>
            </div>
          </div>
        </div>

        {/* Category 4 — international references */}
        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="🌎" title="Referencias internacionales" sub="Solo contexto comparativo · no genera alertas" count="2 / 4" accent="var(--mid)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="FCRA (EE.UU.) · uso de tu informe crediticio" sub="¿El banco cumpliría con estándares FCRA?" />
            <CriterionRow title="CFPB (EE.UU.) · UDAAP y disclosure" sub="¿Hay prácticas que CFPB consideraría abusivas?" />
            <CriterionRow title="EU Consumer Credit Directive · ESIS" sub="Tabla estándar europea" on={false}/>
            <CriterionRow title="HIPAA / GDPR · privacidad de datos" sub="Aplica solo si comparte info médica" on={false}/>
          </div>
        </div>

      </div>

      {/* Right: summary + action */}
      <div className="col gap-10" style={{ width:240, flex:'0 0 auto' }}>
        <div className="hb-soft" style={{ padding:12, background:'#fff' }}>
          <div className="small">Resumen</div>
          <div className="hand-h1" style={{ fontSize:32, marginTop:4 }}>12</div>
          <div className="micro">criterios activos</div>
          <div className="strike-line" style={{ margin:'10px 0', opacity:.4 }}></div>
          <div className="col gap-4">
            <div className="between" style={{ fontSize:12 }}><span>Ley local</span><span><b>5</b></span></div>
            <div className="between" style={{ fontSize:12 }}><span>Mercado</span><span><b>4</b></span></div>
            <div className="between" style={{ fontSize:12 }}><span>Otras ofertas</span><span><b>1</b></span></div>
            <div className="between" style={{ fontSize:12 }}><span>Internacional</span><span><b>2</b></span></div>
          </div>
          <div className="strike-line" style={{ margin:'10px 0', opacity:.4 }}></div>
          <div className="micro">Tiempo estimado</div>
          <div className="hand-h3">~ 2 min</div>
        </div>

        <button className="btn btn-primary" style={{ width:'100%' }}>Empezar análisis →</button>
        <button className="btn btn-ghost" style={{ width:'100%', fontSize:12 }}>Guardar como plantilla</button>

        <div className="stickynote" style={{ marginTop:'auto', fontSize:12 }}>
          Internacional = contexto comparativo. Aparece como referencia en el informe, nunca como alerta.
        </div>
      </div>
    </div>
  </Web>
);

// === Running: same layout but with progress per criterion ===
const Plan_Running = () => (
  <Web>
    <AppBarWithBadge
      badge={<DocTypeBadge icon="bank" label="Crédito de consumo" market="Chile · CMF" confidence="high"/>}
    />
    <div className="between">
      <div>
        <div className="hand-h2">Analizando…</div>
        <div className="scribble" style={{ fontSize:13 }}>7 de 12 criterios listos · puedes ir viendo los hallazgos parciales abajo.</div>
      </div>
      <button className="btn">Cancelar</button>
    </div>

    {/* Top progress bar */}
    <div style={{ marginTop:12, height:8, background:'#efe9d6', borderRadius:4, overflow:'hidden' }}>
      <div style={{ width:'58%', height:'100%', background:'var(--ink)' }}></div>
    </div>
    <div className="micro" style={{ marginTop:4 }}>~ 50 s restantes</div>

    <div className="row gap-12" style={{ marginTop:14, height:'calc(100% - 180px)' }}>
      <div className="col gap-10" style={{ flex:1, overflow:'auto', paddingRight:4 }}>

        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="⚖️" title="Ley y prácticas en Chile" sub="5 criterios" count="5 / 5" accent="var(--ok)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="Cláusulas abusivas (Art. 16)" sub="Sin coincidencias" status="done" />
            <CriterionRow title="CAE informada coincide con la real" sub="Coincide" status="done" />
            <CriterionRow title="Costo total en pesos" sub="Encontrado en cláusula 3" status="done" />
            <CriterionRow title="Productos financieros vinculados" sub="Cláusula 9 · alerta" status="done" finding="1 alerta"/>
            <CriterionRow title="Cláusula de aceleración" sub="Cláusula 12.3 · 1 cuota (estándar: 3)" status="done" finding="1 alerta"/>
          </div>
        </div>

        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="📊" title="Mercado chileno · marzo 2025" sub="4 criterios" count="2 / 4" accent="var(--mid)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="CAE vs. promedio del segmento" sub="+4.2 pts" status="done" finding="alerta"/>
            <CriterionRow title="Tasa de interés vs. mediana banca" sub="+2.5 pts" status="done" finding="alerta"/>
            <CriterionRow title="Comisión inicial vs. mercado" sub="…" status="running"/>
            <CriterionRow title="Costo del seguro de desgravamen" sub="…" status="queued"/>
          </div>
        </div>

        <div className="hb-soft" style={{ background:'#fff', padding:0 }}>
          <CategoryHeader icon="🌎" title="Referencias internacionales" sub="2 criterios" count="0 / 2" accent="var(--ink-faint)"/>
          <div className="col gap-6" style={{ padding:10 }}>
            <CriterionRow title="FCRA · uso de informe crediticio" sub="…" status="queued"/>
            <CriterionRow title="CFPB · UDAAP y disclosure" sub="…" status="queued"/>
          </div>
        </div>

      </div>

      {/* Right: partial findings as they come in */}
      <div className="col gap-8" style={{ width:240, flex:'0 0 auto' }}>
        <div className="small">Hallazgos parciales · 4</div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot hi" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>CAE</b> sobre el mercado</div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot hi" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}><b>Tasa</b> sobre mediana banca</div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot mid" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}>Seguro <b>vinculado</b></div></div>
        </div>
        <div className="hb-soft" style={{ padding:'8px 10px', background:'#fff' }}>
          <div className="row gap-6"><span className="dot mid" style={{ marginTop:5 }}></span><div style={{ fontSize:12 }}>Aceleración a 1 cuota</div></div>
        </div>

        <div className="micro" style={{ marginTop:'auto' }}>Te avisamos cuando termine.</div>
      </div>
    </div>
  </Web>
);

// === Mobile: plan, compact ===
const Plan_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:6 }}>
      <Logo />
      <span className="micro">Plan</span>
    </div>

    <div className="hb-soft" style={{ padding:'6px 8px', background:'#fff', display:'flex', alignItems:'center', gap:8 }}>
      <Glyph name="bank" size={16}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="micro" style={{ fontSize:8 }}>Identificado</div>
        <div style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:12, lineHeight:1.1 }}>Crédito de consumo</div>
      </div>
      <ConfidenceMeter confidence="high"/>
    </div>

    <div className="hand-h3" style={{ marginTop:10 }}>¿Qué revisamos?</div>

    <div className="row gap-4" style={{ marginTop:6, flexWrap:'wrap' }}>
      <span className="pill" style={{ fontSize:9, background:'var(--ink)', color:'var(--paper)' }}>Completo</span>
      <span className="pill" style={{ fontSize:9 }}>Legal</span>
      <span className="pill" style={{ fontSize:9 }}>Mercado</span>
    </div>

    <div className="col gap-6" style={{ marginTop:8, overflow:'auto', flex:1 }}>
      <div className="hb-soft" style={{ padding:'7px 10px', background:'#fff' }}>
        <div className="between">
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span>⚖️</span>
            <span style={{ fontWeight:700, fontSize:12 }}>Ley en Chile</span>
          </div>
          <div className="row gap-4" style={{ alignItems:'center' }}>
            <span className="micro">5 / 5</span>
            <Toggle on size={22}/>
          </div>
        </div>
      </div>
      <div className="hb-soft" style={{ padding:'7px 10px', background:'#fff' }}>
        <div className="between">
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span>📊</span>
            <span style={{ fontWeight:700, fontSize:12 }}>Mercado · CMF</span>
          </div>
          <div className="row gap-4" style={{ alignItems:'center' }}>
            <span className="micro">4 / 4</span>
            <Toggle on size={22}/>
          </div>
        </div>
      </div>
      <div className="hb-soft" style={{ padding:'7px 10px', background:'#fff' }}>
        <div className="between">
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span>🆚</span>
            <span style={{ fontWeight:700, fontSize:12 }}>Otras ofertas</span>
          </div>
          <div className="row gap-4" style={{ alignItems:'center' }}>
            <span className="micro">1 / 1</span>
            <Toggle on size={22}/>
          </div>
        </div>
      </div>
      <div className="hb-soft" style={{ padding:'7px 10px', background:'#f0ece0', opacity:.85 }}>
        <div className="between">
          <div className="row gap-6" style={{ alignItems:'center' }}>
            <span>🌎</span>
            <span style={{ fontWeight:700, fontSize:12 }}>Internacional</span>
          </div>
          <div className="row gap-4" style={{ alignItems:'center' }}>
            <span className="micro">2 / 4</span>
            <Toggle on={false} size={22}/>
          </div>
        </div>
        <div className="micro" style={{ marginTop:3 }}>FCRA, CFPB, EU CCD, HIPAA</div>
      </div>
    </div>

    <div className="hb-dashed" style={{ padding:8, marginTop:8 }}>
      <div className="between">
        <div className="micro">12 criterios · ~ 2 min</div>
        <span className="flag ok" style={{ fontSize:9 }}>Listo</span>
      </div>
    </div>
    <button className="btn btn-primary" style={{ width:'100%', marginTop:8 }}>Empezar análisis</button>
  </Phone>
);

Object.assign(window, { Plan_Hero, Plan_Running, Plan_Mobile });
