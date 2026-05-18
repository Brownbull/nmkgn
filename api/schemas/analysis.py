from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION = "consumer_credit_analysis.v1"
CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION = "consumer_credit_calculations.v1"

AnalysisRunStatus = Literal["pending", "running", "completed", "failed"]
FindingSeverity = Literal["low", "medium", "high", "critical"]
TrustedClaimType = Literal["fact", "calculation", "reference", "inference"]
EvidenceType = Literal["fact", "calculation", "reference", "inference"]
UncertaintyState = Literal["supported", "uncertain", "missing_context"]


class MoneyValue(BaseModel):
    amount: float
    currency: str = Field(min_length=3, max_length=3)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()


class AnalysisCitation(BaseModel):
    label: str = Field(min_length=1, max_length=240)
    url: str = Field(min_length=1, max_length=500)
    reference_key: str | None = Field(default=None, max_length=120)
    retrieved_at: datetime | None = None
    verified_at: datetime | None = None

    @field_validator("label", "url")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @field_validator("reference_key")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class AnalysisCalculationEvidence(BaseModel):
    calculation_key: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=160)
    formula_version: str = Field(
        default=CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION,
        min_length=1,
        max_length=80,
    )
    input_fact_ids: list[str] = Field(default_factory=list)
    inputs: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    missing_input_keys: list[str] = Field(default_factory=list)

    @field_validator("calculation_key", "label", "formula_version")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped


class AnalysisCalculationRead(AnalysisCalculationEvidence):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    created_at: datetime


class AnalysisInferenceMetadata(BaseModel):
    provider: str | None = Field(default=None, max_length=80)
    model_name: str | None = Field(default=None, max_length=120)
    prompt_version: str | None = Field(default=None, max_length=80)
    schema_version: str = Field(
        default=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        min_length=1,
        max_length=80,
    )
    confidence: float | None = Field(default=None, ge=0, le=1)

    @field_validator("provider", "model_name", "prompt_version")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class AnalysisEvidenceCreate(BaseModel):
    evidence_type: EvidenceType
    fact_id: str | None = Field(default=None, max_length=36)
    calculation_id: str | None = Field(default=None, max_length=36)
    calculation_key: str | None = Field(default=None, max_length=80)
    citation: AnalysisCitation | None = None
    excerpt: str | None = None
    inference_summary: str | None = None
    model_name: str | None = Field(default=None, max_length=120)
    schema_version: str | None = Field(default=None, max_length=80)

    @field_validator(
        "fact_id",
        "calculation_id",
        "calculation_key",
        "excerpt",
        "inference_summary",
        "model_name",
        "schema_version",
    )
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_evidence_anchor(self) -> AnalysisEvidenceCreate:
        if self.evidence_type == "fact" and self.fact_id is None:
            raise ValueError("fact evidence requires fact_id")
        if (
            self.evidence_type == "calculation"
            and self.calculation_id is None
            and self.calculation_key is None
        ):
            raise ValueError(
                "calculation evidence requires calculation_id or calculation_key"
            )
        if self.evidence_type == "reference" and self.citation is None:
            raise ValueError("reference evidence requires citation")
        if self.evidence_type == "inference" and (
            self.inference_summary is None or self.model_name is None
        ):
            raise ValueError(
                "inference evidence requires inference_summary and model_name"
            )
        return self


class AnalysisEvidenceRead(AnalysisEvidenceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    finding_id: str
    created_at: datetime


class AnalysisFindingCreate(BaseModel):
    finding_key: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1)
    severity: FindingSeverity
    claim_type: TrustedClaimType
    uncertainty_state: UncertaintyState = "supported"
    confidence: float | None = Field(default=None, ge=0, le=1)
    display_order: int = Field(default=0, ge=0)
    evidence: list[AnalysisEvidenceCreate] = Field(default_factory=list, min_length=1)

    @field_validator("finding_key", "title", "summary")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped


class AnalysisFindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    owner_ref: str
    finding_key: str
    title: str
    summary: str
    severity: FindingSeverity
    claim_type: TrustedClaimType
    uncertainty_state: UncertaintyState
    confidence: float | None
    display_order: int
    created_at: datetime
    updated_at: datetime
    evidence: list[AnalysisEvidenceRead] = Field(default_factory=list)


class UnsupportedAnalysisOutputCreate(BaseModel):
    output_key: str = Field(min_length=1, max_length=120)
    raw_output: dict[str, Any] = Field(default_factory=dict)
    reason: str = Field(min_length=1)

    @field_validator("output_key", "reason")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped


class UnsupportedAnalysisOutputRead(UnsupportedAnalysisOutputCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    created_at: datetime


class AnalysisRunCreate(BaseModel):
    case_id: str = Field(min_length=1, max_length=36)
    owner_ref: str = Field(min_length=1, max_length=64)
    schema_version: str = Field(
        default=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        min_length=1,
        max_length=80,
    )
    readiness_snapshot: dict[str, Any] = Field(default_factory=dict)
    input_fact_ids: list[str] = Field(default_factory=list)

    @field_validator("case_id", "owner_ref", "schema_version")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped


class AnalysisRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    owner_ref: str
    schema_version: str
    status: AnalysisRunStatus
    readiness_snapshot: dict[str, Any]
    input_fact_ids: list[str]
    agent_provider: str | None
    model_name: str | None
    prompt_version: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    latency_ms: int | None
    cost_usd: float | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    calculations: list[AnalysisCalculationRead] = Field(default_factory=list)
    findings: list[AnalysisFindingRead] = Field(default_factory=list)
    unsupported_outputs: list[UnsupportedAnalysisOutputRead] = Field(
        default_factory=list
    )


class ConsumerCreditAnalysis(BaseModel):
    schema_version: Literal["consumer_credit_analysis.v1"] = (
        CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
    )
    analysis_run_id: str = Field(min_length=1, max_length=36)
    case_id: str = Field(min_length=1, max_length=36)
    status: AnalysisRunStatus
    summary: str = Field(min_length=1)
    findings: list[AnalysisFindingCreate] = Field(default_factory=list)
    calculations: list[AnalysisCalculationEvidence] = Field(default_factory=list)
    unsupported_outputs: list[UnsupportedAnalysisOutputCreate] = Field(
        default_factory=list
    )
    warnings: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
    inference_metadata: AnalysisInferenceMetadata = Field(
        default_factory=AnalysisInferenceMetadata
    )

    @field_validator("summary")
    @classmethod
    def strip_summary(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("summary cannot be blank")
        return stripped
