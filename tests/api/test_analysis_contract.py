from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from api.models import Base
from api.models.analysis import (
    AnalysisCalculation,
    AnalysisEvidence,
    AnalysisFinding,
    AnalysisRun,
    UnsupportedAnalysisOutput,
)
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.schemas.analysis import (
    AnalysisCitation,
    AnalysisEvidenceCreate,
    AnalysisFindingCreate,
    ConsumerCreditAnalysis,
    UnsupportedAnalysisOutputCreate,
)


def test_consumer_credit_analysis_schema_preserves_supported_findings_boundary() -> (
    None
):
    analysis = ConsumerCreditAnalysis(
        analysis_run_id="run-123",
        case_id="case-123",
        status="completed",
        summary="Contrato revisado con una discrepancia deterministica.",
        findings=[
            AnalysisFindingCreate(
                finding_key="payment_count_mismatch",
                title="Cantidad de pagos no coincide",
                summary="El contrato muestra 68 pagos y la simulacion muestra 60.",
                severity="high",
                claim_type="calculation",
                confidence=1,
                evidence=[
                    AnalysisEvidenceCreate(
                        evidence_type="calculation",
                        calculation_key="payment_count_delta",
                    )
                ],
            )
        ],
        unsupported_outputs=[
            UnsupportedAnalysisOutputCreate(
                output_key="unmapped_agent_sentence",
                raw_output={"text": "Parece caro."},
                reason="No corresponde a una afirmacion soportada por evidencia.",
            )
        ],
    )

    assert analysis.schema_version == "consumer_credit_analysis.v1"
    assert analysis.findings[0].claim_type == "calculation"
    assert analysis.unsupported_outputs[0].output_key == "unmapped_agent_sentence"

    with pytest.raises(ValidationError, match="claim_type"):
        AnalysisFindingCreate(
            finding_key="unsupported",
            title="Unsupported",
            summary="Should not become trusted.",
            severity="low",
            claim_type="unsupported_output",
        )


def test_analysis_evidence_schema_requires_type_specific_anchors() -> None:
    with pytest.raises(ValidationError, match="fact evidence requires fact_id"):
        AnalysisEvidenceCreate(evidence_type="fact")

    with pytest.raises(
        ValidationError, match="calculation evidence requires calculation_id"
    ):
        AnalysisEvidenceCreate(evidence_type="calculation")

    with pytest.raises(ValidationError, match="reference evidence requires citation"):
        AnalysisEvidenceCreate(evidence_type="reference")

    with pytest.raises(ValidationError, match="inference evidence requires"):
        AnalysisEvidenceCreate(evidence_type="inference", model_name="gpt-demo")

    reference = AnalysisEvidenceCreate(
        evidence_type="reference",
        citation=AnalysisCitation(label="CMF", url="https://www.cmfchile.cl/"),
    )

    assert reference.citation is not None
    assert reference.citation.label == "CMF"


def test_analysis_models_persist_evidence_and_keep_unsupported_output_separate(
    tmp_path,
) -> None:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'analysis.db'}")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case, fact = add_case_document_segment_and_fact(session)

        analysis_run = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={"ready_for_analysis": True},
            input_fact_ids=[fact.id],
            model_name="structured-demo",
        )
        session.add(analysis_run)
        session.flush()

        calculation = AnalysisCalculation(
            analysis_run_id=analysis_run.id,
            case_id=case.id,
            calculation_key="payment_count_delta",
            label="Payment count delta",
            input_fact_ids=[fact.id],
            inputs={"contract_payment_count": 68, "expected_payment_count": 60},
            result={"delta": 8},
        )
        finding = AnalysisFinding(
            analysis_run_id=analysis_run.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="payment_count_mismatch",
            title="Payment count mismatch",
            summary="The contract has more payments than expected.",
            severity="high",
            claim_type="calculation",
            uncertainty_state="supported",
            confidence=1,
        )
        unsupported = UnsupportedAnalysisOutput(
            analysis_run_id=analysis_run.id,
            case_id=case.id,
            output_key="agent_free_text",
            raw_output={"text": "This looks expensive."},
            reason="Unmapped free text is audit-only.",
        )
        session.add_all([calculation, finding, unsupported])
        session.flush()

        session.add_all(
            [
                AnalysisEvidence(
                    analysis_run_id=analysis_run.id,
                    case_id=case.id,
                    finding_id=finding.id,
                    evidence_type="fact",
                    fact_id=fact.id,
                    excerpt="68 cuotas",
                ),
                AnalysisEvidence(
                    analysis_run_id=analysis_run.id,
                    case_id=case.id,
                    finding_id=finding.id,
                    evidence_type="calculation",
                    calculation_id=calculation.id,
                ),
            ]
        )
        session.commit()

        stored_run = session.get(AnalysisRun, analysis_run.id)
        assert stored_run is not None
        assert stored_run.findings[0].evidence[0].fact_id == fact.id
        assert stored_run.calculations[0].result == {"delta": 8}
        assert stored_run.unsupported_outputs[0].output_key == "agent_free_text"

        stored_findings = session.scalars(select(AnalysisFinding)).all()
        assert [finding.claim_type for finding in stored_findings] == ["calculation"]


