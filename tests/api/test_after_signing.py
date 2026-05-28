from __future__ import annotations

from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.services.after_signing import (
    ESCALATION_QUESTION_SPECS,
    MISSING_COMPARISON_LABELS,
)
from api.services.analysis import run_deterministic_analysis
from api.services.references import seed_references


GOLDEN_FACTS = [
    {
        "fact_key": "principal_amount",
        "value_kind": "money",
        "value_number": 6000000.0,
        "label": "Monto del credito",
    },
    {
        "fact_key": "contract_date",
        "value_kind": "date",
        "value_text": "2025-01-15",
        "label": "Fecha del contrato",
    },
    {
        "fact_key": "term_months",
        "value_kind": "integer",
        "value_number": 60,
        "label": "Plazo en meses",
    },
    {
        "fact_key": "payment_count",
        "value_kind": "integer",
        "value_number": 60,
        "label": "Numero de cuotas",
    },
    {
        "fact_key": "installment_amount",
        "value_kind": "money",
        "value_number": 150000.0,
        "label": "Valor de cuota",
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
        "label": "Tasa de interes",
    },
    {
        "fact_key": "total_cost",
        "value_kind": "money",
        "value_number": 9000000.0,
        "label": "Costo total",
    },
]

DISCREPANCY_FACTS = [
    {"fact_key": "principal_amount", "value_kind": "money", "value_number": 6000000.0},
    {"fact_key": "contract_date", "value_kind": "date", "value_text": "2025-01-15"},
    {"fact_key": "term_months", "value_kind": "integer", "value_number": 48},
    {"fact_key": "payment_count", "value_kind": "integer", "value_number": 60},
    {"fact_key": "installment_amount", "value_kind": "money", "value_number": 150000.0},
    {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5},
    {"fact_key": "interest_rate", "value_kind": "percentage", "value_number": 1.2},
    {"fact_key": "total_cost", "value_kind": "money", "value_number": 9000000.0},
]


