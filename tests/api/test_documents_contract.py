from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from api.config import get_upload_storage_settings
from api.models import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ExtractedTextSegment
from api.schemas.documents import DocumentCreate, ExtractedTextSegmentCreate


def test_upload_storage_settings_are_env_backed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NMKGN_UPLOAD_STORAGE_DIR", "tmp/uploads")
    monkeypatch.setenv("NMKGN_UPLOAD_MAX_BYTES", "1024")
    monkeypatch.setenv("NMKGN_UPLOAD_RETENTION_DAYS", "7")
    monkeypatch.setenv("NMKGN_UPLOAD_ALLOWED_CONTENT_TYPES", "application/pdf,text/plain")
    monkeypatch.setenv("NMKGN_ENABLE_PRODUCTION_UPLOADS", "true")

    settings = get_upload_storage_settings()

    assert str(settings.root_path) == "tmp/uploads"
    assert settings.max_bytes == 1024
    assert settings.retention_days == 7
    assert settings.allowed_content_types == ("application/pdf", "text/plain")
    assert settings.production_uploads_enabled is True


@pytest.mark.parametrize(
    ("env_name", "env_value", "message"),
    [
        ("NMKGN_UPLOAD_MAX_BYTES", "0", "greater than 0"),
        ("NMKGN_UPLOAD_RETENTION_DAYS", "-1", "greater than 0"),
        ("NMKGN_UPLOAD_ALLOWED_CONTENT_TYPES", " , ", "at least one content type"),
        ("NMKGN_UPLOAD_STORAGE_DIR", " ", "must not be blank"),
    ],
)
def test_upload_storage_settings_reject_invalid_bounds(
    monkeypatch: pytest.MonkeyPatch,
    env_name: str,
    env_value: str,
    message: str,
) -> None:
    monkeypatch.setenv(env_name, env_value)

    with pytest.raises(ValueError, match=message):
        get_upload_storage_settings()


def test_document_schema_accepts_primary_and_comparison_roles() -> None:
    checksum = "a" * 64

    primary = DocumentCreate(
        case_id="case-123",
        role="primary",
        original_filename="contrato.pdf",
        content_type="application/pdf",
        byte_size=128,
        checksum_sha256=checksum,
        storage_key="demo-user/case-123/doc-1.pdf",
    )
    comparison = DocumentCreate(
        case_id="case-123",
        role="offer",
        original_filename="oferta.txt",
        content_type="text/plain",
        byte_size=64,
        checksum_sha256=checksum,
        storage_key="demo-user/case-123/doc-2.txt",
    )

    assert primary.document_type == "consumer_credit"
    assert comparison.role == "offer"


def test_document_schema_requires_sha256_hex_digest() -> None:
    with pytest.raises(ValidationError, match="checksum_sha256"):
        DocumentCreate(
            case_id="case-123",
            role="primary",
            original_filename="contrato.pdf",
            content_type="application/pdf",
            byte_size=128,
            checksum_sha256="z" * 64,
            storage_key="demo-user/case-123/doc-1.pdf",
        )


def test_extracted_text_schema_requires_ordered_spans() -> None:
    with pytest.raises(ValidationError, match="end_offset"):
        ExtractedTextSegmentCreate(
            document_id="doc-123",
            text="CAE 12%",
            extraction_provider="local-text",
            start_offset=8,
            end_offset=3,
        )


def test_extracted_text_schema_requires_source_locator() -> None:
    with pytest.raises(ValidationError, match="page_number or text span"):
        ExtractedTextSegmentCreate(
            document_id="doc-123",
            text="CAE 12%",
            extraction_provider="local-text",
        )

    with pytest.raises(ValidationError, match="provided together"):
        ExtractedTextSegmentCreate(
            document_id="doc-123",
            text="CAE 12%",
            extraction_provider="local-text",
            start_offset=0,
        )


def test_document_models_represent_provenance_ready_uploads(tmp_path) -> None:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'documents.db'}")
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    delete_after = datetime.now(timezone.utc) + timedelta(days=30)

    with TestingSessionLocal() as session:
        case = Case(
            owner_ref="demo-user",
            title="Credito casa",
            case_stage="before_signing",
            document_type="consumer_credit",
            analysis_plan="before_signing_review",
            institution_name="Banco Demo",
        )
        session.add(case)
        session.flush()

        document = Document(
            case_id=case.id,
            owner_ref="demo-user",
            role="primary",
            document_type="consumer_credit",
            original_filename="contrato.pdf",
            content_type="application/pdf",
            byte_size=1024,
            checksum_sha256="b" * 64,
            storage_key=f"demo-user/{case.id}/contrato.pdf",
            upload_status="stored",
            extraction_status="extracted",
            retention_state="active",
            delete_after=delete_after,
        )
        session.add(document)
        session.flush()

        session.add(
            ExtractedTextSegment(
                document_id=document.id,
                page_number=1,
                start_offset=0,
                end_offset=12,
                text="CAE 12% anual",
                extraction_provider="local-text",
                confidence=0.98,
            )
        )
        session.commit()

        stored = session.scalar(select(Document).where(Document.case_id == case.id))

        assert stored is not None
        assert stored.role == "primary"
        assert stored.retention_state == "active"
        assert stored.delete_after == delete_after
        assert stored.text_segments[0].page_number == 1
        assert stored.text_segments[0].extraction_provider == "local-text"
