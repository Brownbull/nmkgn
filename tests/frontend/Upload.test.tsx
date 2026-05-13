import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Upload } from '../../src/screens/Upload';
import { NavCtx, type NavState, type NavValue } from '../../src/components/NavContext';

function renderUpload(patch: Partial<NavState> = {}) {
  const nav: NavValue = {
    interactive: true,
    state: {
      step: 'upload',
      history: [],
      docType: 'bank',
      docLabel: 'Credito bancario',
      fileName: 'contrato.pdf',
      ...patch,
    },
    go: vi.fn(),
    back: vi.fn(),
    set: vi.fn(),
    reset: vi.fn(),
  };

  render(
    <NavCtx.Provider value={nav}>
      <Upload />
    </NavCtx.Provider>,
  );

  return nav;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Upload document type restriction', () => {
  it('disables non-credit document types when a persisted case exists', async () => {
    const user = userEvent.setup();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    const arriendo = screen.getByText('Arriendo').closest('.card')!;
    await user.click(arriendo);

    expect(nav.set).not.toHaveBeenCalledWith(expect.objectContaining({ docType: 'house' }));
  });

  it('allows selecting credit type when a persisted case exists', async () => {
    const user = userEvent.setup();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    const credit = screen.getByText('Crédito bancario').closest('.card')!;
    await user.click(credit);

    expect(nav.set).toHaveBeenCalledWith({ docType: 'bank', docLabel: 'Crédito bancario' });
  });
});

describe('Upload prototype guard', () => {
  it('blocks mock analysis after a persisted case until the user acknowledges it', async () => {
    const user = userEvent.setup();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    expect(screen.getByText('Vista prototipo despues de subir')).toBeTruthy();
    expect((screen.getByRole('button', { name: /continuar/i }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByText(/Arrastra tus PDFs/i));

    expect(nav.go).not.toHaveBeenCalledWith('process');
  });

  it('allows the mock analysis path only after acknowledgement', async () => {
    const user = userEvent.setup();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    await user.click(screen.getByRole('button', { name: /continuar/i }));

    expect(nav.go).toHaveBeenCalledWith('process');
  });

  it('stores acknowledgement when the checkbox is changed', async () => {
    const user = userEvent.setup();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    await user.click(screen.getByRole('checkbox'));

    expect(nav.set).toHaveBeenCalledWith({ mockAnalysisAcknowledged: true });
  });
});
