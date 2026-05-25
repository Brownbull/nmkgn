from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models.base import Base

if TYPE_CHECKING:
    from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
    from api.models.receptionist import DocumentReceptionistRun


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("byte_size > 0", name="ck_documents_byte_size_positive"),
        CheckConstraint(
            "role in ('primary', 'simulation', 'offer', 'payment', 'email', 'comparator_loan')",
            name="ck_documents_role",
        ),
        CheckConstraint(
            "document_type = 'consumer_credit'", name="ck_documents_document_type"
        ),
        CheckConstraint(
            "upload_status in ('pending', 'stored', 'failed')",
            name="ck_documents_upload_status",
        ),
        CheckConstraint(
            "extraction_status in ('pending', 'extracting', 'extracted', 'needs_ocr', 'failed')",
            name="ck_documents_extraction_status",
        ),
        CheckConstraint(
            "retention_state in ('active', 'delete_requested', 'deleted')",
            name="ck_documents_retention_state",
        ),
        UniqueConstraint("id", "case_id", name="uq_documents_id_case_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False
    )
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    document_type: Mapped[str] = mapped_column(
        String(64), nullable=False, default="consumer_credit"
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    upload_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="stored"
    )
    extraction_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending"
    )
    retention_state: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active"
    )
    delete_after: Mapped[datetime | None] = mapped_column(
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

    text_segments: Mapped[list["ExtractedTextSegment"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    facts: Mapped[list["ConsumerCreditFact"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    receptionist_runs: Mapped[list["DocumentReceptionistRun"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
