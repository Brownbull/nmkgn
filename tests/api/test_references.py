from __future__ import annotations

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from api.models.base import Base
from api.models.reference import REFERENCE_SCHEMA_VERSION
from api.schemas.references import ReferenceCreate, ReferenceRead, ReferenceSeedSummary
from api.services.references import (
    DuplicateReferenceKeyError,
    ReferenceNotFoundError,
    create_reference,
    get_reference,
    get_reference_by_key,
    list_references,
    seed_references,
    SEED_REFERENCES,
)


def _engine(tmp_path, name: str = "ref.db"):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / name}")

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_conn, _connection_record):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    return engine


@pytest.fixture()
def session(tmp_path):
    engine = _engine(tmp_path)
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


CMF_REF = ReferenceCreate(
    reference_key="cmf-test-ref",
    source_category="cmf",
    display_label="CMF — Test Reference",
    marketplace_safe_label="Test reference (CMF)",
    source_url="https://www.cmfchile.cl/example",
    description="A test reference for unit tests.",
)


class TestCreateReference:
    def test_creates_and_returns_reference(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        assert ref.reference_key == "cmf-test-ref"
        assert ref.source_category == "cmf"
        assert ref.display_label == "CMF — Test Reference"
        assert ref.marketplace_safe_label == "Test reference (CMF)"
        assert ref.source_url == "https://www.cmfchile.cl/example"
        assert ref.description == "A test reference for unit tests."
        assert ref.is_active is True
        assert ref.schema_version == REFERENCE_SCHEMA_VERSION
        assert ref.verified_at is None
        assert ref.retrieved_at is not None

    def test_duplicate_key_raises(self, session: Session) -> None:
        create_reference(session, data=CMF_REF)
        with pytest.raises(DuplicateReferenceKeyError):
            create_reference(session, data=CMF_REF)

    def test_custom_retrieved_and_verified(self, session: Session) -> None:
        now = datetime.now(timezone.utc)
        data = ReferenceCreate(
            reference_key="verified-ref",
            source_category="benchmark",
            display_label="Benchmark verified",
            marketplace_safe_label="Benchmark (verified)",
            source_url="https://example.com",
            retrieved_at=now,
            verified_at=now,
        )
        ref = create_reference(session, data=data)
        assert ref.retrieved_at == now
        assert ref.verified_at == now


class TestGetReference:
    def test_get_by_id(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        found = get_reference(session, reference_id=ref.id)
        assert found.id == ref.id

    def test_not_found_raises(self, session: Session) -> None:
        with pytest.raises(ReferenceNotFoundError):
            get_reference(session, reference_id="nonexistent")


class TestGetReferenceByKey:
    def test_get_by_key(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        found = get_reference_by_key(session, reference_key="cmf-test-ref")
        assert found.id == ref.id

    def test_not_found_raises(self, session: Session) -> None:
        with pytest.raises(ReferenceNotFoundError):
            get_reference_by_key(session, reference_key="missing")


class TestListReferences:
    def test_lists_active_by_default(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        results = list_references(session)
        assert len(results) == 1
        assert results[0].id == ref.id

    def test_filters_by_category(self, session: Session) -> None:
        create_reference(session, data=CMF_REF)
        sernac = ReferenceCreate(
            reference_key="sernac-test",
            source_category="sernac",
            display_label="SERNAC test",
            marketplace_safe_label="SERNAC test",
            source_url="https://sernac.cl/test",
        )
        create_reference(session, data=sernac)
        cmf_results = list_references(session, source_category="cmf")
        assert len(cmf_results) == 1
        assert cmf_results[0].source_category == "cmf"

    def test_includes_inactive_when_requested(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        ref.is_active = False
        session.flush()
        active = list_references(session, active_only=True)
        all_refs = list_references(session, active_only=False)
        assert len(active) == 0
        assert len(all_refs) == 1


class TestSeedReferences:
    def test_seeds_all_references(self, session: Session) -> None:
        result = seed_references(session)
        assert result["created"] == len(SEED_REFERENCES)
        assert result["skipped"] == 0
        assert result["total"] == len(SEED_REFERENCES)
        refs = list_references(session)
        assert len(refs) == len(SEED_REFERENCES)

    def test_idempotent_seed(self, session: Session) -> None:
        seed_references(session)
        result = seed_references(session)
        assert result["created"] == 0
        assert result["skipped"] == len(SEED_REFERENCES)
        refs = list_references(session)
        assert len(refs) == len(SEED_REFERENCES)

    def test_partial_seed(self, session: Session) -> None:
        first = SEED_REFERENCES[0]
        create_reference(
            session,
            data=ReferenceCreate(
                reference_key=first["reference_key"],
                source_category=first["source_category"],
                display_label=first["display_label"],
                marketplace_safe_label=first["marketplace_safe_label"],
                source_url=first["source_url"],
            ),
        )
        result = seed_references(session)
        assert result["created"] == len(SEED_REFERENCES) - 1
        assert result["skipped"] == 1


class TestReferenceSchemas:
    def test_read_from_orm(self, session: Session) -> None:
        ref = create_reference(session, data=CMF_REF)
        read = ReferenceRead.model_validate(ref)
        assert read.id == ref.id
        assert read.reference_key == "cmf-test-ref"
        assert read.source_category == "cmf"

    def test_seed_summary_schema(self) -> None:
        summary = ReferenceSeedSummary(created=5, skipped=0, total=5)
        assert summary.schema_version == REFERENCE_SCHEMA_VERSION

    def test_create_strips_whitespace(self) -> None:
        data = ReferenceCreate(
            reference_key="  padded-key  ",
            source_category="cmf",
            display_label="  Padded label  ",
            marketplace_safe_label="  Padded safe  ",
            source_url="  https://example.com  ",
        )
        assert data.reference_key == "padded-key"
        assert data.display_label == "Padded label"
        assert data.source_url == "https://example.com"

    def test_create_rejects_blank_required(self) -> None:
        with pytest.raises(ValueError):
            ReferenceCreate(
                reference_key="   ",
                source_category="cmf",
                display_label="Label",
                marketplace_safe_label="Safe",
                source_url="https://example.com",
            )

    def test_create_rejects_non_http_url(self) -> None:
        with pytest.raises(ValueError, match="http or https"):
            ReferenceCreate(
                reference_key="bad-url",
                source_category="cmf",
                display_label="Label",
                marketplace_safe_label="Safe",
                source_url="javascript:alert(1)",
            )

    def test_create_accepts_http_url(self) -> None:
        data = ReferenceCreate(
            reference_key="http-ref",
            source_category="cmf",
            display_label="Label",
            marketplace_safe_label="Safe",
            source_url="http://example.com",
        )
        assert data.source_url == "http://example.com"
