from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from api.models import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.services.calculations import (
    FactInput,
    calc_fee_sum,
    calc_installment_signal,
    calc_insurance_signals,
    calc_linked_product_signals,
    calc_payment_count_delta,
    calc_rate_cae_signal,
    calc_term_signal,
    calc_total_paid,
    run_all_calculations,
)


def _fi(
    key: str, num: float | None = None, text: str | None = None, fid: str = "f1"
) -> FactInput:
    return FactInput(fact_id=fid, fact_key=key, value_number=num, value_text=text)


class TestPaymentCountDelta:
    def test_golden_60_vs_68(self) -> None:
        facts = {
            "payment_count": [_fi("payment_count", 68, fid="pc1")],
            "term_months": [_fi("term_months", 60, fid="tm1")],
        }
        r = calc_payment_count_delta(facts)
        assert r.calculation_key == "payment_count_delta"
        assert r.result["delta"] == 8
        assert r.result["has_discrepancy"] is True
        assert r.inputs["contract_payment_count"] == 68
        assert r.inputs["expected_payment_count"] == 60
        assert r.missing_input_keys == []
        assert set(r.input_fact_ids) == {"pc1", "tm1"}

    def test_no_discrepancy_when_equal(self) -> None:
        facts = {
            "payment_count": [_fi("payment_count", 60)],
            "term_months": [_fi("term_months", 60)],
        }
        r = calc_payment_count_delta(facts)
        assert r.result["delta"] == 0
        assert r.result["has_discrepancy"] is False

    def test_missing_payment_count(self) -> None:
        facts = {"term_months": [_fi("term_months", 60)]}
        r = calc_payment_count_delta(facts)
        assert "payment_count" in r.missing_input_keys
        assert r.result == {}

    def test_missing_both(self) -> None:
        r = calc_payment_count_delta({})
        assert set(r.missing_input_keys) == {"payment_count", "term_months"}
        assert r.result == {}


class TestTotalPaid:
    def test_discrepancy(self) -> None:
        facts = {
            "installment_amount": [_fi("installment_amount", 150000.0)],
            "payment_count": [_fi("payment_count", 60)],
            "total_cost": [_fi("total_cost", 8500000.0)],
        }
        r = calc_total_paid(facts)
        assert r.result["computed_total_paid"] == 9000000.0
        assert r.result["difference"] == 500000.0
        assert r.result["has_discrepancy"] is True

    def test_no_discrepancy(self) -> None:
        facts = {
            "installment_amount": [_fi("installment_amount", 100000.0)],
            "payment_count": [_fi("payment_count", 12)],
            "total_cost": [_fi("total_cost", 1200000.0)],
        }
        r = calc_total_paid(facts)
        assert r.result["has_discrepancy"] is False

    def test_missing_total_cost(self) -> None:
        facts = {
            "installment_amount": [_fi("installment_amount", 100000.0)],
            "payment_count": [_fi("payment_count", 12)],
        }
        r = calc_total_paid(facts)
        assert r.result["computed_total_paid"] == 1200000.0
        assert "has_discrepancy" not in r.result


class TestInstallmentSignal:
    def test_ratio(self) -> None:
        facts = {
            "principal_amount": [_fi("principal_amount", 6000000.0)],
            "payment_count": [_fi("payment_count", 60)],
            "installment_amount": [_fi("installment_amount", 150000.0)],
        }
        r = calc_installment_signal(facts)
        assert r.result["min_installment_no_interest"] == 100000.0
        assert r.result["ratio_to_minimum"] == 1.5


class TestTermSignal:
    def test_consistent(self) -> None:
        facts = {
            "term_months": [_fi("term_months", 60)],
            "payment_count": [_fi("payment_count", 60)],
        }
        r = calc_term_signal(facts)
        assert r.result["term_matches_count"] is True

    def test_inconsistent(self) -> None:
        facts = {
            "term_months": [_fi("term_months", 60)],
            "payment_count": [_fi("payment_count", 68)],
        }
        r = calc_term_signal(facts)
        assert r.result["term_matches_count"] is False


class TestRateCaeSignal:
    def test_spread(self) -> None:
        facts = {
            "interest_rate": [_fi("interest_rate", 1.2)],
            "cae": [_fi("cae", 18.5)],
        }
        r = calc_rate_cae_signal(facts)
        assert r.result["cae_exceeds_rate"] is True
        assert r.result["spread"] == 17.3


