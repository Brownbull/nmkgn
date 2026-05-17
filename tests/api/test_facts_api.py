from __future__ import annotations

import hashlib
from collections.abc import Generator
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from api.main import app
from api.models import Base
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, FactConfirmation
from api.services.database import get_session
from api.services.facts import REQUIRED_HIGH_IMPACT_FACT_KEYS


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

    def override_session() -> Generator[Session, None, None]:
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def test_list_facts_is_scoped_to_case_and_document_owner(client: TestClient) -> None:
    case_id = create_case(client)

    with next(app.dependency_overrides[get_session]()) as session:
        visible_document = add_document(session, case_id)
        visible_fact = add_fact(session, visible_document, "principal_amount")
        hidden_document = add_document(session, case_id, owner_ref="other-user")
        add_fact(session, hidden_document, "cae")
        session.commit()

    response = client.get(f"/api/cases/{case_id}/facts")

    assert response.status_code == 200
    facts = response.json()
    assert [fact["id"] for fact in facts] == [visible_fact.id]


def test_readiness_reports_missing_and_unresolved_high_impact_facts(
    client: TestClient,
) -> None:
    case_id = create_case(client)

    empty_response = client.get(f"/api/cases/{case_id}/facts/readiness")
    assert empty_response.status_code == 200
    empty = empty_response.json()
    assert empty["ready_for_analysis"] is False
    assert empty["blockers"] == ["missing_required_facts"]
    assert empty["missing_required_fact_keys"] == list(REQUIRED_HIGH_IMPACT_FACT_KEYS)

    with next(app.dependency_overrides[get_session]()) as session:
        document = add_document(session, case_id)
        for fact_key in REQUIRED_HIGH_IMPACT_FACT_KEYS:
            add_fact(
                session,
                document,
                fact_key,
                confirmation_status="pending" if fact_key == "cae" else "confirmed",
            )
        session.commit()

    pending_response = client.get(f"/api/cases/{case_id}/facts/readiness")

    assert pending_response.status_code == 200
    pending = pending_response.json()
    assert pending["ready_for_analysis"] is False
    assert pending["blockers"] == ["unresolved_high_impact_facts"]
    assert pending["missing_required_fact_keys"] == []
    assert pending["unresolved_high_impact_count"] == 1
    assert pending["status_counts"]["pending"] == 1
    assert pending["status_counts"]["confirmed"] == (
        len(REQUIRED_HIGH_IMPACT_FACT_KEYS) - 1
    )


def test_confirming_last_required_fact_opens_readiness_gate(
    client: TestClient,
) -> None:
    case_id = create_case(client)

    with next(app.dependency_overrides[get_session]()) as session:
        document = add_document(session, case_id)
        pending_fact_id = ""
        for fact_key in REQUIRED_HIGH_IMPACT_FACT_KEYS:
            fact = add_fact(
                session,
                document,
                fact_key,
                confirmation_status="pending" if fact_key == "cae" else "confirmed",
            )
            if fact_key == "cae":
                pending_fact_id = fact.id
        session.commit()

    response = client.post(
        f"/api/cases/{case_id}/facts/{pending_fact_id}/confirmations",
        json={"fact_id": pending_fact_id, "action": "confirm"},
    )
    readiness_response = client.get(f"/api/cases/{case_id}/facts/readiness")

    assert response.status_code == 201
    assert response.json()["action"] == "confirm"
    readiness = readiness_response.json()
    assert readiness["ready_for_analysis"] is True
    assert readiness["blockers"] == []
    assert readiness["unresolved_high_impact_count"] == 0
    assert readiness["status_counts"]["confirmed"] == len(
        REQUIRED_HIGH_IMPACT_FACT_KEYS
    )

    with next(app.dependency_overrides[get_session]()) as session:
        fact = session.get(ConsumerCreditFact, pending_fact_id)
        confirmation = session.query(FactConfirmation).one()
        assert fact is not None
        assert fact.confirmation_status == "confirmed"
        assert confirmation.owner_ref == "demo-user"


def test_correction_and_rejection_record_decisions_and_update_fact_status(
    client: TestClient,
) -> None:
    case_id = create_case(client)

    with next(app.dependency_overrides[get_session]()) as session:
        document = add_document(session, case_id)
        principal = add_fact(session, document, "principal_amount")
        fee = add_fact(session, document, "fee")
        session.commit()
        principal_id = principal.id
        fee_id = fee.id

    correction_response = client.post(
        f"/api/cases/{case_id}/facts/{principal_id}/confirmations",
        json={
            "fact_id": principal_id,
            "action": "correct",
            "corrected_value_number": 2_500_000,
            "corrected_value_currency": "clp",
            "note": "amount shown on page 2",
        },
    )
    rejection_response = client.post(
        f"/api/cases/{case_id}/facts/{fee_id}/confirmations",
        json={"fact_id": fee_id, "action": "reject"},
    )

    assert correction_response.status_code == 201
    correction = correction_response.json()
    assert correction["action"] == "correct"
    assert correction["corrected_value_number"] == 2_500_000
    assert correction["corrected_value_currency"] == "CLP"
    assert correction["note"] == "amount shown on page 2"
    assert rejection_response.status_code == 201
    assert rejection_response.json()["action"] == "reject"

    with next(app.dependency_overrides[get_session]()) as session:
        corrected_fact = session.get(ConsumerCreditFact, principal_id)
        rejected_fact = session.get(ConsumerCreditFact, fee_id)
        assert corrected_fact is not None
        assert rejected_fact is not None
        assert corrected_fact.confirmation_status == "corrected"
        assert rejected_fact.confirmation_status == "rejected"
        assert session.query(FactConfirmation).count() == 2


