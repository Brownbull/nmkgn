// letra. — Compare, Email draft, History

// ===== Compare 2 offers =====
const LT_Compare = () => {
  const nav = useNav();
  return (
  <AppShell activeNav="Comparar">
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:18 }}>
        <div>
          <div className="label">2 ofertas</div>
          <h1 className="display" style={{ fontSize:30, margin:'6px 0 4px', letterSpacing:-0.025 }}>Tu crédito vs. el de María</h1>
          <div style={{ fontSize:14, color:'var(--ink-soft)' }}>Ambos son créditos de consumo en pesos · marzo 2025</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-small" onClick={() => nav.notify('Sube un segundo PDF para añadirlo')}><Icon name="plus" size={13}/> Añadir oferta</button>
          <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.go('coach')}>← Volver al análisis</button>
        </div>
      </div>

      {/* Big verdict card */}
      <div className="card" style={{
        padding:'22px 26px',
        background:'linear-gradient(180deg, var(--red-soft) 0%, var(--paper) 70%)',
        borderColor:'transparent',
        marginBottom:18,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:280 }}>
            <div className="label" style={{ color:'var(--red)' }}>Veredicto</div>
            <div className="display" style={{ fontSize:28, marginTop:6, letterSpacing:-0.025, lineHeight:1.15 }}>
              El crédito de María queda <span style={{ color:'var(--green)' }}>$1.2M mejor</span> a lo largo del plazo.
            </div>
            <div style={{ fontSize:14, color:'var(--ink-soft)', marginTop:8, lineHeight:1.55, maxWidth:520 }}>
              La diferencia real no son las cuotas mensuales — son los <b>8 meses extra</b> y los <b>5.4 pts adicionales de CAE</b>.
            </div>
          </div>
          <div style={{ display:'flex', gap:18 }}>
            <DeltaBlock label="Plazo extra"  value="+8" suffix="cuotas" sev="hi"/>
            <DeltaBlock label="CAE"          value="+5.4" suffix="pts"     sev="hi"/>
            <DeltaBlock label="Costo total"  value="−$1.2M" suffix="vs. María" sev="hi"/>
          </div>
        </div>
      </div>

      {/* Comparison grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <OfferCard
          tag="EL TUYO" sev="hi" sevLabel="Peor"
          bank="BancoPlaceholder" date="14 mar 2025"
          rows={[
            ['Monto',         '$18.000.000'],
            ['Cuotas',        '68'],
            ['CAE',           '24.8%'],
            ['Tasa interés',  '18.4%'],
            ['Cuota mensual', '$352.400'],
            ['Costo total',   '$23.9M'],
            ['Seguro',        'Vinculado al banco'],
            ['Aceleración',   '1 cuota impaga'],
          ]}/>
        <OfferCard
          tag="EL DE MARÍA" sev="ok" sevLabel="Mejor"
          bank="OtroBanco" date="14 mar 2025"
          rows={[
            ['Monto',         '$18.000.000'],
            ['Cuotas',        '60'],
            ['CAE',           '19.4%'],
            ['Tasa interés',  '14.8%'],
            ['Cuota mensual', '$378.200'],
            ['Costo total',   '$22.7M'],
            ['Seguro',        'Compañía externa'],
            ['Aceleración',   '3 cuotas impagas'],
          ]}/>
      </div>

      {/* Why you did worse */}
      <div style={{ marginTop:22 }}>
        <h2 className="display" style={{ fontSize:18, margin:'0 0 12px', letterSpacing:-0.015 }}>¿Por qué quedaste peor?</h2>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          <span className="pill pill-red" style={{ fontSize:12, padding:'5px 12px' }}>+8 cuotas en el plazo</span>
          <span className="pill pill-red" style={{ fontSize:12, padding:'5px 12px' }}>+5.4 pts en CAE</span>
          <span className="pill pill-amber" style={{ fontSize:12, padding:'5px 12px' }}>Seguro vinculado al banco</span>
          <span className="pill pill-amber" style={{ fontSize:12, padding:'5px 12px' }}>Aceleración más estricta</span>
          <span className="pill" style={{ fontSize:12, padding:'5px 12px' }}>Tomado bajo urgencia · sin cotización paralela</span>
        </div>
      </div>
    </div>
  </AppShell>
  );
};

