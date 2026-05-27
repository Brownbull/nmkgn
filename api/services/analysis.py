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


class InvalidAnalysisPlanError(AnalysisServiceError):
    pass


CONFIRMED_STATUSES = {"confirmed", "corrected"}

VALID_ANALYSIS_PLANS = {"before_signing_review", "after_signing_discrepancy"}

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


BEFORE_SIGNING_FINDING_SPECS: dict[str, dict] = {
    "bs_rate_comparison": {
        "calculation_key": "rate_cae_signal",
        "title": "Tasa de interés y CAE del crédito",
        "summary_template": (
            "La tasa de interés es {interest_rate}% y el CAE es {cae}% "
            "(diferencia: {spread} puntos). Vale la pena confirmar cómo "
            "se compara con las tasas máximas vigentes."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_total_cost": {
        "calculation_key": "total_paid_check",
        "title": "Costo total del crédito",
        "summary_template": (
            "Cuota ({installment_amount}) x cantidad ({payment_count}) = "
            "{computed_total_paid}. El costo total declarado es "
            "{stated_total_cost}."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_installment_ratio": {
        "calculation_key": "installment_signal",
        "title": "Relación cuota mensual vs capital",
        "summary_template": (
            "La cuota mínima sin interés sería {min_installment_no_interest}, "
            "pero la cuota declarada es {stated_installment} "
            "(ratio: {ratio_to_minimum}x)."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
    "bs_fee_summary": {
        "calculation_key": "fee_sum",
        "title": "Comisiones y cargos del crédito",
        "summary_template": (
            "Se detectaron {fee_count} cobros por un total de {total_fees}. "
            "Vale la pena confirmar si todos son obligatorios."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_insurance_review": {
        "calculation_key": "insurance_signals",
        "title": "Seguros asociados al crédito",
        "summary_template": (
            "Se detectaron {detected_count} seguros asociados. "
            "Vale la pena confirmar cuáles son opcionales."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
    "bs_linked_products": {
        "calculation_key": "linked_product_signals",
        "title": "Productos vinculados al crédito",
        "summary_template": (
            "Se detectaron {detected_count} productos vinculados. "
            "Vale la pena confirmar si son requisito para obtener el crédito."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
}


def _should_fire_finding(spec: dict, calc: CalculationResult) -> bool:
    trigger = spec.get("trigger")
    if trigger == "any_result":
        return bool(calc.result) and not calc.missing_input_keys
    key = spec.get("discrepancy_key")
    if key is None:
        return False
    value = calc.result.get(key)
    if value is None:
        return False
    if spec.get("discrepancy_inverted"):
        return not value
    return bool(value)


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


def _specs_for_plan(analysis_plan: str) -> dict[str, dict]:
    if analysis_plan == "before_signing_review":
        return BEFORE_SIGNING_FINDING_SPECS
    return FINDING_SPECS


def _generate_plan_findings(
    specs: dict[str, dict],
    calc_results: list[CalculationResult],
    calc_models: dict[str, AnalysisCalculation],
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    session: Session,
) -> None:
    calc_map = {cr.calculation_key: cr for cr in calc_results}
    display_order = 0

    for finding_key, spec in specs.items():
        calc_key = spec.get("calculation_key", finding_key)
        cr = calc_map.get(calc_key)
        if cr is None:
            continue
        if not _should_fire_finding(spec, cr):
            continue

        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=finding_key,
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

        calc_model = calc_models.get(calc_key)
        if calc_model is not None:
            evidence = AnalysisEvidence(
                analysis_run_id=run.id,
                case_id=case_id,
                finding_id=finding.id,
                evidence_type="calculation",
                calculation_id=calc_model.id,
                calculation_key=calc_key,
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


def run_deterministic_analysis(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> AnalysisRun:
    case = _ensure_case(session, case_id, owner_ref)

    analysis_plan = case.analysis_plan
    if analysis_plan not in VALID_ANALYSIS_PLANS:
        raise InvalidAnalysisPlanError(
            f"unsupported analysis_plan: {analysis_plan!r}"
        )

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
        "analysis_plan": analysis_plan,
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

    specs = _specs_for_plan(analysis_plan)
    _generate_plan_findings(
        specs, calc_results, calc_models, run, case_id, owner_ref, session
    )

    if analysis_plan == "before_signing_review":
        from api.services.before_signing import (
            attach_reference_evidence,
            generate_missing_info_findings,
            generate_negotiation_questions,
        )

        bs_findings = [f for f in run.findings if f.finding_key.startswith("bs_")]
        attach_reference_evidence(session, bs_findings, run, case_id)

        next_order = len(run.findings)
        missing = generate_missing_info_findings(
            fact_map, run, case_id, owner_ref, session,
            start_display_order=next_order,
        )
        next_order += len(missing)
        generate_negotiation_questions(
            session, run, case_id, owner_ref,
            start_display_order=next_order,
        )

    elif analysis_plan == "after_signing_discrepancy":
        from api.services.after_signing import (
            attach_discrepancy_evidence,
            generate_comparison_context_findings,
            generate_escalation_questions,
        )

        as_findings = list(run.findings)
        attach_discrepancy_evidence(session, as_findings, run, case_id)

        next_order = len(run.findings)
        context = generate_comparison_context_findings(
            session, run, case_id, owner_ref,
            start_display_order=next_order,
        )
        next_order += len(context)
        generate_escalation_questions(
            session, run, case_id, owner_ref,
            start_display_order=next_order,
        )

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

    case = _ensure_case(session, case_id, owner_ref)

    analysis_plan = case.analysis_plan
    if analysis_plan not in VALID_ANALYSIS_PLANS:
        raise InvalidAnalysisPlanError(
            f"unsupported analysis_plan: {analysis_plan!r}"
        )

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
        "analysis_plan": analysis_plan,
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
        analysis_plan=analysis_plan,
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

        if analysis_plan == "before_signing_review":
            from api.services.before_signing import attach_reference_evidence

            session.flush()
            bs_findings = [
                f for f in run.findings if f.finding_key.startswith("bs_")
            ]
            attach_reference_evidence(session, bs_findings, run, case_id)

        elif analysis_plan == "after_signing_discrepancy":
            from api.services.after_signing import attach_discrepancy_evidence

            session.flush()
            attach_discrepancy_evidence(
                session, list(run.findings), run, case_id
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
