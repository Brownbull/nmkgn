import { type DragEvent, type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  listDocuments,
  listTextSegments,
  uploadDocument,
  type DocumentRecord,
  type DocumentRole,
  type ExtractionStatus,
  type ExtractedTextSegment,
} from '../api/documents';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const documentRecords = documents ?? EMPTY_DOCUMENTS;
  const documentsLoading = hasPersisted && documents === null && !documentsError;
  const selectedDocument = useMemo(
    () => documentRecords.find(document => document.id === selectedDocumentId) ?? documentRecords[0],
    [documentRecords, selectedDocumentId],
  );
  const primaryDocument = documentRecords.find(document => document.role === 'primary') ?? documentRecords[0];
  const hasDocuments = documentRecords.length > 0;
  const requiresPrototypeAck = hasPersisted && hasDocuments && !nav.state.mockAnalysisAcknowledged;
  const canContinue = hasPersisted && hasDocuments && !requiresPrototypeAck;
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
      setUploadStage('complete');
    } catch (err) {
      setUploadStage('idle');
      setUploadError(errorText(err, 'No pudimos guardar el documento.'));
    } finally {
      setUploading(false);
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
                  Vista corta para verificar que el lector encontro texto. La confirmacion de hechos y los hallazgos quedan fuera de esta fase.
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

        {hasPersisted && (
          <div className="card" style={{
            marginTop: 18,
            padding: '14px 16px',
            borderColor: requiresPrototypeAck ? 'var(--amber)' : 'var(--line)',
            background: requiresPrototypeAck ? 'var(--amber-soft)' : '#fff',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Icon name="shield-check" size={18} color={requiresPrototypeAck ? 'var(--amber)' : 'var(--accent)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>Los siguientes pasos siguen siendo prototipo</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.45 }}>
                  El documento ya puede guardarse y mostrar texto, pero lectura de hechos, plan y resultados todavia usan datos simulados.
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(nav.state.mockAnalysisAcknowledged)}
                    disabled={!hasDocuments}
                    onChange={event => nav.set({ mockAnalysisAcknowledged: event.target.checked })}
                  />
                  Entiendo que los hallazgos posteriores no son analisis real todavia.
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
