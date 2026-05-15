import { endpoint, responseError } from './client';

export type CaseStage = 'before_signing' | 'after_signing';
export type AnalysisPlan = 'before_signing_review' | 'after_signing_discrepancy';

export interface CaseCreatePayload {
  title: string;
  case_stage: CaseStage;
  document_type: 'consumer_credit';
  analysis_plan?: AnalysisPlan;
  institution_name: string;
  requested_amount_clp?: number;
  expected_term_months?: number;
}

export interface CaseRecord extends CaseCreatePayload {
  id: string;
  owner_ref: string;
  analysis_plan: AnalysisPlan;
  created_at: string;
  updated_at: string;
}

export function defaultAnalysisPlan(caseStage: CaseStage): AnalysisPlan {
  return caseStage === 'before_signing' ? 'before_signing_review' : 'after_signing_discrepancy';
}

export async function createCase(payload: CaseCreatePayload): Promise<CaseRecord> {
  const response = await fetch(endpoint('/api/cases'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await responseError(response, 'No pudimos crear el caso. Revisa los campos e intenta nuevamente.');
  }

  return response.json();
}
