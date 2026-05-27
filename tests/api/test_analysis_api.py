from __future__ import annotations

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from api.models.analysis import CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
from api.models.base import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.models.reference import OfficialReference, REFERENCE_SCHEMA_VERSION
from api.services.analysis import (
    CaseNotFoundError,
    InvalidAnalysisPlanError,
    NotReadyError,
    RunNotFoundError,
    list_analysis_runs,
    get_analysis_run,
    run_deterministic_analysis,
)


def _engine(tmp_path, name: str = "analysis_api.db"):
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


GOLDEN_FACTS = [
    {"fact_key": "principal_amount", "value_kind": "money", "value_number": 6000000.0, "label": "Monto del credito"},
    {"fact_key": "contract_date", "value_kind": "date", "value_text": "2025-01-15", "label": "Fecha del contrato"},
    {"fact_key": "term_months", "value_kind": "integer", "value_number": 60, "label": "Plazo en meses"},
    {"fact_key": "payment_count", "value_kind": "integer", "value_number": 68, "label": "Numero de cuotas"},
    {"fact_key": "installment_amount", "value_kind": "money", "value_number": 150000.0, "label": "Valor de cuota"},
    {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5, "label": "CAE"},
    {"fact_key": "interest_rate", "value_kind": "percentage", "value_number": 1.2, "label": "Tasa de interes"},
    {"fact_key": "total_cost", "value_kind": "money", "value_number": 8500000.0, "label": "Costo total"},
]


def _seed_case_with_facts(
    session,
    facts_spec: list[dict],
    *,
    case_stage: str = "after_signing",
    analysis_plan: str = "after_signing_discrepancy",
) -> tuple[Case, list[ConsumerCreditFact]]:
    case = Case(
        owner_ref="demo-user",
        title="Credito prueba API",
        case_stage=case_stage,
        document_type="consumer_credit",
        analysis_plan=analysis_plan,
        institution_name="Banco Test",
    )
    session.add(case)
    session.flush()

    doc = Document(
        case_id=case.id,
        owner_ref="demo-user",
        role="primary",
        document_type="consumer_credit",
        original_filename="contrato.pdf",
        content_type="application/pdf",
        byte_size=2048,
        checksum_sha256="b" * 64,
        storage_key=f"demo-user/{case.id}/contrato.pdf",
        upload_status="stored",
    )
    session.add(doc)
    session.flush()

    seg = ExtractedTextSegment(
        document_id=doc.id,
        page_number=1,
        start_offset=0,
        end_offset=100,
        text="Contrato credito consumo",
        extraction_provider="local-text",
    )
    session.add(seg)
    session.flush()

    run = DocumentReceptionistRun(
        case_id=case.id,
        document_id=doc.id,
        owner_ref="demo-user",
        provider="test-provider",
        model_name="test-model",
        prompt_version="v1",
        media_kind="text",
        status="completed",
    )
    session.add(run)
    session.flush()

    created_facts = []
    for spec in facts_spec:
        fact = ConsumerCreditFact(
            case_id=case.id,
            document_id=doc.id,
            text_segment_id=seg.id,
            fact_key=spec["fact_key"],
            label=spec.get("label", spec["fact_key"]),
            value_kind=spec.get("value_kind", "integer"),
            value_number=spec.get("value_number"),
            value_text=spec.get("value_text"),
            high_impact=spec.get("high_impact", True),
            confirmation_status=spec.get("confirmation_status", "confirmed"),
            source_page_number=1,
            source_snippet=f'{spec["fact_key"]}: value',
            extraction_provider="local-facts",
            confidence=0.95,
        )
        session.add(fact)
        session.flush()
        created_facts.append(fact)

    return case, created_facts


def _seed_references(session: Session) -> None:
    ref = OfficialReference(
        reference_key="cmf-test",
        source_category="cmf",
        display_label="CMF Test",
        marketplace_safe_label="CMF Test",
        source_url="https://cmfchile.cl/test",
        schema_version=REFERENCE_SCHEMA_VERSION,
    )
    session.add(ref)
    session.flush()


