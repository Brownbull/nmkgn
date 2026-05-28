from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

DocumentRole = Literal[
    "primary", "simulation", "offer", "payment", "email", "comparator_loan"
]
DocumentType = Literal["consumer_credit"]
UploadStatus = Literal["pending", "stored", "failed"]
ExtractionStatus = Literal["pending", "extracting", "extracted", "needs_ocr", "failed"]
RetentionState = Literal["active", "delete_requested", "deleted"]


class DocumentCreate(BaseModel):
    case_id: str = Field(min_length=1, max_length=36)
    role: DocumentRole
    document_type: DocumentType = "consumer_credit"
    original_filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=120)
    byte_size: int = Field(gt=0)
    checksum_sha256: str = Field(min_length=64, max_length=64)
    storage_key: str = Field(min_length=1)

    @field_validator("original_filename", "content_type", "storage_key")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @field_validator("checksum_sha256")
    @classmethod
    def normalize_checksum_sha256(cls, value: str) -> str:
        normalized = value.strip().lower()
        if len(normalized) != 64 or any(
            char not in "0123456789abcdef" for char in normalized
        ):
            raise ValueError(
                "checksum_sha256 must be a 64-character lowercase hexadecimal digest"
            )
        return normalized


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    owner_ref: str
    role: DocumentRole
    document_type: DocumentType
    original_filename: str
    content_type: str
    byte_size: int
    checksum_sha256: str
    upload_status: UploadStatus
    extraction_status: ExtractionStatus
    retention_state: RetentionState
    delete_after: datetime | None
    created_at: datetime
    updated_at: datetime


class ExtractedTextSegmentCreate(BaseModel):
    document_id: str = Field(min_length=1, max_length=36)
    page_number: int | None = Field(default=None, ge=1)
    start_offset: int | None = Field(default=None, ge=0)
    end_offset: int | None = Field(default=None, ge=0)
    text: str = Field(min_length=1)
    extraction_provider: str = Field(min_length=1, max_length=80)
    confidence: float | None = Field(default=None, ge=0, le=1)
    warning_code: str | None = Field(default=None, max_length=80)
    warning_message: str | None = None

    @field_validator("text", "extraction_provider")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @model_validator(mode="after")
    def validate_span_order(self) -> ExtractedTextSegmentCreate:
        has_start = self.start_offset is not None
        has_end = self.end_offset is not None
        if has_start != has_end:
            raise ValueError("start_offset and end_offset must be provided together")
        if self.page_number is None and not has_start:
            raise ValueError("page_number or text span is required")
        if self.start_offset is None or self.end_offset is None:
            return self
        if self.end_offset < self.start_offset:
            raise ValueError("end_offset must be greater than or equal to start_offset")
        return self


class ExtractedTextSegmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    page_number: int | None
    start_offset: int | None
    end_offset: int | None
    text: str
    extraction_provider: str
    extracted_at: datetime
    confidence: float | None
    warning_code: str | None
    warning_message: str | None
