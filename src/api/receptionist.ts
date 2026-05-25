import type { FactKey, FactReadiness } from './facts';
import { endpoint, responseError } from './client';

export type ReceptionistRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ReceptionistGapStatus = 'open' | 'resolved';
export type ReceptionistGapType =
  | 'missing_in_deterministic'
  | 'missing_in_receptionist'
  | 'value_conflict'
  | 'source_conflict'
  | 'deterministic_warning_resolved'
  | 'llm_unanchored_claim'
  | 'unsupported_field'
  | 'receptionist_unavailable'
  | 'partial_document_coverage';
export type ReceptionistResolutionAction =
  | 'confirm_deterministic'
  | 'accept_receptionist'
  | 'reject_receptionist'
  | 'defer_unsupported';

export interface DocumentReceptionistRun {
  id: string;
  case_id: string;
  document_id: string;
  status: ReceptionistRunStatus;
  provider: string;
  model_name: string;
  prompt_version: string;
  schema_version: string;
  media_kind: 'text' | 'image' | 'pdf_images';
  media_page_count: number | null;
  processed_page_count: number | null;
  partial_coverage: boolean;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentExtractionGap {
  id: string;
  case_id: string;
  document_id: string;
  run_id: string;
  observation_id: string | null;
  fact_id: string | null;
  fact_key: FactKey | null;
  gap_type: ReceptionistGapType;
  severity: 'low' | 'medium' | 'high';
  blocking: boolean;
  status: ReceptionistGapStatus;
  detail: string;
  deterministic_value: Record<string, unknown> | null;
  receptionist_value: Record<string, unknown> | null;
  source_summary: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface GapResolution {
  id: string;
  gap_id: string;
  case_id: string;
  owner_ref: string;
  action: ReceptionistResolutionAction;
  note: string | null;
  created_fact_id: string | null;
  corrected_fact_id: string | null;
  created_at: string;
}

export interface AnalysisReadiness {
  case_id: string;
  ready_for_analysis: boolean;
  blockers: string[];
  fact_readiness: FactReadiness;
  receptionist_ready: boolean;
  missing_receptionist_document_ids: string[];
  unresolved_blocking_gap_count: number;
  unresolved_blocking_gap_ids: string[];
  document_run_statuses: Record<string, ReceptionistRunStatus | 'missing'>;
}

export async function startReceptionistRun(
  caseId: string,
  documentId: string,
): Promise<DocumentReceptionistRun> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/documents/${documentId}/receptionist-runs`), {
    method: 'POST',
  });
  if (!response.ok) {
    throw await responseError(response, 'Could not start receptionist review.');
  }
  return response.json() as Promise<DocumentReceptionistRun>;
}

export async function listReceptionistGaps(caseId: string): Promise<DocumentExtractionGap[]> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/receptionist/gaps`));
  if (!response.ok) {
    throw await responseError(response, 'Could not load receptionist gaps.');
  }
  return response.json() as Promise<DocumentExtractionGap[]>;
}

export async function resolveReceptionistGap(
  caseId: string,
  gapId: string,
  action: ReceptionistResolutionAction,
): Promise<GapResolution> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/receptionist/gaps/${gapId}/resolution`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    throw await responseError(response, 'Could not resolve receptionist gap.');
  }
  return response.json() as Promise<GapResolution>;
}

export async function getAnalysisReadiness(caseId: string): Promise<AnalysisReadiness> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/analysis-readiness`));
  if (!response.ok) {
    throw await responseError(response, 'Could not load analysis readiness.');
  }
  return response.json() as Promise<AnalysisReadiness>;
}
