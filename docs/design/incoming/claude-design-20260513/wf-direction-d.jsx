// Direction D — Negotiation coach + comparison
// Dashboard framing. Market benchmarks. Side-by-side compare two docs (Juan vs spouse).

const StatCard = ({ label, value, sub, sev }) => (
  <div className="hb-soft" style={{ padding:10, background:'#fff', flex:1, minWidth:0 }}>
    <div className="small">{label}</div>
    <div className="hand-h2" style={{ marginTop:2, color: sev==='hi'?'var(--hi)':sev==='ok'?'var(--ok)':'var(--ink)' }}>{value}</div>
    <div className="micro" style={{ marginTop:2 }}>{sub}</div>
  </div>
);

const BarRow = ({ label, you, market, sev }) => {
  const max = Math.max(you, market) * 1.15;
  return (
    <div style={{ marginTop:8 }}>
      <div className="between" style={{ marginBottom:4 }}>
        <span style={{ fontSize:12, fontWeight:700 }}>{label}</span>
        <span className={`flag ${sev}`}>{you > market ? '+' : ''}{(you-market).toFixed(1)}</span>
      </div>
      <div className="row gap-4" style={{ alignItems:'center' }}>
        <span className="micro" style={{ width:36 }}>Tú</span>
        <div style={{ flex:1, height:10, background:'#efe9d6', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${you/max*100}%`, height:'100%', background:'var(--hi)' }}></div>
        </div>
        <span className="micro" style={{ width:40, textAlign:'right' }}>{you}%</span>
      </div>
      <div className="row gap-4" style={{ alignItems:'center', marginTop:2 }}>
        <span className="micro" style={{ width:36 }}>Mercado</span>
        <div style={{ flex:1, height:10, background:'#efe9d6', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${market/max*100}%`, height:'100%', background:'var(--ok)' }}></div>
        </div>
        <span className="micro" style={{ width:40, textAlign:'right' }}>{market}%</span>
      </div>
    </div>
  );
};