class TestFeeSumSignal:
    def test_multiple_fees(self) -> None:
        facts = {
            "fee": [
                _fi("fee", 50000.0, fid="fee1"),
                _fi("fee", 30000.0, fid="fee2"),
            ],
        }
        r = calc_fee_sum(facts)
        assert r.result["total_fees"] == 80000.0
        assert r.result["fee_count"] == 2
        assert set(r.input_fact_ids) == {"fee1", "fee2"}

    def test_no_fees(self) -> None:
        r = calc_fee_sum({})
        assert "fee" in r.missing_input_keys
        assert r.result == {}


class TestInsuranceSignals:
    def test_detected(self) -> None:
        facts = {
            "insurance": [_fi("insurance", text="seguro de desgravamen obligatorio")],
        }
        r = calc_insurance_signals(facts)
        assert r.result["detected_count"] == 1

    def test_none(self) -> None:
        r = calc_insurance_signals({})
        assert r.result == {"detected_count": 0, "texts": []}


class TestLinkedProductSignals:
    def test_detected(self) -> None:
        facts = {
            "linked_product": [_fi("linked_product", text="cuenta corriente")],
        }
        r = calc_linked_product_signals(facts)
        assert r.result["detected_count"] == 1


class TestBuildFindingSummary:
    def test_fallback_on_missing_template_key(self) -> None:
        from api.services.finding_specs import build_finding_summary
        from api.services.calculations import CalculationResult

        spec = {
            "title": "Fallback title",
            "summary_template": "Missing key: {nonexistent_key}",
        }
        calc = CalculationResult(
            calculation_key="test",
            label="test",
            inputs={},
            result={},
            input_fact_ids=[],
            missing_input_keys=[],
        )
        assert build_finding_summary(spec, calc) == "Fallback title"

    def test_successful_template_render(self) -> None:
        from api.services.finding_specs import build_finding_summary
        from api.services.calculations import CalculationResult

        spec = {
            "title": "Title",
            "summary_template": "Delta is {delta}",
        }
        calc = CalculationResult(
            calculation_key="test",
            label="test",
            inputs={},
            result={"delta": 8},
            input_fact_ids=[],
            missing_input_keys=[],
        )
        assert build_finding_summary(spec, calc) == "Delta is 8"


class TestRunAllCalculations:
    def test_returns_all_eight(self) -> None:
        results = run_all_calculations({})
        assert len(results) == 8
        keys = {r.calculation_key for r in results}
        assert "payment_count_delta" in keys
        assert "total_paid_check" in keys
        assert "fee_sum" in keys


def _engine_with_fk(tmp_path, name: str = "calc_int.db"):
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / name}")

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_conn, _connection_record):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    return engine


def _seed_case_with_facts(
    session, facts_spec: list[dict]
) -> tuple[Case, list[ConsumerCreditFact]]:
    case = Case(
        owner_ref="demo-user",
        title="Credito prueba calculo",
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
        extraction_status="extracted",
        retention_state="active",
        delete_after=datetime.now(timezone.utc) + timedelta(days=30),
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
            source_snippet=f"{spec['fact_key']}: value",
            extraction_provider="local-facts",
            confidence=0.95,
        )
        session.add(fact)
        session.flush()
        created_facts.append(fact)

    return case, created_facts


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
        "value_number": None,
        "value_text": "2024-01-15",
        "label": "Fecha de contrato",
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
        "value_number": 68,
        "label": "Numero de cuotas",
    },
    {
        "fact_key": "installment_amount",
        "value_kind": "money",
        "value_number": 150000.0,
        "label": "Valor de cuota",
    },
    {
        "fact_key": "interest_rate",
        "value_kind": "percentage",
        "value_number": 1.2,
        "label": "Tasa de interes",
    },
    {
        "fact_key": "cae",
        "value_kind": "percentage",
        "value_number": 18.5,
        "label": "CAE",
        "high_impact": True,
    },
    {
        "fact_key": "total_cost",
        "value_kind": "money",
        "value_number": 8500000.0,
        "label": "Costo total",
    },
    {
        "fact_key": "fee",
        "value_kind": "money",
        "value_number": 50000.0,
        "label": "Comision apertura",
    },
    {
        "fact_key": "insurance",
        "value_kind": "text",
        "value_text": "seguro desgravamen",
        "label": "Seguro asociado",
    },
]


