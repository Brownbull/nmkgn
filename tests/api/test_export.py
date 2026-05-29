from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from api.models.analysis import (
    AnalysisCalculation,
    AnalysisEvidence,
    AnalysisFinding,
    AnalysisRun,
)
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.services.export import (
    CaseNotFoundError,
    EmptySelectionError,
    NoCompletedRunError,
    export_findings,
)


def _seed_case_with_run(
    session: Session,
    *,
    owner_ref: str = "demo-user",
    run_status: str = "completed",
) -> tuple[Case, AnalysisRun, AnalysisFinding, ConsumerCreditFact]:
    case = Case(
        owner_ref=owner_ref,
        title="Export test",
        case_stage="after_signing",
        document_type="consumer_credit",
        analysis_plan="after_signing_discrepancy",
        institution_name="Banco Test",
    )
    session.add(case)
    session.flush()

    doc = Document(
        case_id=case.id,
        owner_ref=owner_ref,
        role="primary",
        document_type="consumer_credit",
        original_filename="contrato.pdf",
        content_type="application/pdf",
        byte_size=2048,
        checksum_sha256="a" * 64,
        storage_key=f"{owner_ref}/{case.id}/contrato.pdf",
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

    rec_run = DocumentReceptionistRun(
        case_id=case.id,
        document_id=doc.id,
        owner_ref=owner_ref,
        provider="test-provider",
        model_name="test-model",
        prompt_version="v1",
        media_kind="text",
        status="completed",
    )
    session.add(rec_run)
    session.flush()

    fact = ConsumerCreditFact(
        case_id=case.id,
        document_id=doc.id,
        text_segment_id=seg.id,
        fact_key="principal_amount",
        label="Monto",
        value_kind="money",
        value_number=6000000.0,
        high_impact=True,
        confirmation_status="confirmed",
        source_page_number=1,
        source_snippet="$6.000.000",
        extraction_provider="local-facts",
        confidence=0.95,
    )
    session.add(fact)
    session.flush()

    run = AnalysisRun(
        case_id=case.id,
        owner_ref=owner_ref,
        status=run_status,
        readiness_snapshot={"ready_for_analysis": True},
        input_fact_ids=[fact.id],
    )
    session.add(run)
    session.flush()

    calc = AnalysisCalculation(
        analysis_run_id=run.id,
        case_id=case.id,
        calculation_key="payment_count_delta",
        label="Payment count delta",
        input_fact_ids=[fact.id],
        inputs={"contract_payment_count": 68, "expected_payment_count": 60},
        result={"delta": 8},
    )
    session.add(calc)
    session.flush()

    finding = AnalysisFinding(
        analysis_run_id=run.id,
        case_id=case.id,
        owner_ref=owner_ref,
        finding_key="payment_count_mismatch",
        title="Payment count mismatch",
        summary="The contract has more payments than expected.",
        severity="high",
        claim_type="calculation",
        uncertainty_state="supported",
        confidence=1.0,
        display_order=1,
    )
    session.add(finding)
    session.flush()

    evidence = AnalysisEvidence(
        analysis_run_id=run.id,
        case_id=case.id,
        finding_id=finding.id,
        evidence_type="fact",
        fact_id=fact.id,
        excerpt="68 cuotas",
    )
    calc_evidence = AnalysisEvidence(
        analysis_run_id=run.id,
        case_id=case.id,
        finding_id=finding.id,
        evidence_type="calculation",
        calculation_id=calc.id,
        calculation_key="payment_count_delta",
    )
    session.add_all([evidence, calc_evidence])
    session.flush()

    return case, run, finding, fact


class TestExportFindings:
    def test_exports_finding_with_evidence(self, session: Session) -> None:
        case, run, finding, _ = _seed_case_with_run(session)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[finding.id],
        )
        assert result.case_id == case.id
        assert result.analysis_run_id == run.id
        assert result.finding_count == 1
        assert len(result.findings) == 1
        assert result.findings[0].finding_id == finding.id
        assert result.findings[0].title == "Payment count mismatch"
        assert len(result.findings[0].evidence) == 2
        assert result.rejected == []

    def test_preserves_display_order(self, session: Session) -> None:
        case, run, finding1, fact = _seed_case_with_run(session)

        finding2 = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="total_paid_excess",
            title="Total paid exceeds expected",
            summary="Total cost is higher than expected.",
            severity="medium",
            claim_type="calculation",
            uncertainty_state="supported",
            display_order=2,
        )
        session.add(finding2)
        session.flush()
        ev = AnalysisEvidence(
            analysis_run_id=run.id,
            case_id=case.id,
            finding_id=finding2.id,
            evidence_type="fact",
            fact_id=fact.id,
            excerpt="$8.500.000",
        )
        session.add(ev)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[finding2.id, finding1.id],
        )
        assert result.finding_count == 2
        assert result.findings[0].finding_key == "payment_count_mismatch"
        assert result.findings[1].finding_key == "total_paid_excess"


