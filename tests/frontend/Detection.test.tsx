import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DetectFailed,
  DetectLowConfidence,
  DetectProcessing,
  DetectUnsupported,
} from '../../src/screens/Detection';
import { NavCtx, type NavState, type NavValue } from '../../src/components/NavContext';

function navWith(patch: Partial<NavState> = {}): NavValue {
  return {
    interactive: true,
    state: {
      step: 'detect',
      history: [],
      docType: 'bank',
      docLabel: 'Crédito bancario',
      fileName: 'contrato.pdf',
      caseId: 'case-123',
      caseTitle: 'Credito para construir casa',
      caseStage: 'before_signing',
      analysisPlan: 'before_signing_review',
      institutionName: 'Banco Demo',
      mockAnalysisAcknowledged: true,
      detectionScenario: 'ready',
      ...patch,
    },
    go: vi.fn(),
    back: vi.fn(),
    set: vi.fn(),
    reset: vi.fn(),
  };
}

function renderWithNav(ui: ReactElement, patch: Partial<NavState> = {}) {
  const nav = navWith(patch);
  render(
    <NavCtx.Provider value={nav}>
      {ui}
    </NavCtx.Provider>,
  );
  return nav;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DetectProcessing branch routing', () => {
  it('routes low-confidence prototype detection to the low-confidence screen', () => {
    vi.useFakeTimers();
    const nav = renderWithNav(<DetectProcessing />, {
      step: 'process',
      detectionScenario: 'low_confidence',
    });

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(nav.go).toHaveBeenCalledWith('detect-low');
  });
});

describe('Detection result states', () => {
  it('marks low-confidence detection as simulated and lets the user continue after confirmation', async () => {
    const user = userEvent.setup();
    const nav = renderWithNav(<DetectLowConfidence />, { detectionScenario: 'low_confidence' });

    expect(screen.getByText('Confianza baja')).toBeTruthy();
    expect(screen.getByText(/Estado simulado/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /confirmar y personalizar plan/i }));

    expect(nav.go).toHaveBeenCalledWith('plan');
  });

  it('blocks unsupported prototype detection from analysis and keeps the case type stable', async () => {
    const user = userEvent.setup();
    const nav = renderWithNav(<DetectUnsupported />, { detectionScenario: 'unsupported' });

    expect(screen.getByText('Tipo no soportado')).toBeTruthy();
    expect(screen.getByText(/El caso persistido no cambia de tipo/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /volver a subir/i }));

    expect(nav.go).toHaveBeenCalledWith('upload');
    expect(nav.set).not.toHaveBeenCalledWith(expect.objectContaining({ docType: 'house' }));
  });

  it('shows failed-read copy without offering analysis', async () => {
    const user = userEvent.setup();
    const nav = renderWithNav(<DetectFailed />, { detectionScenario: 'failed' });

    expect(screen.getByText('Lectura fallida')).toBeTruthy();
    expect(screen.getByText(/No hay analisis hasta reemplazar el archivo/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /reintentar subida/i }));

    expect(nav.go).toHaveBeenCalledWith('upload');
  });
});

describe('Responsive class names present', () => {
  it('detection page applies the responsive CSS target class', () => {
    renderWithNav(<DetectLowConfidence />, { detectionScenario: 'low_confidence' });

    const page = document.querySelector('.detection-page');
    expect(page).toBeTruthy();
  });

  it('processing page applies the responsive CSS target class', () => {
    vi.useFakeTimers();
    renderWithNav(<DetectProcessing />, { step: 'process', detectionScenario: 'ready' });

    const page = document.querySelector('.detection-page');
    expect(page).toBeTruthy();
  });
});
