import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Upload } from '../../src/screens/Upload';
import { NavCtx, type NavState, type NavValue } from '../../src/components/NavContext';
import type { DocumentRecord, ExtractedTextSegment } from '../../src/api/documents';
import type { ConsumerCreditFact, FactReadiness } from '../../src/api/facts';
import type { AnalysisReadiness, DocumentExtractionGap } from '../../src/api/receptionist';

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

const FACT: ConsumerCreditFact = {
  id: 'fact-123',
  case_id: 'case-123',
  document_id: 'doc-123',
  text_segment_id: 'seg-123',
  fact_key: 'cae',
  label: 'CAE',
  value_kind: 'percentage',
  value_text: null,
  value_number: 12,
  value_currency: null,
  value_date: null,
  unit: 'percent_annual',
  high_impact: true,
  confirmation_status: 'confirmed',
  source_type: 'uploaded_document',
  source_page_number: null,
  source_start_offset: 0,
  source_end_offset: 12,
  source_snippet: 'CAE 12% anual',
  extraction_provider: 'local-facts-v1',
  extracted_at: '2026-05-15T00:00:00Z',
  confidence: 0.9,
  warning_code: null,
  warning_message: null,
  created_at: '2026-05-15T00:00:00Z',
  updated_at: '2026-05-15T00:00:00Z',
};

const READY_READINESS: FactReadiness = {
  case_id: 'case-123',
  ready_for_analysis: true,
  blockers: [],
  required_fact_keys: ['cae'],
  missing_required_fact_keys: [],
  total_fact_count: 1,
  high_impact_fact_count: 1,
  unresolved_high_impact_count: 0,
  unresolved_fact_ids: [],
  status_counts: {
    pending: 0,
    confirmed: 1,
    corrected: 0,
    rejected: 0,
  },
};

const BLOCKED_READINESS: FactReadiness = {
  ...READY_READINESS,
  ready_for_analysis: false,
  blockers: ['unresolved_high_impact_facts'],
  unresolved_high_impact_count: 1,
  unresolved_fact_ids: ['fact-123'],
  status_counts: {
    pending: 1,
    confirmed: 0,
    corrected: 0,
    rejected: 0,
  },
};

const READY_ANALYSIS_READINESS: AnalysisReadiness = {
  case_id: 'case-123',
  ready_for_analysis: true,
  blockers: [],
  fact_readiness: READY_READINESS,
  receptionist_ready: true,
  missing_receptionist_document_ids: [],
  unresolved_blocking_gap_count: 0,
  unresolved_blocking_gap_ids: [],
  document_run_statuses: {
    'doc-123': 'completed',
  },
};

