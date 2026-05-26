from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.config import ConsumerCreditAgentSettings
from api.models.analysis import (
    CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
    CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION,
    AnalysisCalculation,
    AnalysisEvidence,
    AnalysisFinding,
    AnalysisRun,
    UnsupportedAnalysisOutput,
)
from api.models.case import Case
from api.models.extraction import ConsumerCreditFact
from api.services.calculations import (
    CalculationResult,
    FactInput,
    run_all_calculations,
)


class AnalysisServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class CaseNotFoundError(AnalysisServiceError):
    pass


class NotReadyError(AnalysisServiceError):
    pass


class RunNotFoundError(AnalysisServiceError):
    pass


class AgentDisabledError(AnalysisServiceError):
    pass


CONFIRMED_STATUSES = {"confirmed", "corrected"}


FINDING_SPECS: dict[str, dict] = {
    "payment_count_delta": {
        "title": "Cantidad de cuotas no coincide con el plazo",
        "summary_template": (
            "El contrato indica {contract_payment_count} cuotas pero el plazo "
            "es de {expected_payment_count} meses (diferencia: {delta})."
        ),
        "severity": "high",
        "discrepancy_key": "has_discrepancy",
    },
    "total_paid_check": {
        "title": "Total pagado no coincide con cuota x cantidad",
        "summary_template": (
            "Cuota ({installment_amount}) x cantidad ({payment_count}) = "
            "{computed_total_paid}, pero el costo total declarado es "
            "{stated_total_cost} (diferencia: {difference})."
        ),
        "severity": "high",
        "discrepancy_key": "has_discrepancy",
    },
    "term_signal": {
        "title": "Plazo y cantidad de cuotas no son consistentes",
        "summary_template": (
            "El plazo es {term_months} meses pero hay {payment_count} cuotas."
        ),
        "severity": "medium",
        "discrepancy_key": "term_matches_count",
        "discrepancy_inverted": True,
    },
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise CaseNotFoundError("case not found")
    return case


def _load_confirmed_facts(
    session: Session, case_id: str
) -> list[ConsumerCreditFact]:
    stmt = (
        select(ConsumerCreditFact)
        .where(
            ConsumerCreditFact.case_id == case_id,
            ConsumerCreditFact.confirmation_status.in_(CONFIRMED_STATUSES),
        )
        .order_by(ConsumerCreditFact.fact_key, ConsumerCreditFact.created_at)
    )
    return list(session.scalars(stmt))


def _facts_to_input_map(
    facts: list[ConsumerCreditFact],
) -> dict[str, list[FactInput]]:
    grouped: dict[str, list[FactInput]] = {}
    for fact in facts:
        entry = FactInput(
            fact_id=fact.id,
            fact_key=fact.fact_key,
            value_number=fact.value_number,
            value_text=fact.value_text,
        )
        grouped.setdefault(fact.fact_key, []).append(entry)
    return grouped


def _build_finding_summary(spec: dict, calc: CalculationResult) -> str:
    merged = {**calc.inputs, **calc.result}
    try:
        return spec["summary_template"].format(**merged)
    except KeyError:
        return spec["title"]


def _has_discrepancy(spec: dict, calc: CalculationResult) -> bool:
    key = spec.get("discrepancy_key")
    if key is None:
        return False
    value = calc.result.get(key)
    if value is None:
        return False
    if spec.get("discrepancy_inverted"):
        return not value
    return bool(value)


def run_deterministic_analysis(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> AnalysisRun:
    _ensure_case(session, case_id, owner_ref)

    from api.services.receptionist_gaps import get_analysis_readiness

    readiness = get_analysis_readiness(
        session, case_id=case_id, owner_ref=owner_ref
    )
    if not readiness.ready_for_analysis:
        raise NotReadyError(
            f"case not ready for analysis: {', '.join(readiness.blockers)}"
        )

    confirmed_facts = _load_confirmed_facts(session, case_id)
    fact_map = _facts_to_input_map(confirmed_facts)

    readiness_snapshot = {
        "fact_count": len(confirmed_facts),
        "fact_keys": sorted({f.fact_key for f in confirmed_facts}),
        "blockers": readiness.blockers,
    }

    run = AnalysisRun(
        case_id=case_id,
        owner_ref=owner_ref,
        schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        status="running",
        readiness_snapshot=readiness_snapshot,
        input_fact_ids=[f.id for f in confirmed_facts],
        started_at=_utcnow(),
    )
    session.add(run)
    session.flush()

    calc_results = run_all_calculations(fact_map)
    calc_models: dict[str, AnalysisCalculation] = {}
    for cr in calc_results:
        calc_model = AnalysisCalculation(
            analysis_run_id=run.id,
            case_id=case_id,
            calculation_key=cr.calculation_key,
            label=cr.label,
            formula_version=CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION,
            input_fact_ids=cr.input_fact_ids,
            inputs=cr.inputs,
            result=cr.result,
            missing_input_keys=cr.missing_input_keys,
        )
        session.add(calc_model)
        session.flush()
        calc_models[cr.calculation_key] = calc_model

    display_order = 0
    for cr in calc_results:
        spec = FINDING_SPECS.get(cr.calculation_key)
        if spec is None:
            continue
        if not _has_discrepancy(spec, cr):
            continue

        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=cr.calculation_key,
            title=spec["title"],
            summary=_build_finding_summary(spec, cr),
            severity=spec["severity"],
            claim_type="calculation",
            uncertainty_state="supported",
            confidence=1.0,
            display_order=display_order,
        )
        session.add(finding)
        session.flush()
        display_order += 1

        calc_model = calc_models[cr.calculation_key]
        evidence = AnalysisEvidence(
            analysis_run_id=run.id,
            case_id=case_id,
            finding_id=finding.id,
            evidence_type="calculation",
            calculation_id=calc_model.id,
            calculation_key=cr.calculation_key,
            schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        )
        session.add(evidence)

        for fact_id in cr.input_fact_ids:
            fact_evidence = AnalysisEvidence(
                analysis_run_id=run.id,
                case_id=case_id,
                finding_id=finding.id,
                evidence_type="fact",
                fact_id=fact_id,
                schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
            )
            session.add(fact_evidence)

    run.status = "completed"
    run.completed_at = _utcnow()
    session.commit()
    session.refresh(run)
    return run


def run_agent_analysis(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
    agent_settings: ConsumerCreditAgentSettings,
) -> AnalysisRun:
    if not agent_settings.enabled:
        raise AgentDisabledError("consumer credit agent is disabled")

    _ensure_case(session, case_id, owner_ref)

    from api.services.receptionist_gaps import get_analysis_readiness

    readiness = get_analysis_readiness(
        session, case_id=case_id, owner_ref=owner_ref
    )
    if not readiness.ready_for_analysis:
        raise NotReadyError(
            f"case not ready for analysis: {', '.join(readiness.blockers)}"
        )

    confirmed_facts = _load_confirmed_facts(session, case_id)
    fact_map = _facts_to_input_map(confirmed_facts)

    readiness_snapshot = {
        "fact_count": len(confirmed_facts),
        "fact_keys": sorted({f.fact_key for f in confirmed_facts}),
        "blockers": readiness.blockers,
    }

    run = AnalysisRun(
        case_id=case_id,
        owner_ref=owner_ref,
        schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        status="running",
        readiness_snapshot=readiness_snapshot,
        input_fact_ids=[f.id for f in confirmed_facts],
        agent_provider=agent_settings.provider,
        model_name=agent_settings.model,
        started_at=_utcnow(),
    )
    session.add(run)
    session.flush()

    calc_results = run_all_calculations(fact_map)
    calc_models: dict[str, AnalysisCalculation] = {}
    for cr in calc_results:
        calc_model = AnalysisCalculation(
            analysis_run_id=run.id,
            case_id=case_id,
            calculation_key=cr.calculation_key,
            label=cr.label,
            formula_version=CONSUMER_CREDIT_CALCULATION_FORMULA_VERSION,
            input_fact_ids=cr.input_fact_ids,
            inputs=cr.inputs,
            result=cr.result,
            missing_input_keys=cr.missing_input_keys,
        )
        session.add(calc_model)
        session.flush()
        calc_models[cr.calculation_key] = calc_model

    from api.agents.consumer_credit import ConsumerCreditAgent
    from api.services.consumer_credit_provider import (
        ConsumerCreditAgentInput,
        ConsumerCreditProviderError,
    )
    from api.services.references import list_references

    active_refs = list_references(session)
    agent_input = ConsumerCreditAgentInput(
        analysis_run_id=run.id,
        case_id=case_id,
        confirmed_fact_ids=[f.id for f in confirmed_facts],
        calculation_results=calc_results,
        reference_keys=[r.reference_key for r in active_refs],
    )

    try:
        agent = ConsumerCreditAgent(agent_settings)
        result = agent.analyze(agent_input=agent_input)

        run.prompt_version = result.analysis.inference_metadata.prompt_version
        run.prompt_tokens = result.prompt_tokens
        run.completion_tokens = result.completion_tokens
        run.latency_ms = result.latency_ms
        run.cost_usd = result.cost_usd

        for finding_data in result.analysis.findings:
            finding = AnalysisFinding(
                analysis_run_id=run.id,
                case_id=case_id,
                owner_ref=owner_ref,
                finding_key=finding_data.finding_key,
                title=finding_data.title,
                summary=finding_data.summary,
                severity=finding_data.severity,
                claim_type=finding_data.claim_type,
                uncertainty_state=finding_data.uncertainty_state,
                confidence=finding_data.confidence,
                display_order=finding_data.display_order,
            )
            session.add(finding)
            session.flush()

            for ev_data in finding_data.evidence:
                calc_id = None
                if ev_data.calculation_key and ev_data.calculation_key in calc_models:
                    calc_id = calc_models[ev_data.calculation_key].id

                evidence = AnalysisEvidence(
                    analysis_run_id=run.id,
                    case_id=case_id,
                    finding_id=finding.id,
                    evidence_type=ev_data.evidence_type,
                    fact_id=ev_data.fact_id,
                    calculation_id=calc_id or ev_data.calculation_id,
                    calculation_key=ev_data.calculation_key,
                    citation_url=ev_data.citation.url if ev_data.citation else None,
                    citation_label=ev_data.citation.label if ev_data.citation else None,
                    reference_key=ev_data.citation.reference_key if ev_data.citation else None,
                    citation_retrieved_at=ev_data.citation.retrieved_at if ev_data.citation else None,
                    citation_verified_at=ev_data.citation.verified_at if ev_data.citation else None,
                    excerpt=ev_data.excerpt,
                    inference_summary=ev_data.inference_summary,
                    model_name=ev_data.model_name,
                    schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
                )
                session.add(evidence)

        for unsupported in result.analysis.unsupported_outputs:
            session.add(
                UnsupportedAnalysisOutput(
                    analysis_run_id=run.id,
                    case_id=case_id,
                    output_key=unsupported.output_key,
                    raw_output=unsupported.raw_output,
                    reason=unsupported.reason,
                )
            )

        run.status = "completed"
        run.completed_at = _utcnow()

    except ConsumerCreditProviderError as exc:
        run.status = "failed"
        run.error_message = f"[{exc.code}] {exc.detail}"
        run.completed_at = _utcnow()
    except Exception as exc:
        run.status = "failed"
        run.error_message = f"[unexpected] {type(exc).__name__}: {exc}"
        run.completed_at = _utcnow()

    session.commit()
    session.refresh(run)
    return run


def list_analysis_runs(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> list[AnalysisRun]:
    _ensure_case(session, case_id, owner_ref)
    stmt = (
        select(AnalysisRun)
        .where(AnalysisRun.case_id == case_id)
        .order_by(AnalysisRun.created_at.desc())
    )
    return list(session.scalars(stmt))


def get_analysis_run(
    session: Session,
    *,
    case_id: str,
    run_id: str,
    owner_ref: str,
) -> AnalysisRun:
    _ensure_case(session, case_id, owner_ref)
    stmt = select(AnalysisRun).where(
        AnalysisRun.id == run_id,
        AnalysisRun.case_id == case_id,
    )
    run = session.scalar(stmt)
    if run is None:
        raise RunNotFoundError("analysis run not found")
    return run
