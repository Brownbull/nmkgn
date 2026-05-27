from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
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
    from api.models.case import Case
    from api.models.extraction import ConsumerCreditFact


CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION = "consumer_credit_analysis.v1"
CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION = "consumer_credit_calculations.v1"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    __table_args__ = (
        CheckConstraint(
            "status in ('pending', 'running', 'completed', 'failed')",
            name="ck_analysis_runs_status",
        ),
        CheckConstraint("schema_version <> ''", name="ck_analysis_runs_schema_version"),
        CheckConstraint(
            "prompt_tokens is null or prompt_tokens >= 0",
            name="ck_analysis_runs_prompt_tokens",
        ),
        CheckConstraint(
            "completion_tokens is null or completion_tokens >= 0",
            name="ck_analysis_runs_completion_tokens",
        ),
        CheckConstraint(
            "latency_ms is null or latency_ms >= 0",
            name="ck_analysis_runs_latency_ms",
        ),
        CheckConstraint(
            "cost_usd is null or cost_usd >= 0",
            name="ck_analysis_runs_cost_usd",
        ),
        UniqueConstraint("id", "case_id", name="uq_analysis_runs_id_case_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False
    )
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    schema_version: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        default=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    readiness_snapshot: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    input_fact_ids: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    agent_provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    timeline_events: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    warnings: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    suppressed_finding_keys: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
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
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    case: Mapped["Case"] = relationship()
    findings: Mapped[list["AnalysisFinding"]] = relationship(
        back_populates="analysis_run", cascade="all, delete-orphan"
    )
    calculations: Mapped[list["AnalysisCalculation"]] = relationship(
        back_populates="analysis_run", cascade="all, delete-orphan"
    )
    unsupported_outputs: Mapped[list["UnsupportedAnalysisOutput"]] = relationship(
        back_populates="analysis_run", cascade="all, delete-orphan"
    )


class AnalysisCalculation(Base):
    __tablename__ = "analysis_calculations"
    __table_args__ = (
        CheckConstraint(
            "calculation_key <> ''",
            name="ck_analysis_calculations_key",
        ),
        CheckConstraint("label <> ''", name="ck_analysis_calculations_label"),
        CheckConstraint(
            "formula_version <> ''",
            name="ck_analysis_calculations_formula_version",
        ),
        ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_calculations_run_case",
        ),
        UniqueConstraint(
            "id",
            "analysis_run_id",
            "case_id",
            name="uq_analysis_calculations_id_run_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    calculation_key: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    formula_version: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        default=CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION,
    )
    input_fact_ids: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    inputs: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    result: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    missing_input_keys: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    analysis_run: Mapped[AnalysisRun] = relationship(back_populates="calculations")
    evidence: Mapped[list["AnalysisEvidence"]] = relationship(
        back_populates="calculation",
        foreign_keys="[AnalysisEvidence.calculation_id]",
    )


class AnalysisFinding(Base):
    __tablename__ = "analysis_findings"
    __table_args__ = (
        CheckConstraint(
            "severity in ('low', 'medium', 'high', 'critical')",
            name="ck_analysis_findings_severity",
        ),
        CheckConstraint(
            "claim_type in ('fact', 'calculation', 'reference', 'inference')",
            name="ck_analysis_findings_claim_type",
        ),
        CheckConstraint(
            "uncertainty_state in ('supported', 'uncertain', 'missing_context')",
            name="ck_analysis_findings_uncertainty_state",
        ),
        CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_analysis_findings_confidence",
        ),
        CheckConstraint("finding_key <> ''", name="ck_analysis_findings_key"),
        CheckConstraint("title <> ''", name="ck_analysis_findings_title"),
        ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_findings_run_case",
        ),
        UniqueConstraint(
            "analysis_run_id",
            "finding_key",
            name="uq_analysis_findings_run_key",
        ),
        UniqueConstraint(
            "id",
            "analysis_run_id",
            "case_id",
            name="uq_analysis_findings_id_run_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    finding_key: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False)
    claim_type: Mapped[str] = mapped_column(String(32), nullable=False)
    uncertainty_state: Mapped[str] = mapped_column(
        String(32), nullable=False, default="supported"
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    analysis_run: Mapped[AnalysisRun] = relationship(back_populates="findings")
    evidence: Mapped[list["AnalysisEvidence"]] = relationship(
        back_populates="finding",
        cascade="all, delete-orphan",
        foreign_keys="[AnalysisEvidence.finding_id]",
    )


class AnalysisEvidence(Base):
    __tablename__ = "analysis_evidence"
    __table_args__ = (
        CheckConstraint(
            "evidence_type in ('fact', 'calculation', 'reference', 'inference')",
            name="ck_analysis_evidence_type",
        ),
        CheckConstraint(
            "("
            "(evidence_type = 'fact' and fact_id is not null) or "
            "(evidence_type = 'calculation' and (calculation_id is not null or calculation_key is not null)) or "
            "(evidence_type = 'reference' and citation_url is not null and citation_label is not null) or "
            "(evidence_type = 'inference' and inference_summary is not null and model_name is not null)"
            ")",
            name="ck_analysis_evidence_locator",
        ),
        ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_evidence_run_case",
        ),
        ForeignKeyConstraint(
            ["finding_id", "analysis_run_id", "case_id"],
            [
                "analysis_findings.id",
                "analysis_findings.analysis_run_id",
                "analysis_findings.case_id",
            ],
            ondelete="CASCADE",
            name="fk_analysis_evidence_finding_run_case",
        ),
        ForeignKeyConstraint(
            ["calculation_id", "analysis_run_id", "case_id"],
            [
                "analysis_calculations.id",
                "analysis_calculations.analysis_run_id",
                "analysis_calculations.case_id",
            ],
            ondelete="CASCADE",
            name="fk_analysis_evidence_calculation_run_case",
        ),
        ForeignKeyConstraint(
            ["fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_evidence_fact_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    finding_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(32), nullable=False)
    fact_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    calculation_id: Mapped[str | None] = mapped_column(
        String(36), index=True, nullable=True
    )
    calculation_key: Mapped[str | None] = mapped_column(
        String(80), index=True, nullable=True
    )
    reference_key: Mapped[str | None] = mapped_column(
        String(120), index=True, nullable=True
    )
    citation_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    citation_label: Mapped[str | None] = mapped_column(String(240), nullable=True)
    citation_retrieved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    citation_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    inference_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    schema_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    finding: Mapped[AnalysisFinding] = relationship(
        back_populates="evidence",
        foreign_keys="[AnalysisEvidence.finding_id]",
    )
    fact: Mapped["ConsumerCreditFact | None"] = relationship(
        foreign_keys="[AnalysisEvidence.fact_id]",
    )
    calculation: Mapped[AnalysisCalculation | None] = relationship(
        back_populates="evidence",
        foreign_keys="[AnalysisEvidence.calculation_id]",
    )

    @property
    def citation(self) -> dict[str, Any] | None:
        if self.citation_url is None or self.citation_label is None:
            return None
        return {
            "label": self.citation_label,
            "url": self.citation_url,
            "reference_key": self.reference_key,
            "retrieved_at": self.citation_retrieved_at,
            "verified_at": self.citation_verified_at,
        }


class UnsupportedAnalysisOutput(Base):
    __tablename__ = "unsupported_analysis_outputs"
    __table_args__ = (
        CheckConstraint(
            "output_key <> ''",
            name="ck_unsupported_analysis_outputs_key",
        ),
        CheckConstraint(
            "reason <> ''",
            name="ck_unsupported_analysis_outputs_reason",
        ),
        ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_unsupported_analysis_outputs_run_case",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    output_key: Mapped[str] = mapped_column(String(120), nullable=False)
    raw_output: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    analysis_run: Mapped[AnalysisRun] = relationship(
        back_populates="unsupported_outputs"
    )
