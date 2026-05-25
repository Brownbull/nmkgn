from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from api.agents.document_receptionist import DocumentReceptionistAgent
from api.config import ReceptionistSettings, UploadStorageSettings
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, FactConfirmation
from api.models.receptionist import (
    RECEPTIONIST_PROMOTION_PROVIDER,
    RECEPTIONIST_SCHEMA_VERSION,
    DocumentExtractionGap,
    DocumentExtractionGapResolution,
    DocumentReceptionistObservation,
    DocumentReceptionistRun,
)
from api.schemas.receptionist import (
    AnalysisReadinessRead,
    GapResolutionCreate,
    ReceptionistObservationCreate,
)
from api.services.fact_extraction import FACT_RULES
from api.services.facts import get_case_readiness
from api.services.receptionist_media import (
    DocumentMediaBundle,
    MediaPackingError,
    build_document_media_bundle,
)
from api.services.receptionist_provider import (
    ReceptionistProviderError,
)

PROMPT_VERSION = "document-receptionist-v1"
RESOLUTION_ACTIONS = {
    "confirm_deterministic",
    "accept_receptionist",
    "reject_receptionist",
    "defer_unsupported",
}

FACT_RULE_BY_KEY = {rule.fact_key: rule for rule in FACT_RULES}
HIGH_IMPACT_KEYS = {rule.fact_key for rule in FACT_RULES if rule.high_impact}
REQUIRED_HIGH_IMPACT_KEYS = {
    rule.fact_key for rule in FACT_RULES if rule.high_impact and rule.required
}


class ReceptionistServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class ReceptionistCaseNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistDocumentNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistRunNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistGapNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistDisabledError(ReceptionistServiceError):
    pass


class ReceptionistResolutionError(ReceptionistServiceError):
    pass


def start_document_receptionist_run(
    session: Session,
    *,
    case_id: str,
    document_id: str,
    owner_ref: str,
    receptionist_settings: ReceptionistSettings,
    upload_settings: UploadStorageSettings,
) -> DocumentReceptionistRun:
    if not receptionist_settings.enabled:
        raise ReceptionistDisabledError("receptionist gate is disabled")

    _ensure_case(session, case_id, owner_ref)
    document = _get_document(session, case_id, document_id, owner_ref)
    if document is None:
        raise ReceptionistDocumentNotFoundError("document not found")

    now = utcnow()
    run = DocumentReceptionistRun(
        case_id=case_id,
        document_id=document_id,
        owner_ref=owner_ref,
        provider=receptionist_settings.provider,
        model_name=receptionist_settings.model,
        prompt_version=PROMPT_VERSION,
        schema_version=RECEPTIONIST_SCHEMA_VERSION,
        status="running",
        media_kind=_media_kind_for_document(document),
        media_page_count=None,
        processed_page_count=None,
        partial_coverage=False,
        started_at=now,
    )
    session.add(run)
    session.flush()

    try:
        media_bundle = build_document_media_bundle(
            session,
            document,
            receptionist_settings,
            upload_settings,
        )
        _apply_media_bundle(run, media_bundle)
        result = DocumentReceptionistAgent(receptionist_settings).review_document(
            document=document,
            media_bundle=media_bundle,
        )
        if result.review.document_id != document.id:
            raise ReceptionistProviderError(
                "invalid_output",
                "receptionist output referenced a different document",
            )
        if result.review.schema_version != RECEPTIONIST_SCHEMA_VERSION:
            raise ReceptionistProviderError(
                "invalid_output",
                "receptionist output used an unsupported schema version",
            )
        observations = _persist_observations(
            session,
            run=run,
            review_observations=result.review.observations,
        )
        run.latency_ms = result.latency_ms
        run.prompt_tokens = result.prompt_tokens
        run.completion_tokens = result.completion_tokens
        run.cost_usd = result.cost_usd
        run.partial_coverage = run.partial_coverage or result.review.partial_coverage
        _create_comparison_gaps(
            session,
            run=run,
            observations=observations,
            media_bundle=media_bundle,
        )
        run.status = "completed"
        run.completed_at = utcnow()
    except MediaPackingError as exc:
        _fail_run(session, run, exc.code, exc.detail)
    except ReceptionistProviderError as exc:
        _fail_run(session, run, exc.code, exc.detail)
    except Exception:
        session.rollback()
        raise

    session.commit()
    return get_document_receptionist_run(
        session,
        case_id=case_id,
        document_id=document_id,
        run_id=run.id,
        owner_ref=owner_ref,
    )


