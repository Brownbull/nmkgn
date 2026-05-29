import { type DragEvent, type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listDocuments,
  listTextSegments,
  uploadDocument,
  type DocumentRecord,
  type DocumentRole,
  type ExtractionStatus,
  type ExtractedTextSegment,
} from '../api/documents';
import {
  getFactReadiness,
  listFacts,
  recordFactConfirmation,
  type ConsumerCreditFact,
  type FactConfirmationAction,
  type FactConfirmationPayload,
  type FactConfirmationStatus,
  type FactReadiness,
} from '../api/facts';
import {
  getAnalysisReadiness,
  listReceptionistGaps,
  resolveReceptionistGap,
  startReceptionistRun,
  type AnalysisReadiness,
  type DocumentExtractionGap,
  type DocumentReceptionistRun,
  type ReceptionistResolutionAction,
} from '../api/receptionist';
import { Icon } from '../components/Icon';
import { AppShell, CaseContextStrip, ProgressBar } from '../components/shared';
import { useNav, type NavState } from '../components/NavContext';

const SUPPORTED_TYPES = [
  { icon: 'bank', label: 'Crédito bancario', sub: 'Consumo · Hipotecario · Automotriz' },
  { icon: 'house', label: 'Arriendo', sub: 'Futuro schema' },
  { icon: 'shield', label: 'Seguro', sub: 'Futuro schema' },
  { icon: 'briefcase', label: 'Contrato laboral', sub: 'Futuro schema' },
  { icon: 'wrench', label: 'Cotización taller', sub: 'Futuro schema' },
  { icon: 'hammer', label: 'Propuesta obra', sub: 'Futuro schema' },
];

const DOCUMENT_ROLES: Array<{ value: DocumentRole; label: string; sub: string }> = [
  { value: 'primary', label: 'Documento principal', sub: 'Contrato o borrador base' },
  { value: 'simulation', label: 'Simulacion', sub: 'Cotizacion o simulador' },
  { value: 'offer', label: 'Oferta', sub: 'Oferta comercial relacionada' },
  { value: 'payment', label: 'Pago', sub: 'Comprobante o cartola' },
  { value: 'email', label: 'Email', sub: 'Contexto escrito' },
  { value: 'comparator_loan', label: 'Credito comparador', sub: 'Otro credito para comparar' },
];

const EMPTY_DOCUMENTS: DocumentRecord[] = [];
const EMPTY_FACTS: ConsumerCreditFact[] = [];
const EMPTY_GAPS: DocumentExtractionGap[] = [];

const STATUS_COPY: Record<FactConfirmationStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'pill-amber' },
  confirmed: { label: 'Confirmado', className: 'pill-green' },
  corrected: { label: 'Corregido', className: 'pill-green' },
  rejected: { label: 'Rechazado', className: 'pill-red' },
};

const FACT_KEY_LABELS: Record<string, string> = {
  principal_amount: 'Monto del credito',
  currency: 'Moneda',
  contract_date: 'Fecha de contrato',
  term_months: 'Plazo',
  payment_count: 'Numero de cuotas',
  installment_amount: 'Valor de cuota',
  interest_rate: 'Tasa de interes',
  cae: 'CAE',
  total_cost: 'Costo total',
  fee: 'Comision o cargo',
  insurance: 'Seguro asociado',
  linked_product: 'Producto vinculado',
  clause: 'Clausula relevante',
};

const FACT_CATEGORIES: Array<{ key: string; label: string; icon: string; keys: string[] }> = [
  { key: 'amounts', label: 'Montos', icon: 'bank', keys: ['principal_amount', 'total_cost', 'installment_amount'] },
  { key: 'dates', label: 'Fechas', icon: 'file', keys: ['contract_date'] },
  { key: 'rates', label: 'Tasas e indices', icon: 'shield-check', keys: ['interest_rate', 'cae'] },
  { key: 'terms', label: 'Plazo y cuotas', icon: 'file', keys: ['term_months', 'payment_count'] },
  { key: 'costs', label: 'Seguros y cargos', icon: 'briefcase', keys: ['fee', 'insurance', 'linked_product'] },
  { key: 'other', label: 'Otros datos', icon: 'file', keys: ['currency', 'clause'] },
];

function groupAndSortFacts(facts: ConsumerCreditFact[]): Array<{ category: typeof FACT_CATEGORIES[number]; facts: ConsumerCreditFact[] }> {
  const assigned = new Set<string>();
  const groups: Array<{ category: typeof FACT_CATEGORIES[number]; facts: ConsumerCreditFact[] }> = [];

  for (const category of FACT_CATEGORIES) {
    const matched = facts.filter(f => category.keys.includes(f.fact_key) && !assigned.has(f.id));
    matched.forEach(f => assigned.add(f.id));
    if (matched.length > 0) {
      groups.push({
        category,
        facts: matched.sort((a, b) => (b.high_impact ? 1 : 0) - (a.high_impact ? 1 : 0)),
      });
    }
  }

  const unmatched = facts.filter(f => !assigned.has(f.id));
  if (unmatched.length > 0) {
    groups.push({
      category: { key: 'uncategorized', label: 'Sin categoria', icon: 'file', keys: [] },
      facts: unmatched.sort((a, b) => (b.high_impact ? 1 : 0) - (a.high_impact ? 1 : 0)),
    });
  }

  return groups;
}

const GAP_TYPE_LABELS: Record<string, string> = {
  missing_in_deterministic: 'Falta en extractor deterministico',
  missing_in_receptionist: 'Falta en recepcion',
  value_conflict: 'Valor distinto',
  source_conflict: 'Fuente distinta',
  deterministic_warning_resolved: 'Advertencia resuelta por recepcion',
  llm_unanchored_claim: 'Dato sin ancla',
  unsupported_field: 'Campo no soportado',
  receptionist_unavailable: 'Recepcion fallida',
  partial_document_coverage: 'Documento parcial',
};

