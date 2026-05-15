import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Upload } from '../../src/screens/Upload';
import { NavCtx, type NavState, type NavValue } from '../../src/components/NavContext';
import type { DocumentRecord, ExtractedTextSegment } from '../../src/api/documents';

const DOCUMENT: DocumentRecord = {
  id: 'doc-123',
  case_id: 'case-123',
  owner_ref: 'demo-user',
  role: 'primary',
  document_type: 'consumer_credit',
  original_filename: 'contrato.txt',
  content_type: 'text/plain',
  byte_size: 34,
  checksum_sha256: 'a'.repeat(64),
  upload_status: 'stored',
  extraction_status: 'extracted',
  retention_state: 'active',
  delete_after: '2026-06-15T00:00:00Z',
  created_at: '2026-05-15T00:00:00Z',
  updated_at: '2026-05-15T00:00:00Z',
};

const SEGMENT: ExtractedTextSegment = {
  id: 'seg-123',
  document_id: 'doc-123',
  page_number: null,
  start_offset: 0,
  end_offset: 34,
  text: 'CAE 12% anual\nCosto total: 3000000',
  extraction_provider: 'local-text',
  extracted_at: '2026-05-15T00:00:00Z',
  confidence: 1,
  warning_code: null,
  warning_message: null,
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

function stubUploadFetch({
  documents = [],
  segments = [],
  uploadedDocument = DOCUMENT,
}: {
  documents?: DocumentRecord[];
  segments?: ExtractedTextSegment[];
  uploadedDocument?: DocumentRecord;
} = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    if (method === 'POST' && url.endsWith('/api/cases/case-123/documents')) {
      return jsonResponse(uploadedDocument);
    }
    if (method === 'GET' && url.endsWith('/api/cases/case-123/documents/doc-123/text-segments')) {
      return jsonResponse(segments);
    }
    if (method === 'GET' && url.endsWith('/api/cases/case-123/documents')) {
      return jsonResponse(documents);
    }

    throw new Error(`Unhandled fetch: ${method} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

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
  vi.unstubAllGlobals();
});

describe('Upload document type restriction', () => {
  it('disables non-credit document types when a persisted case exists', async () => {
    const user = userEvent.setup();
    stubUploadFetch();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    const arriendo = screen.getByText('Arriendo').closest('.card')!;
    await user.click(arriendo);

    expect(nav.set).not.toHaveBeenCalledWith(expect.objectContaining({ docType: 'house' }));
  });

  it('allows selecting credit type when a persisted case exists', async () => {
    const user = userEvent.setup();
    stubUploadFetch();
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    const credit = screen.getByText('Crédito bancario').closest('.card')!;
    await user.click(credit);

    expect(nav.set).toHaveBeenCalledWith({ docType: 'bank', docLabel: 'Crédito bancario' });
  });
});

describe('Upload persistence flow', () => {
  it('posts the selected file as multipart form data and stores returned upload state', async () => {
    const user = userEvent.setup();
    const fetchMock = stubUploadFetch({ documents: [DOCUMENT], segments: [SEGMENT] });
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });
    const file = new File(['CAE 12% anual'], 'contrato.txt', { type: 'text/plain' });

    await user.upload(screen.getByLabelText('Archivo del documento'), file);
    await user.click(screen.getByRole('button', { name: /guardar documento/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:18080/api/cases/case-123/documents',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = postCall?.[1]?.body as FormData;
    expect(body.get('role')).toBe('primary');
    expect(body.get('document_type')).toBe('consumer_credit');
    expect(body.get('file')).toBe(file);

    await waitFor(() => expect(nav.set).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'contrato.txt',
      detectionScenario: 'ready',
      mockAnalysisAcknowledged: false,
    })));
  });

  it('shows stored document metadata and a small extracted-text preview', async () => {
    stubUploadFetch({ documents: [DOCUMENT], segments: [SEGMENT] });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    expect((await screen.findAllByText('contrato.txt')).length).toBeGreaterThan(0);
    expect(screen.getByText('Documento principal · 34 B · text/plain')).toBeTruthy();
    expect(await screen.findByText(/CAE 12% anual/)).toBeTruthy();
    expect(screen.getAllByText('Texto extraido').length).toBeGreaterThan(0);
  });

  it('surfaces OCR-pending status without enabling real analysis claims', async () => {
    const needsOcr = { ...DOCUMENT, extraction_status: 'needs_ocr' as const, original_filename: 'escaneo.png', content_type: 'image/png' };
    stubUploadFetch({ documents: [needsOcr], segments: [] });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    expect((await screen.findAllByText('Necesita OCR')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OCR queda pendiente/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/hallazgos posteriores no son analisis real/i)).toBeTruthy();
  });

  it('shows an upload error when the POST fails', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.endsWith('/documents')) {
        return jsonResponse({ detail: 'Archivo demasiado grande.' }, false);
      }
      if (method === 'GET' && url.endsWith('/documents')) return jsonResponse([]);
      throw new Error(`Unhandled fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });
    const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });

    await user.upload(screen.getByLabelText('Archivo del documento'), file);
    await user.click(screen.getByRole('button', { name: /guardar documento/i }));

    expect(await screen.findByText('Archivo demasiado grande.')).toBeTruthy();
  });

  it('shows the uploaded document even when the list refresh fails after a successful POST', async () => {
    const user = userEvent.setup();
    let listCallCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.endsWith('/documents')) {
        return jsonResponse(DOCUMENT);
      }
      if (method === 'GET' && url.endsWith('/text-segments')) return jsonResponse([SEGMENT]);
      if (method === 'GET' && url.endsWith('/documents')) {
        listCallCount++;
        if (listCallCount === 1) return jsonResponse([]);
        throw new Error('Network failure');
      }
      throw new Error(`Unhandled fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });
    const file = new File(['CAE 12%'], 'contrato.txt', { type: 'text/plain' });

    await user.upload(screen.getByLabelText('Archivo del documento'), file);
    await user.click(screen.getByRole('button', { name: /guardar documento/i }));

    expect(await screen.findByText(/Documento guardado, pero no pudimos actualizar la lista/)).toBeTruthy();
    expect(nav.set).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'contrato.txt',
      detectionScenario: 'ready',
    }));
  });

  it('shows an error when the initial document list load fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error'); }));
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    expect(await screen.findByText('Network error')).toBeTruthy();
  });
});

describe('Upload prototype guard', () => {
  it('blocks prototype analysis until a persisted case has a stored document and acknowledgement', async () => {
    const user = userEvent.setup();
    stubUploadFetch({ documents: [DOCUMENT], segments: [SEGMENT] });
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    expect((await screen.findAllByText('contrato.txt')).length).toBeGreaterThan(0);
    expect((screen.getByRole('button', { name: /continuar al prototipo/i }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: /continuar al prototipo/i }));

    expect(nav.go).not.toHaveBeenCalledWith('process');
  });

  it('allows the guarded prototype path after acknowledgement', async () => {
    const user = userEvent.setup();
    stubUploadFetch({ documents: [DOCUMENT], segments: [SEGMENT] });
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    expect((await screen.findAllByText('contrato.txt')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /continuar al prototipo/i }));

    expect(nav.set).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'contrato.txt',
      detectionScenario: 'ready',
    }));
    expect(nav.go).toHaveBeenCalledWith('process');
  });

  it('stores acknowledgement when the checkbox is changed', async () => {
    const user = userEvent.setup();
    stubUploadFetch({ documents: [DOCUMENT], segments: [SEGMENT] });
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    await screen.findAllByText('contrato.txt');
    await user.click(screen.getByRole('checkbox'));

    expect(nav.set).toHaveBeenCalledWith({ mockAnalysisAcknowledged: true });
  });
});