def get_document_receptionist_run(
    session: Session,
    *,
    case_id: str,
    document_id: str,
    run_id: str,
    owner_ref: str,
) -> DocumentReceptionistRun:
    _ensure_case(session, case_id, owner_ref)
    stmt = (
        select(DocumentReceptionistRun)
        .options(
            selectinload(DocumentReceptionistRun.observations),
            selectinload(DocumentReceptionistRun.gaps),
        )
        .join(Document, DocumentReceptionistRun.document_id == Document.id)
        .where(
            DocumentReceptionistRun.id == run_id,
            DocumentReceptionistRun.case_id == case_id,
            DocumentReceptionistRun.document_id == document_id,
            Document.owner_ref == owner_ref,
        )
    )
    run = session.scalar(stmt)
    if run is None:
        raise ReceptionistRunNotFoundError("receptionist run not found")
    return run


def list_case_gaps(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
    status: str | None = None,
) -> list[DocumentExtractionGap]:
    _ensure_case(session, case_id, owner_ref)
    stmt = (
        select(DocumentExtractionGap)
        .join(Document, DocumentExtractionGap.document_id == Document.id)
        .where(
            DocumentExtractionGap.case_id == case_id,
            Document.case_id == case_id,
            Document.owner_ref == owner_ref,
        )
        .order_by(
            DocumentExtractionGap.blocking.desc(),
            DocumentExtractionGap.created_at.desc(),
            DocumentExtractionGap.id,
        )
    )
    if status is not None:
        stmt = stmt.where(DocumentExtractionGap.status == status)
    return list(session.scalars(stmt))


def resolve_gap(
    session: Session,
    *,
    case_id: str,
    gap_id: str,
    owner_ref: str,
    payload: GapResolutionCreate,
) -> DocumentExtractionGapResolution:
    if payload.action not in RESOLUTION_ACTIONS:
        raise ReceptionistResolutionError("unsupported resolution action")

    gap = _get_gap(session, case_id, gap_id, owner_ref)
    if gap.status == "resolved":
        raise ReceptionistResolutionError("gap is already resolved")

    created_fact_id: str | None = None
    corrected_fact_id: str | None = None
    if payload.action == "accept_receptionist":
        created_fact_id, corrected_fact_id = _accept_receptionist_gap(
            session,
            gap=gap,
            owner_ref=owner_ref,
            note=payload.note,
        )
    elif payload.action == "confirm_deterministic":
        corrected_fact_id = _confirm_deterministic_gap(
            session,
            gap=gap,
            owner_ref=owner_ref,
            note=payload.note,
        )
    elif payload.action == "defer_unsupported" and gap.gap_type != "unsupported_field":
        raise ReceptionistResolutionError("only unsupported gaps can be deferred")

    resolution = DocumentExtractionGapResolution(
        gap_id=gap.id,
        case_id=case_id,
        owner_ref=owner_ref,
        action=payload.action,
        note=payload.note,
        created_fact_id=created_fact_id,
        corrected_fact_id=corrected_fact_id,
    )
    gap.status = "resolved"
    gap.resolved_at = utcnow()
    session.add(resolution)
    session.commit()
    session.refresh(resolution)
    return resolution


