from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

FactKey = Literal[
    "principal_amount",
    "currency",
    "contract_date",
    "term_months",
    "payment_count",
    "installment_amount",
    "interest_rate",
    "cae",
    "total_cost",
    "fee",
    "insurance",
    "linked_product",
    "clause",
]
FactValueKind = Literal[
    "money", "currency", "date", "integer", "percentage", "text", "boolean"
]
FactConfirmationStatus = Literal["pending", "confirmed", "corrected", "rejected"]
FactSourceType = Literal["uploaded_document"]
FactConfirmationAction = Literal["confirm", "correct", "reject"]


class ConsumerCreditFactCreate(BaseModel):
    case_id: str = Field(min_length=1, max_length=36)
    document_id: str = Field(min_length=1, max_length=36)
    text_segment_id: str | None = Field(default=None, max_length=36)
    fact_key: FactKey
    label: str = Field(min_length=1, max_length=160)
    value_kind: FactValueKind
    value_text: str | None = None
    value_number: float | None = None
    value_currency: str | None = Field(default=None, min_length=3, max_length=3)
    value_date: date | None = None
    unit: str | None = Field(default=None, max_length=40)
    high_impact: bool = True
    confirmation_status: FactConfirmationStatus = "pending"
    source_type: FactSourceType = "uploaded_document"
    source_page_number: int | None = Field(default=None, ge=1)
    source_start_offset: int | None = Field(default=None, ge=0)
    source_end_offset: int | None = Field(default=None, ge=0)
    source_snippet: str | None = None
    extraction_provider: str = Field(min_length=1, max_length=80)
    confidence: float | None = Field(default=None, ge=0, le=1)
    warning_code: str | None = Field(default=None, max_length=80)
    warning_message: str | None = None

    @field_validator("label", "extraction_provider")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @field_validator(
        "value_text",
        "value_currency",
        "unit",
        "source_snippet",
        "warning_code",
        "warning_message",
    )
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        return stripped

    @field_validator("value_currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.upper()

    @model_validator(mode="after")
    def validate_source_and_value(self) -> ConsumerCreditFactCreate:
        has_start = self.source_start_offset is not None
        has_end = self.source_end_offset is not None
        if has_start != has_end:
            raise ValueError(
                "source_start_offset and source_end_offset must be provided together"
            )
        if (
            self.source_start_offset is not None
            and self.source_end_offset is not None
            and self.source_end_offset < self.source_start_offset
        ):
            raise ValueError(
                "source_end_offset must be greater than or equal to source_start_offset"
            )
        if (
            self.text_segment_id is None
            and self.source_page_number is None
            and not has_start
        ):
            raise ValueError(
                "text_segment_id, source_page_number, or text span is required"
            )
        if not any(
            value is not None
            for value in (
                self.value_text,
                self.value_number,
                self.value_currency,
                self.value_date,
                self.warning_code,
            )
        ):
            raise ValueError("fact value or warning_code is required")
        return self


class ConsumerCreditFactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    document_id: str
    text_segment_id: str | None
    fact_key: FactKey
    label: str
    value_kind: FactValueKind
    value_text: str | None
    value_number: float | None
    value_currency: str | None
    value_date: date | None
    unit: str | None
    high_impact: bool
    confirmation_status: FactConfirmationStatus
    source_type: FactSourceType
    source_page_number: int | None
    source_start_offset: int | None
    source_end_offset: int | None
    source_snippet: str | None
    extraction_provider: str
    extracted_at: datetime
    confidence: float | None
    warning_code: str | None
    warning_message: str | None
    created_at: datetime
    updated_at: datetime


class FactConfirmationCreate(BaseModel):
    fact_id: str = Field(min_length=1, max_length=36)
    action: FactConfirmationAction
    corrected_value_text: str | None = None
    corrected_value_number: float | None = None
    corrected_value_currency: str | None = Field(
        default=None, min_length=3, max_length=3
    )
    corrected_value_date: date | None = None
    note: str | None = None

    @field_validator("corrected_value_text", "corrected_value_currency", "note")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        return stripped

    @field_validator("corrected_value_currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.upper()

    @model_validator(mode="after")
    def validate_action_values(self) -> FactConfirmationCreate:
        corrected_values = (
            self.corrected_value_text,
            self.corrected_value_number,
            self.corrected_value_currency,
            self.corrected_value_date,
        )
        has_correction = any(value is not None for value in corrected_values)
        if self.action == "correct" and not has_correction:
            raise ValueError("correct action requires a corrected value")
        if self.action != "correct" and has_correction:
            raise ValueError("only correct action can include corrected values")
        return self


class FactConfirmationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fact_id: str
    owner_ref: str
    action: FactConfirmationAction
    corrected_value_text: str | None
    corrected_value_number: float | None
    corrected_value_currency: str | None
    corrected_value_date: date | None
    note: str | None
    created_at: datetime
