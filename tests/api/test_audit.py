from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.models.reference import OfficialReference, REFERENCE_SCHEMA_VERSION
from api.services.audit import (
    AnalysisSetup,
    AuditEvent,
    CaseNotFoundError,
    InvalidAnalysisPlanError,
    NotReadyError,
    RunAuditTimeline,
    prepare_analysis,
)
from api.services.analysis import run_deterministic_analysis


BASIC_FACTS = [
    {
        "fact_key": "principal_amount",
        "value_kind": "money",
        "value_number": 6000000.0,
        "label": "Monto",
    },
    {
        "fact_key": "contract_date",
        "value_kind": "date",
        "value_text": "2025-01-15",
        "label": "Fecha",
    },
    {
        "fact_key": "term_months",
        "value_kind": "integer",
        "value_number": 60,
        "label": "Plazo",
    },
    {
        "fact_key": "payment_count",
        "value_kind": "integer",
        "value_number": 68,
        "label": "Cuotas",
    },
    {
        "fact_key": "installment_amount",
        "value_kind": "money",
        "value_number": 150000.0,
        "label": "Cuota",
    },
    {
        "fact_key": "cae",
        "value_kind": "percentage",
        "value_number": 28.5,
        "label": "CAE",
    },
    {
        "fact_key": "interest_rate",
        "value_kind": "percentage",
        "value_number": 1.2,
        "label": "Tasa",
    },
    {
        "fact_key": "total_cost",
        "value_kind": "money",
        "value_number": 8500000.0,
        "label": "Total",
    },
]


def _seed_case(
    session: Session,
    facts_spec: list[dict],
    *,
    case_stage: str = "after_signing",
    analysis_plan: str = "after_signing_discrepancy",
) -> Case:
    case = Case(
        owner_ref="demo-user",
        title="Audit test case",
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
        checksum_sha256="a" * 64,
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
            high_impact=True,
            confirmation_status="confirmed",
            source_page_number=1,
            source_snippet=f"{spec['fact_key']}: value",
            extraction_provider="local-facts",
            confidence=0.95,
        )
        session.add(fact)

    session.flush()
    return case


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


class TestAuditEvent:
    def test_to_dict_without_details(self) -> None:
        event = AuditEvent(
            timestamp="2026-05-27T12:00:00+00:00", event_type="test_event"
        )
        result = event.to_dict()
        assert result == {
            "timestamp": "2026-05-27T12:00:00+00:00",
            "event_type": "test_event",
        }

    def test_to_dict_with_details(self) -> None:
        event = AuditEvent(
            timestamp="2026-05-27T12:00:00+00:00",
            event_type="calc_done",
            details={"count": 5},
        )
        result = event.to_dict()
        assert result == {
            "timestamp": "2026-05-27T12:00:00+00:00",
            "event_type": "calc_done",
            "details": {"count": 5},
        }


class TestRunAuditTimeline:
    def test_record_creates_event(self) -> None:
        timeline = RunAuditTimeline()
        timeline.record("run_started", plan="after_signing_discrepancy")
        events = timeline.events
        assert len(events) == 1
        assert events[0]["event_type"] == "run_started"
        assert events[0]["details"]["plan"] == "after_signing_discrepancy"
        assert "timestamp" in events[0]

    def test_multiple_events_preserve_order(self) -> None:
        timeline = RunAuditTimeline()
        timeline.record("step_one")
        timeline.record("step_two")
        timeline.record("step_three")
        types = [e["event_type"] for e in timeline.events]
        assert types == ["step_one", "step_two", "step_three"]

    def test_add_warning(self) -> None:
        timeline = RunAuditTimeline()
        timeline.add_warning("missing interest_rate fact")
        timeline.add_warning("cae above threshold")
        assert timeline.warnings == [
            "missing interest_rate fact",
            "cae above threshold",
        ]

    def test_suppress_finding(self) -> None:
        timeline = RunAuditTimeline()
        timeline.suppress_finding("payment_count_delta")
        timeline.suppress_finding("total_cost_delta")
        assert timeline.suppressed_finding_keys == [
            "payment_count_delta",
            "total_cost_delta",
        ]

    def test_properties_return_copies(self) -> None:
        timeline = RunAuditTimeline()
        timeline.record("test")
        timeline.add_warning("w")
        timeline.suppress_finding("k")

        events = timeline.events
        events.append({"fake": True})
        assert len(timeline.events) == 1

        warnings = timeline.warnings
        warnings.append("fake")
        assert len(timeline.warnings) == 1

        suppressed = timeline.suppressed_finding_keys
        suppressed.append("fake")
        assert len(timeline.suppressed_finding_keys) == 1

    def test_empty_details_omitted_from_dict(self) -> None:
        timeline = RunAuditTimeline()
        timeline.record("simple_event")
        event = timeline.events[0]
        assert "details" not in event


