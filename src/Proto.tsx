import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavCtx, type NavState } from './components/NavContext';
import { Login } from './screens/Login';
import { Upload } from './screens/Upload';
import { DetectProcessing, DetectReady } from './screens/Detection';
import { PlanScreen, PlanRunning } from './screens/Plan';
import { Coach } from './screens/Coach';
import { Email } from './screens/Email';

const STORAGE_KEY = 'letra-proto-state-v1';

const INITIAL_STATE: NavState = {
  step: 'login',
  history: [],
  docType: 'bank',
  docLabel: 'Crédito bancario',
  fileName: 'contrato.pdf',
};

function loadState(): NavState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch { return INITIAL_STATE; }
}

function saveState(s: NavState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

const SCREEN_BY_STEP: Record<string, () => React.ReactElement> = {
  login: () => <Login />,
  upload: () => <Upload />,
  process: () => <DetectProcessing />,
  detect: () => <DetectReady />,
  plan: () => <PlanScreen />,
  running: () => <PlanRunning />,
  coach: () => <Coach />,
  email: () => <Email />,
};

const STEP_ORDER = ['login', 'upload', 'process', 'detect', 'plan', 'running', 'coach', 'email'];

function FloatingDebug({ state, stepIdx, go, reset }: {
  state: NavState; stepIdx: number; go: (s: string) => void; reset: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      fontFamily: 'JetBrains Mono', fontSize: 11,
    }}>
      {open ? (
        <div style={{
          background: '#1a1d24', color: '#fafaf7',
          borderRadius: 12, padding: '10px 12px',
          boxShadow: '0 12px 32px -8px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#8b91a0', textTransform: 'uppercase', letterSpacing: 0.1 }}>Saltar a paso</span>
            <span style={{ cursor: 'pointer', color: '#8b91a0' }} onClick={() => setOpen(false)}>×</span>
          </div>
          {STEP_ORDER.map((s, i) => (
            <button key={s}
              onClick={() => go(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 6,
                background: s === state.step ? '#246a5b' : 'transparent',
                color: s === state.step ? '#fff' : '#fafaf7',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'JetBrains Mono', fontSize: 11,
              }}>
              <span style={{ width: 18, opacity: 0.6 }}>{i + 1}.</span>
              <span>{s}</span>
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button onClick={reset} style={{
            padding: '5px 8px', borderRadius: 6, background: 'transparent', color: '#fafaf7',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            fontFamily: 'JetBrains Mono', fontSize: 10.5,
          }}>↻ Reset al inicio</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{
          background: '#1a1d24', color: '#fafaf7',
          border: 'none', borderRadius: 999, padding: '8px 14px',
          fontFamily: 'JetBrains Mono', fontSize: 11,
          boxShadow: '0 6px 16px -4px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#246a5b' }} />
          {state.step}  ·  {stepIdx + 1}/{STEP_ORDER.length}
        </button>
      )}
    </div>
  );
}

export function Proto() {
  const [state, setState] = useState<NavState>(() => loadState());
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => { saveState(state); }, [state]);

  const go = useCallback((nextStep: string) => {
    setState(prev => ({
      ...prev,
      step: nextStep,
      history: prev.step ? [...prev.history, prev.step].slice(-20) : prev.history,
    }));
    setTransitionKey(k => k + 1);
    requestAnimationFrame(() => {
      const el = document.getElementById('proto-screen');
      if (el) el.scrollTop = 0;
    });
  }, []);

  const back = useCallback(() => {
    setState(prev => {
      const h = prev.history.slice();
      const prevStep = h.pop();
      return { ...prev, step: prevStep ?? 'login', history: h };
    });
    setTransitionKey(k => k + 1);
  }, []);

  const set = useCallback((patch: Partial<NavState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
    setTransitionKey(k => k + 1);
  }, []);

  const nav = useMemo(() => ({
    interactive: true,
    state, go, back, set, reset,
  }), [state, go, back, set, reset]);

  const Screen = SCREEN_BY_STEP[state.step] ?? SCREEN_BY_STEP.login;
  const stepIdx = STEP_ORDER.indexOf(state.step);

  return (
    <NavCtx.Provider value={nav}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--paper)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <FloatingDebug state={state} stepIdx={stepIdx} go={go} reset={reset} />
        <div key={transitionKey} id="proto-screen" style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          animation: 'protoFade .25s ease-out',
        }}>
          <Screen />
        </div>
      </div>
    </NavCtx.Provider>
  );
}
