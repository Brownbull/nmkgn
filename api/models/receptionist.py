from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKeyConstraint,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models.base import Base

if TYPE_CHECKING:
    from api.models.document import Document
    from api.models.extraction import ConsumerCreditFact


RECEPTIONIST_SCHEMA_VERSION = "document_receptionist.v1"
RECEPTIONIST_PROMOTION_PROVIDER = "receptionist-agent-v1"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DocumentReceptionistRun(Base):
    __tablename__ = "document_receptionist_runs"
    __table_args__ = (
        CheckConstraint(
            "status in ('pending', 'running', 'completed', 'failed')",
            name="ck_document_receptionist_runs_status",
        ),
        CheckConstraint(
            "media_kind in ('text', 'image', 'pdf_images')",
            name="ck_document_receptionist_runs_media_kind",
        ),
        CheckConstraint(
            "media_page_count is null or media_page_count >= 0",
            name="ck_document_receptionist_runs_media_page_count",
        ),
        CheckConstraint(
            "processed_page_count is null or processed_page_count >= 0",
            name="ck_document_receptionist_runs_processed_page_count",
        ),
        CheckConstraint(
            "processed_page_count is null or media_page_count is null or "
            "processed_page_count <= media_page_count",
            name="ck_document_receptionist_runs_page_order",
        ),
        CheckConstraint(
            "prompt_tokens is null or prompt_tokens >= 0",
            name="ck_document_receptionist_runs_prompt_tokens",
        ),
        CheckConstraint(
            "completion_tokens is null or completion_tokens >= 0",
            name="ck_document_receptionist_runs_completion_tokens",
        ),
        CheckConstraint(
            "latency_ms is null or latency_ms >= 0",
            name="ck_document_receptionist_runs_latency_ms",
        ),
        CheckConstraint(
            "cost_usd is null or cost_usd >= 0",
            name="ck_document_receptionist_runs_cost_usd",
        ),
        UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_receptionist_runs_id_case",
        ),
        UniqueConstraint(
            "id",
            "document_id",
            "case_id",
            name="uq_document_receptionist_runs_id_document_case",
        ),
        ForeignKeyConstraint(
            ["document_id", "case_id"],
            ["documents.id", "documents.case_id"],
            ondelete="CASCADE",
            name="fk_document_receptionist_runs_document_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(80), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(80), nullable=False)
    schema_version: Mapped[str] = mapped_column(
        String(80), nullable=False, default=RECEPTIONIST_SCHEMA_VERSION
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    media_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    media_page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processed_page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    partial_coverage: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="receptionist_runs")
    observations: Mapped[list["DocumentReceptionistObservation"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )
    gaps: Mapped[list["DocumentExtractionGap"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )


class DocumentReceptionistObservation(Base):
    __tablename__ = "document_receptionist_observations"
    __table_args__ = (
        CheckConstraint(
            "value_kind in ('money', 'currency', 'date', 'integer', 'percentage', 'text', 'boolean', 'unsupported')",
            name="ck_document_receptionist_observations_value_kind",
        ),
        CheckConstraint(
            "anchor_status in ('anchored', 'unanchored', 'partial')",
            name="ck_document_receptionist_observations_anchor_status",
        ),
        CheckConstraint(
            "source_page_number is null or source_page_number >= 1",
            name="ck_document_receptionist_observations_page_positive",
        ),
        CheckConstraint(
            "source_start_offset is null or source_start_offset >= 0",
            name="ck_document_receptionist_observations_start_positive",
        ),
        CheckConstraint(
            "source_end_offset is null or source_end_offset >= 0",
            name="ck_document_receptionist_observations_end_positive",
        ),
        CheckConstraint(
            "source_start_offset is null or source_end_offset is null or "
            "source_end_offset >= source_start_offset",
            name="ck_document_receptionist_observations_span_order",
        ),
        CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_document_receptionist_observations_confidence",
        ),
        UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_receptionist_observations_id_case",
        ),
        UniqueConstraint(
            "id",
            "run_id",
            "case_id",
            name="uq_document_receptionist_observations_id_run_case",
        ),
        ForeignKeyConstraint(
            ["run_id", "document_id", "case_id"],
            [
                "document_receptionist_runs.id",
                "document_receptionist_runs.document_id",
                "document_receptionist_runs.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_receptionist_observations_run_document_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    fact_key: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    field_label: Mapped[str] = mapped_column(String(160), nullable=False)
    value_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    value_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    source_page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_start_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_end_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    bounding_box: Mapped[dict[str, float] | None] = mapped_column(JSON, nullable=True)
    anchor_status: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_payload: Mapped[dict[str, object]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    run: Mapped[DocumentReceptionistRun] = relationship(back_populates="observations")
    gaps: Mapped[list["DocumentExtractionGap"]] = relationship(
        back_populates="observation",
        overlaps="gaps,run",
    )


class DocumentExtractionGap(Base):
    __tablename__ = "document_extraction_gaps"
    __table_args__ = (
        CheckConstraint(
            "gap_type in ("
            "'missing_in_deterministic', 'missing_in_receptionist', 'value_conflict', "
            "'source_conflict', 'deterministic_warning_resolved', 'llm_unanchored_claim', "
            "'unsupported_field', 'receptionist_unavailable', 'partial_document_coverage'"
            ")",
            name="ck_document_extraction_gaps_type",
        ),
        CheckConstraint(
            "severity in ('low', 'medium', 'high')",
            name="ck_document_extraction_gaps_severity",
        ),
        CheckConstraint(
            "status in ('open', 'resolved')",
            name="ck_document_extraction_gaps_status",
        ),
        UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_extraction_gaps_id_case",
        ),
        ForeignKeyConstraint(
            ["run_id", "document_id", "case_id"],
            [
                "document_receptionist_runs.id",
                "document_receptionist_runs.document_id",
                "document_receptionist_runs.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_extraction_gaps_run_document_case",
        ),
        ForeignKeyConstraint(
            ["observation_id", "run_id", "case_id"],
            [
                "document_receptionist_observations.id",
                "document_receptionist_observations.run_id",
                "document_receptionist_observations.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_extraction_gaps_observation_run_case",
        ),
        ForeignKeyConstraint(
            ["fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gaps_fact_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    observation_id: Mapped[str | None] = mapped_column(
        String(36), index=True, nullable=True
    )
    fact_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    fact_key: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    gap_type: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    blocking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    deterministic_value: Mapped[dict[str, object] | None] = mapped_column(
        JSON, nullable=True
    )
    receptionist_value: Mapped[dict[str, object] | None] = mapped_column(
        JSON, nullable=True
    )
    source_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    run: Mapped[DocumentReceptionistRun] = relationship(
        back_populates="gaps",
        overlaps="gaps,observation",
    )
    observation: Mapped[DocumentReceptionistObservation | None] = relationship(
        back_populates="gaps",
        overlaps="gaps,run",
    )
    fact: Mapped["ConsumerCreditFact | None"] = relationship(
        overlaps="gaps,observation,run"
    )
    resolutions: Mapped[list["DocumentExtractionGapResolution"]] = relationship(
        back_populates="gap",
        cascade="all, delete-orphan",
    )


class DocumentExtractionGapResolution(Base):
    __tablename__ = "document_extraction_gap_resolutions"
    __table_args__ = (
        CheckConstraint(
            "action in ('confirm_deterministic', 'accept_receptionist', 'reject_receptionist', 'defer_unsupported')",
            name="ck_document_extraction_gap_resolutions_action",
        ),
        ForeignKeyConstraint(
            ["gap_id", "case_id"],
            ["document_extraction_gaps.id", "document_extraction_gaps.case_id"],
            ondelete="CASCADE",
            name="fk_document_extraction_gap_resolutions_gap_case",
        ),
        ForeignKeyConstraint(
            ["created_fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gap_resolutions_created_fact_case",
        ),
        ForeignKeyConstraint(
            ["corrected_fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gap_resolutions_corrected_fact_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    gap_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_fact_id: Mapped[str | None] = mapped_column(
        String(36), index=True, nullable=True
    )
    corrected_fact_id: Mapped[str | None] = mapped_column(
        String(36), index=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    gap: Mapped[DocumentExtractionGap] = relationship(back_populates="resolutions")