const EXTRACTION_COPY: Record<ExtractionStatus, { label: string; className: string; detail: string }> = {
  pending: {
    label: 'Pendiente',
    className: '',
    detail: 'El documento esta guardado; la lectura todavia no ha comenzado.',
  },
  extracting: {
    label: 'Leyendo',
    className: 'pill-amber',
    detail: 'El documento esta en lectura local.',
  },
  extracted: {
    label: 'Texto extraido',
    className: 'pill-green',
    detail: 'Hay texto revisable. Aun no son hechos confirmados ni hallazgos.',
  },
  needs_ocr: {
    label: 'Necesita OCR',
    className: 'pill-amber',
    detail: 'El archivo parece escaneado o es imagen. OCR queda pendiente.',
  },
  failed: {
    label: 'Lectura fallida',
    className: 'pill-red',
    detail: 'El archivo se guardo, pero no pudimos extraer texto revisable.',
  },
};

function statusToScenario(status: ExtractionStatus): NonNullable<NavState['detectionScenario']> {
  if (status === 'extracted') return 'ready';
  if (status === 'needs_ocr') return 'low_confidence';
  if (status === 'failed') return 'failed';
  return 'low_confidence';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function roleLabel(role: DocumentRole): string {
  return DOCUMENT_ROLES.find(item => item.value === role)?.label ?? role;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function previewText(segments: ExtractedTextSegment[]): string {
  return segments
    .map(segment => segment.text.trim())
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 1200);
}

function formatFactValue(fact: ConsumerCreditFact): string {
  if (fact.warning_code) return fact.warning_message ?? 'Necesita revision manual';
  if (fact.value_kind === 'money' && fact.value_number !== null) {
    const currency = fact.value_currency ? ` ${fact.value_currency}` : '';
    return `${new Intl.NumberFormat('es-CL').format(fact.value_number)}${currency}`;
  }
  if (fact.value_kind === 'percentage' && fact.value_number !== null) {
    return `${fact.value_number.toLocaleString('es-CL')}%`;
  }
  if (fact.value_kind === 'integer' && fact.value_number !== null) {
    const unit = fact.unit ? ` ${fact.unit}` : '';
    return `${fact.value_number.toLocaleString('es-CL')}${unit}`;
  }
  if (fact.value_kind === 'currency' && fact.value_currency) return fact.value_currency;
  if (fact.value_kind === 'date' && fact.value_date) return fact.value_date;
  if (fact.value_text) return fact.value_text;
  return 'Sin valor normalizado';
}

function factLocator(fact: ConsumerCreditFact): string {
  const parts = [];
  if (fact.source_page_number) parts.push(`pag. ${fact.source_page_number}`);
  if (fact.source_start_offset !== null && fact.source_end_offset !== null) {
    parts.push(`chars ${fact.source_start_offset}-${fact.source_end_offset}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'segmento extraido';
}

function formatGapPayload(payload: Record<string, unknown> | null): string {
  if (!payload) return 'Sin valor';
  const valueDate = typeof payload.value_date === 'string' ? payload.value_date : null;
  const valueText = typeof payload.value_text === 'string' ? payload.value_text : null;
  const valueCurrency = typeof payload.value_currency === 'string' ? payload.value_currency : null;
  const valueNumber = typeof payload.value_number === 'number' ? payload.value_number : null;
  const warning = typeof payload.warning_message === 'string' ? payload.warning_message : null;
  if (warning) return warning;
  if (valueNumber !== null) {
    const currency = valueCurrency ? ` ${valueCurrency}` : '';
    return `${new Intl.NumberFormat('es-CL').format(valueNumber)}${currency}`;
  }
  return valueDate ?? valueCurrency ?? valueText ?? 'Sin valor';
}

function parseCorrectionNumber(raw: string): number {
  const normalized = raw
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  if (!/\d/.test(normalized)) {
    throw new Error('Ingresa un numero valido para corregir este hecho.');
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error('Ingresa un numero valido para corregir este hecho.');
  }
  return parsed;
}

function buildConfirmationPayload(
  fact: ConsumerCreditFact,
  action: FactConfirmationAction,
  correctionRaw: string,
): FactConfirmationPayload {
  const payload: FactConfirmationPayload = { fact_id: fact.id, action };
  if (action !== 'correct') return payload;

  const value = correctionRaw.trim();
  if (!value) {
    throw new Error('Ingresa una correccion antes de guardar.');
  }

  if (fact.value_kind === 'money') {
    payload.corrected_value_number = parseCorrectionNumber(value);
    payload.corrected_value_currency = fact.value_currency ?? 'CLP';
    return payload;
  }
  if (fact.value_kind === 'percentage' || fact.value_kind === 'integer') {
    payload.corrected_value_number = parseCorrectionNumber(value);
    return payload;
  }
  if (fact.value_kind === 'currency') {
    payload.corrected_value_currency = value.toUpperCase();
    return payload;
  }
  if (fact.value_kind === 'date') {
    payload.corrected_value_date = value;
    return payload;
  }
  payload.corrected_value_text = value;
  return payload;
}

export function Upload() {
  const nav = useNav();
  const caseId = nav.state.caseId;
  const selectedType = nav.state.docType ?? 'bank';
  const hasPersisted = Boolean(caseId);
  const [documents, setDocuments] = useState<DocumentRecord[] | null>(hasPersisted ? null : []);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<DocumentRole>('primary');
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'refreshing' | 'complete'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [segmentsByDocumentId, setSegmentsByDocumentId] = useState<Record<string, ExtractedTextSegment[]>>({});
  const [segmentErrorsByDocumentId, setSegmentErrorsByDocumentId] = useState<Record<string, string>>({});
  const [facts, setFacts] = useState<ConsumerCreditFact[] | null>(hasPersisted ? null : []);
  const [readiness, setReadiness] = useState<FactReadiness | null>(hasPersisted ? null : null);
  const [factsError, setFactsError] = useState<string | null>(null);
  const [factActionById, setFactActionById] = useState<Record<string, FactConfirmationAction>>({});
  const [correctionById, setCorrectionById] = useState<Record<string, string>>({});
  const [analysisReadiness, setAnalysisReadiness] = useState<AnalysisReadiness | null>(hasPersisted ? null : null);
  const [receptionistGaps, setReceptionistGaps] = useState<DocumentExtractionGap[] | null>(hasPersisted ? null : []);
  const [receptionistError, setReceptionistError] = useState<string | null>(null);
  const [receptionistRunByDocumentId, setReceptionistRunByDocumentId] = useState<Record<string, DocumentReceptionistRun>>({});
  const [receptionistRunBusyByDocumentId, setReceptionistRunBusyByDocumentId] = useState<Record<string, boolean>>({});
  const [gapActionById, setGapActionById] = useState<Record<string, ReceptionistResolutionAction>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentRecords = documents ?? EMPTY_DOCUMENTS;
  const documentsLoading = hasPersisted && documents === null && !documentsError;
  const selectedDocument = useMemo(
    () => documentRecords.find(document => document.id === selectedDocumentId) ?? documentRecords[0],
    [documentRecords, selectedDocumentId],
  );
  const primaryDocument = documentRecords.find(document => document.role === 'primary') ?? documentRecords[0];
  const hasDocuments = documentRecords.length > 0;
  const factRecords = facts ?? EMPTY_FACTS;
  const gapRecords = receptionistGaps ?? EMPTY_GAPS;
  const factsLoading = hasPersisted && facts === null && !factsError;
  const receptionistLoading = hasPersisted && receptionistGaps === null && !receptionistError;
  const readinessReady = Boolean(readiness?.ready_for_analysis);
  const analysisReady = Boolean(analysisReadiness?.ready_for_analysis);
  const receptionistReady = Boolean(analysisReadiness?.receptionist_ready);
  const factReviewBlocked = hasPersisted && hasDocuments && !analysisReady;
  const requiresPrototypeAck = hasPersisted && hasDocuments && analysisReady && !nav.state.mockAnalysisAcknowledged;
  const canContinue = hasPersisted && hasDocuments && analysisReady && !requiresPrototypeAck;
  const progressPct = uploadStage === 'uploading' ? 45 : uploadStage === 'refreshing' ? 78 : uploadStage === 'complete' ? 100 : 0;
  const selectedDocumentIdForSegments = selectedDocument?.id;
  const segments = selectedDocumentIdForSegments ? segmentsByDocumentId[selectedDocumentIdForSegments] ?? [] : [];
  const segmentsError = selectedDocumentIdForSegments ? segmentErrorsByDocumentId[selectedDocumentIdForSegments] ?? null : null;
  const segmentsLoading = Boolean(
    selectedDocumentIdForSegments
      && !(selectedDocumentIdForSegments in segmentsByDocumentId)
      && !(selectedDocumentIdForSegments in segmentErrorsByDocumentId),
  );
  const preview = previewText(segments);
  const updateNav = nav.set;
  const factGroups = useMemo(() => groupAndSortFacts(factRecords), [factRecords]);
  const pendingFacts = factRecords.filter(f => f.confirmation_status === 'pending');

  const refreshFactReview = useCallback(async () => {
    if (!caseId) return;
    setFactsError(null);
    setReceptionistError(null);
    const [nextFacts, nextReadiness, nextAnalysisReadiness, nextGaps] = await Promise.all([
      listFacts(caseId),
      getFactReadiness(caseId),
      getAnalysisReadiness(caseId),
      listReceptionistGaps(caseId),
    ]);
    setFacts(nextFacts);
    setReadiness(nextReadiness);
    setAnalysisReadiness(nextAnalysisReadiness);
    setReceptionistGaps(nextGaps);
    updateNav({
      factReviewReady: nextAnalysisReadiness.ready_for_analysis,
      unresolvedHighImpactFactCount: nextReadiness.unresolved_high_impact_count,
    });
  }, [caseId, updateNav]);

  useEffect(() => {
    if (!caseId) {
      return;
    }

    let ignore = false;
    listDocuments(caseId)
      .then(records => {
        if (ignore) return;
        setDocuments(records);
        setSelectedDocumentId(previous => (
          records.some(document => document.id === previous)
            ? previous
            : records[0]?.id ?? null
        ));
      })
      .catch(err => {
        if (!ignore) setDocumentsError(errorText(err, 'No pudimos cargar los documentos.'));
      })

    return () => {
      ignore = true;
    };
  }, [caseId]);

  useEffect(() => {
    if (!caseId) {
      return;
    }

    let ignore = false;
    Promise.all([
      listFacts(caseId),
      getFactReadiness(caseId),
      getAnalysisReadiness(caseId),
      listReceptionistGaps(caseId),
    ])
      .then(([nextFacts, nextReadiness, nextAnalysisReadiness, nextGaps]) => {
        if (ignore) return;
        setFacts(nextFacts);
        setReadiness(nextReadiness);
        setAnalysisReadiness(nextAnalysisReadiness);
        setReceptionistGaps(nextGaps);
        updateNav({
          factReviewReady: nextAnalysisReadiness.ready_for_analysis,
          unresolvedHighImpactFactCount: nextReadiness.unresolved_high_impact_count,
        });
      })
      .catch(err => {
        if (!ignore) {
          setFactsError(errorText(err, 'No pudimos cargar los hechos del caso.'));
          setReceptionistError(errorText(err, 'No pudimos cargar la recepcion del caso.'));
          updateNav({ factReviewReady: false });
        }
      });

    return () => {
      ignore = true;
    };
  }, [caseId, updateNav]);

  useEffect(() => {
    if (!caseId || !selectedDocumentIdForSegments) {
      return;
    }

    let ignore = false;
    listTextSegments(caseId, selectedDocumentIdForSegments)
      .then(records => {
        if (!ignore) {
          setSegmentsByDocumentId(previous => ({
            ...previous,
            [selectedDocumentIdForSegments]: records,
          }));
        }
      })
      .catch(err => {
        if (!ignore) {
          setSegmentErrorsByDocumentId(previous => ({
            ...previous,
            [selectedDocumentIdForSegments]: errorText(err, 'No pudimos cargar el texto extraido.'),
          }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [caseId, selectedDocumentIdForSegments]);

  function applyFile(file: File | undefined) {
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!hasPersisted || uploading) return;
    applyFile(event.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!caseId || !selectedFile) return;

    try {
      setUploading(true);
      setUploadStage('uploading');
      setUploadError(null);
      const uploaded = await uploadDocument({
        caseId,
        file: selectedFile,
        role: selectedRole,
      });

      setSelectedFile(null);
      nav.set({
        fileName: uploaded.original_filename,
        detectionScenario: statusToScenario(uploaded.extraction_status),
        mockAnalysisAcknowledged: false,
        factReviewReady: false,
        unresolvedHighImpactFactCount: undefined,
      });

      setUploadStage('refreshing');
      try {
        const freshDocuments = await listDocuments(caseId);
        setDocuments(freshDocuments);
      } catch {
        setDocuments(prev => [...(prev ?? []), uploaded]);
        setUploadError('Documento guardado, pero no pudimos actualizar la lista. Recarga la pagina para ver el estado completo.');
      }
      setSelectedDocumentId(uploaded.id);
      try {
        setReceptionistRunBusyByDocumentId(previous => ({ ...previous, [uploaded.id]: true }));
        const run = await startReceptionistRun(caseId, uploaded.id);
        setReceptionistRunByDocumentId(previous => ({ ...previous, [uploaded.id]: run }));
      } catch (err) {
        setReceptionistError(errorText(err, 'Documento guardado, pero no pudimos ejecutar la recepcion.'));
      } finally {
        setReceptionistRunBusyByDocumentId(previous => {
          const next = { ...previous };
          delete next[uploaded.id];
          return next;
        });
      }
      try {
        await refreshFactReview();
      } catch {
        setFactsError('Documento guardado, pero no pudimos actualizar los hechos extraidos. Recarga la pagina para revisar la confirmacion.');
        nav.set({ factReviewReady: false });
      }
      setUploadStage('complete');
    } catch (err) {
      setUploadStage('idle');
      setUploadError(errorText(err, 'No pudimos guardar el documento.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleStartReceptionist(documentId: string) {
    if (!caseId || receptionistRunBusyByDocumentId[documentId]) return;
    try {
      setReceptionistError(null);
      setReceptionistRunBusyByDocumentId(previous => ({ ...previous, [documentId]: true }));
      const run = await startReceptionistRun(caseId, documentId);
      setReceptionistRunByDocumentId(previous => ({ ...previous, [documentId]: run }));
      await refreshFactReview();
    } catch (err) {
      setReceptionistError(errorText(err, 'No pudimos ejecutar la recepcion del documento.'));
    } finally {
      setReceptionistRunBusyByDocumentId(previous => {
        const next = { ...previous };
        delete next[documentId];
        return next;
      });
    }
  }

  async function handleGapResolution(gap: DocumentExtractionGap, action: ReceptionistResolutionAction) {
    if (!caseId || gapActionById[gap.id]) return;
    try {
      setReceptionistError(null);
      setGapActionById(previous => ({ ...previous, [gap.id]: action }));
      await resolveReceptionistGap(caseId, gap.id, action);
      await refreshFactReview();
    } catch (err) {
      setReceptionistError(errorText(err, 'No pudimos resolver la brecha de recepcion.'));
    } finally {
      setGapActionById(previous => {
        const next = { ...previous };
        delete next[gap.id];
        return next;
      });
    }
  }

  async function handleFactAction(fact: ConsumerCreditFact, action: FactConfirmationAction) {
    if (!caseId || factActionById[fact.id]) return;

    try {
      setFactsError(null);
      setFactActionById(previous => ({ ...previous, [fact.id]: action }));
      const payload = buildConfirmationPayload(fact, action, correctionById[fact.id] ?? '');
      await recordFactConfirmation({ caseId, factId: fact.id, payload });
      if (action === 'correct') {
        setCorrectionById(previous => {
          const next = { ...previous };
          delete next[fact.id];
          return next;
        });
      }
      await refreshFactReview();
    } catch (err) {
      setFactsError(errorText(err, 'No pudimos registrar la decision.'));
    } finally {
      setFactActionById(previous => {
        const next = { ...previous };
        delete next[fact.id];
        return next;
      });
    }
  }

  function continueToProcess() {
    if (!hasPersisted) {
      nav.go('case');
      return;
    }
    if (!canContinue) return;
    if (primaryDocument) {
      nav.set({
        fileName: primaryDocument.original_filename,
        detectionScenario: statusToScenario(primaryDocument.extraction_status),
        factReviewReady: true,
      });
    }
    nav.go('process');
  }

  return (
    <AppShell activeNav="Análisis">
      <div className="upload-page" style={{ padding: '32px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <div className="label">Paso 2 de 4</div>
        <h1 className="display" style={{ fontSize: 34, margin: '8px 0 6px', letterSpacing: 0 }}>Sube los documentos del caso.</h1>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', maxWidth: 760, lineHeight: 1.5 }}>
          Los archivos se guardan localmente para este caso y la lectura disponible queda separada de los hallazgos.
        </div>

        <div style={{ marginTop: 18 }}>
          <CaseContextStrip />
        </div>

        {!hasPersisted && (
          <div className="card" style={{ marginTop: 18, padding: 16, borderColor: 'var(--amber)', background: 'var(--amber-soft)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
              <Icon name="shield-check" size={18} color="var(--amber)" />
              <strong style={{ color: 'var(--ink)' }}>Primero crea un caso guardado.</strong>
              <span>La carga real necesita un `caseId` para preservar procedencia.</span>
            </div>
          </div>
        )}

        <div className="upload-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
          {SUPPORTED_TYPES.map(type => {
            const isSelected = type.icon === selectedType;
            const isLocked = hasPersisted && type.icon !== 'bank';
            return (
              <div
                key={type.label}
                className="card"
                style={{
                  padding: '16px 18px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  background: isSelected ? 'var(--accent-soft)' : '#fff',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--line)',
                  transition: 'background .15s, border-color .15s',
                  opacity: isLocked ? 0.45 : 1,
                }}
                onClick={() => !isLocked && nav.set({ docType: type.icon, docLabel: type.label })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? '#fff' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={type.icon} size={18} color={isSelected ? 'var(--accent)' : 'var(--ink)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{type.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{type.sub}</div>
                  </div>
                  {isSelected && <Icon name="check-circle" size={18} color="var(--accent)" />}
                  {isLocked && <span className="pill" style={{ fontSize: 10 }}>bloqueado</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="case-flow-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, .9fr)', gap: 18, marginTop: 18, alignItems: 'start' }}>
          <section className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div className="label">Carga</div>
                <h2 className="display" style={{ fontSize: 20, margin: '6px 0 4px', letterSpacing: 0 }}>Archivo para guardar</h2>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  PDF con texto, TXT o imagen. Los escaneos quedan marcados como OCR pendiente.
                </div>
              </div>
              <span className="pill pill-accent">demo-user</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: 12, marginTop: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span className="label">Rol</span>
                <select
                  value={selectedRole}
                  onChange={event => setSelectedRole(event.target.value as DocumentRole)}
                  disabled={!hasPersisted || uploading}
                  style={inputStyle}
                >
                  {DOCUMENT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span className="label">Uso</span>
                <div style={{ ...inputStyle, height: 'auto', minHeight: 42, display: 'flex', alignItems: 'center', color: 'var(--ink-soft)', background: 'var(--paper-2)' }}>
                  {DOCUMENT_ROLES.find(role => role.value === selectedRole)?.sub}
                </div>
              </div>
            </div>

            <div
              className="card"
              onDragOver={event => event.preventDefault()}
              onDrop={handleDrop}
              onClick={() => hasPersisted && !uploading && fileInputRef.current?.click()}
              style={{
                marginTop: 16,
                padding: '28px 20px',
                background: hasPersisted ? 'repeating-linear-gradient(135deg, var(--paper-2) 0 14px, transparent 14px 28px)' : 'var(--paper-2)',
                border: '1.5px dashed var(--line-2)',
                textAlign: 'center',
                cursor: hasPersisted && !uploading ? 'pointer' : 'default',
                opacity: hasPersisted ? 1 : 0.62,
              }}
            >
              <input
                ref={fileInputRef}
                aria-label="Archivo del documento"
                type="file"
                accept="application/pdf,text/plain,image/jpeg,image/png,.pdf,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={!hasPersisted || uploading}
                style={visuallyHiddenInputStyle}
              />
              <div style={{ width: 54, height: 54, borderRadius: 13, background: '#fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -4px rgba(26,29,36,0.1)' }}>
                <Icon name="upload" size={25} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 14, letterSpacing: 0 }}>
                {selectedFile ? selectedFile.name : 'Selecciona o arrastra un archivo'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 5 }}>
                {selectedFile ? `${formatBytes(selectedFile.size)} · ${selectedFile.type || 'tipo no declarado'}` : 'PDF, TXT, JPG o PNG · hasta 25 MB'}
              </div>
              <div style={{ marginTop: 14, display: 'inline-flex', gap: 10, alignItems: 'center', fontSize: 11.5, color: 'var(--ink-faint)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="pill" style={{ fontSize: 11 }}>.pdf</span>
                <span className="pill" style={{ fontSize: 11 }}>.txt</span>
                <span className="pill" style={{ fontSize: 11 }}>.jpg / .png</span>
              </div>
            </div>

            {uploadStage !== 'idle' && (
              <div style={{ marginTop: 14 }}>
                <ProgressBar pct={progressPct} accent="var(--accent)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, color: 'var(--ink-faint)', fontSize: 11.5, fontWeight: 700 }}>
                  <span>{uploadStage === 'uploading' ? 'Subiendo archivo' : uploadStage === 'refreshing' ? 'Actualizando estado' : 'Guardado'}</span>
                  <span>{progressPct}%</span>
                </div>
              </div>
            )}

            {uploadError && (
              <div style={errorBoxStyle}>{uploadError}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-accent"
                disabled={!hasPersisted || !selectedFile || uploading}
                onClick={handleUpload}
                style={{ opacity: hasPersisted && selectedFile && !uploading ? 1 : 0.55 }}
              >
                {uploading ? 'Guardando...' : 'Guardar documento'} <Icon name="arrow-r" size={14} />
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div className="label">Documentos guardados</div>
                <h2 className="display" style={{ fontSize: 20, margin: '6px 0 4px', letterSpacing: 0 }}>Estado de lectura</h2>
              </div>
              <span className="pill">{documentRecords.length}</span>
            </div>

            {documentsLoading && <div style={emptyStateStyle}>Cargando documentos...</div>}
            {documentsError && <div style={errorBoxStyle}>{documentsError}</div>}
            {!documentsLoading && !documentsError && documentRecords.length === 0 && (
              <div style={emptyStateStyle}>Todavia no hay documentos guardados para este caso.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {documentRecords.map(document => {
                const status = EXTRACTION_COPY[document.extraction_status];
                const active = selectedDocument?.id === document.id;
                const receptionistStatus = (
                  receptionistRunByDocumentId[document.id]?.status
                  ?? analysisReadiness?.document_run_statuses[document.id]
                );
                const receptionistClass = receptionistStatus === 'completed'
                  ? 'pill-green'
                  : receptionistStatus === 'failed'
                    ? 'pill-red'
                    : 'pill-amber';
                return (
                  <button
                    key={document.id}
                    type="button"
                    className="card"
                    onClick={() => setSelectedDocumentId(document.id)}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderColor: active ? 'var(--accent)' : 'var(--line)',
                      background: active ? 'var(--accent-soft)' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                        <Icon name="file" size={17} color="var(--accent)" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 13.5 }}>{document.original_filename}</strong>
                          <span className={`pill ${status.className}`} style={{ fontSize: 10.5 }}>{status.label}</span>
                          {receptionistStatus && (
                            <span className={`pill ${receptionistClass}`} style={{ fontSize: 10.5 }}>
                              Recepcion {receptionistStatus}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 4, color: 'var(--ink-faint)', fontSize: 11.5, lineHeight: 1.4 }}>
                          {roleLabel(document.role)} · {formatBytes(document.byte_size)} · {document.content_type}
                        </div>
                        <div style={{ marginTop: 5, color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.45 }}>
                          {status.detail}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {selectedDocument && (
          <section className="card" style={{ padding: 20, marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div className="label">Texto extraido</div>
                <h2 className="display" style={{ fontSize: 20, margin: '6px 0 4px', letterSpacing: 0 }}>
                  {selectedDocument.original_filename}
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Vista corta para verificar que el lector encontro texto. La confirmacion se revisa abajo y los hallazgos quedan fuera de esta fase.
                </div>
              </div>
              <span className={`pill ${EXTRACTION_COPY[selectedDocument.extraction_status].className}`}>
                {EXTRACTION_COPY[selectedDocument.extraction_status].label}
              </span>
            </div>

            {segmentsLoading && <div style={emptyStateStyle}>Cargando texto...</div>}
            {segmentsError && <div style={errorBoxStyle}>{segmentsError}</div>}
            {!segmentsLoading && !segmentsError && preview && (
              <pre style={previewStyle}>{preview}</pre>
            )}
            {!segmentsLoading && !segmentsError && !preview && (
              <div style={emptyStateStyle}>{EXTRACTION_COPY[selectedDocument.extraction_status].detail}</div>
            )}
          </section>
        )}

        {hasPersisted && hasDocuments && (
          <section className="card" style={{ padding: 20, marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div className="label">Recepcion multimodal</div>
                <h2 className="display" style={{ fontSize: 20, margin: '6px 0 4px', letterSpacing: 0 }}>
                  Brechas contra el documento original
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  El receptionist revisa el documento aparte y deja observaciones auditables; solo una decision humana puede promover o cerrar brechas.
                </div>
              </div>
              <span className={`pill ${receptionistReady ? 'pill-green' : 'pill-amber'}`}>
                {receptionistReady ? 'Recepcion lista' : 'Recepcion pendiente'}
              </span>
            </div>

            {analysisReadiness && (
              <div className="fact-review-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 10, marginTop: 16 }}>
                <div style={summaryBoxStyle}>
                  <div className="label">Documentos</div>
                  <strong>{documentRecords.length}</strong>
                </div>
                <div style={summaryBoxStyle}>
                  <div className="label">Sin recepcion</div>
                  <strong>{analysisReadiness.missing_receptionist_document_ids.length}</strong>
                </div>
                <div style={summaryBoxStyle}>
                  <div className="label">Brechas abiertas</div>
                  <strong>{gapRecords.filter(gap => gap.status === 'open').length}</strong>
                </div>
                <div style={summaryBoxStyle}>
                  <div className="label">Bloqueantes</div>
                  <strong>{analysisReadiness.unresolved_blocking_gap_count}</strong>
                </div>
              </div>
            )}

            {receptionistError && <div style={errorBoxStyle}>{receptionistError}</div>}
            {receptionistLoading && <div style={emptyStateStyle}>Cargando recepcion...</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {documentRecords.map(document => {
                const status = (
                  receptionistRunByDocumentId[document.id]?.status
                  ?? analysisReadiness?.document_run_statuses[document.id]
                  ?? 'missing'
                );
                const busy = Boolean(receptionistRunBusyByDocumentId[document.id]);
                const statusClass = status === 'completed'
                  ? 'pill-green'
                  : status === 'failed'
                    ? 'pill-red'
                    : 'pill-amber';
                return (
                  <div key={document.id} style={{ ...factRowStyle, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 13.5 }}>{document.original_filename}</strong>
                        <span className={`pill ${statusClass}`} style={{ fontSize: 10.5 }}>{status}</span>
                      </div>
                      <div style={{ marginTop: 4, color: 'var(--ink-faint)', fontSize: 11.5 }}>
                        {roleLabel(document.role)} · {document.content_type}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={busy}
                      onClick={() => handleStartReceptionist(document.id)}
                      style={{ flex: '0 0 auto' }}
                    >
                      {busy ? 'Revisando...' : status === 'completed' ? 'Revisar otra vez' : 'Ejecutar recepcion'}
                    </button>
                  </div>
                );
              })}
            </div>

            {!receptionistLoading && !receptionistError && gapRecords.length === 0 && (
              <div style={emptyStateStyle}>No hay brechas registradas para este caso.</div>
            )}

            {gapRecords.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {gapRecords.map(gap => {
                  const busy = Boolean(gapActionById[gap.id]);
                  const canAcceptReceptionist = gap.status === 'open'
                    && Boolean(gap.observation_id)
                    && gap.gap_type !== 'unsupported_field'
                    && gap.gap_type !== 'missing_in_receptionist'
                    && gap.gap_type !== 'receptionist_unavailable'
                    && gap.gap_type !== 'partial_document_coverage';
                  const canConfirmDeterministic = gap.status === 'open' && Boolean(gap.fact_id);
                  return (
                    <div key={gap.id} style={factRowStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 13.5 }}>{GAP_TYPE_LABELS[gap.gap_type] ?? gap.gap_type}</strong>
                            <span className={`pill ${gap.blocking ? 'pill-amber' : ''}`} style={{ fontSize: 10.5 }}>
                              {gap.blocking ? 'bloqueante' : 'advisory'}
                            </span>
                            <span className="pill" style={{ fontSize: 10.5 }}>{gap.status}</span>
                          </div>
                          <div style={{ marginTop: 5, color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.45 }}>
                            {gap.detail}
                          </div>
                          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={summaryBoxStyle}>
                              <div className="label">Deterministico</div>
                              <strong style={{ fontSize: 12.5 }}>{formatGapPayload(gap.deterministic_value)}</strong>
                            </div>
                            <div style={summaryBoxStyle}>
                              <div className="label">Recepcion</div>
                              <strong style={{ fontSize: 12.5 }}>{formatGapPayload(gap.receptionist_value)}</strong>
                            </div>
                          </div>
                          {gap.source_summary && <blockquote style={snippetStyle}>{gap.source_summary}</blockquote>}
                          {gap.status === 'open' && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                              {canAcceptReceptionist && (
                                <button type="button" className="btn btn-small btn-accent" disabled={busy} onClick={() => handleGapResolution(gap, 'accept_receptionist')}>
                                  Aceptar recepcion
                                </button>
                              )}
                              {canConfirmDeterministic && (
                                <button type="button" className="btn btn-small" disabled={busy} onClick={() => handleGapResolution(gap, 'confirm_deterministic')}>
                                  Mantener deterministico
                                </button>
                              )}
                              {gap.gap_type === 'unsupported_field' && (
                                <button type="button" className="btn btn-small" disabled={busy} onClick={() => handleGapResolution(gap, 'defer_unsupported')}>
                                  Diferir
                                </button>
                              )}
                              <button type="button" className="btn btn-small btn-ghost" disabled={busy} onClick={() => handleGapResolution(gap, 'reject_receptionist')}>
                                Marcar revisado
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {hasPersisted && hasDocuments && (
          <section className="card" style={{ padding: 20, marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div className="label">Hechos por confirmar</div>
                <h2 className="display" style={{ fontSize: 20, margin: '6px 0 4px', letterSpacing: 0 }}>
                  Revisa los datos antes de analizar
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Estos son candidatos extraidos del texto. Solo los hechos confirmados, corregidos o rechazados abren el siguiente paso.
                </div>
              </div>
              <span className={`pill ${readinessReady ? 'pill-green' : 'pill-amber'}`}>
                {readinessReady ? 'Listo para prototipo' : 'Bloqueado'}
              </span>
            </div>

            {readiness && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(90px, 1fr))', gap: 8, marginTop: 16 }}>
                  <div style={summaryBoxStyle}>
                    <div className="label">Total</div>
                    <strong>{readiness.total_fact_count}</strong>
                  </div>
                  <div style={{ ...summaryBoxStyle, borderColor: readiness.status_counts.confirmed > 0 ? 'var(--green)' : undefined }}>
                    <div className="label">Confirmados</div>
                    <strong style={{ color: 'var(--green)' }}>{readiness.status_counts.confirmed}</strong>
                  </div>
                  <div style={{ ...summaryBoxStyle, borderColor: readiness.status_counts.corrected > 0 ? 'var(--green)' : undefined }}>
                    <div className="label">Corregidos</div>
                    <strong style={{ color: 'var(--green)' }}>{readiness.status_counts.corrected}</strong>
                  </div>
                  <div style={{ ...summaryBoxStyle, borderColor: pendingFacts.length > 0 ? 'var(--amber)' : undefined }}>
                    <div className="label">Pendientes</div>
                    <strong style={{ color: pendingFacts.length > 0 ? 'var(--amber)' : undefined }}>{pendingFacts.length}</strong>
                  </div>
                  <div style={summaryBoxStyle}>
                    <div className="label">Rechazados</div>
                    <strong style={{ color: readiness.status_counts.rejected > 0 ? 'var(--red)' : undefined }}>{readiness.status_counts.rejected}</strong>
                  </div>
                </div>
                {readiness.total_fact_count > 0 && (
                  <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'var(--paper-2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      background: 'var(--green)',
                      width: `${Math.round(((readiness.total_fact_count - pendingFacts.length) / readiness.total_fact_count) * 100)}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}
              </>
            )}

            {factsLoading && <div style={emptyStateStyle}>Cargando hechos extraidos...</div>}
            {factsError && <div style={errorBoxStyle}>{factsError}</div>}
            {bulkError && <div style={errorBoxStyle}>{bulkError}</div>}
            {!factsLoading && !factsError && factRecords.length === 0 && (
              <div style={emptyStateStyle}>
                Todavia no hay hechos extraidos para confirmar. Sube un documento con texto de credito de consumo o revisa si la lectura quedo pendiente.
              </div>
            )}

            {readiness && readiness.missing_required_fact_keys.length > 0 && (
              <div style={{ ...errorBoxStyle, background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                Faltan datos obligatorios: {readiness.missing_required_fact_keys.map(key => FACT_KEY_LABELS[key] ?? key).join(', ')}.
              </div>
            )}

            {pendingFacts.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-small btn-accent"
                  disabled={bulkBusy}
                  onClick={async () => {
                    if (!caseId) return;
                    setBulkBusy(true);
                    setBulkError(null);
                    const results = await Promise.allSettled(
                      pendingFacts.map(fact =>
                        recordFactConfirmation({ caseId, factId: fact.id, payload: { fact_id: fact.id, action: 'confirm' } })
                      )
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed > 0) {
                      setBulkError(`${failed} de ${pendingFacts.length} hechos no se pudieron confirmar. Los demas se procesaron correctamente.`);
                    }
                    await refreshFactReview();
                    setBulkBusy(false);
                  }}
                >
                  {bulkBusy ? 'Procesando...' : `Confirmar todos (${pendingFacts.length})`}
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  disabled={bulkBusy}
                  style={{ color: 'var(--red)' }}
                  onClick={async () => {
                    if (!caseId) return;
                    setBulkBusy(true);
                    setBulkError(null);
                    const results = await Promise.allSettled(
                      pendingFacts.map(fact =>
                        recordFactConfirmation({ caseId, factId: fact.id, payload: { fact_id: fact.id, action: 'reject' } })
                      )
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed > 0) {
                      setBulkError(`${failed} de ${pendingFacts.length} hechos no se pudieron rechazar. Los demas se procesaron correctamente.`);
                    }
                    await refreshFactReview();
                    setBulkBusy(false);
                  }}
                >
                  Rechazar todos ({pendingFacts.length})
                </button>
                {bulkBusy && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Procesando {pendingFacts.length} hechos...</span>}
              </div>
            )}

            {factGroups.map(group => {
              const collapsed = collapsedGroups[group.category.key] ?? false;
              const groupPending = group.facts.filter(f => f.confirmation_status === 'pending').length;
              const groupResolved = group.facts.length - groupPending;
              return (
                <div key={group.category.key} style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.category.key]: !collapsed }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)',
                      background: 'var(--paper-2)', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Icon name={collapsed ? 'chevron-r' : 'chevron-d'} size={14} color="var(--ink-faint)" />
                    <Icon name={group.category.icon} size={16} color="var(--ink-soft)" />
                    <strong style={{ flex: 1, fontSize: 13 }}>{group.category.label}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                      {groupResolved}/{group.facts.length} resueltos
                    </span>
                    {groupPending > 0 && <span className="pill pill-amber" style={{ fontSize: 10 }}>{groupPending} pendientes</span>}
                  </button>
                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {group.facts.map(fact => {
                        const status = STATUS_COPY[fact.confirmation_status];
                        const resolved = fact.confirmation_status !== 'pending';
                        const busy = Boolean(factActionById[fact.id]) || bulkBusy;
                        const correction = correctionById[fact.id] ?? '';
                        return (
                          <div key={fact.id} style={factRowStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: fact.high_impact ? 'var(--amber-soft)' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                                <Icon name={fact.high_impact ? 'shield-check' : 'file'} size={14} color={fact.high_impact ? 'var(--amber)' : 'var(--ink-faint)'} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 13 }}>{fact.label}</strong>
                                  <span className={`pill ${status.className}`} style={{ fontSize: 10 }}>{status.label}</span>
                                  {fact.high_impact && <span className="pill pill-amber" style={{ fontSize: 10 }}>alto impacto</span>}
                                </div>
                                <div style={{ marginTop: 4, fontSize: 13, color: fact.warning_code ? 'var(--amber)' : 'var(--ink)', fontWeight: 700 }}>
                                  {formatFactValue(fact)}
                                </div>
                                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-faint)' }}>
                                  {fact.extraction_provider} · {factLocator(fact)}
                                  {fact.confidence !== null ? ` · ${Math.round(fact.confidence * 100)}%` : ''}
                                </div>
                                {fact.source_snippet && (
                                  <blockquote style={snippetStyle}>{fact.source_snippet}</blockquote>
                                )}
                              </div>
                              <div style={{ flex: '0 0 auto', display: 'flex', gap: 6, alignItems: 'flex-start', marginLeft: 8 }}>
                                {!resolved ? (
                                  <>
                                    <input
                                      aria-label={`Correccion para ${fact.label}`}
                                      value={correction}
                                      onChange={event => setCorrectionById(previous => ({ ...previous, [fact.id]: event.target.value }))}
                                      placeholder="Corregir..."
                                      style={{ ...correctionInputStyle, width: 120 }}
                                    />
                                    <button type="button" className="btn btn-small" disabled={busy} onClick={() => handleFactAction(fact, 'correct')}>
                                      Corregir
                                    </button>
                                    <button type="button" className="btn btn-small btn-accent" disabled={busy} onClick={() => handleFactAction(fact, 'confirm')}>
                                      Confirmar
                                    </button>
                                    <button type="button" className="btn btn-small btn-ghost" disabled={busy} onClick={() => handleFactAction(fact, 'reject')} style={{ color: 'var(--red)' }}>
                                      Rechazar
                                    </button>
                                  </>
                                ) : (
                                  <span className={`pill ${status.className}`} style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>{status.label}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {hasPersisted && (
          <div className="card" style={{
            marginTop: 18,
            padding: '14px 16px',
            borderColor: factReviewBlocked || requiresPrototypeAck ? 'var(--amber)' : 'var(--line)',
            background: factReviewBlocked || requiresPrototypeAck ? 'var(--amber-soft)' : '#fff',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Icon name="shield-check" size={18} color={factReviewBlocked || requiresPrototypeAck ? 'var(--amber)' : 'var(--accent)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>La recepcion y confirmacion abren el prototipo</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.45 }}>
                  Los hechos de alto impacto y las brechas bloqueantes deben quedar resueltos antes de entrar a pantallas simuladas de analisis.
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(nav.state.mockAnalysisAcknowledged)}
                    disabled={!hasDocuments || !analysisReady}
                    onChange={event => nav.set({ mockAnalysisAcknowledged: event.target.checked })}
                  />
                  Entiendo que las pantallas posteriores siguen siendo prototipo hasta construir el motor de analisis.
                </label>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <button className="btn btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={() => nav.go(hasPersisted ? 'case' : 'login')}>
            <Icon name="arrow-l" size={14} /> Volver
          </button>
          <button
            className="btn btn-primary"
            disabled={hasPersisted ? !canContinue : false}
            onClick={continueToProcess}
            style={{ opacity: hasPersisted && !canContinue ? 0.55 : 1 }}
          >
            {hasPersisted ? 'Continuar al prototipo' : 'Crear caso primero'} <Icon name="arrow-r" size={14} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

const inputStyle = {
  minHeight: 42,
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--ink)',
  padding: '0 12px',
  fontFamily: 'Manrope',
  fontSize: 14,
  outline: 'none',
} as const;

const visuallyHiddenInputStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
} as const;

const errorBoxStyle = {
  marginTop: 14,
  padding: '10px 12px',
  borderRadius: 10,
  background: 'var(--red-soft)',
  color: 'var(--red)',
  fontSize: 13,
  fontWeight: 700,
} as const;

const summaryBoxStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  background: 'var(--paper-2)',
  border: '1px solid var(--line)',
  minWidth: 0,
} as const;

const factRowStyle = {
  padding: 13,
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const snippetStyle = {
  margin: '9px 0 0',
  padding: '9px 11px',
  borderLeft: '3px solid var(--line-2)',
  background: 'var(--paper-2)',
  color: 'var(--ink-soft)',
  fontSize: 12,
  lineHeight: 1.45,
} as const;

const correctionInputStyle = {
  minHeight: 34,
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--ink)',
  padding: '0 10px',
  fontFamily: 'Manrope',
  fontSize: 12.5,
  outline: 'none',
} as const;

const emptyStateStyle = {
  marginTop: 14,
  padding: '16px 14px',
  borderRadius: 10,
  background: 'var(--paper-2)',
  color: 'var(--ink-soft)',
  fontSize: 13,
  lineHeight: 1.45,
} as const;

const previewStyle = {
  margin: '16px 0 0',
  maxHeight: 220,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--paper-2)',
  color: 'var(--ink)',
  padding: 14,
  fontSize: 12.5,
  lineHeight: 1.55,
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
} as const;
