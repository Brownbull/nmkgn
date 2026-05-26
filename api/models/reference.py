from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from api.models.base import Base

REFERENCE_SCHEMA_VERSION = "official_references.v1"

SOURCE_CATEGORIES = (
    "cmf",
    "sernac",
    "ley_chile",
    "benchmark",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OfficialReference(Base):
    __tablename__ = "official_references"
    __table_args__ = (
        CheckConstraint(
            "source_category in ('cmf', 'sernac', 'ley_chile', 'benchmark')",
            name="ck_official_references_source_category",
        ),
        UniqueConstraint("reference_key", name="uq_official_references_key"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    reference_key: Mapped[str] = mapped_column(
        String(120), nullable=False, index=True
    )
    source_category: Mapped[str] = mapped_column(String(32), nullable=False)
    display_label: Mapped[str] = mapped_column(String(240), nullable=False)
    marketplace_safe_label: Mapped[str] = mapped_column(
        String(240), nullable=False
    )
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    schema_version: Mapped[str] = mapped_column(
        String(80), default=REFERENCE_SCHEMA_VERSION, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