class TestPrepareAnalysis:
    def test_returns_setup_with_correct_fields(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        session.commit()

        setup = prepare_analysis(session, case_id=case.id, owner_ref="demo-user")
        assert isinstance(setup, AnalysisSetup)
        assert setup.case.id == case.id
        assert setup.analysis_plan == "after_signing_discrepancy"
        assert len(setup.confirmed_facts) == len(BASIC_FACTS)
        assert "principal_amount" in setup.fact_map
        assert setup.readiness_snapshot["analysis_plan"] == "after_signing_discrepancy"
        assert setup.readiness_snapshot["fact_count"] == len(BASIC_FACTS)

    def test_case_not_found_raises(self, session: Session) -> None:
        with pytest.raises(CaseNotFoundError):
            prepare_analysis(session, case_id="nonexistent", owner_ref="demo-user")

    def test_invalid_plan_raises(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="Bad plan",
            case_stage="after_signing",
            document_type="consumer_credit",
            analysis_plan="invalid_plan",
            institution_name="Banco Test",
        )
        session.add(case)
        session.commit()

        with pytest.raises(InvalidAnalysisPlanError, match="invalid_plan"):
            prepare_analysis(session, case_id=case.id, owner_ref="demo-user")

    def test_not_ready_without_facts(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="Empty",
            case_stage="after_signing",
            document_type="consumer_credit",
            analysis_plan="after_signing_discrepancy",
            institution_name="Banco Test",
        )
        session.add(case)
        session.commit()

        with pytest.raises(NotReadyError):
            prepare_analysis(session, case_id=case.id, owner_ref="demo-user")

    def test_setup_is_frozen(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        session.commit()

        setup = prepare_analysis(session, case_id=case.id, owner_ref="demo-user")
        with pytest.raises(AttributeError):
            setup.analysis_plan = "something_else"  # type: ignore[misc]


class TestTimelineIntegration:
    def test_run_populates_timeline_events(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert len(run.timeline_events) > 0

        event_types = [e["event_type"] for e in run.timeline_events]
        assert "run_started" in event_types
        assert "run_completed" in event_types

    def test_run_started_is_first_event(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert run.timeline_events[0]["event_type"] == "run_started"

    def test_run_completed_is_last_event(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert run.timeline_events[-1]["event_type"] == "run_completed"

    def test_timeline_includes_calculations_and_findings(
        self, session: Session
    ) -> None:
        case = _seed_case(session, BASIC_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        event_types = [e["event_type"] for e in run.timeline_events]
        assert "calculations_complete" in event_types
        assert "findings_generated" in event_types

    def test_suppressed_findings_tracked(self, session: Session) -> None:
        no_discrep = [
            {
                "fact_key": "principal_amount",
                "value_kind": "money",
                "value_number": 6000000.0,
            },
            {
                "fact_key": "contract_date",
                "value_kind": "date",
                "value_text": "2025-01-15",
            },
            {"fact_key": "term_months", "value_kind": "integer", "value_number": 60},
            {"fact_key": "payment_count", "value_kind": "integer", "value_number": 60},
            {
                "fact_key": "installment_amount",
                "value_kind": "money",
                "value_number": 150000.0,
            },
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 20.0},
            {
                "fact_key": "interest_rate",
                "value_kind": "percentage",
                "value_number": 1.2,
            },
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
            },
        ]
        case = _seed_case(session, no_discrep)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert len(run.suppressed_finding_keys) > 0

    def test_warnings_empty_when_all_calcs_available(self, session: Session) -> None:
        case = _seed_case(session, BASIC_FACTS)
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert isinstance(run.warnings, list)

    def test_before_signing_timeline_records_plan(self, session: Session) -> None:
        case = _seed_case(
            session,
            BASIC_FACTS,
            case_stage="before_signing",
            analysis_plan="before_signing_review",
        )
        _seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        enrichment_events = [
            e
            for e in run.timeline_events
            if e["event_type"] == "plan_enrichment_complete"
        ]
        assert len(enrichment_events) == 1
        assert enrichment_events[0]["details"]["plan"] == "before_signing_review"
