from __future__ import annotations

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from api.config import ConsumerCreditAgentSettings
from api.models.analysis import CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
from api.models.base import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import DocumentReceptionistRun
from api.models.reference import OfficialReference, REFERENCE_SCHEMA_VERSION
from api.services.calculations import CalculationResult
from api.services.consumer_credit_provider import (
    ConsumerCreditAgentInput,
    ConsumerCreditProviderError,
    FakeConsumerCreditProvider,
    TimeoutConsumerCreditProvider,
    UnavailableConsumerCreditProvider,
    get_consumer_credit_provider,
)
from api.services.analysis import (
    AgentDisabledError,
    NotReadyError,
    run_agent_analysis,
)


FAKE_SETTINGS = ConsumerCreditAgentSettings(
    enabled=True,
    provider="fake",
    model="fake-consumer-credit-v1",
    timeout_seconds=60,
)

DISABLED_SETTINGS = ConsumerCreditAgentSettings(
    enabled=False,
    provider="fake",
    model="fake-consumer-credit-v1",
    timeout_seconds=60,
)

TIMEOUT_SETTINGS = ConsumerCreditAgentSettings(
    enabled=True,
    provider="fake-timeout",
    model="fake-consumer-credit-v1",
    timeout_seconds=5,
)


def _engine(tmp_path, name: str = "agent.db"):
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


def _seed_case_with_facts(session, facts_spec: list[dict]) -> tuple[Case, list[ConsumerCreditFact]]:
    case = Case(
        owner_ref="demo-user",
        title="Credito prueba agente",
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


class TestProviderFactory:
    def test_fake_provider(self) -> None:
        provider = get_consumer_credit_provider(FAKE_SETTINGS)
        assert isinstance(provider, FakeConsumerCreditProvider)

    def test_timeout_provider(self) -> None:
        provider = get_consumer_credit_provider(TIMEOUT_SETTINGS)
        assert isinstance(provider, TimeoutConsumerCreditProvider)

    def test_unknown_provider(self) -> None:
        settings = ConsumerCreditAgentSettings(
            enabled=True, provider="unknown", model="m", timeout_seconds=60
        )
        provider = get_consumer_credit_provider(settings)
        assert isinstance(provider, UnavailableConsumerCreditProvider)


class TestFakeProvider:
    def test_produces_valid_analysis(self) -> None:
        agent_input = ConsumerCreditAgentInput(
            analysis_run_id="run-1",
            case_id="case-1",
            confirmed_fact_ids=["f1", "f2"],
            calculation_results=[
                CalculationResult(
                    calculation_key="payment_count_delta",
                    label="Diferencia de cuotas",
                    inputs={"contract_payment_count": 68, "expected_payment_count": 60},
                    result={"has_discrepancy": True, "delta": 8},
                    input_fact_ids=["f1", "f2"],
                    missing_input_keys=[],
                ),
            ],
            reference_keys=["cmf-test"],
        )
        provider = FakeConsumerCreditProvider()
        result = provider.analyze(agent_input=agent_input, settings=FAKE_SETTINGS)
        assert result.analysis.status == "completed"
        assert result.analysis.analysis_run_id == "run-1"
        assert result.analysis.case_id == "case-1"
        assert len(result.analysis.findings) == 1
        assert result.analysis.findings[0].finding_key == "payment_count_delta"
        assert result.analysis.findings[0].severity == "high"
        assert result.latency_ms >= 0
        assert result.analysis.inference_metadata.provider == "fake"

    def test_no_discrepancy_yields_no_findings(self) -> None:
        agent_input = ConsumerCreditAgentInput(
            analysis_run_id="run-2",
            case_id="case-2",
            confirmed_fact_ids=["f1"],
            calculation_results=[
                CalculationResult(
                    calculation_key="payment_count_delta",
                    label="Diferencia de cuotas",
                    inputs={"contract_payment_count": 60, "expected_payment_count": 60},
                    result={"has_discrepancy": False, "delta": 0},
                    input_fact_ids=["f1"],
                    missing_input_keys=[],
                ),
            ],
            reference_keys=[],
        )
        provider = FakeConsumerCreditProvider()
        result = provider.analyze(agent_input=agent_input, settings=FAKE_SETTINGS)
        assert len(result.analysis.findings) == 0
        assert "no se detectaron discrepancias" in result.analysis.next_actions[0].lower()


class TestTimeoutProvider:
    def test_raises_provider_error(self) -> None:
        agent_input = ConsumerCreditAgentInput(
            analysis_run_id="run-t",
            case_id="case-t",
            confirmed_fact_ids=[],
            calculation_results=[],
            reference_keys=[],
        )
        provider = TimeoutConsumerCreditProvider()
        with pytest.raises(ConsumerCreditProviderError, match="timed out"):
            provider.analyze(agent_input=agent_input, settings=TIMEOUT_SETTINGS)


class TestUnavailableProvider:
    def test_raises_provider_error(self) -> None:
        agent_input = ConsumerCreditAgentInput(
            analysis_run_id="run-u",
            case_id="case-u",
            confirmed_fact_ids=[],
            calculation_results=[],
            reference_keys=[],
        )
        provider = UnavailableConsumerCreditProvider("missing-provider")
        with pytest.raises(ConsumerCreditProviderError, match="not available"):
            provider.analyze(agent_input=agent_input, settings=FAKE_SETTINGS)


class TestRunAgentAnalysis:
    def test_golden_path_with_discrepancy(self, session: Session) -> None:
        case, facts = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_agent_analysis(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            agent_settings=FAKE_SETTINGS,
        )
        assert run.status == "completed"
        assert run.agent_provider == "fake"
        assert run.model_name == "fake-consumer-credit-v1"
        assert run.latency_ms is not None
        assert run.latency_ms >= 0
        assert run.prompt_tokens == 0
        assert run.cost_usd == 0.0
        assert len(run.findings) > 0
        assert len(run.calculations) > 0

    def test_agent_disabled_raises(self, session: Session) -> None:
        case, _facts = _seed_case_with_facts(session, GOLDEN_FACTS)
        session.commit()

        with pytest.raises(AgentDisabledError):
            run_agent_analysis(
                session,
                case_id=case.id,
                owner_ref="demo-user",
                agent_settings=DISABLED_SETTINGS,
            )

    def test_not_ready_raises(self, session: Session) -> None:
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
            run_agent_analysis(
                session,
                case_id=case.id,
                owner_ref="demo-user",
                agent_settings=FAKE_SETTINGS,
            )

    def test_provider_failure_records_error(self, session: Session) -> None:
        case, facts = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_agent_analysis(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            agent_settings=TIMEOUT_SETTINGS,
        )
        assert run.status == "failed"
        assert "timed out" in run.error_message
        assert len(run.findings) == 0

    def test_run_records_schema_version(self, session: Session) -> None:
        case, facts = _seed_case_with_facts(session, GOLDEN_FACTS)
        _seed_references(session)
        session.commit()

        run = run_agent_analysis(
            session,
            case_id=case.id,
            owner_ref="demo-user",
            agent_settings=FAKE_SETTINGS,
        )
        assert run.schema_version == CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