def get_analysis_readiness(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> AnalysisReadinessRead:
    fact_readiness = get_case_readiness(session, case_id, owner_ref)
    documents = _case_documents(session, case_id, owner_ref)
    latest_runs = _latest_runs_by_document(session, case_id, owner_ref)
    document_run_statuses: dict[str, str] = {}
    missing_receptionist_document_ids: list[str] = []
    blockers: list[str] = list(fact_readiness.blockers)

    for document in documents:
        latest_run = latest_runs.get(document.id)
        if latest_run is None:
            document_run_statuses[document.id] = "missing"
            missing_receptionist_document_ids.append(document.id)
            continue
        document_run_statuses[document.id] = latest_run.status
        if latest_run.status == "failed":
            blockers.append("failed_receptionist_run")
        elif latest_run.status != "completed":
            blockers.append("incomplete_receptionist_run")

    if missing_receptionist_document_ids:
        blockers.append("missing_receptionist_run")

    open_blocking_gaps = [
        gap
        for gap in list_case_gaps(
            session,
            case_id=case_id,
            owner_ref=owner_ref,
            status="open",
        )
        if gap.blocking
    ]
    if open_blocking_gaps:
        blockers.append("unresolved_receptionist_gaps")

    unique_blockers = list(dict.fromkeys(blockers))
    receptionist_ready = not (
        missing_receptionist_document_ids
        or open_blocking_gaps
        or any(status != "completed" for status in document_run_statuses.values())
    )
    return AnalysisReadinessRead(
        case_id=case_id,
        ready_for_analysis=fact_readiness.ready_for_analysis and receptionist_ready,
        blockers=unique_blockers,
        fact_readiness=fact_readiness,
        receptionist_ready=receptionist_ready,
        missing_receptionist_document_ids=missing_receptionist_document_ids,
        unresolved_blocking_gap_count=len(open_blocking_gaps),
        unresolved_blocking_gap_ids=[gap.id for gap in open_blocking_gaps],
        document_run_statuses=document_run_statuses,
    )


def _ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise ReceptionistCaseNotFoundError("case not found")
    return case


def _get_document(
    session: Session, case_id: str, document_id: str, owner_ref: str
) -> Document | None:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.case_id == case_id,
        Document.owner_ref == owner_ref,
        Document.upload_status == "stored",
        Document.retention_state == "active",
    )
    return session.scalar(stmt)


def _case_documents(session: Session, case_id: str, owner_ref: str) -> list[Document]:
    _ensure_case(session, case_id, owner_ref)
    stmt = (
        select(Document)
        .where(
            Document.case_id == case_id,
            Document.owner_ref == owner_ref,
            Document.upload_status == "stored",
            Document.retention_state == "active",
        )
        .order_by(Document.created_at, Document.id)
    )
    return list(session.scalars(stmt))


def _latest_runs_by_document(
    session: Session, case_id: str, owner_ref: str
) -> dict[str, DocumentReceptionistRun]:
    stmt = (
        select(DocumentReceptionistRun)
        .join(Document, DocumentReceptionistRun.document_id == Document.id)
        .where(
            DocumentReceptionistRun.case_id == case_id,
            Document.owner_ref == owner_ref,
        )
        .order_by(
            DocumentReceptionistRun.document_id,
            DocumentReceptionistRun.created_at.desc(),
        )
    )
    latest: dict[str, DocumentReceptionistRun] = {}
    for run in session.scalars(stmt):
        latest.setdefault(run.document_id, run)
    return latest


def _apply_media_bundle(
    run: DocumentReceptionistRun, media_bundle: DocumentMediaBundle
) -> None:
    run.media_kind = media_bundle.media_kind
    run.media_page_count = media_bundle.media_page_count
    run.processed_page_count = media_bundle.processed_page_count
    run.partial_coverage = media_bundle.partial_coverage


def _persist_observations(
    session: Session,
    *,
    run: DocumentReceptionistRun,
    review_observations: list[ReceptionistObservationCreate],
) -> list[DocumentReceptionistObservation]:
    observations = [
        DocumentReceptionistObservation(
            run_id=run.id,
            case_id=run.case_id,
            document_id=run.document_id,
            fact_key=observation.fact_key,
            field_label=observation.field_label,
            value_kind=observation.value_kind,
            value_text=observation.value_text,
            value_number=observation.value_number,
            value_currency=observation.value_currency,
            value_date=observation.value_date,
            unit=observation.unit,
            source_page_number=observation.source.page_number,
            source_start_offset=observation.source.start_offset,
            source_end_offset=observation.source.end_offset,
            source_snippet=observation.source.snippet,
            bounding_box=observation.source.bounding_box,
            anchor_status=observation.anchor_status,
            confidence=observation.confidence,
            raw_payload=observation.raw_payload,
        )
        for observation in review_observations
    ]
    session.add_all(observations)
    session.flush()
    return observations