class TestListAnalysisRuns:
    def test_empty_list(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        session.commit()
        runs = list_analysis_runs(session, case_id=case.id, owner_ref="demo-user")
        assert runs == []

    def test_returns_runs_after_analysis(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        runs = list_analysis_runs(session, case_id=case.id, owner_ref="demo-user")
        assert len(runs) == 1
        assert runs[0].id == run.id
        assert runs[0].status == "completed"

    def test_case_not_found(self, session: Session) -> None:
        with pytest.raises(CaseNotFoundError):
            list_analysis_runs(session, case_id="nonexistent", owner_ref="demo-user")

    def test_ordering_newest_first(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run1 = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        run2 = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        runs = list_analysis_runs(session, case_id=case.id, owner_ref="demo-user")
        assert len(runs) == 2
        assert runs[0].id == run2.id
        assert runs[1].id == run1.id


class TestGetAnalysisRun:
    def test_get_completed_run(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        fetched = get_analysis_run(
            session, case_id=case.id, run_id=run.id, owner_ref="demo-user"
        )
        assert fetched.id == run.id
        assert fetched.status == "completed"
        assert fetched.schema_version == CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION

    def test_run_not_found(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        session.commit()
        with pytest.raises(RunNotFoundError):
            get_analysis_run(
                session, case_id=case.id, run_id="nonexistent", owner_ref="demo-user"
            )

    def test_run_includes_findings_and_evidence(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        fetched = get_analysis_run(
            session, case_id=case.id, run_id=run.id, owner_ref="demo-user"
        )
        assert len(fetched.findings) > 0
        for finding in fetched.findings:
            assert finding.finding_key != ""
            assert finding.title != ""
            assert finding.severity in ("low", "medium", "high", "critical")
            assert finding.claim_type in ("fact", "calculation", "reference", "inference")
            assert len(finding.evidence) > 0

    def test_run_includes_calculations(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        fetched = get_analysis_run(
            session, case_id=case.id, run_id=run.id, owner_ref="demo-user"
        )
        assert len(fetched.calculations) > 0
        for calc in fetched.calculations:
            assert calc.calculation_key != ""
            assert calc.label != ""


class TestDeterministicAnalysisViaService:
    def test_not_ready_without_facts(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="Empty case",
            case_stage="after_signing",
            document_type="consumer_credit",
            analysis_plan="after_signing_discrepancy",
            institution_name="Banco Test",
        )
        session.add(case)
        session.commit()

        with pytest.raises(NotReadyError):
            run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )

    def test_golden_path_produces_discrepancy_findings(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert run.status == "completed"
        assert len(run.findings) > 0

        payment_finding = next(
            (f for f in run.findings if f.finding_key == "payment_count_delta"), None
        )
        assert payment_finding is not None
        assert payment_finding.severity == "high"
        assert payment_finding.claim_type == "calculation"
        assert len(payment_finding.evidence) > 0

    def test_no_findings_when_no_discrepancy(self, session: Session) -> None:
        no_discrep_facts = [
            {"fact_key": "principal_amount", "value_kind": "money", "value_number": 6000000.0},
            {"fact_key": "contract_date", "value_kind": "date", "value_text": "2025-01-15"},
            {"fact_key": "term_months", "value_kind": "integer", "value_number": 60},
            {"fact_key": "payment_count", "value_kind": "integer", "value_number": 60},
            {"fact_key": "installment_amount", "value_kind": "money", "value_number": 150000.0},
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 20.0},
            {"fact_key": "interest_rate", "value_kind": "percentage", "value_number": 1.2},
            {"fact_key": "total_cost", "value_kind": "money", "value_number": 9000000.0},
        ]
        case, _ = _seed_case_with_facts(session, no_discrep_facts)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert run.status == "completed"
        assert len(run.findings) == 0


class TestBeforeSigningDeterministicAnalysis:
    def test_produces_findings_with_data(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(
            session,
            GOLDEN_FACTS,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert run.status == "completed"
        assert len(run.findings) > 0

    def test_finding_keys_use_bs_prefix(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(
            session,
            GOLDEN_FACTS,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        for finding in run.findings:
            assert finding.finding_key.startswith("bs_"), (
                f"Before-signing finding_key should start with bs_: {finding.finding_key}"
            )

    def test_fires_on_data_presence_not_discrepancy(self, session: Session) -> None:
        no_discrep_facts = [
            {"fact_key": "principal_amount", "value_kind": "money", "value_number": 6000000.0},
            {"fact_key": "contract_date", "value_kind": "date", "value_text": "2025-01-15"},
            {"fact_key": "term_months", "value_kind": "integer", "value_number": 60},
            {"fact_key": "payment_count", "value_kind": "integer", "value_number": 60},
            {"fact_key": "installment_amount", "value_kind": "money", "value_number": 150000.0},
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 20.0},
            {"fact_key": "interest_rate", "value_kind": "percentage", "value_number": 1.2},
            {"fact_key": "total_cost", "value_kind": "money", "value_number": 9000000.0},
        ]
        case, _ = _seed_case_with_facts(
            session,
            no_discrep_facts,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert run.status == "completed"
        assert len(run.findings) > 0, (
            "Before-signing should fire findings on data presence, not only discrepancy"
        )

    def test_readiness_snapshot_includes_plan(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(
            session,
            GOLDEN_FACTS,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert run.readiness_snapshot["analysis_plan"] == "before_signing_review"

    def test_each_finding_has_evidence(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(
            session,
            GOLDEN_FACTS,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(session, case_id=case.id, owner_ref="demo-user")
        for finding in run.findings:
            assert len(finding.evidence) > 0, (
                f"Finding {finding.finding_key} should have evidence"
            )


class TestInvalidAnalysisPlan:
    def test_invalid_plan_raises_error(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="Bad plan case",
            case_stage="after_signing",
            document_type="consumer_credit",
            analysis_plan="nonexistent_plan",
            institution_name="Banco Test",
        )
        session.add(case)
        session.commit()

        with pytest.raises(InvalidAnalysisPlanError):
            run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )

    def test_error_detail_includes_plan_value(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="Bad plan case 2",
            case_stage="after_signing",
            document_type="consumer_credit",
            analysis_plan="bogus_plan",
            institution_name="Banco Test",
        )
        session.add(case)
        session.commit()

        with pytest.raises(InvalidAnalysisPlanError, match="bogus_plan"):
            run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )
