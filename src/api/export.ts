import { endpoint, responseError } from './client';

export interface ExportEvidenceItem {
  evidence_type: string;
  fact_id: string | null;
  calculation_key: string | null;
  reference_key: string | null;
  citation_label: string | null;
  citation_url: string | null;
  excerpt: string | null;
}

export interface ExportFindingItem {
  finding_id: string;
  finding_key: string;
  title: string;
  summary: string;
  severity: string;
  claim_type: string;
  uncertainty_state: string;
  confidence: number | null;
  evidence: ExportEvidenceItem[];
}

export interface ExportRejectedItem {
  finding_id: string;
  reason: string;
}

export interface ExportSummary {
  case_id: string;
  analysis_run_id: string;
  exported_at: string;
  finding_count: number;
  findings: ExportFindingItem[];
  rejected: ExportRejectedItem[];
}

export interface DraftSection {
  heading: string;
  body: string;
}

export interface DraftResult {
  case_id: string;
  analysis_run_id: string;
  generated_at: string;
  sections: DraftSection[];
  filtered_phrases: string[];
  warnings: string[];
}

export async function exportFindings(
  caseId: string,
  findingIds: string[],
): Promise<ExportSummary> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/export`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finding_ids: findingIds }),
  });
  if (!response.ok) {
    throw await responseError(response, 'No pudimos exportar los hallazgos.');
  }
  return response.json();
}

export async function generateDraft(
  caseId: string,
  findingIds: string[],
): Promise<DraftResult> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/draft`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finding_ids: findingIds }),
  });
  if (!response.ok) {
    throw await responseError(response, 'No pudimos generar el borrador.');
  }
  return response.json();
}
