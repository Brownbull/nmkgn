from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from api.config import get_upload_storage_settings
from api.models import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import (
    ConsumerCreditFact,
    ExtractedTextSegment,
    FactConfirmation,
)
from api.schemas.documents import DocumentCreate, ExtractedTextSegmentCreate
from api.schemas.facts import ConsumerCreditFactCreate, FactConfirmationCreate


def test_upload_storage_settings_are_env_backed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NMKGN_UPLOAD_STORAGE_DIR", "tmp/uploads")
    monkeypatch.setenv("NMKGN_UPLOAD_MAX_BYTES", "1024")
    monkeypatch.setenv("NMKGN_UPLOAD_RETENTION_DAYS", "7")
    monkeypatch.setenv(
        "NMKGN_UPLOAD_ALLOWED_CONTENT_TYPES", "application/pdf,text/plain"
    )
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


def test_consumer_credit_fact_schema_requires_value_and_source_locator() -> None:
    with pytest.raises(
        ValidationError, match="text_segment_id, source_page_number, or text span"
    ):
        ConsumerCreditFactCreate(
            case_id="case-123",
            document_id="doc-123",
            fact_key="cae",
            label="CAE",
            value_kind="percentage",
            value_number=12.5,
            extraction_provider="local-facts",
        )

    with pytest.raises(ValidationError, match="fact value or warning_code"):
        ConsumerCreditFactCreate(
            case_id="case-123",
            document_id="doc-123",
            text_segment_id="segment-123",
            fact_key="cae",
            label="CAE",
            value_kind="percentage",
            extraction_provider="local-facts",
        )


def test_fact_confirmation_schema_preserves_correction_boundary() -> None:
    confirm = FactConfirmationCreate(fact_id="fact-123", action="confirm")
    correction = FactConfirmationCreate(
        fact_id="fact-123",
        action="correct",
        corrected_value_text="68 cuotas",
        note="El contrato dice 68, no 60.",
    )

    assert confirm.corrected_value_text is None
    assert correction.corrected_value_text == "68 cuotas"

    with pytest.raises(ValidationError, match="correct action requires"):
        FactConfirmationCreate(fact_id="fact-123", action="correct")

    with pytest.raises(ValidationError, match="only correct action"):
        FactConfirmationCreate(
            fact_id="fact-123",
            action="reject",
            corrected_value_number=68,
        )


def test_document_models_represent_provenance_ready_uploads_and_facts(tmp_path) -> None:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'documents.db'}")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
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

        segment = ExtractedTextSegment(
            document_id=document.id,
            page_number=1,
            start_offset=0,
            end_offset=12,
            text="CAE 12% anual",
            extraction_provider="local-text",
            confidence=0.98,
        )
        session.add(segment)
        session.flush()

        fact = ConsumerCreditFact(
            case_id=case.id,
            document_id=document.id,
            text_segment_id=segment.id,
            fact_key="cae",
            label="CAE",
            value_kind="percentage",
            value_number=12.0,
            unit="percent_annual",
            high_impact=True,
            confirmation_status="pending",
            source_type="uploaded_document",
            source_page_number=1,
            source_start_offset=0,
            source_end_offset=12,
            source_snippet="CAE 12% anual",
            extraction_provider="local-facts",
            confidence=0.8,
        )
        session.add(fact)
        session.flush()
        session.add(
            FactConfirmation(fact_id=fact.id, owner_ref="demo-user", action="confirm")
        )
        session.commit()

        stored = session.scalar(select(Document).where(Document.case_id == case.id))

        assert stored is not None
        assert stored.role == "primary"
        assert stored.retention_state == "active"
        assert stored.delete_after == delete_after
        assert stored.text_segments[0].page_number == 1
        assert stored.text_segments[0].extraction_provider == "local-text"
        assert stored.facts[0].fact_key == "cae"
        assert stored.facts[0].source_page_number == 1
        assert stored.facts[0].confirmations[0].action == "confirm"


def _sqlite_fk_engine(db_path):
    """Create a SQLite engine with foreign key enforcement enabled."""
    from sqlalchemy import event as sa_event

    engine = create_engine(f"sqlite+pysqlite:///{db_path}")

    @sa_event.listens_for(engine, "connect")
    def _set_fk_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine


def test_consumer_credit_fact_rejects_mismatched_case_document(tmp_path) -> None:
    engine = _sqlite_fk_engine(tmp_path / "provenance.db")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case_a = Case(
            owner_ref="demo-user",
            title="Case A",
            case_stage="before_signing",
            document_type="consumer_credit",
            analysis_plan="before_signing_review",
            institution_name="Banco A",
        )
        case_b = Case(
            owner_ref="demo-user",
            title="Case B",
            case_stage="before_signing",
            document_type="consumer_credit",
            analysis_plan="before_signing_review",
            institution_name="Banco B",
        )
        session.add_all([case_a, case_b])
        session.flush()

        doc_b = Document(
            case_id=case_b.id,
            owner_ref="demo-user",
            role="primary",
            document_type="consumer_credit",
            original_filename="contrato_b.pdf",
            content_type="application/pdf",
            byte_size=1024,
            checksum_sha256="b" * 64,
            storage_key=f"demo-user/{case_b.id}/contrato_b.pdf",
            upload_status="stored",
            extraction_status="extracted",
            retention_state="active",
        )
        session.add(doc_b)
        session.flush()

        session.add(
            ConsumerCreditFact(
                case_id=case_a.id,
                document_id=doc_b.id,
                fact_key="cae",
                label="CAE",
                value_kind="percentage",
                value_number=12.0,
                high_impact=True,
                confirmation_status="pending",
                source_type="uploaded_document",
                source_page_number=1,
                extraction_provider="local-facts",
            )
        )

        with pytest.raises(IntegrityError):
            session.commit()


def test_consumer_credit_fact_model_requires_source_locator(tmp_path) -> None:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'facts.db'}")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

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
        )
        session.add(document)
        session.flush()

        session.add(
            ConsumerCreditFact(
                case_id=case.id,
                document_id=document.id,
                fact_key="payment_count",
                label="Numero de cuotas",
                value_kind="integer",
                value_number=68,
                high_impact=True,
                confirmation_status="pending",
                source_type="uploaded_document",
                extraction_provider="local-facts",
                confidence=0.6,
            )
        )

        with pytest.raises(
            IntegrityError, match="ck_consumer_credit_facts_source_locator"
        ):
            session.commit()