const D_Hero = () => (
  <Web>
    <AppBarWithBadge
      badge={<DocTypeBadge icon="bank" label="Crédito de consumo" market="Chile · CMF" confidence="high"/>}
    />
    <div className="hand-h2" style={{ marginBottom:2 }}>Tu crédito vs. el mercado</div>
    <div className="scribble" style={{ marginBottom:10, fontSize:13 }}>BancoPlaceholder · 14 mar 2025 · contrato.pdf</div>

    <div className="row gap-12">
      <StatCard label="Monto" value="$18.0M" sub="Solicitado" />
      <StatCard label="Cuotas" value="68" sub="vs. 60 simuladas" sev="hi" />
      <StatCard label="CAE" value="24.8%" sub="+4.2 sobre mercado" sev="hi" />
      <StatCard label="Costo total" value="$23.9M" sub="$1.4M más que esperado" sev="hi" />
    </div>

    <div className="row gap-16" style={{ marginTop:14, height:260 }}>
      <div className="hb-soft" style={{ flex:1.2, padding:12, background:'#fff' }}>
        <div className="between">
          <div className="hand-h3">vs. mercado · marzo 2025</div>
          <span className="small">Fuente: CMF</span>
        </div>
        <BarRow label="CAE" you={24.8} market={20.6} sev="hi" />
        <BarRow label="Tasa interés" you={18.4} market={15.9} sev="hi" />
        <BarRow label="Comisión" you={2.1}  market={1.4}  sev="mid" />
      </div>

      <div className="col gap-8" style={{ flex:1 }}>
        <div className="hand-h3">Plan de acción</div>
        <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
          <div className="row gap-6" style={{ alignItems:'flex-start' }}>
            <span className="flag hi" style={{ fontSize:9 }}>1</span>
            <div style={{ fontSize:13 }}><b>Pide cotización a 2 bancos más.</b> Con tu perfil puedes apuntar a 20% CAE.</div>
          </div>
        </div>
        <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
          <div className="row gap-6" style={{ alignItems:'flex-start' }}>
            <span className="flag hi" style={{ fontSize:9 }}>2</span>
            <div style={{ fontSize:13 }}><b>Pregunta por qué son 68 cuotas y no 60.</b> Tienes argumento legal si la simulación decía 60.</div>
          </div>
        </div>
        <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
          <div className="row gap-6" style={{ alignItems:'flex-start' }}>
            <span className="flag mid" style={{ fontSize:9 }}>3</span>
            <div style={{ fontSize:13 }}><b>Cambia el seguro</b> a una compañía externa: ahorro estimado $320k.</div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop:'auto', alignSelf:'flex-start', padding:'6px 12px', fontSize:13 }}>Generar email para el banco →</button>
      </div>
    </div>

    {/* International standards — comparative context only, not flags */}
    <div className="hb-dashed" style={{ marginTop:14, padding:'10px 14px', background:'#f4eedb' }}>
      <div className="between" style={{ marginBottom:6 }}>
        <div className="row gap-6" style={{ alignItems:'center' }}>
          <span style={{ fontSize:14 }}>🌎</span>
          <span style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:14 }}>Contexto internacional</span>
          <span className="pill" style={{ fontSize:9, background:'#fff' }}>solo referencia</span>
        </div>
        <span className="micro">No genera alertas · educativo</span>
      </div>
      <div className="row gap-10">
        <div className="hb" style={{ flex:1, padding:'6px 8px', background:'#fff' }}>
          <div className="micro" style={{ fontSize:9 }}>FCRA · EE.UU.</div>
          <div style={{ fontSize:11.5, lineHeight:1.3 }}>Si esto fuera EE.UU., exigiría notificarte de uso de tu informe crediticio. Acá <b>no es obligatorio</b>.</div>
        </div>
        <div className="hb" style={{ flex:1, padding:'6px 8px', background:'#fff' }}>
          <div className="micro" style={{ fontSize:9 }}>CFPB · UDAAP</div>
          <div style={{ fontSize:11.5, lineHeight:1.3 }}>El cambio de 60 a 68 cuotas <b>podría considerarse práctica engañosa</b> bajo el estándar CFPB.</div>
        </div>
        <div className="hb" style={{ flex:1, padding:'6px 8px', background:'#fff' }}>
          <div className="micro" style={{ fontSize:9 }}>EU CCD · ESIS</div>
          <div style={{ fontSize:11.5, lineHeight:1.3 }}>En la UE, la tabla ESIS muestra todos los costos en una sola página estándar. <b>Acá no existe</b>.</div>
        </div>
      </div>
    </div>

  </Web>
);

