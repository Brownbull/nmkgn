import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaseSetup } from '../../src/screens/CaseSetup';
import { NavCtx, type NavValue } from '../../src/components/NavContext';

function renderCaseSetup() {
  const nav: NavValue = {
    interactive: true,
    state: {
      step: 'case',
      history: [],
      docType: 'bank',
      docLabel: 'Credito bancario',
      fileName: 'contrato.pdf',
    },
    go: vi.fn(),
    back: vi.fn(),
    set: vi.fn(),
    reset: vi.fn(),
  };

  render(
    <NavCtx.Provider value={nav}>
      <CaseSetup />
    </NavCtx.Provider>,
  );

  return nav;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CaseSetup', () => {
  it('validates required lean fields before submitting', async () => {
    const user = userEvent.setup();
    const nav = renderCaseSetup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await user.clear(screen.getByLabelText('Nombre del caso'));
    await user.click(screen.getByRole('button', { name: /crear caso/i }));

    expect(screen.getByText('El caso necesita un nombre y una institucion.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(nav.go).not.toHaveBeenCalledWith('upload');
  });

  it('rejects invalid optional numeric fields instead of dropping them', async () => {
    const user = userEvent.setup();
    const nav = renderCaseSetup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await user.clear(screen.getByLabelText('Monto solicitado (CLP, opcional)'));
    await user.type(screen.getByLabelText('Monto solicitado (CLP, opcional)'), 'abc');
    await user.click(screen.getByRole('button', { name: /crear caso/i }));

    expect(screen.getByText('Monto solicitado debe ser un numero mayor a cero.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(nav.go).not.toHaveBeenCalledWith('upload');
  });

  it('posts a case, stores the returned case id, and advances to upload', async () => {
    const user = userEvent.setup();
    const nav = renderCaseSetup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'case-123',
        owner_ref: 'demo-user',
        title: 'Credito para construir casa',
        case_stage: 'before_signing',
        document_type: 'consumer_credit',
        analysis_plan: 'before_signing_review',
        institution_name: 'Banco Demo',
        requested_amount_clp: 25000000,
        expected_term_months: 60,
        created_at: '2026-05-13T16:00:00Z',
        updated_at: '2026-05-13T16:00:00Z',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await user.click(screen.getByRole('button', { name: /crear caso/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:18080/api/cases');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({
      title: 'Credito para construir casa',
      case_stage: 'before_signing',
      document_type: 'consumer_credit',
      analysis_plan: 'before_signing_review',
      institution_name: 'Banco Demo',
      requested_amount_clp: 25000000,
      expected_term_months: 60,
    });

    await waitFor(() => expect(nav.set).toHaveBeenCalledWith(expect.objectContaining({
      caseId: 'case-123',
      mockAnalysisAcknowledged: false,
    })));
    expect(nav.go).toHaveBeenCalledWith('upload');
  });

  it('keeps the user on case setup when the API fails', async () => {
    const user = userEvent.setup();
    const nav = renderCaseSetup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'backend failed' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await user.click(screen.getByRole('button', { name: /crear caso/i }));

    expect(await screen.findByText('backend failed')).toBeTruthy();
    expect(nav.go).not.toHaveBeenCalledWith('upload');
  });
});
