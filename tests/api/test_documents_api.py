from __future__ import annotations

import hashlib
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.config import UploadStorageSettings, get_upload_storage_settings
from api.main import app
from api.models import Base
from api.models.case import Case
from api.models.document import Document
from api.services.database import get_session


@pytest.fixture()
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)
    upload_root = tmp_path / "uploads"

    def override_session() -> Generator[Session, None, None]:
        with TestingSessionLocal() as session:
            yield session

    def override_upload_settings() -> UploadStorageSettings:
        return UploadStorageSettings(
            root_path=upload_root,
            max_bytes=12,
            retention_days=30,
            allowed_content_types=("application/pdf", "text/plain"),
            production_uploads_enabled=False,
        )

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_upload_storage_settings] = override_upload_settings
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def create_case(client: TestClient) -> str:
    response = client.post(
        "/api/cases",
        json={
            "title": "Credito casa",
            "case_stage": "before_signing",
            "institution_name": "Banco Demo",
            "requested_amount_clp": 25_000_000,
            "expected_term_months": 60,
        },
    )
    assert response.status_code == 201
    return str(response.json()["id"])


def test_upload_document_persists_metadata_and_file_bytes(
    client: TestClient, tmp_path: Path
) -> None:
    case_id = create_case(client)
    payload = b"credito pdf"

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary", "document_type": "consumer_credit"},
        files={"file": ("contrato final.pdf", payload, "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["case_id"] == case_id
    assert body["owner_ref"] == "demo-user"
    assert body["role"] == "primary"
    assert body["original_filename"] == "contrato_final.pdf"
    assert body["content_type"] == "application/pdf"
    assert body["byte_size"] == len(payload)
    assert body["checksum_sha256"] == hashlib.sha256(payload).hexdigest()
    assert body["upload_status"] == "stored"
    assert body["extraction_status"] == "pending"

    with next(app.dependency_overrides[get_session]()) as session:
        document = session.get(Document, body["id"])
        assert document is not None
        assert (tmp_path / "uploads" / document.storage_key).read_bytes() == payload


def test_list_and_read_documents_are_scoped_to_stub_owner(client: TestClient) -> None:
    case_id = create_case(client)
    upload_response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "offer"},
        files={"file": ("oferta.txt", b"oferta", "text/plain")},
    )
    assert upload_response.status_code == 201
    document_id = upload_response.json()["id"]

    with next(app.dependency_overrides[get_session]()) as session:
        session.add(
            Document(
                case_id=case_id,
                owner_ref="other-user",
                role="payment",
                document_type="consumer_credit",
                original_filename="hidden.txt",
                content_type="text/plain",
                byte_size=6,
                checksum_sha256=hashlib.sha256(b"hidden").hexdigest(),
                storage_key="other-user/hidden.txt",
                upload_status="stored",
                extraction_status="pending",
                retention_state="active",
            )
        )
        session.commit()

    list_response = client.get(f"/api/cases/{case_id}/documents")
    read_response = client.get(f"/api/cases/{case_id}/documents/{document_id}")

    assert list_response.status_code == 200
    assert [document["id"] for document in list_response.json()] == [document_id]
    assert read_response.status_code == 200
    assert read_response.json()["id"] == document_id


def test_upload_rejects_other_owner_case(client: TestClient) -> None:
    with next(app.dependency_overrides[get_session]()) as session:
        other_case = Case(
            owner_ref="other-user",
            title="Other case",
            case_stage="before_signing",
            document_type="consumer_credit",
            analysis_plan="before_signing_review",
            institution_name="Banco Otro",
        )
        session.add(other_case)
        session.commit()
        case_id = other_case.id

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary"},
        files={"file": ("contrato.pdf", b"credito", "application/pdf")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "case not found"


def test_upload_rejects_unsupported_content_type(client: TestClient) -> None:
    case_id = create_case(client)

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary"},
        files={
            "file": (
                "contrato.docx",
                b"docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "unsupported content type"


def test_upload_rejects_oversize_payload_without_storing_record(
    client: TestClient, tmp_path: Path
) -> None:
    case_id = create_case(client)

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary"},
        files={"file": ("contrato.pdf", b"x" * 13, "application/pdf")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "upload exceeds maximum size"
    with next(app.dependency_overrides[get_session]()) as session:
        assert session.query(Document).count() == 0
    assert not any((tmp_path / "uploads").rglob("*.*"))


def test_upload_rejects_empty_file(client: TestClient, tmp_path: Path) -> None:
    case_id = create_case(client)

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary"},
        files={"file": ("contrato.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "upload must not be empty"
    with next(app.dependency_overrides[get_session]()) as session:
        assert session.query(Document).count() == 0
    assert not any((tmp_path / "uploads").rglob("*.*"))


def test_upload_returns_500_on_storage_write_failure(
    client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = create_case(client)

    def failing_write(
        upload: object, destination: object, max_bytes: object
    ) -> tuple[int, str]:
        raise OSError("disk full")

    monkeypatch.setattr("api.services.documents._write_upload_file", failing_write)

    response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary"},
        files={"file": ("contrato.pdf", b"credito pdf", "application/pdf")},
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "could not store upload"
    with next(app.dependency_overrides[get_session]()) as session:
        assert session.query(Document).count() == 0


def test_list_documents_returns_404_for_nonexistent_case(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/cases/00000000-0000-0000-0000-000000000000/documents"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "case not found"


def test_get_document_returns_404_for_nonexistent_case(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/cases/00000000-0000-0000-0000-000000000000/documents/some-doc-id"
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "case not found"