const DeltaBlock = ({ label, value, suffix, sev }) => {
  const color = sev==='hi' ? 'var(--red)' : sev==='ok' ? 'var(--green)' : 'var(--amber)';
  return (
    <div className="card" style={{ padding:'14px 18px', minWidth:120 }}>
      <div className="label">{label}</div>
      <div className="num display" style={{ fontSize:22, marginTop:6, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11.5, color:'var(--ink-faint)', marginTop:4 }}>{suffix}</div>
    </div>
  );
};

const OfferCard = ({ tag, sev, sevLabel, bank, date, rows }) => {
  const accent = sev==='hi' ? 'var(--red)' : 'var(--green)';
  const accentSoft = sev==='hi' ? 'var(--red-soft)' : 'var(--green-soft)';
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', background: accentSoft, display:'flex', alignItems:'center', gap:10 }}>
        <span className="label" style={{ color: accent }}>{tag}</span>
        <div style={{ flex:1 }}/>
        <span className={`pill ${sev==='hi'?'pill-red':'pill-green'}`} style={{ fontSize:11 }}>{sevLabel}</span>
      </div>
      <div style={{ padding:'14px 18px 6px' }}>
        <div style={{ fontSize:15, fontWeight:700 }}>{bank}</div>
        <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:2 }}>{date}</div>
      </div>
      <div style={{ padding:'4px 18px 18px', display:'flex', flexDirection:'column' }}>
        {rows.map(([k,v],i)=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'9px 0', borderTop: i===0 ? 'none' : '1px solid var(--line)' }}>
            <span style={{ fontSize:12.5, color:'var(--ink-soft)' }}>{k}</span>
            <span className="num" style={{ fontSize:13.5, fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== Email to bank =====

// Tones — each rewrites greeting/intro/outro and the per-finding paragraph
const EMAIL_TONES = {
  cordial: {
    label:'Cordial',
    desc:'Amable y abierto, sin presión',
    pillCls:'pill-accent',
    greet:'Estimado/a,',
    intro:'Antes de firmar el contrato de mutuo en referencia, me gustaría aclarar algunos puntos:',
    outro:'Quedo atento/a a su respuesta. Muchas gracias.',
    sign:'Saluda atentamente,',
  },
  firme: {
    label:'Firme',
    desc:'Asertivo pero respetuoso · pide cambios concretos',
    pillCls:'pill-amber',
    greet:'Estimado/a,',
    intro:'Antes de firmar el contrato de mutuo, necesito que revisemos los siguientes puntos. Hay diferencias respecto a lo simulado y a lo que indica la normativa:',
    outro:'Agradezco confirmar por escrito los ajustes antes de la firma.',
    sign:'Atentamente,',
  },
  asertivo: {
    label:'Asertivo',
    desc:'Claro y orientado a negociación · cita ley y mercado',
    pillCls:'pill-red',
    greet:'Estimado/a,',
    intro:'Antes de firmar el contrato, requiero los siguientes ajustes. Cada punto está fundamentado en la Ley 19.496, datos CMF o el estándar de mercado:',
    outro:'Espero su respuesta con la propuesta actualizada en los próximos 5 días hábiles.',
    sign:'Cordialmente,',
  },
  directo: {
    label:'Directo',
    desc:'Sin rodeos · bullets cortos',
    pillCls:'pill',
    greet:'Hola,',
    intro:'Antes de firmar, necesito resolver:',
    outro:'Quedo a la espera.',
    sign:'Saludos,',
  },
};

// Findings — each finding has tone-specific paragraph and a real clause excerpt
const EMAIL_FINDINGS = [
  {
    id:'plazo',
    sev:'hi', title:'Plazo', summary:'68 cuotas vs. 60 simuladas', clauseRef:'Cláusula 4.2', lens:'ley',
    clauseText:'"El deudor pagará el monto adeudado en sesenta y ocho (68) cuotas mensuales y sucesivas, venciendo la primera de ellas el día 14 de abril de 2025…"',
    by: {
      cordial:'En la simulación inicial el plazo era de 60 cuotas; el contrato indica 68 cuotas en la cláusula 4.2. Agradecería recibir la tabla de amortización a 60 cuotas para comparar.',
      firme:'La simulación mostraba 60 cuotas. El contrato indica 68 cuotas (cláusula 4.2) — son 8 cuotas adicionales no informadas en la cotización. Necesito la versión a 60 cuotas o la justificación del cambio.',
      asertivo:'El plazo informado en simulación (60 cuotas) difiere del contrato (68 cuotas, cláusula 4.2). Solicito alinearlo a la simulación original o presentar por escrito la causa del cambio.',
      directo:'Plazo: 68 cuotas vs. 60 simuladas (cl. 4.2). Necesito la tabla a 60.',
    },
  },
  {
    id:'cae',
    sev:'hi', title:'CAE', summary:'24.8% — +4.2 pts vs. mercado', clauseRef:'Cláusula 3', lens:'mercado',
    clauseText:'"Carga Anual Equivalente (CAE) aplicable al presente crédito: 24,8% anual."',
    by: {
      cordial:'La CAE del contrato es 24.8%, 4.2 puntos sobre el promedio CMF de marzo 2025 para mi perfil. ¿Existe espacio para ajustarla?',
      firme:'La CAE de 24.8% supera en 4.2 puntos el promedio CMF para mi segmento (marzo 2025). Solicito una propuesta con CAE alineada a mercado.',
      asertivo:'CAE de 24.8% — 4.2 puntos sobre el promedio CMF marzo 2025 para mi perfil. Sobre $18M y 60 cuotas, esto representa ~$890.000 adicionales. Solicito alinearla al mercado.',
      directo:'CAE 24.8% (cl. 3). Mercado: 20.6%. Bajar a 21% o explicar.',
    },
  },
  {
    id:'seguro',
    sev:'mid', title:'Seguro vinculado', summary:'Compañía del banco — Art. 17 H', clauseRef:'Cláusula 9', lens:'ley',
    clauseText:'"El deudor contratará un seguro de desgravamen con Aseguradora Filial S.A., compañía vinculada al banco…"',
    by: {
      cordial:'El seguro de desgravamen (cláusula 9) está vinculado a la compañía del banco. Conforme al Art. 17 H Ley 19.496, solicito poder contratarlo con otra aseguradora.',
      firme:'La cláusula 9 obliga a contratar el seguro con una aseguradora vinculada al banco. El Art. 17 H Ley 19.496 me reconoce el derecho a elegir el proveedor. Solicito modificarla.',
      asertivo:'Cláusula 9 — seguro vinculado al banco. El Art. 17 H Ley 19.496 ampara mi elección de aseguradora externa. Solicito eliminar la imposición.',
      directo:'Seguro vinculado (cl. 9). Art. 17 H me deja elegir. Saquen la imposición.',
    },
  },
  {
    id:'mora',
    sev:'mid', title:'Aceleración', summary:'Cláusula 12.3 · 1 cuota (estándar 3)', clauseRef:'Cláusula 12.3', lens:'mercado',
    clauseText:'"El no pago de una (1) cuota habilitará al acreedor a hacer exigible la totalidad de la deuda."',
    by: {
      cordial:'La cláusula 12.3 establece aceleración por 1 cuota impaga; el estándar de mercado es 3. ¿Pueden ajustarla?',
      firme:'Aceleración a 1 cuota (cláusula 12.3) es más estricta que el estándar de mercado (3 cuotas). Solicito modificarla.',
      asertivo:'Aceleración a 1 cuota (cláusula 12.3) — la mediana del mercado es 3 cuotas. Solicito alinearla.',
      directo:'Aceleración 1 cuota (cl. 12.3). Mercado: 3. Cambien a 3.',
    },
  },
];

// Estimate word count for a tone + active findings combination
function emailWordCount(tone, activeFindings, signOff) {
  const t = EMAIL_TONES[tone];
  const parts = [
    t.greet, t.intro,
    ...activeFindings.map(f => f.by[tone]),
    t.outro, t.sign, signOff,
  ];
  return parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

const LT_Email = () => {
  const nav = useNav();
  const [tone, setTone] = React.useState('cordial');
  const [toneOpen, setToneOpen] = React.useState(false);
  const [enabled, setEnabled] = React.useState(() => new Set(EMAIL_FINDINGS.map(f => f.id)));
  const [activeClause, setActiveClause] = React.useState(null);
  const [sent, setSent] = React.useState(false);

  const toggleFinding = (id) => {
    setEnabled(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const t = EMAIL_TONES[tone];
  const active = EMAIL_FINDINGS.filter(f => enabled.has(f.id));
  const signOff = 'Juan R.';
  const wordCount = emailWordCount(tone, active, signOff);
  const readingSec = Math.max(15, Math.round(wordCount / 3.5));

  const handleSend = () => {
    setSent(true);
    nav.notify('Email enviado a ejecutivo@bancoplaceholder.cl');
  };

  return (
  <AppShell>
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:18 }}>
        <div>
          <div className="label">Acción</div>
          <h1 className="display" style={{ fontSize:28, margin:'6px 0 4px', letterSpacing:-0.025 }}>Redactar email al banco</h1>
          <div style={{ fontSize:14, color:'var(--ink-soft)' }}>
            {sent ? 'Email enviado · puedes seguir editando o ir al historial.' :
              `Redactado con base en ${active.length} de ${EMAIL_FINDINGS.length} hallazgos. Edítalo antes de enviar.`}
          </div>
        </div>
        <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.go('coach')}>← Volver al análisis</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:18 }}>
        {/* Email composer */}
        <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
          {/* Toolbar */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8, background:'var(--paper)' }}>
            <div style={{ position:'relative' }}>
              <button className="btn btn-xs" onClick={() => setToneOpen(o => !o)}>
                <Icon name="edit" size={11}/> Tono · <b style={{ marginLeft:4 }}>{t.label}</b>
                <Icon name="chevron-d" size={10}/>
              </button>
              {toneOpen ? (
                <div className="card" style={{
                  position:'absolute', top:32, left:0, zIndex:50,
                  padding:6, minWidth:240, boxShadow:'0 16px 36px -8px rgba(0,0,0,0.18)',
                }}>
                  {Object.entries(EMAIL_TONES).map(([id, def]) => {
                    const on = tone === id;
                    return (
                      <button key={id}
                        onClick={() => { setTone(id); setToneOpen(false); }}
                        className="btn btn-xs"
                        style={{
                          width:'100%', display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px',
                          background: on ? 'var(--paper-2)' : 'transparent', border:'none', textAlign:'left',
                          borderRadius:8,
                        }}>
                        <span style={{
                          width:14, height:14, borderRadius:'50%',
                          border: on ? '4px solid var(--accent)' : '1.5px solid var(--line-2)',
                          background:'#fff', flex:'0 0 auto', marginTop:1,
                        }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:700 }}>{def.label}</div>
                          <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2, lineHeight:1.4 }}>{def.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <span className={`pill ${t.pillCls}`} style={{ fontSize:10.5 }}>{t.label.toLowerCase()}</span>
            <span style={{ fontSize:11, color:'var(--ink-faint)' }}>· {wordCount} palabras · {readingSec}s lectura</span>
            <div style={{ flex:1 }}/>
            <span style={{ fontSize:11, color:'var(--ink-faint)' }}>Idioma · ES-CL</span>
          </div>

          {/* Headers */}
          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:8, borderBottom:'1px solid var(--line)' }}>
            <EmailField label="Para" value="ejecutivo@bancoplaceholder.cl"/>
            <EmailField label="CC"   value="maria.lopez@gmail.com"/>
            <EmailField label="Asunto" value="Consultas sobre el contrato de mutuo N° 4471-2025-ZZ" bold/>
          </div>

          {/* Body */}
          <div style={{ padding:'18px 22px', fontSize:14, lineHeight:1.65, color:'var(--ink)', fontFamily:'Manrope', minHeight:300 }}>
            <p style={{ margin:'0 0 14px' }}>{t.greet}</p>
            <p style={{ margin:'0 0 14px' }}>{t.intro}</p>
            {active.length === 0 ? (
              <div style={{
                padding:'18px 16px', background:'var(--paper-2)', borderRadius:10,
                fontSize:13, color:'var(--ink-faint)', lineHeight:1.55, textAlign:'center',
              }}>
                No hay hallazgos activos. Apaga / enciende hallazgos en el panel derecho para incluirlos.
              </div>
            ) : (
              <ol style={{ margin:'0', padding:'0 0 0 20px', display:'flex', flexDirection:'column', gap:10 }}>
                {active.map(f => (
                  <li key={f.id} style={{ animation:'emailLineIn .25s ease-out' }}>
                    {f.by[tone]}{' '}
                    <button
                      onClick={() => setActiveClause(activeClause === f.id ? null : f.id)}
                      style={{
                        background:'transparent', border:'1px dashed var(--line-2)', borderRadius:5,
                        padding:'1px 6px', fontSize:11, color:'var(--ink-soft)', cursor:'pointer',
                        fontFamily:'JetBrains Mono', verticalAlign:'middle',
                      }}>
                      📎 {f.clauseRef}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <p style={{ margin:'14px 0 0' }}>{t.outro}</p>
            <p style={{ margin:'10px 0 0' }}>{t.sign}<br/>{signOff}</p>
          </div>

          {/* Footer actions / sent state */}
          {sent ? (
            <div style={{
              padding:'14px 18px', borderTop:'1px solid var(--accent)',
              background:'var(--accent-soft)',
              display:'flex', alignItems:'center', gap:12,
            }}>
              <Icon name="check-circle" size={18} color="var(--accent)"/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'var(--accent)' }}>Email enviado · hace unos segundos</div>
                <div style={{ fontSize:11.5, color:'var(--ink-soft)', marginTop:2 }}>
                  Lo guardamos en tu análisis para reabrirlo si responden.
                </div>
              </div>
              <button className="btn btn-xs" onClick={() => setSent(false)}>Seguir editando</button>
              <button className="btn btn-xs btn-accent" onClick={() => nav.go('history')}>Ver en historial</button>
            </div>
          ) : (
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8 }}>
              <button className="btn btn-small btn-ghost" style={{ color:'var(--ink-soft)' }} onClick={() => nav.notify('Análisis adjuntado · 2 páginas')}>
                <Icon name="file" size={13}/> Adjuntar análisis (PDF)
              </button>
              <span className="pill" style={{ fontSize:10.5 }}>📎 análisis · 2 págs.</span>
              <div style={{ flex:1 }}/>
              <button className="btn btn-small" onClick={() => nav.notify('Borrador guardado')}>Guardar borrador</button>
              <button className="btn btn-small" onClick={() => { navigator.clipboard?.writeText('Email copiado'); nav.notify('Texto copiado al portapapeles'); }}>Copiar</button>
              <button className="btn btn-small btn-accent" disabled={active.length === 0} style={active.length === 0 ? { opacity:0.45, cursor:'not-allowed' } : null} onClick={handleSend}>
                <Icon name="send" size={13}/> Enviar
              </button>
            </div>
          )}

          {/* Clause popover */}
          {activeClause ? (() => {
            const f = EMAIL_FINDINGS.find(x => x.id === activeClause);
            return (
              <div style={{
                position:'absolute', right:18, bottom:78, zIndex:30,
                maxWidth:380,
                background:'#fff', border:'1px solid var(--line)', borderRadius:10,
                padding:'12px 14px', boxShadow:'0 18px 36px -10px rgba(0,0,0,0.2)',
                animation:'emailLineIn .2s ease-out',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="label" style={{ fontSize:9.5 }}>{f.clauseRef} · texto original</span>
                  <div style={{ flex:1 }}/>
                  <span style={{ fontSize:14, color:'var(--ink-faint)', cursor:'pointer' }} onClick={() => setActiveClause(null)}>×</span>
                </div>
                <div style={{
                  marginTop:8, padding:'10px 12px', background:'var(--paper-2)', borderRadius:6,
                  fontSize:12, color:'var(--ink-soft)', lineHeight:1.55, fontStyle:'italic',
                }}>
                  {f.clauseText}
                </div>
              </div>
            );
          })() : null}
        </div>

        {/* Right rail: findings */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div className="label">Hallazgos en el email</div>
            <span style={{ fontSize:11, color:'var(--ink-faint)' }}>{active.length} / {EMAIL_FINDINGS.length} activos</span>
          </div>

          {EMAIL_FINDINGS.map((f) => {
            const on = enabled.has(f.id);
            return (
              <div key={f.id} className="card" style={{
                padding:'12px 14px',
                opacity: on ? 1 : 0.55,
                transition:'opacity .2s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className={`pill ${f.sev==='hi'?'pill-red':'pill-amber'}`} style={{ fontSize:10.5, padding:'2px 7px' }}>
                    {f.sev==='hi'?'Alto':'Atención'}
                  </span>
                  <span style={{ fontSize:13.5, fontWeight:700, flex:1 }}>{f.title}</span>
                  <span onClick={() => toggleFinding(f.id)} style={{ cursor:'pointer' }}>
                    <Toggle on={on} size={26}/>
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                  <LensTag id={f.lens}/>
                </div>
                <div style={{ fontSize:12.5, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>{f.summary}</div>
                <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:4 }}>{f.clauseRef}</div>
              </div>
            );
          })}

          <div className="card-soft" style={{ padding:14, fontSize:12, color:'var(--ink-soft)', lineHeight:1.5, marginTop:'auto' }}>
            <Icon name="sparkle" size={12}/> Apaga un hallazgo para sacarlo del email. Re-redactamos al toque.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes emailLineIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  </AppShell>
  );
};

const EmailField = ({ label, value, bold }) => (
  <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
    <span className="label" style={{ width:50, fontSize:10 }}>{label}</span>
    <span style={{ fontSize:13.5, color: bold ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: bold ? 700 : 400 }}>{value}</span>
  </div>
);

const Highlight = ({ children }) => (
  <span style={{ background:'var(--red-soft)', padding:'1px 4px', borderRadius:3, color:'var(--red)', fontWeight:600 }}>{children}</span>
);

// ===== History =====
const LT_History = () => {
  const nav = useNav();
  return (
  <AppShell activeNav="Mis documentos">
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, gap:12 }}>
        <div>
          <div className="label">Historial</div>
          <h1 className="display" style={{ fontSize:30, margin:'6px 0 4px', letterSpacing:-0.025 }}>Mis documentos</h1>
          <div style={{ fontSize:14, color:'var(--ink-soft)' }}>7 documentos · este año</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-small" onClick={() => nav.notify('Filtros próximamente')}><Icon name="sliders" size={13}/> Filtros</button>
          <button className="btn btn-small" onClick={() => nav.notify('Búsqueda próximamente')}><Icon name="search" size={13}/> Buscar</button>
          <button className="btn btn-small btn-accent" onClick={() => { nav.set({ detectResult: 'ready' }); nav.go('upload'); }}><Icon name="plus" size={13}/> Nuevo análisis</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'flex', gap:14, marginBottom:18 }}>
        <StatCard label="Analizados"     value="7"     sub="este año"/>
        <StatCard label="Ahorro estimado" value="$2.4M" sub="por negociar 3 ofertas" sev="ok" delta="+$2.4M"/>
        <StatCard label="Pendientes"      value="2"     sub="esperan tu firma" sev="mid" delta="acción"/>
        <StatCard label="No soportados"   value="1"     sub="te avisaremos cuando esté listo" delta="en cola"/>
      </div>

      {/* List */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {[
          { icon:'bank',  name:'Crédito BancoPlaceholder',     tag:'Crédito de consumo', date:'14 mar 2025', score:62, sev:'hi',  meta:'68 cuotas · CAE 24.8%' },
          { icon:'bank',  name:'Crédito María · OtroBanco',    tag:'Crédito de consumo', date:'14 mar 2025', score:88, sev:'ok',  meta:'60 cuotas · CAE 19.4%' },
          { icon:'wrench',name:'Cotización Taller Reyes',       tag:'Cotización taller',  date:'02 mar 2025', score:74, sev:'mid', meta:'5 ítems · 2 sin detalle' },
          { icon:'house', name:'Arriendo depto. Providencia',   tag:'Arriendo vivienda',  date:'18 feb 2025', score:91, sev:'ok',  meta:'1 año · UF 18 mensual' },
          { icon:'shield',name:'Seguro auto · Aseguradora X',   tag:'Seguro',             date:'10 feb 2025', score:69, sev:'mid', meta:'Cobertura básica' },
          { icon:'bank',  name:'Crédito hipotecario · simulación', tag:'Crédito hipotecario', date:'28 ene 2025', score:80, sev:'ok', meta:'Simulación · no firmado' },
          { icon:'file',  name:'Términos del banco',            tag:'No soportado',       date:'14 mar 2025', score:null, sev:'unsupported', meta:'En lista de espera' },
        ].map((r,i,arr)=>(
          <div key={i}
            onClick={() => {
              if (r.sev === 'unsupported') { nav.notify('Te avisaremos cuando soportemos este tipo'); return; }
              nav.set({ docType: r.icon, docLabel: r.tag, fileName: r.name + '.pdf' });
              nav.go('coach');
            }}
            style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'14px 18px',
            borderTop: i===0 ? 'none' : '1px solid var(--line)',
            cursor:'pointer',
          }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}>
              <Icon name={r.icon} size={18}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:14.5, fontWeight:700 }}>{r.name}</span>
                <span className={`pill ${r.sev==='unsupported'?'pill-red':''}`} style={{ fontSize:10.5 }}>{r.tag}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3 }}>{r.date} · {r.meta}</div>
            </div>
            {r.score != null ? (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <ScoreRing score={r.score} sev={r.sev}/>
              </div>
            ) : (
              <span className="pill pill-red" style={{ fontSize:11 }}>—</span>
            )}
            {/* Row actions — re-analyze + share, only for analyzed docs */}
            {r.score != null ? (
              <div style={{ display:'flex', gap:4, marginLeft:4 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-xs btn-ghost" style={{ color:'var(--ink-faint)', padding:'4px 8px' }}
                  title="Compartir"
                  onClick={() => { nav.set({ docType: r.icon, docLabel: r.tag, fileName: r.name + '.pdf' }); nav.go('share'); }}>
                  <Icon name="send" size={13}/>
                </button>
                <button className="btn btn-xs btn-ghost" style={{ color:'var(--ink-faint)', padding:'4px 8px' }}
                  title="Re-analizar con nueva versión"
                  onClick={() => { nav.set({ detectResult:'ready', fileName: r.name.toLowerCase().replace(/\s+/g,'-')+'-v2.pdf' }); nav.go('upload'); }}>
                  ↻
                </button>
              </div>
            ) : null}
            <Icon name="chevron-r" size={16} color="var(--ink-faint)"/>
          </div>
        ))}
      </div>
    </div>
  </AppShell>
  );
};

const ScoreRing = ({ score, sev }) => {
  const color = sev==='hi'?'var(--red)':sev==='mid'?'var(--amber)':sev==='ok'?'var(--green)':'var(--ink-faint)';
  const r = 14;
  const c = 2*Math.PI*r;
  return (
    <div style={{ width:42, height:42, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg width="42" height="42" viewBox="0 0 42 42" style={{ position:'absolute', inset:0 }}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="3"/>
        <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${score/100*c} ${c}`} transform="rotate(-90 21 21)"/>
      </svg>
      <span className="num" style={{ fontSize:12.5, fontWeight:700, color }}>{score}</span>
    </div>
  );
};

Object.assign(window, { LT_Compare, LT_Email, LT_History });
