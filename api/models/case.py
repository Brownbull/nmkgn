from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from api.models.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    owner_ref: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    case_stage: Mapped[str] = mapped_column(String(32), nullable=False)
    document_type: Mapped[str] = mapped_column(
        String(64), nullable=False, default="consumer_credit"
    )
    analysis_plan: Mapped[str] = mapped_column(String(64), nullable=False)
    institution_name: Mapped[str] = mapped_column(String(160), nullable=False)
    requested_amount_clp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_term_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
