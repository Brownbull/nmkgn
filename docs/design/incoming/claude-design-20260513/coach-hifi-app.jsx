// Hi-fi explorations canvas
const { DesignCanvas, DCSection, DCArtboard } = window;

const StrategyNote = () => (
  <div className="notes-card">
    <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'0.08em', color:'#8a8278', textTransform:'uppercase' }}>Visual direction · hi-fi study</div>
    <h1 style={{ fontSize:28, fontWeight:700, margin:0, letterSpacing:-0.015, lineHeight:1.1 }}>3 treatments of the Coach dashboard.</h1>

    <p style={{ fontSize:14, color:'#4a423a', lineHeight:1.55, margin:0 }}>
      Same screen, same data, three different emotional registers. Each treatment commits to a tone, type pairing, palette, and component language. Pick one — or remix elements — before we mock the rest of the product.
    </p>

    <div style={{ height:1, background:'#e6e0cf', margin:'4px 0' }}/>

    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{ fontWeight:700, fontSize:15 }}>A · Pliego  <span style={{ fontWeight:400, color:'#8a8278', fontSize:12 }}>— notarial / editorial</span></div>
        <div style={{ fontSize:13, color:'#4a423a', marginTop:4, lineHeight:1.5 }}>Newsreader serif, cream paper, oxblood + sage + ochre. Hairline rules, small-caps labels. Feels like a high-end legal product. <i>Trust through gravitas.</i></div>
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:15 }}>B · letra.  <span style={{ fontWeight:400, color:'#8a8278', fontSize:12 }}>— calm fintech</span></div>
        <div style={{ fontSize:13, color:'#4a423a', marginTop:4, lineHeight:1.5 }}>Manrope, pale neutrals, single deep-teal accent. Rounded soft cards, generous spacing. Reads modern + approachable. <i>Trust through restraint and competence.</i></div>
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:15 }}>C · Marcado  <span style={{ fontWeight:400, color:'#8a8278', fontSize:12 }}>— data-precise archival</span></div>
        <div style={{ fontSize:13, color:'#4a423a', marginTop:4, lineHeight:1.5 }}>Space Grotesk + IBM Plex Mono, charcoal panels, electric orange accent. Tabular, high-contrast, monospace numbers. <i>Trust through precision.</i></div>
      </div>
    </div>

    <div style={{ height:1, background:'#e6e0cf', margin:'4px 0' }}/>

    <div style={{ fontSize:12, color:'#8a8278', lineHeight:1.5 }}>
      The wordmarks (Pliego, letra., Marcado) are also up for discussion. Same product, three name candidates.
    </div>
  </div>
);

const App = () => (
  <DesignCanvas>
    <DCSection
      id="strategy"
      title="Coach dashboard · 3 hi-fi treatments"
      subtitle="Compare side by side. Each card is one full coach screen at intended density. Open any fullscreen to inspect."
    >
      <DCArtboard id="notes" label="Strategy" width={460} height={780}>
        <StrategyNote />
      </DCArtboard>

      <DCArtboard id="hifi-a" label="A · Pliego  ·  notarial" width={1200} height={780}>
        <Pliego_Dashboard />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="b"
      title="B · letra.  ·  calm fintech"
      subtitle="Pale neutrals + deep teal accent. Manrope. Soft rounded cards."
    >
      <DCArtboard id="hifi-b" label="B · letra." width={1200} height={780}>
        <Letra_Dashboard />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="c"
      title="C · Marcado  ·  data-precise archival"
      subtitle="Space Grotesk + IBM Plex Mono. Charcoal panels, electric orange accent. Tabular and precise."
    >
      <DCArtboard id="hifi-c" label="C · Marcado" width={1200} height={780}>
        <Marcado_Dashboard />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
