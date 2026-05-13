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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:18080';

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
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
    let detail = 'No pudimos crear el caso. Revisa los campos e intenta nuevamente.';
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // Keep the generic message.
    }
    throw new Error(detail);
  }

  return response.json();
}
