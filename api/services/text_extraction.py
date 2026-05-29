from __future__ import annotations

from dataclasses import dataclass, replace
from pathlib import Path

from pypdf import PdfReader
from sqlalchemy import delete
from sqlalchemy.orm import Session

from api.config import UploadStorageSettings
from api.models.document import Document
from api.models.extraction import ExtractedTextSegment
from api.schemas.documents import ExtractionStatus

TEXT_SEGMENT_CHARS = 8_000
OCR_CONTENT_TYPES = {"image/jpeg", "image/png"}


@dataclass(frozen=True)
class SegmentData:
    text: str
    extraction_provider: str
    page_number: int | None = None
    start_offset: int | None = None
    end_offset: int | None = None
    confidence: float | None = None
    warning_code: str | None = None
    warning_message: str | None = None


@dataclass(frozen=True)
class ExtractionOutcome:
    status: ExtractionStatus
    segments: tuple[SegmentData, ...] = ()


def extract_document_text(
    session: Session, document: Document, settings: UploadStorageSettings
) -> list[ExtractedTextSegment]:
    from api.services.fact_extraction import (
        clear_pending_facts,
        extract_consumer_credit_facts,
    )

    document.extraction_status = "extracting"
    session.flush()
    clear_pending_facts(session, document.id)
    _clear_existing_segments(session, document.id)

    path = settings.root_path / document.storage_key
    outcome = _extract_from_path(path, document.content_type)

    segments = [
        ExtractedTextSegment(
            document_id=document.id,
            page_number=segment.page_number,
            start_offset=segment.start_offset,
            end_offset=segment.end_offset,
            text=segment.text,
            extraction_provider=segment.extraction_provider,
            confidence=segment.confidence,
            warning_code=segment.warning_code,
            warning_message=segment.warning_message,
        )
        for segment in outcome.segments
    ]
    session.add_all(segments)
    session.flush()
    if outcome.status == "extracted":
        try:
            with session.begin_nested():
                extract_consumer_credit_facts(session, document, clear_existing=False)
        except Exception:
            pass
    document.extraction_status = outcome.status
    session.commit()
    session.refresh(document)
    return segments


def _extract_from_path(path: Path, content_type: str) -> ExtractionOutcome:
    if content_type == "text/plain":
        return _extract_plain_text(path)
    if content_type == "application/pdf":
        return _extract_pdf_text(path)
    if content_type in OCR_CONTENT_TYPES:
        return ExtractionOutcome(status="needs_ocr")
    return ExtractionOutcome(status="failed")


def _extract_plain_text(path: Path) -> ExtractionOutcome:
    try:
        raw = path.read_bytes()
    except OSError:
        return ExtractionOutcome(status="failed")

    warning_code = None
    warning_message = None
    try:
        decoded = raw.decode("utf-8")
    except UnicodeDecodeError:
        decoded = raw.decode("utf-8", errors="replace")
        warning_code = "decode_replacement"
        warning_message = "Plain text upload contained bytes outside UTF-8."

    normalized = decoded.replace("\x00", "")
    segments = tuple(
        SegmentData(
            start_offset=start,
            end_offset=end,
            text=normalized[start:end],
            extraction_provider="local-text",
            confidence=1.0 if warning_code is None else None,
            warning_code=warning_code,
            warning_message=warning_message,
        )
        for start, end in _text_chunks(normalized)
    )
    if not segments:
        return ExtractionOutcome(status="failed")
    return ExtractionOutcome(status="extracted", segments=segments)


def _extract_pdf_text(path: Path) -> ExtractionOutcome:
    try:
        reader = PdfReader(path)
        if reader.is_encrypted:
            return ExtractionOutcome(status="failed")
        if not reader.pages:
            return ExtractionOutcome(status="failed")
    except Exception:
        return ExtractionOutcome(status="failed")

    segments: list[SegmentData] = []
    blank_pages = 0
    for page_number, page in enumerate(reader.pages, start=1):
        try:
            text = (page.extract_text() or "").replace("\x00", "").strip()
        except Exception:
            text = ""
        if not text:
            blank_pages += 1
            continue
        segments.append(
            SegmentData(
                page_number=page_number,
                text=text,
                extraction_provider="pypdf",
            )
        )

    if not segments:
        return ExtractionOutcome(status="needs_ocr")
    if blank_pages:
        segments = [
            replace(
                segment,
                warning_code="partial_pdf_text",
                warning_message="One or more PDF pages did not contain extractable text.",
            )
            for segment in segments
        ]
    return ExtractionOutcome(status="extracted", segments=tuple(segments))


def _text_chunks(text: str) -> list[tuple[int, int]]:
    stripped_start = 0
    stripped_end = len(text)
    while stripped_start < stripped_end and text[stripped_start].isspace():
        stripped_start += 1
    while stripped_end > stripped_start and text[stripped_end - 1].isspace():
        stripped_end -= 1

    chunks: list[tuple[int, int]] = []
    for raw_start in range(stripped_start, stripped_end, TEXT_SEGMENT_CHARS):
        raw_end = min(raw_start + TEXT_SEGMENT_CHARS, stripped_end)
        start, end = _trimmed_bounds(text, raw_start, raw_end)
        if start < end:
            chunks.append((start, end))
    return chunks


def _trimmed_bounds(text: str, start: int, end: int) -> tuple[int, int]:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    return start, end


def _clear_existing_segments(session: Session, document_id: str) -> None:
    session.execute(
        delete(ExtractedTextSegment).where(
            ExtractedTextSegment.document_id == document_id
        )
    )
