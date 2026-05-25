from __future__ import annotations

import base64
from dataclasses import dataclass
from pathlib import Path

import fitz
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.config import ReceptionistSettings, UploadStorageSettings
from api.models.document import Document
from api.models.extraction import ExtractedTextSegment


class MediaPackingError(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class PackedMediaPage:
    page_number: int
    content_type: str
    data_base64: str


@dataclass(frozen=True)
class PackedTextSegment:
    id: str
    page_number: int | None
    start_offset: int | None
    end_offset: int | None
    text: str
    warning_code: str | None
    warning_message: str | None


@dataclass(frozen=True)
class DocumentMediaBundle:
    media_kind: str
    media_page_count: int | None
    processed_page_count: int | None
    partial_coverage: bool
    pages: tuple[PackedMediaPage, ...]
    text_segments: tuple[PackedTextSegment, ...]
    warnings: tuple[str, ...]


def build_document_media_bundle(
    session: Session,
    document: Document,
    receptionist_settings: ReceptionistSettings,
    upload_settings: UploadStorageSettings,
) -> DocumentMediaBundle:
    path = upload_settings.root_path / document.storage_key
    if not path.exists() or not path.is_file():
        raise MediaPackingError("missing_file", "stored document file was not found")

    if document.content_type == "text/plain":
        return _pack_text_document(session, document)
    if document.content_type in {"image/jpeg", "image/png"}:
        return _pack_image_document(session, document, path, document.content_type)
    if document.content_type == "application/pdf":
        return _pack_pdf_document(
            session, document, path, receptionist_settings.max_pages
        )

    raise MediaPackingError(
        "unsupported_media", "document content type is not supported"
    )


def _pack_text_document(session: Session, document: Document) -> DocumentMediaBundle:
    segments = _load_text_segments(session, document)
    warnings = () if segments else ("no extracted text segments available",)
    return DocumentMediaBundle(
        media_kind="text",
        media_page_count=0,
        processed_page_count=0,
        partial_coverage=False,
        pages=(),
        text_segments=segments,
        warnings=warnings,
    )


def _load_text_segments(
    session: Session, document: Document
) -> tuple[PackedTextSegment, ...]:
    stmt = (
        select(ExtractedTextSegment)
        .where(ExtractedTextSegment.document_id == document.id)
        .order_by(
            ExtractedTextSegment.page_number,
            ExtractedTextSegment.start_offset,
            ExtractedTextSegment.extracted_at,
        )
    )
    segments = tuple(
        PackedTextSegment(
            id=segment.id,
            page_number=segment.page_number,
            start_offset=segment.start_offset,
            end_offset=segment.end_offset,
            text=segment.text,
            warning_code=segment.warning_code,
            warning_message=segment.warning_message,
        )
        for segment in session.scalars(stmt)
    )
    return segments


def _pack_image_document(
    session: Session, document: Document, path: Path, content_type: str
) -> DocumentMediaBundle:
    try:
        data = path.read_bytes()
    except OSError as exc:
        raise MediaPackingError(
            "media_read_failed", "could not read image file"
        ) from exc
    return DocumentMediaBundle(
        media_kind="image",
        media_page_count=1,
        processed_page_count=1,
        partial_coverage=False,
        pages=(
            PackedMediaPage(
                page_number=1,
                content_type=content_type,
                data_base64=base64.b64encode(data).decode("ascii"),
            ),
        ),
        text_segments=_load_text_segments(session, document),
        warnings=(),
    )


def _pack_pdf_document(
    session: Session, document: Document, path: Path, max_pages: int
) -> DocumentMediaBundle:
    try:
        pdf = fitz.open(path)
    except Exception as exc:
        raise MediaPackingError("malformed_document", "could not open PDF") from exc

    try:
        page_count = pdf.page_count
        processed_count = min(page_count, max_pages)
        pages: list[PackedMediaPage] = []
        for index in range(processed_count):
            page = pdf.load_page(index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            pages.append(
                PackedMediaPage(
                    page_number=index + 1,
                    content_type="image/png",
                    data_base64=base64.b64encode(pixmap.tobytes("png")).decode("ascii"),
                )
            )
    except Exception as exc:
        raise MediaPackingError(
            "media_render_failed", "could not render PDF pages"
        ) from exc
    finally:
        pdf.close()

    partial = page_count > processed_count
    warnings = (
        (f"processed {processed_count} of {page_count} pages",) if partial else ()
    )
    return DocumentMediaBundle(
        media_kind="pdf_images",
        media_page_count=page_count,
        processed_page_count=processed_count,
        partial_coverage=partial,
        pages=tuple(pages),
        text_segments=_load_text_segments(session, document),
        warnings=warnings,
    )
