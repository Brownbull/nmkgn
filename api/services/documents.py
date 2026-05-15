from __future__ import annotations

import hashlib
import string
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.config import UploadStorageSettings
from api.models.case import Case
from api.models.document import Document, utcnow
from api.models.extraction import ExtractedTextSegment
from api.schemas.documents import DocumentRole, DocumentType
from api.services.text_extraction import extract_document_text

CHUNK_SIZE_BYTES = 1024 * 1024


class DocumentServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class CaseNotFoundError(DocumentServiceError):
    pass


class EmptyUploadError(DocumentServiceError):
    pass


class UploadTooLargeError(DocumentServiceError):
    pass


class UnsupportedContentTypeError(DocumentServiceError):
    pass


class StorageWriteError(DocumentServiceError):
    pass


def list_documents(session: Session, case_id: str, owner_ref: str) -> list[Document]:
    ensure_case(session, case_id, owner_ref)
    stmt = (
        select(Document)
        .where(Document.case_id == case_id, Document.owner_ref == owner_ref)
        .order_by(Document.created_at.desc())
    )
    return list(session.scalars(stmt))


def get_document(
    session: Session, case_id: str, document_id: str, owner_ref: str
) -> Document | None:
    ensure_case(session, case_id, owner_ref)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.case_id == case_id,
        Document.owner_ref == owner_ref,
    )
    return session.scalar(stmt)


def list_text_segments(
    session: Session, case_id: str, document_id: str, owner_ref: str
) -> list[ExtractedTextSegment] | None:
    document = get_document(session, case_id, document_id, owner_ref)
    if document is None:
        return None
    stmt = (
        select(ExtractedTextSegment)
        .where(ExtractedTextSegment.document_id == document.id)
        .order_by(
            ExtractedTextSegment.page_number,
            ExtractedTextSegment.start_offset,
            ExtractedTextSegment.extracted_at,
        )
    )
    return list(session.scalars(stmt))


def store_document_upload(
    session: Session,
    case_id: str,
    owner_ref: str,
    role: DocumentRole,
    document_type: DocumentType,
    upload: UploadFile,
    settings: UploadStorageSettings,
) -> Document:
    case = ensure_case(session, case_id, owner_ref)
    if case.document_type != document_type:
        raise CaseNotFoundError("case not found")

    content_type = (upload.content_type or "").strip()
    if content_type not in settings.allowed_content_types:
        raise UnsupportedContentTypeError("unsupported content type")

    original_filename = _clean_filename(upload.filename)
    document_id = str(uuid4())
    storage_key = _storage_key(owner_ref, case_id, document_id, original_filename)
    destination = settings.root_path / storage_key

    try:
        byte_size, checksum = _write_upload_file(
            upload, destination, settings.max_bytes
        )
    except DocumentServiceError:
        _remove_partial_file(destination)
        raise
    except OSError as exc:
        _remove_partial_file(destination)
        raise StorageWriteError("could not store upload") from exc

    delete_after = utcnow() + timedelta(days=settings.retention_days)
    document = Document(
        id=document_id,
        case_id=case.id,
        owner_ref=owner_ref,
        role=role,
        document_type=document_type,
        original_filename=original_filename,
        content_type=content_type,
        byte_size=byte_size,
        checksum_sha256=checksum,
        storage_key=storage_key.as_posix(),
        upload_status="stored",
        extraction_status="pending",
        retention_state="active",
        delete_after=delete_after,
    )
    session.add(document)
    try:
        session.commit()
    except Exception:
        session.rollback()
        _remove_partial_file(destination)
        raise
    session.refresh(document)
    extract_document_text(session, document, settings)
    return document


def ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise CaseNotFoundError("case not found")
    return case


def _write_upload_file(
    upload: UploadFile, destination: Path, max_bytes: int
) -> tuple[int, str]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    byte_size = 0

    upload.file.seek(0)
    with destination.open("xb") as stored_file:
        while chunk := upload.file.read(CHUNK_SIZE_BYTES):
            byte_size += len(chunk)
            if byte_size > max_bytes:
                raise UploadTooLargeError("upload exceeds maximum size")
            digest.update(chunk)
            stored_file.write(chunk)

    if byte_size == 0:
        raise EmptyUploadError("upload must not be empty")
    return byte_size, digest.hexdigest()


def _clean_filename(filename: str | None) -> str:
    normalized = Path((filename or "upload").replace("\\", "/")).name.strip()
    safe = _safe_segment(normalized)
    return safe or "upload"


def _safe_segment(value: str) -> str:
    allowed = set(string.ascii_letters + string.digits + "._-")
    return "".join(char if char in allowed else "_" for char in value).strip("._")


def _storage_key(owner_ref: str, case_id: str, document_id: str, filename: str) -> Path:
    return Path(_safe_segment(owner_ref) or "owner") / case_id / document_id / filename


def _remove_partial_file(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass
