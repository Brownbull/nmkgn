from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, sessionmaker

from api.main import app
from api.models import Base
from api.models.case import Case
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

    def override_session() -> Generator[Session, None, None]:
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def valid_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "title": "Credito casa",
        "case_stage": "before_signing",
        "institution_name": "Banco Demo",
        "requested_amount_clp": 25_000_000,
        "expected_term_months": 60,
    }
    payload.update(overrides)
    return payload


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_case_persists_and_defaults_analysis_plan(client: TestClient) -> None:
    response = client.post("/api/cases", json=valid_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["owner_ref"] == "demo-user"
    assert body["case_stage"] == "before_signing"
    assert body["document_type"] == "consumer_credit"
    assert body["analysis_plan"] == "before_signing_review"
    assert body["id"]

    read_response = client.get(f"/api/cases/{body['id']}")
    assert read_response.status_code == 200
    assert read_response.json()["title"] == "Credito casa"


def test_after_signing_defaults_analysis_plan(client: TestClient) -> None:
    response = client.post("/api/cases", json=valid_payload(case_stage="after_signing"))

    assert response.status_code == 201
    assert response.json()["analysis_plan"] == "after_signing_discrepancy"


def test_missing_or_invalid_case_stage_returns_validation_error(
    client: TestClient,
) -> None:
    missing = valid_payload()
    missing.pop("case_stage")

    missing_response = client.post("/api/cases", json=missing)
    invalid_response = client.post(
        "/api/cases", json=valid_payload(case_stage="signed_later")
    )

    assert missing_response.status_code == 422
    assert invalid_response.status_code == 422


def test_mismatched_stage_and_plan_returns_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/cases",
        json=valid_payload(
            case_stage="after_signing",
            analysis_plan="before_signing_review",
        ),
    )

    assert response.status_code == 422


def test_case_list_only_returns_demo_user_cases(client: TestClient) -> None:
    created = client.post("/api/cases", json=valid_payload()).json()

    with next(app.dependency_overrides[get_session]()) as session:
        session.add(
            Case(
                owner_ref="other-user",
                title="Other case",
                case_stage="before_signing",
                document_type="consumer_credit",
                analysis_plan="before_signing_review",
                institution_name="Banco Otro",
            )
        )
        session.commit()

    response = client.get("/api/cases")

    assert response.status_code == 200
    cases = response.json()
    assert [case["id"] for case in cases] == [created["id"]]


def test_alembic_upgrade_creates_cases_table(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    db_path = tmp_path / "migration.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+pysqlite:///{db_path}")

    config = Config("api/migrations/alembic.ini")
    command.upgrade(config, "head")

    engine = create_engine(os.environ["DATABASE_URL"])
    inspector = inspect(engine)
    assert "cases" in inspector.get_table_names()
    assert "documents" in inspector.get_table_names()
    assert "extracted_text_segments" in inspector.get_table_names()
    assert "consumer_credit_facts" in inspector.get_table_names()
    assert "fact_confirmations" in inspector.get_table_names()