def test_analysis_finding_db_constraint_rejects_unsupported_claim_type(
    tmp_path,
) -> None:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'analysis.db'}")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case, fact = add_case_document_segment_and_fact(session)
        analysis_run = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={"ready_for_analysis": True},
            input_fact_ids=[fact.id],
        )
        session.add(analysis_run)
        session.flush()

        session.add(
            AnalysisFinding(
                analysis_run_id=analysis_run.id,
                case_id=case.id,
                owner_ref="demo-user",
                finding_key="unsupported",
                title="Unsupported",
                summary="Should fail at the database boundary.",
                severity="low",
                claim_type="unsupported_output",
                uncertainty_state="supported",
            )
        )

        with pytest.raises(IntegrityError):
            session.commit()


def _engine_with_fk(tmp_path, name: str = "analysis.db"):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / name}")

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_conn, _connection_record):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    return engine


def test_analysis_evidence_rejects_cross_run_finding(tmp_path) -> None:
    engine = _engine_with_fk(tmp_path)
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case, fact = add_case_document_segment_and_fact(session)

        run_a = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={},
            input_fact_ids=[],
        )
        run_b = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={},
            input_fact_ids=[],
        )
        session.add_all([run_a, run_b])
        session.flush()

        finding_a = AnalysisFinding(
            analysis_run_id=run_a.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="finding_a",
            title="Finding A",
            summary="Belongs to run A.",
            severity="high",
            claim_type="fact",
            uncertainty_state="supported",
        )
        session.add(finding_a)
        session.flush()

        session.add(
            AnalysisEvidence(
                analysis_run_id=run_b.id,
                case_id=case.id,
                finding_id=finding_a.id,
                evidence_type="fact",
                fact_id=fact.id,
            )
        )

        with pytest.raises(IntegrityError):
            session.flush()


def test_analysis_evidence_rejects_cross_run_calculation(tmp_path) -> None:
    engine = _engine_with_fk(tmp_path, "calc.db")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case, fact = add_case_document_segment_and_fact(session)

        run_a = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={},
            input_fact_ids=[],
        )
        run_b = AnalysisRun(
            case_id=case.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={},
            input_fact_ids=[],
        )
        session.add_all([run_a, run_b])
        session.flush()

        finding_b = AnalysisFinding(
            analysis_run_id=run_b.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="finding_b",
            title="Finding B",
            summary="Belongs to run B.",
            severity="high",
            claim_type="calculation",
            uncertainty_state="supported",
        )
        calc_a = AnalysisCalculation(
            analysis_run_id=run_a.id,
            case_id=case.id,
            calculation_key="calc_a",
            label="Calc A",
            input_fact_ids=[],
            inputs={},
            result={},
        )
        session.add_all([finding_b, calc_a])
        session.flush()

        session.add(
            AnalysisEvidence(
                analysis_run_id=run_b.id,
                case_id=case.id,
                finding_id=finding_b.id,
                evidence_type="calculation",
                calculation_id=calc_a.id,
            )
        )

        with pytest.raises(IntegrityError):
            session.flush()


def test_analysis_evidence_rejects_cross_case_fact(tmp_path) -> None:
    engine = _engine_with_fk(tmp_path, "fact.db")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        case_a, fact_a = add_case_document_segment_and_fact(session)
        case_b, _ = add_case_document_segment_and_fact(session, suffix="B")

        run_b = AnalysisRun(
            case_id=case_b.id,
            owner_ref="demo-user",
            status="completed",
            readiness_snapshot={},
            input_fact_ids=[],
        )
        session.add(run_b)
        session.flush()

        finding_b = AnalysisFinding(
            analysis_run_id=run_b.id,
            case_id=case_b.id,
            owner_ref="demo-user",
            finding_key="finding_b",
            title="Finding B",
            summary="Belongs to case B.",
            severity="high",
            claim_type="fact",
            uncertainty_state="supported",
        )
        session.add(finding_b)
        session.flush()

        session.add(
            AnalysisEvidence(
                analysis_run_id=run_b.id,
                case_id=case_b.id,
                finding_id=finding_b.id,
                evidence_type="fact",
                fact_id=fact_a.id,
            )
        )

        with pytest.raises(IntegrityError):
            session.flush()


def add_case_document_segment_and_fact(
    session, *, suffix: str = ""
) -> tuple[Case, ConsumerCreditFact]:
    case = Case(
        owner_ref="demo-user",
        title=f"Credito casa {suffix}".strip(),
        case_stage="after_signing",
        document_type="consumer_credit",
        analysis_plan="after_signing_discrepancy",
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
        checksum_sha256=("c" if not suffix else "d") * 64,
        storage_key=f"demo-user/{case.id}/contrato{suffix}.pdf",
        upload_status="stored",
        extraction_status="extracted",
        retention_state="active",
        delete_after=datetime.now(timezone.utc) + timedelta(days=30),
    )
    session.add(document)
    session.flush()

    segment = ExtractedTextSegment(
        document_id=document.id,
        page_number=1,
        start_offset=0,
        end_offset=9,
        text="68 cuotas",
        extraction_provider="local-text",
    )
    session.add(segment)
    session.flush()

    fact = ConsumerCreditFact(
        case_id=case.id,
        document_id=document.id,
        text_segment_id=segment.id,
        fact_key="payment_count",
        label="Cantidad de cuotas",
        value_kind="integer",
        value_number=68,
        high_impact=True,
        confirmation_status="confirmed",
        source_page_number=1,
        source_snippet="68 cuotas",
        extraction_provider="local-facts",
        confidence=0.98,
    )
    session.add(fact)
    session.flush()

    return case, fact