const D_Compare = () => (
  <Web>
    <AppBarWithBadge
      badge={<DocTypeBadge icon="bank" label="2 créditos comparados" market="Chile · CMF" confidence="high"/>}
      right={<span className="pill">+ Añadir oferta</span>}
    />
    <div className="hand-h2">Tu crédito vs. el de tu esposa</div>
    <div className="scribble">Cargamos ambos contratos. Te mostramos quién quedó mejor — y por qué.</div>

    <div className="row gap-12" style={{ marginTop:14, height:280 }}>
      {/* Yours */}
      <div className="hb-soft" style={{ flex:1, padding:12, background:'#fff', borderColor:'var(--hi)', borderWidth:2 }}>
        <div className="between">
          <div className="hand-h3">El tuyo</div>
          <span className="flag hi">Peor</span>
        </div>
        <div className="micro">BancoPlaceholder · marzo 2025</div>
        <div className="col gap-4" style={{ marginTop:8 }}>
          <div className="between" style={{ fontSize:13 }}><span>Cuotas</span><span><b>68</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>CAE</span><span><b>24.8%</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Cuota mensual</span><span><b>$352k</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Costo total</span><span><b>$23.9M</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Seguro</span><span>Vinculado</span></div>
        </div>
      </div>

      {/* Spouse's */}
      <div className="hb-soft" style={{ flex:1, padding:12, background:'#fff', borderColor:'var(--ok)', borderWidth:2 }}>
        <div className="between">
          <div className="hand-h3">El de tu esposa</div>
          <span className="flag ok">Mejor</span>
        </div>
        <div className="micro">OtroBanco · marzo 2025</div>
        <div className="col gap-4" style={{ marginTop:8 }}>
          <div className="between" style={{ fontSize:13 }}><span>Cuotas</span><span><b>60</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>CAE</span><span><b>19.4%</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Cuota mensual</span><span><b>$378k</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Costo total</span><span><b>$22.7M</b></span></div>
          <div className="between" style={{ fontSize:13 }}><span>Seguro</span><span>Externo</span></div>
        </div>
      </div>

      {/* Verdict */}
      <div className="col" style={{ width:200, gap:8 }}>
        <div className="hb-dashed" style={{ padding:12 }}>
          <div className="small">Diferencia total</div>
          <div className="hand-h1" style={{ fontSize:32, color:'var(--hi)' }}>−$1.2M</div>
          <div className="micro">a lo largo del crédito</div>
        </div>
        <div className="scribble" style={{ fontSize:12 }}>
          La diferencia real no son las cuotas mensuales — son los <b>8 meses</b> y la CAE más alta.
        </div>
      </div>
    </div>

    <div className="hand-h3" style={{ marginTop:12 }}>¿Por qué quedaste peor?</div>
    <div className="row gap-8" style={{ marginTop:6 }}>
      <span className="flag hi">+8 cuotas</span>
      <span className="flag hi">+5.4 pts CAE</span>
      <span className="flag mid">Seguro vinculado</span>
      <span className="flag mid">Sin cotización paralela</span>
    </div>
  </Web>
);

const D_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:6 }}>
      <Logo />
      <span className="pill" style={{ fontSize:9 }}>Comparar</span>
    </div>

    {/* Doc-type badge is persistent on mobile too — compact form */}
    <div className="hb-soft" style={{ padding:'6px 8px', background:'#fff', display:'flex', alignItems:'center', gap:8 }}>
      <Glyph name="bank" size={16}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="micro" style={{ fontSize:8 }}>Identificado</div>
        <div style={{ fontFamily:'var(--hand)', fontWeight:700, fontSize:12, lineHeight:1.1 }}>Crédito de consumo</div>
      </div>
      <ConfidenceMeter confidence="high"/>
    </div>

    <div className="hb-dashed" style={{ padding:10, textAlign:'center', marginTop:8 }}>
      <div className="small">Estás pagando de más</div>
      <div className="hand-h1" style={{ fontSize:30, color:'var(--hi)' }}>+$1.4M</div>
      <div className="micro">vs. mercado para tu perfil</div>
    </div>

    <div className="hand-h3" style={{ marginTop:10 }}>Qué hacer</div>
    <div className="col gap-6" style={{ marginTop:4 }}>
      <div className="hb-soft" style={{ padding:8, background:'#fff' }}>
        <div className="row gap-6"><span className="flag hi" style={{ fontSize:9 }}>1</span><span style={{ fontSize:12 }}>Cotiza con 2 bancos más</span></div>
      </div>
      <div className="hb-soft" style={{ padding:8, background:'#fff' }}>
        <div className="row gap-6"><span className="flag hi" style={{ fontSize:9 }}>2</span><span style={{ fontSize:12 }}>Pregunta por las 8 cuotas extra</span></div>
      </div>
      <div className="hb-soft" style={{ padding:8, background:'#fff' }}>
        <div className="row gap-6"><span className="flag mid" style={{ fontSize:9 }}>3</span><span style={{ fontSize:12 }}>Cambia el seguro</span></div>
      </div>
    </div>

    <div style={{ flex:1 }}></div>
    <button className="btn btn-primary" style={{ width:'100%' }}>Generar email al banco</button>
  </Phone>
);

Object.assign(window, { D_Hero, D_Compare, D_Mobile });
