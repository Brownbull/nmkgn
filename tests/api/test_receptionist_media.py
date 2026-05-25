from __future__ import annotations

import hashlib
from pathlib import Path

import fitz
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.config import ReceptionistSettings, UploadStorageSettings
from api.models import Base
from api.models.document import Document
from api.models.extraction import ExtractedTextSegment
from api.services.receptionist_media import (
    MediaPackingError,
    build_document_media_bundle,
)


@pytest.fixture()
def session(tmp_path: Path) -> Session:
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with SessionLocal() as db:
        yield db
    Base.metadata.drop_all(bind=engine)


def test_text_document_uses_extracted_text_segments(
    session: Session, tmp_path: Path
) -> None:
    upload_settings = upload_settings_for(tmp_path)
    document = add_document(session, upload_settings, content_type="text/plain")
    session.add(
        ExtractedTextSegment(
            document_id=document.id,
            page_number=None,
            start_offset=0,
            end_offset=8,
            text="CAE 12%",
            extraction_provider="local-text",
            confidence=1.0,
        )
    )
    session.commit()

    bundle = build_document_media_bundle(
        session, document, receptionist_settings(), upload_settings
    )

    assert bundle.media_kind == "text"
    assert bundle.pages == ()
    assert len(bundle.text_segments) == 1
    assert bundle.text_segments[0].text == "CAE 12%"


def test_image_document_passes_image_media(session: Session, tmp_path: Path) -> None:
    upload_settings = upload_settings_for(tmp_path)
    document = add_document(
        session,
        upload_settings,
        content_type="image/png",
        payload=b"\x89PNG\r\n\x1a\nfake",
    )
    session.commit()

    bundle = build_document_media_bundle(
        session, document, receptionist_settings(), upload_settings
    )

    assert bundle.media_kind == "image"
    assert bundle.media_page_count == 1
    assert bundle.processed_page_count == 1
    assert bundle.pages[0].content_type == "image/png"
    assert bundle.pages[0].data_base64


def test_pdf_document_renders_bounded_pages(session: Session, tmp_path: Path) -> None:
    upload_settings = upload_settings_for(tmp_path)
    pdf_bytes = multipage_pdf_bytes(page_count=3)
    document = add_document(
        session,
        upload_settings,
        content_type="application/pdf",
        payload=pdf_bytes,
    )
    session.commit()

    bundle = build_document_media_bundle(
        session,
        document,
        receptionist_settings(max_pages=2),
        upload_settings,
    )

    assert bundle.media_kind == "pdf_images"
    assert bundle.media_page_count == 3
    assert bundle.processed_page_count == 2
    assert bundle.partial_coverage is True
    assert len(bundle.pages) == 2


def test_missing_or_malformed_files_fail_with_codes(
    session: Session, tmp_path: Path
) -> None:
    upload_settings = upload_settings_for(tmp_path)
    missing = add_document(session, upload_settings, content_type="text/plain")
    (upload_settings.root_path / missing.storage_key).unlink()
    malformed = add_document(
        session,
        upload_settings,
        content_type="application/pdf",
        payload=b"%PDF-not-enough",
    )
    session.commit()

    with pytest.raises(MediaPackingError) as missing_error:
        build_document_media_bundle(
            session,
            missing,
            receptionist_settings(),
            upload_settings,
        )
    with pytest.raises(MediaPackingError) as malformed_error:
        build_document_media_bundle(
            session,
            malformed,
            receptionist_settings(),
            upload_settings,
        )

    assert missing_error.value.code == "missing_file"
    assert malformed_error.value.code == "malformed_document"


def upload_settings_for(tmp_path: Path) -> UploadStorageSettings:
    return UploadStorageSettings(
        root_path=tmp_path / "uploads",
        max_bytes=4096,
        retention_days=30,
        allowed_content_types=("application/pdf", "text/plain", "image/png"),
        production_uploads_enabled=False,
    )


def receptionist_settings(max_pages: int = 2) -> ReceptionistSettings:
    return ReceptionistSettings(
        enabled=True,
        provider="fake",
        model="fake-receptionist-v1",
        max_pages=max_pages,
        timeout_seconds=10,
    )


def add_document(
    session: Session,
    upload_settings: UploadStorageSettings,
    *,
    content_type: str,
    payload: bytes = b"CAE 12%",
) -> Document:
    document = Document(
        case_id="case-123",
        owner_ref="demo-user",
        role="primary",
        document_type="consumer_credit",
        original_filename="contrato",
        content_type=content_type,
        byte_size=len(payload),
        checksum_sha256=hashlib.sha256(payload).hexdigest(),
        storage_key=f"demo-user/case-123/{hashlib.sha1(payload).hexdigest()}/contrato",
        upload_status="stored",
        extraction_status="extracted",
        retention_state="active",
    )
    session.add(document)
    session.flush()
    path = upload_settings.root_path / document.storage_key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return document


def multipage_pdf_bytes(page_count: int) -> bytes:
    pdf = fitz.open()
    for _ in range(page_count):
        page = pdf.new_page(width=72, height=72)
        page.insert_text((8, 36), "CAE 12%")
    data = pdf.tobytes()
    pdf.close()
    return data
