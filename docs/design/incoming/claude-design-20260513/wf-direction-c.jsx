// Direction C — Conversational
// Chat with the document. Flags surface as suggested questions and answers.

const ChatBubble = ({ from='ai', children, sources, flag }) => {
  const isUser = from === 'user';
  return (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginTop:8 }}>
      <div className="hb-soft" style={{
        maxWidth: '78%',
        padding:'8px 10px',
        background: isUser ? 'var(--ink)' : '#fff',
        color: isUser ? 'var(--paper)' : 'var(--ink)',
        boxShadow: isUser ? '2px 2px 0 rgba(0,0,0,.2)' : '2px 2px 0 rgba(0,0,0,.06)',
        border: '1.5px solid var(--rule)',
      }}>
        {flag ? <div style={{ marginBottom:4 }}><span className={`flag ${flag}`}>{flag==='hi'?'Alerta':flag==='mid'?'Atención':'OK'}</span></div> : null}
        <div style={{ fontSize:13.5, lineHeight:1.4 }}>{children}</div>
        {sources && sources.length ? (
          <div className="row gap-4" style={{ marginTop:6, flexWrap:'wrap' }}>
            {sources.map((s,i)=>(
              <span key={i} className="pill" style={{ fontSize:9, padding:'1px 6px', background: isUser?'rgba(255,255,255,.1)':'#fff', color: isUser?'var(--paper)':'var(--ink-soft)', borderColor: isUser?'var(--paper)':'var(--rule)' }}>{s}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const SuggestedQ = ({ children, flag }) => (
  <div className="hb" style={{
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'6px 10px', borderRadius:18, background:'#fff', fontSize:12,
    boxShadow:'2px 2px 0 rgba(0,0,0,.05)',
  }}>
    {flag ? <span className={`dot ${flag}`}></span> : null}
    {children}
  </div>
);

const C_Hero = () => (
  <Web>
    <AppBar title="Conversación · contrato.pdf" />

    <div className="row gap-12" style={{ height:'calc(100% - 60px)' }}>
      {/* Left: doc context */}
      <div className="col gap-8" style={{ width:200 }}>
        <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
          <div className="small">Documento</div>
          <div style={{ fontWeight:700, fontSize:13, marginTop:4 }}>Mutuo de dinero</div>
          <div className="micro">BancoPlaceholder · 6 págs</div>
        </div>
        <div className="hb-soft" style={{ padding:10, background:'#fff' }}>
          <div className="small">Resumen rápido</div>
          <div className="col gap-4" style={{ marginTop:6 }}>
            <div style={{ fontSize:12 }}>💰 $18.000.000</div>
            <div style={{ fontSize:12 }}>📅 68 cuotas</div>
            <div style={{ fontSize:12 }}>📊 CAE 24.8%</div>
            <div style={{ fontSize:12 }}>🏦 Banco Placeholder</div>
          </div>
        </div>
        <div className="hb-dashed" style={{ padding:10 }}>
          <div className="small" style={{ marginBottom:4 }}>Alertas</div>
          <div className="col gap-4">
            <div className="row gap-4" style={{ fontSize:11.5 }}><span className="dot hi"></span><span>Plazo</span></div>
            <div className="row gap-4" style={{ fontSize:11.5 }}><span className="dot hi"></span><span>CAE</span></div>
            <div className="row gap-4" style={{ fontSize:11.5 }}><span className="dot mid"></span><span>Seguro</span></div>
          </div>
        </div>
      </div>

      {/* Right: chat */}
      <div className="col grow" style={{ minWidth:0 }}>
        <div className="grow" style={{ overflow:'hidden', paddingRight:4 }}>
          <ChatBubble from="ai">
            Listo. Revisé tu contrato. Encontré <b>3 cosas importantes</b>: el plazo no coincide con la simulación, la CAE está sobre el mercado, y hay un seguro vinculado al banco. ¿Por dónde quieres empezar?
          </ChatBubble>

          <ChatBubble from="user">¿Cuántas cuotas tengo que pagar realmente?</ChatBubble>

          <ChatBubble from="ai" flag="hi" sources={['Cláusula 4.2','Pág. 3']}>
            <b>68 cuotas mensuales.</b> Si te dijeron 60, son 8 cuotas más — alrededor de <b>$1.4M en intereses adicionales</b>. Te recomiendo pedir la tabla de amortización a 60 cuotas para comparar antes de firmar.
          </ChatBubble>

          <ChatBubble from="user">¿Es legal eso?</ChatBubble>

          <ChatBubble from="ai" sources={['Ley 19.496 Art. 17B','SERNAC']}>
            Sí, mientras esté en el contrato. Pero la <b>Ley del Consumidor</b> exige que las simulaciones y el contrato coincidan. Si la simulación inicial decía 60, tienes argumento para pedir explicación o renegociar.
          </ChatBubble>
        </div>

        {/* Suggested questions */}
        <div className="row gap-6" style={{ flexWrap:'wrap', marginTop:6, marginBottom:6 }}>
          <SuggestedQ flag="hi">¿Por qué la CAE es alta?</SuggestedQ>
          <SuggestedQ flag="mid">¿Puedo cambiar el seguro?</SuggestedQ>
          <SuggestedQ>Compara con otros bancos</SuggestedQ>
          <SuggestedQ>Explícalo en simple</SuggestedQ>
        </div>

        {/* Input */}
        <div className="hb-soft" style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:8, background:'#fff' }}>
          <span className="micro">Pregunta lo que quieras del contrato…</span>
          <span className="grow"></span>
          <button className="btn btn-primary" style={{ padding:'4px 10px', fontSize:12 }}><Glyph name="send" size={14}/> Enviar</button>
        </div>
      </div>
    </div>

    <div className="stickynote blue" style={{ position:'absolute', top:50, right:20, maxWidth:170 }}>
      Bajo umbral: si no sabes qué preguntar, te sugerimos.
    </div>
  </Web>
);

const C_Picker = () => (
  // Variation: doc picker w/ chat-first framing
  <Web>
    <AppBar />
    <div className="col" style={{ height:'calc(100% - 60px)', alignItems:'center', justifyContent:'center', textAlign:'center', gap:14 }}>
      <div className="hand-h1" style={{ maxWidth:520 }}>Hola, Juan.<br/>¿Qué documento te tiene dudoso hoy?</div>
      <div className="scribble" style={{ maxWidth:440 }}>Sube el archivo o cuéntame en tus palabras. Lo conversamos.</div>

      <div className="hb-dashed center" style={{ width:480, padding:'18px 16px', flexDirection:'column', gap:6 }}>
        <Glyph name="upload" size={26} />
        <div className="hand-h3">Arrastra el PDF, o pega un link</div>
        <div className="micro">Detectamos el tipo automáticamente</div>
      </div>

      <div className="small" style={{ marginTop:4 }}>O empieza con un ejemplo</div>
      <div className="row gap-6" style={{ flexWrap:'wrap', justifyContent:'center', maxWidth:540 }}>
        <SuggestedQ flag="ok">"Mi banco me ofreció un crédito"</SuggestedQ>
        <SuggestedQ flag="ok">"Cotización de mi taller"</SuggestedQ>
        <SuggestedQ flag="ok">"Contrato de arriendo"</SuggestedQ>
        <SuggestedQ flag="ok">"Letra chica de seguro"</SuggestedQ>
      </div>
    </div>
  </Web>
);

const C_Mobile = () => (
  <Phone>
    <div className="between" style={{ marginBottom:6 }}>
      <Logo />
      <span className="micro">contrato.pdf</span>
    </div>

    <div className="grow col" style={{ overflow:'hidden' }}>
      <ChatBubble from="ai">
        Encontré <b>3 cosas</b> en tu crédito. ¿Por dónde empezamos?
      </ChatBubble>
      <ChatBubble from="user">¿Cuántas cuotas son?</ChatBubble>
      <ChatBubble from="ai" flag="hi" sources={['Cl. 4.2']}>
        <b>68</b> cuotas. Si te dijeron 60, es ~<b>$1.4M extra</b>.
      </ChatBubble>
    </div>

    <div className="col gap-4" style={{ marginTop:6 }}>
      <SuggestedQ flag="hi">¿Por qué CAE alta?</SuggestedQ>
      <SuggestedQ flag="mid">¿Puedo sacar el seguro?</SuggestedQ>
      <SuggestedQ>Explícalo simple</SuggestedQ>
    </div>

    <div className="hb-soft" style={{ marginTop:8, padding:'7px 10px', display:'flex', alignItems:'center', gap:6, background:'#fff' }}>
      <span className="micro">Escribe…</span>
      <span className="grow"></span>
      <Glyph name="send" size={14}/>
    </div>
  </Phone>
);

Object.assign(window, { C_Hero, C_Picker, C_Mobile });
