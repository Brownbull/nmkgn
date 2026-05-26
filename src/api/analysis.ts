import { endpoint, responseError } from './client';

export type AnalysisRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ClaimType = 'fact' | 'calculation' | 'reference' | 'inference';
export type EvidenceType = 'fact' | 'calculation' | 'reference' | 'inference';
export type UncertaintyState = 'supported' | 'uncertain' | 'missing_context';

export interface AnalysisCitation {
  label: string;
  url: string;
  reference_key: string | null;
  retrieved_at: string | null;
  verified_at: string | null;
}

export interface AnalysisEvidence {
  id: string;
  analysis_run_id: string;
  case_id: string;
  finding_id: string;
  evidence_type: EvidenceType;
  fact_id: string | null;
  calculation_id: string | null;
  calculation_key: string | null;
  citation: AnalysisCitation | null;
  excerpt: string | null;
  inference_summary: string | null;
  model_name: string | null;
  schema_version: string | null;
  created_at: string;
}

export interface AnalysisFinding {
  id: string;
  analysis_run_id: string;
  case_id: string;
  owner_ref: string;
  finding_key: string;
  title: string;
  summary: string;
  severity: FindingSeverity;
  claim_type: ClaimType;
  uncertainty_state: UncertaintyState;
  confidence: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  evidence: AnalysisEvidence[];
}

export interface AnalysisCalculation {
  id: string;
  analysis_run_id: string;
  case_id: string;
  calculation_key: string;
  label: string;
  formula_version: string;
  input_fact_ids: string[];
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  missing_input_keys: string[];
  created_at: string;
}

export interface UnsupportedAnalysisOutput {
  id: string;
  analysis_run_id: string;
  case_id: string;
  output_key: string;
  raw_output: Record<string, unknown>;
  reason: string;
  created_at: string;
}

export interface AnalysisRun {
  id: string;
  case_id: string;
  owner_ref: string;
  schema_version: string;
  status: AnalysisRunStatus;
  readiness_snapshot: Record<string, unknown>;
  input_fact_ids: string[];
  agent_provider: string | null;
  model_name: string | null;
  prompt_version: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  cost_usd: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  calculations: AnalysisCalculation[];
  findings: AnalysisFinding[];
  unsupported_outputs: UnsupportedAnalysisOutput[];
}

export async function listAnalysisRuns(caseId: string): Promise<AnalysisRun[]> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/analysis/runs`));
  if (!response.ok) {
    throw await responseError(response, 'No pudimos cargar los analisis del caso.');
  }
  return response.json();
}

export async function startAnalysis(caseId: string): Promise<AnalysisRun> {
  const response = await fetch(endpoint(`/api/cases/${caseId}/analysis/runs`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw await responseError(response, 'No pudimos iniciar el analisis.');
  }
  return response.json();
}

