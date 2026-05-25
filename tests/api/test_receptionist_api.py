from __future__ import annotations

import hashlib
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.config import (
    ReceptionistSettings,
    UploadStorageSettings,
    get_receptionist_settings,
    get_upload_storage_settings,
)
from api.main import app
from api.models import Base
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, FactConfirmation
from api.models.receptionist import (
    RECEPTIONIST_SCHEMA_VERSION,
    DocumentExtractionGap,
    DocumentReceptionistObservation,
    DocumentReceptionistRun,
)
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
            max_bytes=4096,
            retention_days=30,
            allowed_content_types=("application/pdf", "text/plain", "image/png"),
            production_uploads_enabled=False,
        )

    def override_receptionist_settings() -> ReceptionistSettings:
        return ReceptionistSettings(
            enabled=True,
            provider="fake",
            model="fake-receptionist-v1",
            max_pages=2,
            timeout_seconds=10,
        )

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_upload_storage_settings] = override_upload_settings
    app.dependency_overrides[get_receptionist_settings] = override_receptionist_settings
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def test_receptionist_run_stores_observations_and_visible_gaps(
    client: TestClient,
) -> None:
    case_id = create_case(client)
    upload_response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary", "document_type": "consumer_credit"},
        files={
            "file": (
                "contrato.txt",
                b"CAE 12% anual\nGasto de cobranza informado",
                "text/plain",
            )
        },
    )
    assert upload_response.status_code == 201
    document_id = upload_response.json()["id"]

    run_response = client.post(
        f"/api/cases/{case_id}/documents/{document_id}/receptionist-runs"
    )
    gaps_response = client.get(f"/api/cases/{case_id}/receptionist/gaps")
    readiness_response = client.get(f"/api/cases/{case_id}/analysis-readiness")

    assert run_response.status_code == 202
    run = run_response.json()
    assert run["status"] == "completed"
    assert run["provider"] == "fake"
    assert run["media_kind"] == "text"

    detail_response = client.get(
        f"/api/cases/{case_id}/documents/{document_id}/receptionist-runs/{run['id']}"
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert {observation["fact_key"] for observation in detail["observations"]} >= {
        "cae",
        None,
    }

    assert gaps_response.status_code == 200
    gaps = gaps_response.json()
    assert any(gap["gap_type"] == "unsupported_field" for gap in gaps)
    assert all(gap["blocking"] is False for gap in gaps)

    assert readiness_response.status_code == 200
    readiness = readiness_response.json()
    assert readiness["ready_for_analysis"] is False
    assert readiness["receptionist_ready"] is True
    assert "unresolved_high_impact_facts" in readiness["blockers"]


def test_fake_receptionist_uses_structural_extractor_for_gap_comparison(
    client: TestClient,
) -> None:
    case_id = create_case(client)
    text = """
    HOJA RESUMEN / COTIZACION CREDITO DE CONSUMO
    Fecha: 02/12/2022
    Producto Principal
    Monto Liquido del Credito. Anexo
    Plazo del Credito. Anexo
    Valor de la Cuota. Anexo
    Costo Total del Credito (**). Anexo
    CAE(*) Carga Anual Equivalente
    $ 20.000.000
    68
    $ 504.456
    $ 34.316.064
    20,28 %
    Informacion Adicional
    Numero de Cuotas
    Tasa Anual
    68
    17,88 %
    """.strip()
    upload_response = client.post(
        f"/api/cases/{case_id}/documents",
        data={"role": "primary", "document_type": "consumer_credit"},
        files={"file": ("oferta.txt", text.encode("utf-8"), "text/plain")},
    )
    assert upload_response.status_code == 201
    document_id = upload_response.json()["id"]

    run_response = client.post(
        f"/api/cases/{case_id}/documents/{document_id}/receptionist-runs"
    )

    assert run_response.status_code == 202
    run = run_response.json()
    detail_response = client.get(
        f"/api/cases/{case_id}/documents/{document_id}/receptionist-runs/{run['id']}"
    )
    gaps_response = client.get(f"/api/cases/{case_id}/receptionist/gaps")

    assert detail_response.status_code == 200
    observations = {
        observation["fact_key"]: observation
        for observation in detail_response.json()["observations"]
    }
    assert observations["principal_amount"]["value_number"] == 20_000_000
    assert observations["term_months"]["value_number"] == 68
    assert observations["payment_count"]["value_number"] == 68
    assert observations["installment_amount"]["value_number"] == 504_456
    assert observations["total_cost"]["value_number"] == 34_316_064
    assert observations["cae"]["value_number"] == 20.28

    assert gaps_response.status_code == 200
    assert gaps_response.json() == []


def test_provider_failure_creates_blocking_gap_and_blocks_readiness(
    client: TestClient,
) -> None:
    case_id = create_case(client)
    document = add_document(client, case_id)

    def timeout_settings() -> ReceptionistSettings:
        return ReceptionistSettings(
            enabled=True,
            provider="fake-timeout",
            model="fake-timeout",
            max_pages=2,
            timeout_seconds=1,
        )

    app.dependency_overrides[get_receptionist_settings] = timeout_settings

    run_response = client.post(
        f"/api/cases/{case_id}/documents/{document.id}/receptionist-runs"
    )
    gaps_response = client.get(f"/api/cases/{case_id}/receptionist/gaps")
    readiness_response = client.get(f"/api/cases/{case_id}/analysis-readiness")

    assert run_response.status_code == 202
    assert run_response.json()["status"] == "failed"
    gaps = gaps_response.json()
    assert len(gaps) == 1
    assert gaps[0]["gap_type"] == "receptionist_unavailable"
    assert gaps[0]["blocking"] is True
    readiness = readiness_response.json()
    assert readiness["ready_for_analysis"] is False
    assert readiness["receptionist_ready"] is False
    assert "failed_receptionist_run" in readiness["blockers"]
    assert "unresolved_receptionist_gaps" in readiness["blockers"]


def test_accept_missing_receptionist_observation_promotes_fact(
    client: TestClient,
) -> None:
    case_id = create_case(client)
    document = add_document(client, case_id)
    with next(app.dependency_overrides[get_session]()) as session:
        run = add_run(session, document)
        observation = add_observation(session, run, fact_key="cae", value_number=14.2)
        gap = add_gap(
            session,
            run,
            observation=observation,
            gap_type="missing_in_deterministic",
            fact=None,
        )
        session.commit()
        gap_id = gap.id

    response = client.post(
        f"/api/cases/{case_id}/receptionist/gaps/{gap_id}/resolution",
        json={"action": "accept_receptionist"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["created_fact_id"] is not None
    assert body["corrected_fact_id"] is None

    with next(app.dependency_overrides[get_session]()) as session:
        fact = session.get(ConsumerCreditFact, body["created_fact_id"])
        assert fact is not None
        assert fact.fact_key == "cae"
        assert fact.value_number == 14.2
        assert fact.confirmation_status == "confirmed"
        assert fact.extraction_provider == "receptionist-agent-v1"
        confirmation = session.query(FactConfirmation).one()
        assert confirmation.action == "confirm"
        assert session.get(DocumentExtractionGap, gap_id).status == "resolved"


def test_accept_value_conflict_corrects_existing_fact(
    client: TestClient,
) -> None:
    case_id = create_case(client)
    document = add_document(client, case_id)
    with next(app.dependency_overrides[get_session]()) as session:
        fact = add_fact(session, document, value_number=12.0)
        run = add_run(session, document)
        observation = add_observation(session, run, fact_key="cae", value_number=13.0)
        gap = add_gap(
            session,
            run,
            observation=observation,
            gap_type="value_conflict",
            fact=fact,
        )
        session.commit()
        gap_id = gap.id
        fact_id = fact.id

    response = client.post(
        f"/api/cases/{case_id}/receptionist/gaps/{gap_id}/resolution",
        json={"action": "accept_receptionist"},
    )

    assert response.status_code == 201
    assert response.json()["corrected_fact_id"] == fact_id
    with next(app.dependency_overrides[get_session]()) as session:
        corrected = session.get(ConsumerCreditFact, fact_id)
        assert corrected is not None
        assert corrected.value_number == 13.0
        assert corrected.confirmation_status == "corrected"
        confirmation = session.query(FactConfirmation).one()
        assert confirmation.action == "correct"
        assert confirmation.corrected_value_number == 13.0


def test_defer_unsupported_gap_does_not_create_fact(client: TestClient) -> None:
    case_id = create_case(client)
    document = add_document(client, case_id)
    with next(app.dependency_overrides[get_session]()) as session:
        run = add_run(session, document)
        observation = add_observation(
            session,
            run,
            fact_key=None,
            value_number=None,
            value_text="Gasto notarial",
            value_kind="unsupported",
        )
        gap = add_gap(
            session,
            run,
            observation=observation,
            gap_type="unsupported_field",
            fact=None,
            blocking=False,
        )
        session.commit()
        gap_id = gap.id

    response = client.post(
        f"/api/cases/{case_id}/receptionist/gaps/{gap_id}/resolution",
        json={"action": "defer_unsupported"},
    )

    assert response.status_code == 201
    with next(app.dependency_overrides[get_session]()) as session:
        assert session.query(ConsumerCreditFact).count() == 0
        assert session.get(DocumentExtractionGap, gap_id).status == "resolved"


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


def add_document(client: TestClient, case_id: str) -> Document:
    upload_root = app.dependency_overrides[get_upload_storage_settings]().root_path
    with next(app.dependency_overrides[get_session]()) as session:
        document = Document(
            case_id=case_id,
            owner_ref="demo-user",
            role="primary",
            document_type="consumer_credit",
            original_filename="contrato.txt",
            content_type="text/plain",
            byte_size=16,
            checksum_sha256=hashlib.sha256(b"CAE 12% anual").hexdigest(),
            storage_key=f"demo-user/{case_id}/manual/contrato.txt",
            upload_status="stored",
            extraction_status="extracted",
            retention_state="active",
        )
        session.add(document)
        session.commit()
        session.refresh(document)
        path = upload_root / document.storage_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("CAE 12% anual", encoding="utf-8")
        return document


def add_run(session: Session, document: Document) -> DocumentReceptionistRun:
    run = DocumentReceptionistRun(
        case_id=document.case_id,
        document_id=document.id,
        owner_ref=document.owner_ref,
        provider="fake",
        model_name="fake-receptionist-v1",
        prompt_version="document-receptionist-v1",
        schema_version=RECEPTIONIST_SCHEMA_VERSION,
        status="completed",
        media_kind="text",
        media_page_count=0,
        processed_page_count=0,
        partial_coverage=False,
    )
    session.add(run)
    session.flush()
    return run


def add_observation(
    session: Session,
    run: DocumentReceptionistRun,
    *,
    fact_key: str | None,
    value_number: float | None,
    value_text: str | None = None,
    value_kind: str = "percentage",
) -> DocumentReceptionistObservation:
    observation = DocumentReceptionistObservation(
        run_id=run.id,
        case_id=run.case_id,
        document_id=run.document_id,
        fact_key=fact_key,
        field_label="CAE" if fact_key else "Campo no soportado",
        value_kind=value_kind,
        value_text=value_text,
        value_number=value_number,
        unit="percent_annual" if value_kind == "percentage" else None,
        source_page_number=1,
        source_start_offset=0,
        source_end_offset=12,
        source_snippet="CAE 13% anual",
        anchor_status="anchored",
        confidence=0.8,
        raw_payload={},
    )
    session.add(observation)
    session.flush()
    return observation


def add_fact(
    session: Session, document: Document, *, value_number: float
) -> ConsumerCreditFact:
    fact = ConsumerCreditFact(
        case_id=document.case_id,
        document_id=document.id,
        fact_key="cae",
        label="CAE",
        value_kind="percentage",
        value_number=value_number,
        unit="percent_annual",
        high_impact=True,
        confirmation_status="pending",
        source_type="uploaded_document",
        source_start_offset=0,
        source_end_offset=10,
        source_snippet="CAE 12% anual",
        extraction_provider="test",
        confidence=0.8,
    )
    session.add(fact)
    session.flush()
    return fact


def add_gap(
    session: Session,
    run: DocumentReceptionistRun,
    *,
    observation: DocumentReceptionistObservation,
    gap_type: str,
    fact: ConsumerCreditFact | None,
    blocking: bool = True,
) -> DocumentExtractionGap:
    gap = DocumentExtractionGap(
        case_id=run.case_id,
        document_id=run.document_id,
        run_id=run.id,
        observation_id=observation.id,
        fact_id=fact.id if fact is not None else None,
        fact_key=observation.fact_key,
        gap_type=gap_type,
        severity="high" if blocking else "low",
        blocking=blocking,
        status="open",
        detail="test gap",
        deterministic_value=None,
        receptionist_value={"value_number": observation.value_number},
        source_summary=observation.source_snippet,
    )
    session.add(gap)
    session.flush()
    return gap
