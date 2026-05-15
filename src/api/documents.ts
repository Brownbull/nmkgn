import { endpoint, responseError } from './client';

export type DocumentRole = 'primary' | 'simulation' | 'offer' | 'payment' | 'email' | 'comparator_loan';
export type DocumentType = 'consumer_credit';
export type UploadStatus = 'pending' | 'stored' | 'failed';
export type ExtractionStatus = 'pending' | 'extracting' | 'extracted' | 'needs_ocr' | 'failed';
export type RetentionState = 'active' | 'delete_requested' | 'deleted';

export interface DocumentRecord {
  id: string;
  case_id: string;
  owner_ref: string;
  role: DocumentRole;
  document_type: DocumentType;
  original_filename: string;
  content_type: string;
  byte_size: number;
  checksum_sha256: string;
  upload_status: UploadStatus;
  extraction_status: ExtractionStatus;
  retention_state: RetentionState;
  delete_after: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTextSegment {
  id: string;
  document_id: string;
  page_number: number | null;
  start_offset: number | null;
  end_offset: number | null;
  text: string;
  extraction_provider: string;
  extracted_at: string;
  confidence: number | null;
  warning_code: string | null;
  warning_message: string | null;
}

export interface UploadDocumentPayload {
  caseId: string;
  file: File;
  role: DocumentRole;
  documentType?: DocumentType;
}

export async function listDocuments(caseId: string): Promise<DocumentRecord[]> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/documents`));
  if (!response.ok) {
    throw await responseError(response, 'No pudimos cargar los documentos del caso.');
  }
  return response.json();
}

export async function uploadDocument({
  caseId,
  file,
  role,
  documentType = 'consumer_credit',
}: UploadDocumentPayload): Promise<DocumentRecord> {
  const body = new FormData();
  body.append('file', file);
  body.append('role', role);
  body.append('document_type', documentType);

  const response = await fetch(endpoint(`/api/cases/${caseId}/documents`), {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw await responseError(response, 'No pudimos guardar el documento.');
  }

  return response.json();
}

export async function listTextSegments(caseId: string, documentId: string): Promise<ExtractedTextSegment[]> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/documents/${documentId}/text-segments`));
  if (!response.ok) {
    throw await responseError(response, 'No pudimos cargar el texto extraido.');
  }
  return response.json();
}