def test_correction_rejects_type_incompatible_value(client: TestClient) -> None:
    case_id = create_case(client)

    with next(app.dependency_overrides[get_session]()) as session:
        document = add_document(session, case_id)
        money_fact = add_fact(session, document, "principal_amount")
        date_fact = add_fact(session, document, "contract_date")
        session.commit()
        money_fact_id = money_fact.id
        date_fact_id = date_fact.id

    money_with_date = client.post(
        f"/api/cases/{case_id}/facts/{money_fact_id}/confirmations",
        json={
            "fact_id": money_fact_id,
            "action": "correct",
            "corrected_value_date": "2026-06-01",
        },
    )
    date_with_number = client.post(
        f"/api/cases/{case_id}/facts/{date_fact_id}/confirmations",
        json={
            "fact_id": date_fact_id,
            "action": "correct",
            "corrected_value_number": 999,
        },
    )

    assert money_with_date.status_code == 422
    assert "corrected_value_number" in money_with_date.json()["detail"]
    assert date_with_number.status_code == 422
    assert "corrected_value_date" in date_with_number.json()["detail"]

    with next(app.dependency_overrides[get_session]()) as session:
        assert (
            session.get(ConsumerCreditFact, money_fact_id).confirmation_status
            == "pending"
        )
        assert (
            session.get(ConsumerCreditFact, date_fact_id).confirmation_status
            == "pending"
        )


def test_list_and_readiness_return_404_for_nonexistent_case(
    client: TestClient,
) -> None:
    fake_case_id = "00000000-0000-0000-0000-000000000000"

    list_response = client.get(f"/api/cases/{fake_case_id}/facts")
    readiness_response = client.get(f"/api/cases/{fake_case_id}/facts/readiness")

    assert list_response.status_code == 404
    assert readiness_response.status_code == 404


def test_confirmation_rejects_mismatched_or_unowned_fact(
    client: TestClient,
) -> None:
    case_id = create_case(client)

    with next(app.dependency_overrides[get_session]()) as session:
        visible_document = add_document(session, case_id)
        visible_fact = add_fact(session, visible_document, "principal_amount")
        hidden_document = add_document(session, case_id, owner_ref="other-user")
        hidden_fact = add_fact(session, hidden_document, "cae")
        session.commit()
        visible_fact_id = visible_fact.id
        hidden_fact_id = hidden_fact.id

    mismatch_response = client.post(
        f"/api/cases/{case_id}/facts/{visible_fact_id}/confirmations",
        json={"fact_id": hidden_fact_id, "action": "confirm"},
    )
    unowned_response = client.post(
        f"/api/cases/{case_id}/facts/{hidden_fact_id}/confirmations",
        json={"fact_id": hidden_fact_id, "action": "confirm"},
    )

    assert mismatch_response.status_code == 400
    assert mismatch_response.json()["detail"] == "fact_id mismatch"
    assert unowned_response.status_code == 404
    assert unowned_response.json()["detail"] == "fact not found"


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


def add_document(
    session: Session, case_id: str, *, owner_ref: str = "demo-user"
) -> Document:
    document = Document(
        case_id=case_id,
        owner_ref=owner_ref,
        role="primary",
        document_type="consumer_credit",
        original_filename=f"{owner_ref}-contrato.txt",
        content_type="text/plain",
        byte_size=16,
        checksum_sha256=hashlib.sha256(owner_ref.encode()).hexdigest(),
        storage_key=f"{owner_ref}/{case_id}/contrato.txt",
        upload_status="stored",
        extraction_status="extracted",
        retention_state="active",
    )
    session.add(document)
    session.flush()
    return document


def add_fact(
    session: Session,
    document: Document,
    fact_key: str,
    *,
    confirmation_status: str = "pending",
) -> ConsumerCreditFact:
    value = fact_value(fact_key)
    fact = ConsumerCreditFact(
        case_id=document.case_id,
        document_id=document.id,
        fact_key=fact_key,
        label=value["label"],
        value_kind=value["value_kind"],
        value_text=value.get("value_text"),
        value_number=value.get("value_number"),
        value_currency=value.get("value_currency"),
        value_date=value.get("value_date"),
        unit=value.get("unit"),
        high_impact=True,
        confirmation_status=confirmation_status,
        source_type="uploaded_document",
        source_start_offset=0,
        source_end_offset=12,
        source_snippet="Contrato demo",
        extraction_provider="test",
        confidence=0.9,
    )
    session.add(fact)
    session.flush()
    return fact


def fact_value(fact_key: str) -> dict[str, object]:
    values: dict[str, dict[str, object]] = {
        "principal_amount": {
            "label": "Monto del credito",
            "value_kind": "money",
            "value_number": 3_000_000.0,
            "value_currency": "CLP",
        },
        "contract_date": {
            "label": "Fecha de contrato",
            "value_kind": "date",
            "value_date": date(2026, 5, 15),
        },
        "term_months": {
            "label": "Plazo en meses",
            "value_kind": "integer",
            "value_number": 60.0,
            "unit": "months",
        },
        "payment_count": {
            "label": "Numero de cuotas",
            "value_kind": "integer",
            "value_number": 60.0,
            "unit": "payments",
        },
        "installment_amount": {
            "label": "Valor de cuota",
            "value_kind": "money",
            "value_number": 85_000.0,
            "value_currency": "CLP",
        },
        "cae": {
            "label": "CAE",
            "value_kind": "percentage",
            "value_number": 22.4,
            "unit": "percent_annual",
        },
        "total_cost": {
            "label": "Costo total",
            "value_kind": "money",
            "value_number": 5_100_000.0,
            "value_currency": "CLP",
        },
        "fee": {
            "label": "Comision o cargo",
            "value_kind": "money",
            "value_number": 20_000.0,
            "value_currency": "CLP",
        },
    }
    return values[fact_key]