def _create_comparison_gaps(
    session: Session,
    *,
    run: DocumentReceptionistRun,
    observations: list[DocumentReceptionistObservation],
    media_bundle: DocumentMediaBundle,
) -> None:
    facts = _document_facts(session, run.case_id, run.document_id)
    facts_by_key: dict[str, list[ConsumerCreditFact]] = {}
    for fact in facts:
        facts_by_key.setdefault(fact.fact_key, []).append(fact)

    observed_keys: set[str] = set()
    for observation in observations:
        gap = _gap_from_observation(run, observation, facts_by_key)
        if observation.fact_key:
            observed_keys.add(observation.fact_key)
        if gap is not None:
            session.add(gap)

    for fact in facts:
        if fact.warning_code or fact.fact_key in observed_keys:
            continue
        session.add(
            _gap(
                run=run,
                gap_type="missing_in_receptionist",
                fact_key=fact.fact_key,
                fact=fact,
                observation=None,
                severity="medium" if fact.high_impact else "low",
                blocking=False,
                detail=f"Receptionist did not report deterministic field {fact.label}.",
                deterministic_value=_fact_payload(fact),
                receptionist_value=None,
                source_summary=_source_summary_for_fact(fact),
            )
        )

    if media_bundle.partial_coverage:
        session.add(
            _gap(
                run=run,
                gap_type="partial_document_coverage",
                fact_key=None,
                fact=None,
                observation=None,
                severity="high",
                blocking=True,
                detail="Receptionist reviewed only part of the document due to page limits.",
                deterministic_value=None,
                receptionist_value={
                    "media_page_count": media_bundle.media_page_count,
                    "processed_page_count": media_bundle.processed_page_count,
                },
                source_summary="; ".join(media_bundle.warnings) or None,
            )
        )
    session.flush()


def _gap_from_observation(
    run: DocumentReceptionistRun,
    observation: DocumentReceptionistObservation,
    facts_by_key: dict[str, list[ConsumerCreditFact]],
) -> DocumentExtractionGap | None:
    if observation.fact_key is None or observation.value_kind == "unsupported":
        return _gap(
            run=run,
            gap_type="unsupported_field",
            fact_key=None,
            fact=None,
            observation=observation,
            severity="low",
            blocking=False,
            detail=f"Receptionist found unsupported field {observation.field_label}.",
            deterministic_value=None,
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )

    high_impact = observation.fact_key in HIGH_IMPACT_KEYS
    if observation.anchor_status != "anchored":
        return _gap(
            run=run,
            gap_type="llm_unanchored_claim",
            fact_key=observation.fact_key,
            fact=None,
            observation=observation,
            severity="high" if high_impact else "medium",
            blocking=high_impact,
            detail=f"Receptionist reported {observation.field_label} without a stable source anchor.",
            deterministic_value=None,
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )

    facts = facts_by_key.get(observation.fact_key, [])
    if not facts:
        return _gap(
            run=run,
            gap_type="missing_in_deterministic",
            fact_key=observation.fact_key,
            fact=None,
            observation=observation,
            severity="high"
            if _is_required_or_high_impact(observation.fact_key)
            else "medium",
            blocking=_is_required_or_high_impact(observation.fact_key),
            detail=f"Receptionist found {observation.field_label}, but deterministic extraction did not.",
            deterministic_value=None,
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )

    warning_fact = next((fact for fact in facts if fact.warning_code), None)
    if warning_fact is not None:
        return _gap(
            run=run,
            gap_type="deterministic_warning_resolved",
            fact_key=observation.fact_key,
            fact=warning_fact,
            observation=observation,
            severity="high" if warning_fact.high_impact else "medium",
            blocking=warning_fact.high_impact,
            detail=(
                f"Deterministic extraction warned on {warning_fact.label}, "
                "but receptionist proposed a value."
            ),
            deterministic_value=_fact_payload(warning_fact),
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )

    matching_fact = next(
        (
            fact
            for fact in facts
            if _value_signature_for_fact(fact)
            == _value_signature_for_observation(observation)
        ),
        None,
    )
    if matching_fact is None:
        fact = facts[0]
        return _gap(
            run=run,
            gap_type="value_conflict",
            fact_key=observation.fact_key,
            fact=fact,
            observation=observation,
            severity="high" if fact.high_impact else "medium",
            blocking=fact.high_impact,
            detail=f"Receptionist value conflicts with deterministic {fact.label}.",
            deterministic_value=_fact_payload(fact),
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )

    if (
        matching_fact.source_page_number is not None
        and observation.source_page_number is not None
        and matching_fact.source_page_number != observation.source_page_number
    ):
        return _gap(
            run=run,
            gap_type="source_conflict",
            fact_key=observation.fact_key,
            fact=matching_fact,
            observation=observation,
            severity="high" if matching_fact.high_impact else "medium",
            blocking=matching_fact.high_impact,
            detail=f"Receptionist and deterministic extraction cite different pages for {matching_fact.label}.",
            deterministic_value=_fact_payload(matching_fact),
            receptionist_value=_observation_payload(observation),
            source_summary=_source_summary_for_observation(observation),
        )
    return None