const GAP: DocumentExtractionGap = {
  id: 'gap-123',
  case_id: 'case-123',
  document_id: 'doc-123',
  run_id: 'run-123',
  observation_id: 'obs-123',
  fact_id: 'fact-123',
  fact_key: 'cae',
  gap_type: 'value_conflict',
  severity: 'high',
  blocking: true,
  status: 'open',
  detail: 'Receptionist value conflicts with deterministic CAE.',
  deterministic_value: {
    value_kind: 'percentage',
    value_number: 12,
  },
  receptionist_value: {
    value_kind: 'percentage',
    value_number: 13,
  },
  source_summary: 'CAE 13% anual',
  created_at: '2026-05-15T00:00:00Z',
  resolved_at: null,
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
  facts = [FACT],
  readiness = READY_READINESS,
  analysisReadiness,
  gaps = [],
}: {
  documents?: DocumentRecord[];
  segments?: ExtractedTextSegment[];
  uploadedDocument?: DocumentRecord;
  facts?: ConsumerCreditFact[];
  readiness?: FactReadiness;
  analysisReadiness?: AnalysisReadiness;
  gaps?: DocumentExtractionGap[];
} = {}) {
  const effectiveAnalysisReadiness = analysisReadiness ?? {
    ...READY_ANALYSIS_READINESS,
    ready_for_analysis: readiness.ready_for_analysis,
    blockers: readiness.blockers,
    fact_readiness: readiness,
  };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    if (method === 'GET' && url.endsWith('/api/cases/case-123/analysis-readiness')) {
      return jsonResponse(effectiveAnalysisReadiness);
    }
    if (method === 'GET' && url.endsWith('/api/cases/case-123/receptionist/gaps')) {
      return jsonResponse(gaps);
    }
    if (method === 'POST' && url.endsWith('/api/cases/case-123/documents/doc-123/receptionist-runs')) {
      return jsonResponse({
        id: 'run-123',
        case_id: 'case-123',
        document_id: 'doc-123',
        status: 'completed',
        provider: 'fake',
        model_name: 'fake-receptionist-v1',
        prompt_version: 'document-receptionist-v1',
        schema_version: 'document_receptionist.v1',
        media_kind: 'text',
        media_page_count: 0,
        processed_page_count: 0,
        partial_coverage: false,
        error_code: null,
        error_message: null,
        created_at: '2026-05-15T00:00:00Z',
        updated_at: '2026-05-15T00:00:00Z',
      });
    }
    if (method === 'POST' && url.endsWith('/api/cases/case-123/receptionist/gaps/gap-123/resolution')) {
      return jsonResponse({
        id: 'resolution-123',
        gap_id: 'gap-123',
        case_id: 'case-123',
        owner_ref: 'demo-user',
        action: 'confirm_deterministic',
        note: null,
        created_fact_id: null,
        corrected_fact_id: 'fact-123',
        created_at: '2026-05-15T00:00:00Z',
      });
    }
    if (method === 'GET' && url.endsWith('/api/cases/case-123/facts/readiness')) {
      return jsonResponse(readiness);
    }
    if (method === 'GET' && url.endsWith('/api/cases/case-123/facts')) {
      return jsonResponse(facts);
    }
    if (method === 'POST' && url.endsWith('/api/cases/case-123/facts/fact-123/confirmations')) {
      return jsonResponse({ id: 'confirmation-123', fact_id: 'fact-123', owner_ref: 'demo-user', action: 'confirm' }, true);
    }
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
    expect((await screen.findAllByText(/CAE 12% anual/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Texto extraido').length).toBeGreaterThan(0);
  });

  it('renders fact readiness and records a confirmation decision', async () => {
    const user = userEvent.setup();
    const pendingFact = { ...FACT, confirmation_status: 'pending' as const };
    const fetchMock = stubUploadFetch({
      documents: [DOCUMENT],
      segments: [SEGMENT],
      facts: [pendingFact],
      readiness: BLOCKED_READINESS,
    });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    expect(await screen.findByText('Revisa los datos antes de analizar')).toBeTruthy();
    expect(screen.getByText('Bloqueado')).toBeTruthy();
    expect(screen.getByText('12%')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:18080/api/cases/case-123/facts/fact-123/confirmations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ fact_id: 'fact-123', action: 'confirm' }),
        }),
      );
    });
  });

  it('renders receptionist gaps and records a resolution decision', async () => {
    const user = userEvent.setup();
    const fetchMock = stubUploadFetch({
      documents: [DOCUMENT],
      segments: [SEGMENT],
      gaps: [GAP],
      analysisReadiness: {
        ...READY_ANALYSIS_READINESS,
        ready_for_analysis: false,
        blockers: ['unresolved_receptionist_gaps'],
        receptionist_ready: false,
        unresolved_blocking_gap_count: 1,
        unresolved_blocking_gap_ids: ['gap-123'],
      },
    });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    expect(await screen.findByText('Brechas contra el documento original')).toBeTruthy();
    expect(screen.getByText('Valor distinto')).toBeTruthy();
    expect(screen.getByText('13')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /mantener deterministico/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:18080/api/cases/case-123/receptionist/gaps/gap-123/resolution',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'confirm_deterministic' }),
        }),
      );
    });
  });

  it('rejects non-numeric corrections before sending them to the API', async () => {
    const user = userEvent.setup();
    const pendingFact = { ...FACT, confirmation_status: 'pending' as const };
    const fetchMock = stubUploadFetch({
      documents: [DOCUMENT],
      segments: [SEGMENT],
      facts: [pendingFact],
      readiness: BLOCKED_READINESS,
    });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: false });

    await screen.findByText('Revisa los datos antes de analizar');
    await user.type(screen.getByLabelText('Correccion para CAE'), '$');
    await user.click(screen.getByRole('button', { name: /corregir/i }));

    expect(await screen.findByText('Ingresa un numero valido para corregir este hecho.')).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input).includes('/api/cases/case-123/facts/fact-123/confirmations')
      && init?.method === 'POST'
    ))).toBe(false);
  });

  it('surfaces OCR-pending status without enabling real analysis claims', async () => {
    const needsOcr = { ...DOCUMENT, extraction_status: 'needs_ocr' as const, original_filename: 'escaneo.png', content_type: 'image/png' };
    stubUploadFetch({
      documents: [needsOcr],
      segments: [],
      facts: [{ ...FACT, confirmation_status: 'pending' }],
      readiness: BLOCKED_READINESS,
    });
    renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });

    expect((await screen.findAllByText('Necesita OCR')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OCR queda pendiente/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/brechas bloqueantes deben quedar resueltos/i)).toBeTruthy();
  });

  it('shows an upload error when the POST fails', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.endsWith('/documents')) {
        return jsonResponse({ detail: 'Archivo demasiado grande.' }, false);
      }
      if (method === 'GET' && url.endsWith('/facts/readiness')) return jsonResponse(READY_READINESS);
      if (method === 'GET' && url.endsWith('/facts')) return jsonResponse([FACT]);
      if (method === 'GET' && url.endsWith('/analysis-readiness')) return jsonResponse(READY_ANALYSIS_READINESS);
      if (method === 'GET' && url.endsWith('/receptionist/gaps')) return jsonResponse([]);
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
      if (method === 'POST' && url.endsWith('/receptionist-runs')) {
        return jsonResponse({ ...READY_ANALYSIS_READINESS, id: 'run-123', status: 'completed' });
      }
      if (method === 'GET' && url.endsWith('/text-segments')) return jsonResponse([SEGMENT]);
      if (method === 'GET' && url.endsWith('/facts/readiness')) return jsonResponse(READY_READINESS);
      if (method === 'GET' && url.endsWith('/facts')) return jsonResponse([FACT]);
      if (method === 'GET' && url.endsWith('/analysis-readiness')) return jsonResponse(READY_ANALYSIS_READINESS);
      if (method === 'GET' && url.endsWith('/receptionist/gaps')) return jsonResponse([]);
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

  it('keeps the saved upload state when fact readiness refresh fails after a successful POST', async () => {
    const user = userEvent.setup();
    let documentsCallCount = 0;
    let factsCallCount = 0;
    let readinessCallCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.endsWith('/documents')) {
        return jsonResponse(DOCUMENT);
      }
      if (method === 'POST' && url.endsWith('/receptionist-runs')) {
        return jsonResponse({ ...READY_ANALYSIS_READINESS, id: 'run-123', status: 'completed' });
      }
      if (method === 'GET' && url.endsWith('/text-segments')) return jsonResponse([SEGMENT]);
      if (method === 'GET' && url.endsWith('/analysis-readiness')) return jsonResponse(READY_ANALYSIS_READINESS);
      if (method === 'GET' && url.endsWith('/receptionist/gaps')) return jsonResponse([]);
      if (method === 'GET' && url.endsWith('/facts/readiness')) {
        readinessCallCount++;
        if (readinessCallCount === 1) return jsonResponse(READY_READINESS);
        throw new Error('Readiness refresh failed');
      }
      if (method === 'GET' && url.endsWith('/facts')) {
        factsCallCount++;
        if (factsCallCount === 1) return jsonResponse([FACT]);
        throw new Error('Facts refresh failed');
      }
      if (method === 'GET' && url.endsWith('/documents')) {
        documentsCallCount++;
        return jsonResponse(documentsCallCount === 1 ? [] : [DOCUMENT]);
      }
      throw new Error(`Unhandled fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const nav = renderUpload({ caseId: 'case-123', mockAnalysisAcknowledged: true });
    const file = new File(['CAE 12%'], 'contrato.txt', { type: 'text/plain' });

    await user.upload(screen.getByLabelText('Archivo del documento'), file);
    await user.click(screen.getByRole('button', { name: /guardar documento/i }));

    expect(await screen.findByText(/Documento guardado, pero no pudimos actualizar los hechos extraidos/)).toBeTruthy();
    expect(screen.queryByText(/No pudimos guardar el documento/)).toBeNull();
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
