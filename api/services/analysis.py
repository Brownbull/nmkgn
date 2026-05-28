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
from api.services.audit import (
    AgentDisabledError,
    CaseNotFoundError,
    InvalidAnalysisPlanError,
    NotReadyError,
    RunAuditTimeline,
    RunNotFoundError,
    _ensure_case,
    prepare_analysis,
)
from api.services.calculations import (
    CalculationResult,
    FactInput,
    run_all_calculations,
)
from api.services.finding_specs import (
    BEFORE_SIGNING_FINDING_SPECS,
    FINDING_SPECS,
    build_finding_summary,
    should_fire_finding,
    specs_for_plan,
)

__all__ = [
    "AgentDisabledError",
    "BEFORE_SIGNING_FINDING_SPECS",
    "CaseNotFoundError",
    "FINDING_SPECS",
    "InvalidAnalysisPlanError",
    "NotReadyError",
    "RunNotFoundError",
    "get_analysis_run",
    "list_analysis_runs",
    "run_agent_analysis",
    "run_deterministic_analysis",
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _persist_calculations(
    session: Session,
    calc_results: list[CalculationResult],
    run: AnalysisRun,
    case_id: str,
    timeline: RunAuditTimeline,
) -> dict[str, AnalysisCalculation]:
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
    timeline.record(
        "calculations_persisted",
        count=len(calc_models),
        keys=list(calc_models.keys()),
    )
    return calc_models


def _generate_plan_findings(
    specs: dict[str, dict],
    calc_results: list[CalculationResult],
    calc_models: dict[str, AnalysisCalculation],
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    session: Session,
    timeline: RunAuditTimeline,
) -> None:
    calc_map = {cr.calculation_key: cr for cr in calc_results}
    display_order = 0

    for finding_key, spec in specs.items():
        calc_key = spec.get("calculation_key", finding_key)
        cr = calc_map.get(calc_key)
        if cr is None:
            timeline.suppress_finding(finding_key)
            timeline.add_warning(
                f"finding {finding_key}: calculation {calc_key} not available"
            )
            continue
        if not should_fire_finding(spec, cr):
            timeline.suppress_finding(finding_key)
            continue

        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=finding_key,
            title=spec["title"],
            summary=build_finding_summary(spec, cr),
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

    timeline.record(
        "findings_generated",
        fired=display_order,
        suppressed=len(timeline.suppressed_finding_keys),
    )


def _apply_plan_enrichment(
    session: Session,
    analysis_plan: str,
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    fact_map: dict[str, list[FactInput]],
    timeline: RunAuditTimeline,
) -> None:
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
            fact_map,
            run,
            case_id,
            owner_ref,
            session,
            start_display_order=next_order,
        )
        next_order += len(missing)
        generate_negotiation_questions(
            session,
            run,
            case_id,
            owner_ref,
            start_display_order=next_order,
        )
        timeline.record(
            "plan_enrichment_complete",
            plan=analysis_plan,
            missing_info_count=len(missing),
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
            session,
            run,
            case_id,
            owner_ref,
            start_display_order=next_order,
        )
        next_order += len(context)
        generate_escalation_questions(
            session,
            run,
            case_id,
            owner_ref,
            start_display_order=next_order,
        )
        timeline.record(
            "plan_enrichment_complete",
            plan=analysis_plan,
            comparison_context_count=len(context),
        )


def _finalize_run(run: AnalysisRun, timeline: RunAuditTimeline) -> None:
    run.timeline_events = timeline.events
    run.warnings = timeline.warnings
    run.suppressed_finding_keys = timeline.suppressed_finding_keys


