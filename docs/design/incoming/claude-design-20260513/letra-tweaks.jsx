// letra. — Tweaks panel
// Exposes high-leverage design knobs over the prototype: accent color, density, type pair,
// international-references visibility, and key copy.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#246a5b", "#d9e8e3"],
  "density": "estandar",
  "typePair": "manrope",
  "showIntl": true,
  "heroCopy": "Lee la letra chica por ti.",
  "heroAccent": "chica",
  "ctaCopy": "Continuar con Google"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  ['#246a5b','#d9e8e3'],   // teal (default)
  ['#3b4a6b','#e6eaf3'],   // slate blue
  ['#7a4b6f','#f3e6ee'],   // plum
  ['#8a6f3d','#f3ecd9'],   // tan
  ['#b8442e','#fbe7e1'],   // brick (warning-as-brand)
];

const TYPE_PAIRS = {
  manrope: { body:'Manrope, system-ui, sans-serif',          mono:'JetBrains Mono, ui-monospace, monospace',          fonts:'Manrope:wght@400;500;600;700;800|JetBrains+Mono:wght@400;500;600' },
  inter:   { body:'Inter, system-ui, sans-serif',            mono:'JetBrains Mono, ui-monospace, monospace',          fonts:'Inter:wght@400;500;600;700;800|JetBrains+Mono:wght@400;500;600' },
  plex:    { body:'IBM Plex Sans, system-ui, sans-serif',    mono:'IBM Plex Mono, ui-monospace, monospace',           fonts:'IBM+Plex+Sans:wght@400;500;600;700|IBM+Plex+Mono:wght@400;500;600' },
  sourceSans: { body:'Source Sans 3, system-ui, sans-serif', mono:'JetBrains Mono, ui-monospace, monospace',          fonts:'Source+Sans+3:wght@400;500;600;700;800|JetBrains+Mono:wght@400;500;600' },
};

const DENSITY = {
  comoda:    { pad: 36, gap: 22, scale: 1.05 },
  estandar:  { pad: 28, gap: 18, scale: 1.00 },
  compacta:  { pad: 20, gap: 12, scale: 0.94 },
};

function LetraTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweak values to the live DOM via CSS variables.
  // We mutate the document so it applies across all letra screens regardless of which one is mounted.
  React.useEffect(() => {
    const root = document.documentElement;
    // Accent — value is an array (palette) or a string
    const accent = Array.isArray(t.accent) ? t.accent[0] : t.accent;
    const accentSoft = Array.isArray(t.accent) ? t.accent[1] : null;
    if (accent) root.style.setProperty('--accent', accent);
    if (accentSoft) root.style.setProperty('--accent-soft', accentSoft);

    // Type pair — swap CSS font families used in letra. card and base
    const pair = TYPE_PAIRS[t.typePair] ?? TYPE_PAIRS.manrope;
    document.body.style.fontFamily = pair.body;
    // Inject font import once per pair
    const linkId = 'letra-tweaks-fonts';
    let link = document.getElementById(linkId);
    const href = `https://fonts.googleapis.com/css2?family=${pair.fonts.replace(/\|/g, '&family=')}&display=swap`;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId; link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;

    // Also override .lt and class typography
    const styleId = 'letra-tweaks-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const density = DENSITY[t.density] ?? DENSITY.estandar;
    style.textContent = `
      .lt, .lt .display, .lt p, .lt h1, .lt h2, .lt h3, .lt button, .lt input { font-family: ${pair.body} !important; }
      .lt .num, .lt .label { font-family: ${pair.mono} !important; }
      .lt .card { padding-block: ${Math.max(10, density.pad - 14)}px; }
      .lt-density-scale { --tw-density-scale: ${density.scale}; }
    `;

    // Density — set custom prop on the root
    root.style.setProperty('--tw-density-gap', density.gap + 'px');
    root.style.setProperty('--tw-density-pad', density.pad + 'px');

    return () => {};
  }, [t.accent, t.density, t.typePair]);

  // Surface intl visibility and copy as window props so screens can read them
  React.useEffect(() => {
    window.__letraTweaks = {
      showIntl: t.showIntl,
      heroCopy: t.heroCopy,
      heroAccent: t.heroAccent,
      ctaCopy: t.ctaCopy,
    };
    // Force a soft re-render of the page by dispatching a custom event
    window.dispatchEvent(new CustomEvent('letra-tweaks-changed', { detail: window.__letraTweaks }));
  }, [t.showIntl, t.heroCopy, t.heroAccent, t.ctaCopy]);

  return (
    <TweaksPanel title="letra. tweaks">
      <TweakSection label="Visual">
        <TweakColor label="Color de acento" value={t.accent} options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)}/>
        <TweakRadio label="Densidad" value={t.density}
          options={[
            { label:'Cómoda',   value:'comoda'   },
            { label:'Estándar', value:'estandar' },
            { label:'Compacta', value:'compacta' },
          ]}
          onChange={(v) => setTweak('density', v)}/>
        <TweakSelect label="Familia tipográfica" value={t.typePair}
          options={[
            { label:'Manrope + JetBrains Mono', value:'manrope' },
            { label:'Inter + JetBrains Mono',    value:'inter' },
            { label:'IBM Plex (Sans + Mono)',    value:'plex' },
            { label:'Source Sans 3 + JBM',       value:'sourceSans' },
          ]}
          onChange={(v) => setTweak('typePair', v)}/>
      </TweakSection>

      <TweakSection label="Contenido">
        <TweakText label="Headline del login" value={t.heroCopy}
          placeholder="Lee la letra chica por ti."
          onChange={(v) => setTweak('heroCopy', v)}/>
        <TweakText label="Palabra resaltada" value={t.heroAccent}
          placeholder="chica"
          onChange={(v) => setTweak('heroAccent', v)}/>
        <TweakText label="CTA del login" value={t.ctaCopy}
          placeholder="Continuar con Google"
          onChange={(v) => setTweak('ctaCopy', v)}/>
      </TweakSection>

      <TweakSection label="Funcionalidad">
        <TweakToggle label="Mostrar referencias internacionales"
          value={t.showIntl}
          onChange={(v) => setTweak('showIntl', v)}/>
      </TweakSection>

      <TweakSection label="Demo">
        <TweakButton label="Reiniciar prototipo" onClick={() => {
          try { sessionStorage.removeItem('letra-proto-state-v1'); } catch {}
          window.location.reload();
        }}/>
      </TweakSection>
    </TweaksPanel>
  );
}

// Read tweak values from window with sensible fallback (screens use this when wired)
function useLetraTweaks() {
  const [v, setV] = React.useState(() => window.__letraTweaks ?? {
    showIntl: true,
    heroCopy: 'Lee la letra chica por ti.',
    heroAccent: 'chica',
    ctaCopy: 'Continuar con Google',
  });
  React.useEffect(() => {
    const onChange = (e) => setV({ ...e.detail });
    window.addEventListener('letra-tweaks-changed', onChange);
    return () => window.removeEventListener('letra-tweaks-changed', onChange);
  }, []);
  return v;
}

Object.assign(window, { LetraTweaks, useLetraTweaks });
