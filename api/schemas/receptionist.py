from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from api.schemas.facts import FactKey, FactReadinessRead

ReceptionistRunStatus = Literal["pending", "running", "completed", "failed"]
ReceptionistMediaKind = Literal["text", "image", "pdf_images"]
ReceptionistValueKind = Literal[
    "money",
    "currency",
    "date",
    "integer",
    "percentage",
    "text",
    "boolean",
    "unsupported",
]
ReceptionistAnchorStatus = Literal["anchored", "unanchored", "partial"]
ReceptionistGapType = Literal[
    "missing_in_deterministic",
    "missing_in_receptionist",
    "value_conflict",
    "source_conflict",
    "deterministic_warning_resolved",
    "llm_unanchored_claim",
    "unsupported_field",
    "receptionist_unavailable",
    "partial_document_coverage",
]
ReceptionistGapSeverity = Literal["low", "medium", "high"]
ReceptionistGapStatus = Literal["open", "resolved"]
ReceptionistResolutionAction = Literal[
    "confirm_deterministic",
    "accept_receptionist",
    "reject_receptionist",
    "defer_unsupported",
]


class ReceptionistSourceAnchor(BaseModel):
    page_number: int | None = Field(default=None, ge=1)
    start_offset: int | None = Field(default=None, ge=0)
    end_offset: int | None = Field(default=None, ge=0)
    snippet: str | None = None
    bounding_box: dict[str, float] | None = None

    @field_validator("snippet")
    @classmethod
    def strip_snippet(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_span(self) -> ReceptionistSourceAnchor:
        has_start = self.start_offset is not None
        has_end = self.end_offset is not None
        if has_start != has_end:
            raise ValueError("start_offset and end_offset must be provided together")
        if (
            self.start_offset is not None
            and self.end_offset is not None
            and self.end_offset < self.start_offset
        ):
            raise ValueError("end_offset must be greater than or equal to start_offset")
        return self


class ReceptionistObservationCreate(BaseModel):
    fact_key: FactKey | None = None
    field_label: str = Field(min_length=1, max_length=160)
    value_kind: ReceptionistValueKind
    value_text: str | None = None
    value_number: float | None = None
    value_currency: str | None = Field(default=None, min_length=3, max_length=3)
    value_date: date | None = None
    unit: str | None = Field(default=None, max_length=40)
    source: ReceptionistSourceAnchor = Field(default_factory=ReceptionistSourceAnchor)
    anchor_status: ReceptionistAnchorStatus
    confidence: float | None = Field(default=None, ge=0, le=1)
    raw_payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("field_label")
    @classmethod
    def strip_field_label(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("field_label must not be blank")
        return stripped

    @field_validator("value_text", "value_currency", "unit")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("value_currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.upper()

    @model_validator(mode="after")
    def validate_supported_value(self) -> ReceptionistObservationCreate:
        if self.value_kind == "unsupported":
            if self.fact_key is not None:
                raise ValueError("unsupported observations must not include fact_key")
            return self

        if not any(
            value is not None
            for value in (
                self.value_text,
                self.value_number,
                self.value_currency,
                self.value_date,
            )
        ):
            raise ValueError("supported observations require a value")
        return self


class ReceptionistAgentReview(BaseModel):
    schema_version: str = Field(min_length=1, max_length=80)
    document_id: str = Field(min_length=1, max_length=36)
    observations: list[ReceptionistObservationCreate] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    partial_coverage: bool = False


class DocumentReceptionistObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    case_id: str
    document_id: str
    fact_key: FactKey | None
    field_label: str
    value_kind: ReceptionistValueKind
    value_text: str | None
    value_number: float | None
    value_currency: str | None
    value_date: date | None
    unit: str | None
    source_page_number: int | None
    source_start_offset: int | None
    source_end_offset: int | None
    source_snippet: str | None
    bounding_box: dict[str, float] | None
    anchor_status: ReceptionistAnchorStatus
    confidence: float | None
    raw_payload: dict[str, Any]
    created_at: datetime


class DocumentExtractionGapRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    document_id: str
    run_id: str
    observation_id: str | None
    fact_id: str | None
    fact_key: FactKey | None
    gap_type: ReceptionistGapType
    severity: ReceptionistGapSeverity
    blocking: bool
    status: ReceptionistGapStatus
    detail: str
    deterministic_value: dict[str, Any] | None
    receptionist_value: dict[str, Any] | None
    source_summary: str | None
    created_at: datetime
    resolved_at: datetime | None


class DocumentReceptionistRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    document_id: str
    owner_ref: str
    provider: str
    model_name: str
    prompt_version: str
    schema_version: str
    status: ReceptionistRunStatus
    media_kind: ReceptionistMediaKind
    media_page_count: int | None
    processed_page_count: int | None
    partial_coverage: bool
    prompt_tokens: int | None
    completion_tokens: int | None
    latency_ms: int | None
    cost_usd: float | None
    error_code: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DocumentReceptionistRunDetailRead(DocumentReceptionistRunRead):
    observations: list[DocumentReceptionistObservationRead]
    gaps: list[DocumentExtractionGapRead]


class GapResolutionCreate(BaseModel):
    action: ReceptionistResolutionAction
    note: str | None = None

    @field_validator("note")
    @classmethod
    def strip_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class GapResolutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    gap_id: str
    case_id: str
    owner_ref: str
    action: ReceptionistResolutionAction
    note: str | None
    created_fact_id: str | None
    corrected_fact_id: str | None
    created_at: datetime


class AnalysisReadinessRead(BaseModel):
    case_id: str
    ready_for_analysis: bool
    blockers: list[str]
    fact_readiness: FactReadinessRead
    receptionist_ready: bool
    missing_receptionist_document_ids: list[str]
    unresolved_blocking_gap_count: int
    unresolved_blocking_gap_ids: list[str]
    document_run_statuses: dict[str, ReceptionistRunStatus | Literal["missing"]]
