from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.models.reference import REFERENCE_SCHEMA_VERSION

SourceCategory = Literal["cmf", "sernac", "ley_chile", "benchmark"]


class ReferenceCreate(BaseModel):
    reference_key: str = Field(min_length=1, max_length=120)
    source_category: SourceCategory
    display_label: str = Field(min_length=1, max_length=240)
    marketplace_safe_label: str = Field(min_length=1, max_length=240)
    source_url: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=2000)
    retrieved_at: datetime | None = None
    verified_at: datetime | None = None

    @field_validator(
        "reference_key",
        "display_label",
        "marketplace_safe_label",
        "source_url",
    )
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @field_validator("description")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class ReferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reference_key: str
    source_category: SourceCategory
    display_label: str
    marketplace_safe_label: str
    source_url: str
    description: str | None
    retrieved_at: datetime
    verified_at: datetime | None
    is_active: bool
    schema_version: str
    created_at: datetime
    updated_at: datetime


class ReferenceList(BaseModel):
    items: list[ReferenceRead]
    total: int


class ReferenceSeedSummary(BaseModel):
    created: int
    skipped: int
    total: int
    schema_version: str = REFERENCE_SCHEMA_VERSION
