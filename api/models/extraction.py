from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.models.base import Base

if TYPE_CHECKING:
    from api.models.document import Document


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExtractedTextSegment(Base):
    __tablename__ = "extracted_text_segments"
    __table_args__ = (
        CheckConstraint("page_number is null or page_number >= 1", name="ck_extracted_text_page_positive"),
        CheckConstraint("start_offset is null or start_offset >= 0", name="ck_extracted_text_start_positive"),
        CheckConstraint("end_offset is null or end_offset >= 0", name="ck_extracted_text_end_positive"),
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
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
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
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    warning_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    document: Mapped["Document"] = relationship(back_populates="text_segments")