class TestExportRejections:
    def test_rejects_missing_finding_id(self, session: Session) -> None:
        case, run, finding, _ = _seed_case_with_run(session)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[finding.id, "nonexistent-id"],
        )
        assert result.finding_count == 1
        assert len(result.rejected) == 1
        assert result.rejected[0].finding_id == "nonexistent-id"
        assert "not found" in result.rejected[0].reason

    def test_rejects_inference_claim_type(self, session: Session) -> None:
        case, run, valid_finding, fact = _seed_case_with_run(session)

        inference_finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="inference_test",
            title="Inference finding",
            summary="LLM-generated insight.",
            severity="low",
            claim_type="inference",
            uncertainty_state="uncertain",
            display_order=10,
        )
        session.add(inference_finding)
        session.flush()
        ev = AnalysisEvidence(
            analysis_run_id=run.id,
            case_id=case.id,
            finding_id=inference_finding.id,
            evidence_type="inference",
            inference_summary="Some inference",
            model_name="test-model",
        )
        session.add(ev)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[valid_finding.id, inference_finding.id],
        )
        assert result.finding_count == 1
        assert len(result.rejected) == 1
        assert result.rejected[0].finding_id == inference_finding.id
        assert "unsupported claim type" in result.rejected[0].reason

    def test_rejects_finding_without_evidence(self, session: Session) -> None:
        case, run, valid_finding, _ = _seed_case_with_run(session)

        bare_finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="bare_test",
            title="Bare finding",
            summary="No evidence attached.",
            severity="low",
            claim_type="fact",
            uncertainty_state="supported",
            display_order=10,
        )
        session.add(bare_finding)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[valid_finding.id, bare_finding.id],
        )
        assert result.finding_count == 1
        rejected_ids = {r.finding_id for r in result.rejected}
        assert bare_finding.id in rejected_ids
        bare_rejection = [r for r in result.rejected if r.finding_id == bare_finding.id]
        assert "no evidence" in bare_rejection[0].reason

    def test_all_rejected_raises_empty_selection(self, session: Session) -> None:
        case, run, _, _ = _seed_case_with_run(session)

        bare_finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case.id,
            owner_ref="demo-user",
            finding_key="bare_only",
            title="Bare only",
            summary="No evidence.",
            severity="low",
            claim_type="fact",
            uncertainty_state="supported",
            display_order=10,
        )
        session.add(bare_finding)
        session.commit()

        with pytest.raises(EmptySelectionError, match="no exportable findings"):
            export_findings(
                session,
                case_id=case.id,
                owner_ref="demo-user",
                finding_ids=[bare_finding.id],
            )


class TestExportErrors:
    def test_case_not_found_raises(self, session: Session) -> None:
        with pytest.raises(CaseNotFoundError):
            export_findings(
                session,
                case_id="nonexistent",
                owner_ref="demo-user",
                finding_ids=["any-id"],
            )

    def test_wrong_owner_raises(self, session: Session) -> None:
        case, _, finding, _ = _seed_case_with_run(session)
        session.commit()

        with pytest.raises(CaseNotFoundError):
            export_findings(
                session,
                case_id=case.id,
                owner_ref="other-user",
                finding_ids=[finding.id],
            )

    def test_no_completed_run_raises(self, session: Session) -> None:
        case, _, _, _ = _seed_case_with_run(session, run_status="failed")
        session.commit()

        with pytest.raises(NoCompletedRunError, match="no completed"):
            export_findings(
                session,
                case_id=case.id,
                owner_ref="demo-user",
                finding_ids=["any-id"],
            )


class TestExportEvidenceMapping:
    def test_evidence_includes_fact_and_calculation_refs(
        self, session: Session
    ) -> None:
        case, _, finding, fact = _seed_case_with_run(session)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[finding.id],
        )
        evidence_types = {e.evidence_type for e in result.findings[0].evidence}
        assert "fact" in evidence_types
        assert "calculation" in evidence_types

        fact_ev = [
            e for e in result.findings[0].evidence if e.evidence_type == "fact"
        ]
        assert fact_ev[0].fact_id == fact.id
        assert fact_ev[0].excerpt == "68 cuotas"

    def test_reference_evidence_includes_citation(self, session: Session) -> None:
        case, run, finding, _ = _seed_case_with_run(session)

        ref_evidence = AnalysisEvidence(
            analysis_run_id=run.id,
            case_id=case.id,
            finding_id=finding.id,
            evidence_type="reference",
            reference_key="cmf-test",
            citation_url="https://cmfchile.cl/test",
            citation_label="CMF Circular Test",
        )
        session.add(ref_evidence)
        session.commit()

        result = export_findings(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            finding_ids=[finding.id],
        )
        ref_items = [
            e for e in result.findings[0].evidence if e.evidence_type == "reference"
        ]
        assert len(ref_items) == 1
        assert ref_items[0].citation_label == "CMF Circular Test"
        assert ref_items[0].citation_url == "https://cmfchile.cl/test"
        assert ref_items[0].reference_key == "cmf-test"


class TestExportRequestValidation:
    def test_deduplicates_finding_ids(self) -> None:
        from api.schemas.export import ExportRequest

        req = ExportRequest(finding_ids=["a", "b", "a", "c", "b"])
        assert req.finding_ids == ["a", "b", "c"]

    def test_rejects_empty_list(self) -> None:
        from api.schemas.export import ExportRequest

        with pytest.raises(Exception):
            ExportRequest(finding_ids=[])

    def test_rejects_blank_entries(self) -> None:
        from api.schemas.export import ExportRequest

        with pytest.raises(Exception):
            ExportRequest(finding_ids=["valid", "  "])
