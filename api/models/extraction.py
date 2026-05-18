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
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models.base import Base

if TYPE_CHECKING:
    from api.models.document import Document


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExtractedTextSegment(Base):
    __tablename__ = "extracted_text_segments"
    __table_args__ = (
        CheckConstraint(
            "page_number is null or page_number >= 1",
            name="ck_extracted_text_page_positive",
        ),
        CheckConstraint(
            "start_offset is null or start_offset >= 0",
            name="ck_extracted_text_start_positive",
        ),
        CheckConstraint(
            "end_offset is null or end_offset >= 0",
            name="ck_extracted_text_end_positive",
        ),
        CheckConstraint(
            "start_offset is null or end_offset is null or end_offset >= start_offset",
            name="ck_extracted_text_span_order",
        ),
        CheckConstraint(
            "(start_offset is null and end_offset is null) or "
            "(start_offset is not null and end_offset is not null)",
            name="ck_extracted_text_span_pair",
        ),
        CheckConstraint(
            "page_number is not null or start_offset is not null",
            name="ck_extracted_text_source_locator",
        ),
        CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_extracted_text_confidence",
        ),
        UniqueConstraint("id", "document_id", name="uq_extracted_text_id_document_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    extraction_provider: Mapped[str] = mapped_column(String(80), nullable=False)
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    warning_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    document: Mapped["Document"] = relationship(back_populates="text_segments")
    facts: Mapped[list["ConsumerCreditFact"]] = relationship(
        back_populates="text_segment"
    )


class ConsumerCreditFact(Base):
    __tablename__ = "consumer_credit_facts"
    __table_args__ = (
        CheckConstraint(
            "fact_key in ("
            "'principal_amount', 'currency', 'contract_date', 'term_months', "
            "'payment_count', 'installment_amount', 'interest_rate', 'cae', "
            "'total_cost', 'fee', 'insurance', 'linked_product', 'clause'"
            ")",
            name="ck_consumer_credit_facts_key",
        ),
        CheckConstraint(
            "value_kind in ('money', 'currency', 'date', 'integer', 'percentage', 'text', 'boolean')",
            name="ck_consumer_credit_facts_value_kind",
        ),
        CheckConstraint(
            "confirmation_status in ('pending', 'confirmed', 'corrected', 'rejected')",
            name="ck_consumer_credit_facts_confirmation_status",
        ),
        CheckConstraint(
            "source_type = 'uploaded_document'",
            name="ck_consumer_credit_facts_source_type",
        ),
        CheckConstraint(
            "source_page_number is null or source_page_number >= 1",
            name="ck_consumer_credit_facts_page_positive",
        ),
        CheckConstraint(
            "source_start_offset is null or source_start_offset >= 0",
            name="ck_consumer_credit_facts_start_positive",
        ),
        CheckConstraint(
            "source_end_offset is null or source_end_offset >= 0",
            name="ck_consumer_credit_facts_end_positive",
        ),
        CheckConstraint(
            "source_start_offset is null or source_end_offset is null or source_end_offset >= source_start_offset",
            name="ck_consumer_credit_facts_span_order",
        ),
        CheckConstraint(
            "(source_start_offset is null and source_end_offset is null) or "
            "(source_start_offset is not null and source_end_offset is not null)",
            name="ck_consumer_credit_facts_span_pair",
        ),
        CheckConstraint(
            "text_segment_id is not null or source_page_number is not null or source_start_offset is not null",
            name="ck_consumer_credit_facts_source_locator",
        ),
        CheckConstraint(
            "value_text is not null or value_number is not null or value_currency is not null or "
            "value_date is not null or warning_code is not null",
            name="ck_consumer_credit_facts_value_or_warning",
        ),
        CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_consumer_credit_facts_confidence",
        ),
        UniqueConstraint("id", "case_id", name="uq_consumer_credit_facts_id_case_id"),
        ForeignKeyConstraint(
            ["document_id", "case_id"],
            ["documents.id", "documents.case_id"],
            ondelete="CASCADE",
            name="fk_consumer_credit_facts_document_case",
        ),
        ForeignKeyConstraint(
            ["text_segment_id"],
            ["extracted_text_segments.id"],
            ondelete="SET NULL",
            name="fk_consumer_credit_facts_text_segment",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    case_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    text_segment_id: Mapped[str | None] = mapped_column(
        String(36), index=True, nullable=True
    )
    fact_key: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    value_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    value_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    high_impact: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    confirmation_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending"
    )
    source_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="uploaded_document"
    )
    source_page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_start_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_end_offset: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_provider: Mapped[str] = mapped_column(String(80), nullable=False)
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    warning_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="facts")
    text_segment: Mapped[ExtractedTextSegment | None] = relationship(
        back_populates="facts"
    )
    confirmations: Mapped[list["FactConfirmation"]] = relationship(
        back_populates="fact",
        cascade="all, delete-orphan",
    )


class FactConfirmation(Base):
    __tablename__ = "fact_confirmations"
    __table_args__ = (
        CheckConstraint(
            "action in ('confirm', 'correct', 'reject')",
            name="ck_fact_confirmations_action",
        ),
        CheckConstraint(
            "(action = 'correct' and ("
            "corrected_value_text is not null or corrected_value_number is not null or "
            "corrected_value_currency is not null or corrected_value_date is not null"
            ")) or (action in ('confirm', 'reject') and "
            "corrected_value_text is null and corrected_value_number is null and "
            "corrected_value_currency is null and corrected_value_date is null)",
            name="ck_fact_confirmations_action_value",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    fact_id: Mapped[str] = mapped_column(
        ForeignKey("consumer_credit_facts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    corrected_value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_value_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    corrected_value_currency: Mapped[str | None] = mapped_column(
        String(3), nullable=True
    )
    corrected_value_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    fact: Mapped[ConsumerCreditFact] = relationship(back_populates="confirmations")