def _fail_run(
    session: Session,
    run: DocumentReceptionistRun,
    error_code: str,
    error_message: str,
) -> None:
    run.status = "failed"
    run.error_code = error_code
    run.error_message = error_message
    run.completed_at = utcnow()
    session.add(
        _gap(
            run=run,
            gap_type="receptionist_unavailable",
            fact_key=None,
            fact=None,
            observation=None,
            severity="high",
            blocking=True,
            detail=f"Receptionist run failed: {error_message}",
            deterministic_value=None,
            receptionist_value={
                "error_code": error_code,
                "error_message": error_message,
            },
            source_summary=None,
        )
    )


def _get_gap(
    session: Session, case_id: str, gap_id: str, owner_ref: str
) -> DocumentExtractionGap:
    _ensure_case(session, case_id, owner_ref)
    stmt = (
        select(DocumentExtractionGap)
        .options(
            selectinload(DocumentExtractionGap.observation),
            selectinload(DocumentExtractionGap.fact),
        )
        .join(Document, DocumentExtractionGap.document_id == Document.id)
        .where(
            DocumentExtractionGap.id == gap_id,
            DocumentExtractionGap.case_id == case_id,
            Document.owner_ref == owner_ref,
        )
    )
    gap = session.scalar(stmt)
    if gap is None:
        raise ReceptionistGapNotFoundError("gap not found")
    return gap


def _accept_receptionist_gap(
    session: Session,
    *,
    gap: DocumentExtractionGap,
    owner_ref: str,
    note: str | None,
) -> tuple[str | None, str | None]:
    observation = gap.observation
    if observation is None or observation.fact_key is None:
        raise ReceptionistResolutionError(
            "gap has no promotable receptionist observation"
        )
    if observation.anchor_status != "anchored":
        raise ReceptionistResolutionError(
            "unanchored receptionist observations cannot be accepted"
        )
    if (
        observation.source_page_number is None
        and observation.source_start_offset is None
    ):
        raise ReceptionistResolutionError(
            "accepted receptionist observations need a source anchor"
        )
    if observation.value_kind == "unsupported":
        raise ReceptionistResolutionError(
            "unsupported receptionist observations cannot become facts"
        )

    if gap.fact_id is None:
        fact = _fact_from_observation(observation)
        session.add(fact)
        session.flush()
        _add_confirmation(
            session,
            fact=fact,
            owner_ref=owner_ref,
            action="confirm",
            note=note,
        )
        return fact.id, None

    fact = _document_fact_by_id(session, gap.case_id, gap.fact_id)
    if fact is None:
        raise ReceptionistResolutionError("deterministic fact no longer exists")
    _apply_observation_to_fact(fact, observation)
    fact.confirmation_status = "corrected"
    _add_confirmation(
        session,
        fact=fact,
        owner_ref=owner_ref,
        action="correct",
        note=note,
        observation=observation,
    )
    return None, fact.id


def _confirm_deterministic_gap(
    session: Session,
    *,
    gap: DocumentExtractionGap,
    owner_ref: str,
    note: str | None,
) -> str | None:
    if gap.fact_id is None:
        return None
    fact = _document_fact_by_id(session, gap.case_id, gap.fact_id)
    if fact is None:
        raise ReceptionistResolutionError("deterministic fact no longer exists")
    fact.confirmation_status = "confirmed"
    _add_confirmation(
        session,
        fact=fact,
        owner_ref=owner_ref,
        action="confirm",
        note=note,
    )
    return fact.id


