from __future__ import annotations

from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.services.analysis import run_deterministic_analysis
from api.services.before_signing import (
    BEFORE_SIGNING_OPTIONAL_FACTS,
    NEGOTIATION_QUESTION_SPECS,
)
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


def _seed_case_with_facts(
    session,
    facts_spec: list[dict],
) -> tuple[Case, list[ConsumerCreditFact]]:
    case = Case(
        owner_ref="demo-user",
        title="Credito prueba BS",
        case_stage="before_signing",
        document_type="consumer_credit",
        analysis_plan="before_signing_review",
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
            source_snippet=f"{spec['fact_key']}: value",
            extraction_provider="local-facts",
            confidence=0.95,
        )
        session.add(fact)
        session.flush()
        created_facts.append(fact)

    return case, created_facts


class TestReferenceEvidenceAttachment:
    def test_attaches_reference_evidence_to_findings(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        bs_findings = [f for f in run.findings if f.finding_key.startswith("bs_")]
        assert len(bs_findings) > 0

        ref_evidence_count = 0
        for finding in bs_findings:
            for ev in finding.evidence:
                if ev.evidence_type == "reference":
                    ref_evidence_count += 1
                    assert ev.citation_url is not None
                    assert ev.citation_label is not None
                    assert ev.reference_key is not None
        assert ref_evidence_count > 0

    def test_rate_finding_cites_cmf_reference(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        rate_finding = next(
            (f for f in run.findings if f.finding_key == "bs_rate_comparison"), None
        )
        assert rate_finding is not None

        ref_keys = [
            ev.reference_key
            for ev in rate_finding.evidence
            if ev.evidence_type == "reference"
        ]
        assert "cmf-tasa-maxima-convencional" in ref_keys

    def test_no_reference_evidence_without_seed_data(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        for finding in run.findings:
            ref_evidence = [
                e for e in finding.evidence if e.evidence_type == "reference"
            ]
            assert len(ref_evidence) == 0


class TestMissingInfoFindings:
    def test_missing_optional_facts_produce_findings(self, session: Session) -> None:
        """All readiness-required facts present, but no optional facts (rate, fee, insurance, linked_product)."""
        required_only = [
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
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5},
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
            },
        ]
        case, _ = _seed_case_with_facts(session, required_only)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_missing_")
        ]
        assert len(missing_findings) > 0

        missing_keys = {f.finding_key for f in missing_findings}
        assert "bs_missing_interest_rate" in missing_keys
        assert "bs_missing_fee" in missing_keys
        assert "bs_missing_insurance" in missing_keys
        assert "bs_missing_linked_product" in missing_keys

    def test_no_missing_findings_with_all_facts(self, session: Session) -> None:
        all_facts = GOLDEN_FACTS + [
            {
                "fact_key": "fee",
                "value_kind": "money",
                "value_number": 50000.0,
                "label": "Comision",
            },
            {
                "fact_key": "insurance",
                "value_kind": "text",
                "value_text": "Seguro desgravamen",
                "label": "Seguro",
            },
            {
                "fact_key": "linked_product",
                "value_kind": "text",
                "value_text": "Cuenta corriente",
                "label": "Producto vinculado",
            },
        ]
        case, _ = _seed_case_with_facts(session, all_facts)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_missing_")
        ]
        assert len(missing_findings) == 0

    def test_missing_findings_have_missing_context_state(
        self, session: Session
    ) -> None:
        required_only = [
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
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5},
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
            },
        ]
        case, _ = _seed_case_with_facts(session, required_only)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_missing_")
        ]
        for finding in missing_findings:
            assert finding.uncertainty_state == "missing_context"
            assert finding.claim_type == "fact"
            assert finding.severity == "medium"

    def test_missing_findings_cite_references_when_available(
        self, session: Session
    ) -> None:
        required_only = [
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
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5},
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
            },
        ]
        case, _ = _seed_case_with_facts(session, required_only)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        rate_missing = next(
            (f for f in run.findings if f.finding_key == "bs_missing_interest_rate"),
            None,
        )
        assert rate_missing is not None
        ref_evidence = [
            e for e in rate_missing.evidence if e.evidence_type == "reference"
        ]
        assert len(ref_evidence) > 0
        assert ref_evidence[0].reference_key == "cmf-tasa-maxima-convencional"

    def test_each_optional_fact_has_missing_label(self) -> None:
        from api.services.before_signing import MISSING_INFO_LABELS

        for fact_key in BEFORE_SIGNING_OPTIONAL_FACTS:
            assert fact_key in MISSING_INFO_LABELS, (
                f"Optional fact {fact_key} has no missing-info label"
            )


class TestNegotiationQuestions:
    def test_produces_questions_with_seed_references(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_question_")
        ]
        assert len(question_findings) > 0

    def test_question_findings_cite_references(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_question_")
        ]
        for finding in question_findings:
            ref_evidence = [
                e for e in finding.evidence if e.evidence_type == "reference"
            ]
            assert len(ref_evidence) > 0, (
                f"Question {finding.finding_key} should cite a reference"
            )

    def test_question_findings_are_low_severity(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_question_")
        ]
        for finding in question_findings:
            assert finding.severity == "low"
            assert finding.claim_type == "reference"

    def test_no_questions_without_references(self, session: Session) -> None:
        case, _ = _seed_case_with_facts(session, GOLDEN_FACTS)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        question_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_question_")
        ]
        assert len(question_findings) == 0

    def test_each_question_spec_has_reference_key(self) -> None:
        for spec in NEGOTIATION_QUESTION_SPECS:
            assert "reference_key" in spec
            assert "finding_key" in spec
            assert spec["finding_key"].startswith("bs_question_")


class TestEdgeCases:
    def test_zero_value_facts_still_produce_findings(self, session: Session) -> None:
        zero_facts = [
            {
                "fact_key": "principal_amount",
                "value_kind": "money",
                "value_number": 0.0,
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
                "value_number": 0.0,
            },
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 0.0},
            {
                "fact_key": "interest_rate",
                "value_kind": "percentage",
                "value_number": 0.0,
            },
            {"fact_key": "total_cost", "value_kind": "money", "value_number": 0.0},
        ]
        case, _ = _seed_case_with_facts(session, zero_facts)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert run.status == "completed"
        missing_findings = [
            f for f in run.findings if f.finding_key == "bs_missing_interest_rate"
        ]
        assert len(missing_findings) == 0

    def test_required_only_produces_all_optional_missing(
        self, session: Session
    ) -> None:
        required_only = [
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
            {"fact_key": "cae", "value_kind": "percentage", "value_number": 28.5},
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
            },
        ]
        case, _ = _seed_case_with_facts(session, required_only)
        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )
        assert run.status == "completed"

        missing_findings = [
            f for f in run.findings if f.finding_key.startswith("bs_missing_")
        ]
        assert len(missing_findings) == len(BEFORE_SIGNING_OPTIONAL_FACTS)

    def test_after_signing_path_unchanged(self, session: Session) -> None:
        case = Case(
            owner_ref="demo-user",
            title="After signing case",
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
            checksum_sha256="c" * 64,
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
            text="Contrato",
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

        for spec in GOLDEN_FACTS:
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

        seed_references(session)
        session.commit()

        run = run_deterministic_analysis(
            session, case_id=case.id, owner_ref="demo-user"
        )

        bs_findings = [f for f in run.findings if f.finding_key.startswith("bs_")]
        assert len(bs_findings) == 0, (
            "After-signing path should not produce before-signing findings"
        )
