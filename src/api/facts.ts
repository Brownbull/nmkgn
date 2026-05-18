import { endpoint, responseError } from './client';

export type FactKey =
  | 'principal_amount'
  | 'currency'
  | 'contract_date'
  | 'term_months'
  | 'payment_count'
  | 'installment_amount'
  | 'interest_rate'
  | 'cae'
  | 'total_cost'
  | 'fee'
  | 'insurance'
  | 'linked_product'
  | 'clause';

export type FactValueKind = 'money' | 'currency' | 'date' | 'integer' | 'percentage' | 'text' | 'boolean';
export type FactConfirmationStatus = 'pending' | 'confirmed' | 'corrected' | 'rejected';
export type FactConfirmationAction = 'confirm' | 'correct' | 'reject';

export interface ConsumerCreditFact {
  id: string;
  case_id: string;
  document_id: string;
  text_segment_id: string | null;
  fact_key: FactKey;
  label: string;
  value_kind: FactValueKind;
  value_text: string | null;
  value_number: number | null;
  value_currency: string | null;
  value_date: string | null;
  unit: string | null;
  high_impact: boolean;
  confirmation_status: FactConfirmationStatus;
  source_type: 'uploaded_document';
  source_page_number: number | null;
  source_start_offset: number | null;
  source_end_offset: number | null;
  source_snippet: string | null;
  extraction_provider: string;
  extracted_at: string;
  confidence: number | null;
  warning_code: string | null;
  warning_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactReadiness {
  case_id: string;
  ready_for_analysis: boolean;
  blockers: string[];
  required_fact_keys: FactKey[];
  missing_required_fact_keys: FactKey[];
  total_fact_count: number;
  high_impact_fact_count: number;
  unresolved_high_impact_count: number;
  unresolved_fact_ids: string[];
  status_counts: Record<FactConfirmationStatus, number>;
}

export interface FactConfirmationPayload {
  fact_id: string;
  action: FactConfirmationAction;
  corrected_value_text?: string | null;
  corrected_value_number?: number | null;
  corrected_value_currency?: string | null;
  corrected_value_date?: string | null;
  note?: string | null;
}

export async function listFacts(caseId: string): Promise<ConsumerCreditFact[]> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/facts`));
  if (!response.ok) {
    throw await responseError(response, 'No pudimos cargar los hechos del caso.');
  }
  return response.json();
}

export async function getFactReadiness(caseId: string): Promise<FactReadiness> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/facts/readiness`));
  if (!response.ok) {
    throw await responseError(response, 'No pudimos cargar el estado de confirmacion.');
  }
  return response.json();
}

export async function recordFactConfirmation({
  caseId,
  factId,
  payload,
}: {
  caseId: string;
  factId: string;
  payload: FactConfirmationPayload;
}): Promise<void> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/facts/${factId}/confirmations`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await responseError(response, 'No pudimos registrar la decision del hecho.');
  }
}