def _fact_from_observation(
    observation: DocumentReceptionistObservation,
) -> ConsumerCreditFact:
    rule = FACT_RULE_BY_KEY.get(observation.fact_key or "")
    return ConsumerCreditFact(
        case_id=observation.case_id,
        document_id=observation.document_id,
        text_segment_id=None,
        fact_key=observation.fact_key or "",
        label=rule.label if rule is not None else observation.field_label,
        value_kind=_fact_value_kind(observation.value_kind),
        value_text=observation.value_text,
        value_number=observation.value_number,
        value_currency=observation.value_currency,
        value_date=observation.value_date,
        unit=observation.unit,
        high_impact=rule.high_impact if rule is not None else True,
        confirmation_status="confirmed",
        source_type="uploaded_document",
        source_page_number=observation.source_page_number,
        source_start_offset=observation.source_start_offset,
        source_end_offset=observation.source_end_offset,
        source_snippet=observation.source_snippet,
        extraction_provider=RECEPTIONIST_PROMOTION_PROVIDER,
        confidence=observation.confidence,
        warning_code=None,
        warning_message=None,
    )


def _apply_observation_to_fact(
    fact: ConsumerCreditFact, observation: DocumentReceptionistObservation
) -> None:
    fact.value_kind = _fact_value_kind(observation.value_kind)
    fact.value_text = observation.value_text
    fact.value_number = observation.value_number
    fact.value_currency = observation.value_currency
    fact.value_date = observation.value_date
    fact.unit = observation.unit
    fact.source_page_number = observation.source_page_number
    fact.source_start_offset = observation.source_start_offset
    fact.source_end_offset = observation.source_end_offset
    fact.source_snippet = observation.source_snippet
    fact.confidence = observation.confidence
    fact.warning_code = None
    fact.warning_message = None


def _add_confirmation(
    session: Session,
    *,
    fact: ConsumerCreditFact,
    owner_ref: str,
    action: str,
    note: str | None,
    observation: DocumentReceptionistObservation | None = None,
) -> FactConfirmation:
    confirmation = FactConfirmation(
        fact_id=fact.id,
        owner_ref=owner_ref,
        action=action,
        note=note,
    )
    if action == "correct" and observation is not None:
        confirmation.corrected_value_text = observation.value_text
        confirmation.corrected_value_number = observation.value_number
        confirmation.corrected_value_currency = observation.value_currency
        confirmation.corrected_value_date = observation.value_date
    session.add(confirmation)
    return confirmation


def _document_facts(
    session: Session, case_id: str, document_id: str
) -> list[ConsumerCreditFact]:
    stmt = (
        select(ConsumerCreditFact)
        .where(
            ConsumerCreditFact.case_id == case_id,
            ConsumerCreditFact.document_id == document_id,
        )
        .order_by(ConsumerCreditFact.fact_key, ConsumerCreditFact.created_at)
    )
    return list(session.scalars(stmt))


def _document_fact_by_id(
    session: Session, case_id: str, fact_id: str
) -> ConsumerCreditFact | None:
    stmt = select(ConsumerCreditFact).where(
        ConsumerCreditFact.case_id == case_id,
        ConsumerCreditFact.id == fact_id,
    )
    return session.scalar(stmt)


def _gap(
    *,
    run: DocumentReceptionistRun,
    gap_type: str,
    fact_key: str | None,
    fact: ConsumerCreditFact | None,
    observation: DocumentReceptionistObservation | None,
    severity: str,
    blocking: bool,
    detail: str,
    deterministic_value: dict[str, Any] | None,
    receptionist_value: dict[str, Any] | None,
    source_summary: str | None,
) -> DocumentExtractionGap:
    return DocumentExtractionGap(
        case_id=run.case_id,
        document_id=run.document_id,
        run_id=run.id,
        observation_id=observation.id if observation is not None else None,
        fact_id=fact.id if fact is not None else None,
        fact_key=fact_key,
        gap_type=gap_type,
        severity=severity,
        blocking=blocking,
        status="open",
        detail=detail,
        deterministic_value=deterministic_value,
        receptionist_value=receptionist_value,
        source_summary=source_summary,
    )