def run_deterministic_analysis(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> AnalysisRun:
    timeline = RunAuditTimeline()
    setup = prepare_analysis(session, case_id=case_id, owner_ref=owner_ref)
    timeline.record(
        "run_started",
        analysis_plan=setup.analysis_plan,
        fact_count=len(setup.confirmed_facts),
    )

    run = AnalysisRun(
        case_id=case_id,
        owner_ref=owner_ref,
        schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        status="running",
        readiness_snapshot=setup.readiness_snapshot,
        input_fact_ids=[f.id for f in setup.confirmed_facts],
        started_at=_utcnow(),
    )
    session.add(run)
    session.flush()

    calc_results = run_all_calculations(setup.fact_map)
    timeline.record("calculations_complete", count=len(calc_results))
    calc_models = _persist_calculations(session, calc_results, run, case_id, timeline)

    specs = specs_for_plan(setup.analysis_plan)
    _generate_plan_findings(
        specs,
        calc_results,
        calc_models,
        run,
        case_id,
        owner_ref,
        session,
        timeline,
    )

    _apply_plan_enrichment(
        session,
        setup.analysis_plan,
        run,
        case_id,
        owner_ref,
        setup.fact_map,
        timeline,
    )

    run.status = "completed"
    run.completed_at = _utcnow()
    timeline.record("run_completed")
    _finalize_run(run, timeline)
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

    timeline = RunAuditTimeline()
    setup = prepare_analysis(session, case_id=case_id, owner_ref=owner_ref)
    timeline.record(
        "run_started",
        analysis_plan=setup.analysis_plan,
        fact_count=len(setup.confirmed_facts),
        agent_provider=agent_settings.provider,
        agent_model=agent_settings.model,
    )

    run = AnalysisRun(
        case_id=case_id,
        owner_ref=owner_ref,
        schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        status="running",
        readiness_snapshot=setup.readiness_snapshot,
        input_fact_ids=[f.id for f in setup.confirmed_facts],
        agent_provider=agent_settings.provider,
        model_name=agent_settings.model,
        started_at=_utcnow(),
    )
    session.add(run)
    session.flush()

    calc_results = run_all_calculations(setup.fact_map)
    timeline.record("calculations_complete", count=len(calc_results))
    calc_models = _persist_calculations(session, calc_results, run, case_id, timeline)

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
        analysis_plan=setup.analysis_plan,
        confirmed_fact_ids=[f.id for f in setup.confirmed_facts],
        calculation_results=calc_results,
        reference_keys=[r.reference_key for r in active_refs],
    )

    try:
        agent = ConsumerCreditAgent(agent_settings)
        timeline.record("agent_call_started")
        result = agent.analyze(agent_input=agent_input)
        timeline.record(
            "agent_call_complete",
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            latency_ms=result.latency_ms,
            cost_usd=result.cost_usd,
        )

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
                    reference_key=ev_data.citation.reference_key
                    if ev_data.citation
                    else None,
                    citation_retrieved_at=ev_data.citation.retrieved_at
                    if ev_data.citation
                    else None,
                    citation_verified_at=ev_data.citation.verified_at
                    if ev_data.citation
                    else None,
                    excerpt=ev_data.excerpt,
                    inference_summary=ev_data.inference_summary,
                    model_name=ev_data.model_name,
                    schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
                )
                session.add(evidence)

        timeline.record(
            "agent_findings_persisted",
            finding_count=len(result.analysis.findings),
        )

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

        if setup.analysis_plan == "before_signing_review":
            from api.services.before_signing import attach_reference_evidence

            session.flush()
            bs_findings = [f for f in run.findings if f.finding_key.startswith("bs_")]
            attach_reference_evidence(session, bs_findings, run, case_id)
            timeline.record("agent_reference_evidence_attached")

        elif setup.analysis_plan == "after_signing_discrepancy":
            from api.services.after_signing import attach_discrepancy_evidence

            session.flush()
            attach_discrepancy_evidence(session, list(run.findings), run, case_id)
            timeline.record("agent_discrepancy_evidence_attached")

        run.status = "completed"
        run.completed_at = _utcnow()
        timeline.record("run_completed")

    except ConsumerCreditProviderError as exc:
        run.status = "failed"
        run.error_message = f"[{exc.code}] {exc.detail}"
        run.completed_at = _utcnow()
        timeline.record("run_failed", error_code=exc.code, error_detail=exc.detail)
    except Exception as exc:
        run.status = "failed"
        run.error_message = f"[unexpected] {type(exc).__name__}: {exc}"
        run.completed_at = _utcnow()
        timeline.record(
            "run_failed",
            error_type=type(exc).__name__,
            error_detail=str(exc),
        )

    _finalize_run(run, timeline)
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