class TestAnalysisServiceIntegration:
    def test_golden_68_vs_60_produces_findings(self, tmp_path) -> None:
        from api.services.analysis import run_deterministic_analysis

        engine = _engine_with_fk(tmp_path)
        Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        Base.metadata.create_all(bind=engine)

        with Session() as session:
            case, facts = _seed_case_with_facts(session, GOLDEN_FACTS)
            session.commit()

            run = run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )

            assert run.status == "completed"
            assert len(run.calculations) == 8

            finding_keys = {f.finding_key for f in run.findings}
            assert "payment_count_delta" in finding_keys
            assert "total_paid_check" in finding_keys
            assert "term_signal" in finding_keys

            pcd_finding = next(
                f for f in run.findings if f.finding_key == "payment_count_delta"
            )
            assert pcd_finding.severity == "high"
            assert pcd_finding.claim_type == "calculation"
            assert pcd_finding.confidence == 1.0
            assert len(pcd_finding.evidence) >= 1

            calc_evidence = [
                e for e in pcd_finding.evidence if e.evidence_type == "calculation"
            ]
            assert len(calc_evidence) == 1
            assert calc_evidence[0].calculation_key == "payment_count_delta"

            fact_evidence = [
                e for e in pcd_finding.evidence if e.evidence_type == "fact"
            ]
            assert len(fact_evidence) >= 1

    def test_no_findings_when_consistent(self, tmp_path) -> None:
        from api.services.analysis import run_deterministic_analysis

        engine = _engine_with_fk(tmp_path, "consistent.db")
        Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        Base.metadata.create_all(bind=engine)

        consistent_facts = [
            {
                "fact_key": "principal_amount",
                "value_kind": "money",
                "value_number": 6000000.0,
                "label": "Monto",
            },
            {
                "fact_key": "contract_date",
                "value_kind": "date",
                "value_text": "2024-01-15",
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
                "value_number": 60,
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
                "value_number": 18.5,
                "label": "CAE",
            },
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 9000000.0,
                "label": "Total",
            },
        ]

        with Session() as session:
            case, facts = _seed_case_with_facts(session, consistent_facts)
            session.commit()

            run = run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )

            assert run.status == "completed"
            discrepancy_findings = [
                f for f in run.findings if f.claim_type == "calculation"
            ]
            assert len(discrepancy_findings) == 0
            assert len(run.calculations) == 8

    def test_not_ready_raises(self, tmp_path) -> None:
        from api.services.analysis import NotReadyError, run_deterministic_analysis

        engine = _engine_with_fk(tmp_path, "notready.db")
        Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        Base.metadata.create_all(bind=engine)

        with Session() as session:
            case = Case(
                owner_ref="demo-user",
                title="Case sin facts",
                case_stage="after_signing",
                document_type="consumer_credit",
                analysis_plan="after_signing_discrepancy",
                institution_name="Banco X",
            )
            session.add(case)
            session.commit()

            with pytest.raises(NotReadyError):
                run_deterministic_analysis(
                    session, case_id=case.id, owner_ref="demo-user"
                )

    def test_pending_facts_excluded(self, tmp_path) -> None:
        from api.services.analysis import run_deterministic_analysis

        engine = _engine_with_fk(tmp_path, "pending.db")
        Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        Base.metadata.create_all(bind=engine)

        mixed_facts = [
            {
                "fact_key": "principal_amount",
                "value_kind": "money",
                "value_number": 6000000.0,
                "label": "Monto",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "contract_date",
                "value_kind": "date",
                "value_text": "2024-01-15",
                "label": "Fecha",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "term_months",
                "value_kind": "integer",
                "value_number": 60,
                "label": "Plazo",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "payment_count",
                "value_kind": "integer",
                "value_number": 68,
                "label": "Cuotas",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "installment_amount",
                "value_kind": "money",
                "value_number": 150000.0,
                "label": "Cuota",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "cae",
                "value_kind": "percentage",
                "value_number": 18.5,
                "label": "CAE",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "total_cost",
                "value_kind": "money",
                "value_number": 8500000.0,
                "label": "Total",
                "confirmation_status": "confirmed",
            },
            {
                "fact_key": "payment_count",
                "value_kind": "integer",
                "value_number": 60,
                "label": "Cuotas wrong",
                "confirmation_status": "pending",
                "high_impact": False,
            },
        ]

        with Session() as session:
            case, facts = _seed_case_with_facts(session, mixed_facts)
            session.commit()

            run = run_deterministic_analysis(
                session, case_id=case.id, owner_ref="demo-user"
            )

            pcd_calc = next(
                c
                for c in run.calculations
                if c.calculation_key == "payment_count_delta"
            )
            assert pcd_calc.inputs["contract_payment_count"] == 68