def _fact_payload(fact: ConsumerCreditFact) -> dict[str, Any]:
    return {
        "fact_key": fact.fact_key,
        "label": fact.label,
        "value_kind": fact.value_kind,
        "value_text": fact.value_text,
        "value_number": fact.value_number,
        "value_currency": fact.value_currency,
        "value_date": fact.value_date.isoformat() if fact.value_date else None,
        "unit": fact.unit,
        "warning_code": fact.warning_code,
        "warning_message": fact.warning_message,
        "source_page_number": fact.source_page_number,
        "source_start_offset": fact.source_start_offset,
        "source_end_offset": fact.source_end_offset,
        "source_snippet": fact.source_snippet,
    }


def _observation_payload(
    observation: DocumentReceptionistObservation,
) -> dict[str, Any]:
    return {
        "fact_key": observation.fact_key,
        "field_label": observation.field_label,
        "value_kind": observation.value_kind,
        "value_text": observation.value_text,
        "value_number": observation.value_number,
        "value_currency": observation.value_currency,
        "value_date": observation.value_date.isoformat()
        if observation.value_date
        else None,
        "unit": observation.unit,
        "anchor_status": observation.anchor_status,
        "confidence": observation.confidence,
        "source_page_number": observation.source_page_number,
        "source_start_offset": observation.source_start_offset,
        "source_end_offset": observation.source_end_offset,
        "source_snippet": observation.source_snippet,
    }


def _value_signature_for_fact(fact: ConsumerCreditFact) -> tuple[Any, ...]:
    return _value_signature(
        kind=fact.value_kind,
        text=fact.value_text,
        number=fact.value_number,
        currency=fact.value_currency,
        value_date=fact.value_date.isoformat() if fact.value_date else None,
    )


def _value_signature_for_observation(
    observation: DocumentReceptionistObservation,
) -> tuple[Any, ...]:
    return _value_signature(
        kind=observation.value_kind,
        text=observation.value_text,
        number=observation.value_number,
        currency=observation.value_currency,
        value_date=observation.value_date.isoformat()
        if observation.value_date
        else None,
    )


def _value_signature(
    *,
    kind: str,
    text: str | None,
    number: float | None,
    currency: str | None,
    value_date: str | None,
) -> tuple[Any, ...]:
    if kind in {"money", "percentage"}:
        return (kind, round(number, 4) if number is not None else None, currency)
    if kind == "integer":
        return (kind, int(number) if number is not None else None)
    if kind == "currency":
        return (kind, (currency or text or "").upper() or None)
    if kind == "date":
        return (kind, value_date)
    return (kind, " ".join((text or "").lower().split()) or None)


def _source_summary_for_fact(fact: ConsumerCreditFact) -> str | None:
    if fact.source_page_number is None and fact.source_snippet is None:
        return None
    parts: list[str] = []
    if fact.source_page_number is not None:
        parts.append(f"page {fact.source_page_number}")
    if fact.source_snippet:
        parts.append(fact.source_snippet)
    return ": ".join(parts)


def _source_summary_for_observation(
    observation: DocumentReceptionistObservation,
) -> str | None:
    if observation.source_page_number is None and observation.source_snippet is None:
        return None
    parts: list[str] = []
    if observation.source_page_number is not None:
        parts.append(f"page {observation.source_page_number}")
    if observation.source_snippet:
        parts.append(observation.source_snippet)
    return ": ".join(parts)


def _media_kind_for_document(document: Document) -> str:
    if document.content_type == "application/pdf":
        return "pdf_images"
    if document.content_type in {"image/jpeg", "image/png"}:
        return "image"
    return "text"


def _is_required_or_high_impact(fact_key: str) -> bool:
    return fact_key in REQUIRED_HIGH_IMPACT_KEYS or fact_key in HIGH_IMPACT_KEYS


def _fact_value_kind(value_kind: str) -> str:
    if value_kind == "unsupported":
        raise ReceptionistResolutionError("unsupported values cannot be promoted")
    return value_kind


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