def _seed_as_case(
    session: Session,
    facts_spec: list[dict],
    extra_doc_roles: list[str] | None = None,
) -> tuple[Case, list[ConsumerCreditFact]]:
    case = Case(
        owner_ref="demo-user",
        title="Credito prueba AS",
        case_stage="after_signing",
        document_type="consumer_credit",
        analysis_plan="after_signing_discrepancy",
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

    run_obj = DocumentReceptionistRun(
        case_id=case.id,
        document_id=doc.id,
        owner_ref="demo-user",
        provider="test-provider",
        model_name="test-model",
        prompt_version="v1",
        media_kind="text",
        status="completed",
    )
    session.add(run_obj)
    session.flush()

    created_facts: list[ConsumerCreditFact] = []
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
        created_facts.append(fact)

    for idx, role in enumerate(extra_doc_roles or []):
        extra_doc = Document(
            case_id=case.id,
            owner_ref="demo-user",
            role=role,
            document_type="consumer_credit",
            original_filename=f"{role}.pdf",
            content_type="application/pdf",
            byte_size=1024,
            checksum_sha256=f"{idx:0>64x}",
            storage_key=f"demo-user/{case.id}/{role}.pdf",
            upload_status="stored",
        )
        session.add(extra_doc)
        session.flush()

        extra_seg = ExtractedTextSegment(
            document_id=extra_doc.id,
            page_number=1,
            start_offset=0,
            end_offset=50,
            text=f"Documento {role}",
            extraction_provider="local-text",
        )
        session.add(extra_seg)
        session.flush()

        extra_run = DocumentReceptionistRun(
            case_id=case.id,
            document_id=extra_doc.id,
            owner_ref="demo-user",
            provider="test-provider",
            model_name="test-model",
            prompt_version="v1",
            media_kind="text",
            status="completed",
        )
        session.add(extra_run)
        session.flush()

    return case, created_facts


class TestDiscrepancyEvidenceAttachment:
    def test_attaches_reference_evidence_to_discrepancy_findings(
        self, session: Session
    ) -> None:
        case, _ = _seed_as_case(session, DISCREPANCY_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        discrepancy_findings = [
            f
            for f in run.findings
            if f.finding_key
            in ("payment_count_delta", "total_paid_check", "term_signal")
        ]
        assert len(discrepancy_findings) > 0

        ref_evidence_count = 0
        for finding in discrepancy_findings:
            for ev in finding.evidence:
                if ev.evidence_type == "reference":
                    ref_evidence_count += 1
                    assert ev.citation_url is not None
                    assert ev.citation_label is not None
                    assert ev.reference_key is not None
        assert ref_evidence_count > 0

    def test_discrepancy_findings_cite_ley_18010(self, session: Session) -> None:
        case, _ = _seed_as_case(session, DISCREPANCY_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        pcd = next(
            (f for f in run.findings if f.finding_key == "payment_count_delta"), None
        )
        assert pcd is not None

        ref_keys = [
            ev.reference_key for ev in pcd.evidence if ev.evidence_type == "reference"
        ]
        assert "ley-chile-18010-operaciones-credito" in ref_keys

    def test_no_reference_evidence_without_seed_data(self, session: Session) -> None:
        case, _ = _seed_as_case(session, DISCREPANCY_FACTS)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        discrepancy_findings = [
            f
            for f in run.findings
            if f.finding_key
            in ("payment_count_delta", "total_paid_check", "term_signal")
        ]
        for finding in discrepancy_findings:
            ref_evidence = [
                e for e in finding.evidence if e.evidence_type == "reference"
            ]
            assert len(ref_evidence) == 0

    def test_consistent_facts_produce_no_discrepancy_findings(
        self, session: Session
    ) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        discrepancy_findings = [
            f
            for f in run.findings
            if f.finding_key in ("payment_count_delta", "total_paid_check")
        ]
        assert len(discrepancy_findings) == 0


class TestComparisonContextFindings:
    def test_missing_comparison_docs_produce_findings(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        assert len(missing_findings) == len(MISSING_COMPARISON_LABELS)

        missing_keys = {f.finding_key for f in missing_findings}
        assert "as_missing_simulation" in missing_keys
        assert "as_missing_offer" in missing_keys

    def test_no_missing_findings_when_simulation_exists(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS, extra_doc_roles=["simulation"])
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        assert len(missing_findings) == 0

    def test_no_missing_findings_when_offer_exists(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS, extra_doc_roles=["offer"])
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        assert len(missing_findings) == 0

    def test_missing_findings_have_correct_metadata(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        for finding in missing_findings:
            assert finding.severity == "low"
            assert finding.claim_type == "fact"
            assert finding.uncertainty_state == "missing_context"
            assert finding.confidence == 1.0

    def test_missing_findings_cite_consumer_protection_law(
        self, session: Session
    ) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        for finding in missing_findings:
            ref_evidence = [
                e for e in finding.evidence if e.evidence_type == "reference"
            ]
            assert len(ref_evidence) > 0
            assert (
                ref_evidence[0].reference_key == "ley-chile-19496-proteccion-consumidor"
            )


class TestEscalationQuestions:
    def test_produces_questions_with_seed_references(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("as_question_")
        ]
        assert len(question_findings) == len(ESCALATION_QUESTION_SPECS)

    def test_question_findings_cite_references(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("as_question_")
        ]
        for finding in question_findings:
            ref_evidence = [
                e for e in finding.evidence if e.evidence_type == "reference"
            ]
            assert len(ref_evidence) > 0, (
                f"Question {finding.finding_key} should cite a reference"
            )

    def test_question_findings_are_low_severity_reference_type(
        self, session: Session
    ) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("as_question_")
        ]
        for finding in question_findings:
            assert finding.severity == "low"
            assert finding.claim_type == "reference"
            assert finding.uncertainty_state == "supported"

    def test_no_questions_without_references(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("as_question_")
        ]
        assert len(question_findings) == 0

    def test_each_question_spec_has_required_fields(self) -> None:
        for spec in ESCALATION_QUESTION_SPECS:
            assert "reference_key" in spec
            assert "finding_key" in spec
            assert spec["finding_key"].startswith("as_question_")
            assert "title" in spec
            assert "summary" in spec


class TestAfterSigningEdgeCases:
    def test_does_not_produce_before_signing_findings(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        bs_findings = [f for f in run.findings if f.finding_key.startswith("bs_")]
        assert len(bs_findings) == 0

    def test_comparator_loan_suppresses_missing_context(self, session: Session) -> None:
        case, _ = _seed_as_case(
            session, GOLDEN_FACTS, extra_doc_roles=["comparator_loan"]
        )
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("as_missing_")
        ]
        assert len(missing_findings) == 0

    def test_display_order_increments_across_finding_types(
        self, session: Session
    ) -> None:
        case, _ = _seed_as_case(session, DISCREPANCY_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        orders = [f.display_order for f in run.findings]
        assert len(orders) == len(set(orders)), "display_order values must be unique"

    def test_run_completes_successfully(self, session: Session) -> None:
        case, _ = _seed_as_case(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert run.status == "completed"
