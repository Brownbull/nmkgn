from __future__ import annotations

from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, FactConfirmation
from api.schemas.facts import FactConfirmationCreate, FactReadinessRead
from api.services.fact_extraction import FACT_RULES

RESOLVED_CONFIRMATION_STATUSES = {"confirmed", "corrected", "rejected"}
REQUIRED_HIGH_IMPACT_FACT_KEYS = tuple(
    rule.fact_key for rule in FACT_RULES if rule.required and rule.high_impact
)


class FactServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class CaseNotFoundError(FactServiceError):
    pass


class FactNotFoundError(FactServiceError):
    pass


class InvalidCorrectionError(FactServiceError):
    pass


def list_facts(
    session: Session, case_id: str, owner_ref: str
) -> list[ConsumerCreditFact]:
    _ensure_case(session, case_id, owner_ref)
    stmt = _owner_scoped_fact_stmt(case_id, owner_ref).order_by(
        ConsumerCreditFact.created_at,
        ConsumerCreditFact.fact_key,
        ConsumerCreditFact.id,
    )
    return list(session.scalars(stmt))


def get_fact(
    session: Session, case_id: str, fact_id: str, owner_ref: str
) -> ConsumerCreditFact:
    _ensure_case(session, case_id, owner_ref)
    stmt = _owner_scoped_fact_stmt(case_id, owner_ref).where(
        ConsumerCreditFact.id == fact_id
    )
    fact = session.scalar(stmt)
    if fact is None:
        raise FactNotFoundError("fact not found")
    return fact


def record_confirmation(
    session: Session,
    case_id: str,
    fact_id: str,
    owner_ref: str,
    payload: FactConfirmationCreate,
) -> FactConfirmation:
    fact = get_fact(session, case_id, fact_id, owner_ref)
    if payload.action == "correct":
        _validate_correction_compatibility(fact.value_kind, payload)
    confirmation = FactConfirmation(
        fact_id=fact.id,
        owner_ref=owner_ref,
        action=payload.action,
        corrected_value_text=payload.corrected_value_text,
        corrected_value_number=payload.corrected_value_number,
        corrected_value_currency=payload.corrected_value_currency,
        corrected_value_date=payload.corrected_value_date,
        note=payload.note,
    )
    fact.confirmation_status = _status_for_action(payload.action)
    session.add(confirmation)
    session.commit()
    session.refresh(confirmation)
    return confirmation


def get_case_readiness(
    session: Session, case_id: str, owner_ref: str
) -> FactReadinessRead:
    facts = list_facts(session, case_id, owner_ref)
    status_counts = Counter(fact.confirmation_status for fact in facts)

    unresolved_facts = [
        fact
        for fact in facts
        if fact.high_impact
        and fact.confirmation_status not in RESOLVED_CONFIRMATION_STATUSES
    ]
    seen_required_keys = {
        fact.fact_key
        for fact in facts
        if fact.high_impact and fact.fact_key in REQUIRED_HIGH_IMPACT_FACT_KEYS
    }
    missing_required_keys = [
        key for key in REQUIRED_HIGH_IMPACT_FACT_KEYS if key not in seen_required_keys
    ]
    blockers: list[str] = []
    if unresolved_facts:
        blockers.append("unresolved_high_impact_facts")
    if missing_required_keys:
        blockers.append("missing_required_facts")

    return FactReadinessRead(
        case_id=case_id,
        ready_for_analysis=not blockers,
        blockers=blockers,
        required_fact_keys=list(REQUIRED_HIGH_IMPACT_FACT_KEYS),
        missing_required_fact_keys=missing_required_keys,
        total_fact_count=len(facts),
        high_impact_fact_count=sum(1 for fact in facts if fact.high_impact),
        unresolved_high_impact_count=len(unresolved_facts),
        unresolved_fact_ids=[fact.id for fact in unresolved_facts],
        status_counts={
            "pending": status_counts["pending"],
            "confirmed": status_counts["confirmed"],
            "corrected": status_counts["corrected"],
            "rejected": status_counts["rejected"],
        },
    )


def _ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise CaseNotFoundError("case not found")
    return case


def _owner_scoped_fact_stmt(case_id: str, owner_ref: str):
    return (
        select(ConsumerCreditFact)
        .join(Document, ConsumerCreditFact.document_id == Document.id)
        .where(
            ConsumerCreditFact.case_id == case_id,
            Document.case_id == case_id,
            Document.owner_ref == owner_ref,
        )
    )


_CORRECTION_REQUIRED_FIELD: dict[str, str] = {
    "money": "corrected_value_number",
    "currency": "corrected_value_currency",
    "date": "corrected_value_date",
    "integer": "corrected_value_number",
    "percentage": "corrected_value_number",
    "text": "corrected_value_text",
    "boolean": "corrected_value_text",
}


def _validate_correction_compatibility(
    value_kind: str, payload: FactConfirmationCreate
) -> None:
    required_field = _CORRECTION_REQUIRED_FIELD.get(value_kind)
    if required_field is None:
        return
    if getattr(payload, required_field) is None:
        raise InvalidCorrectionError(f"{value_kind} fact requires {required_field}")


def _status_for_action(action: str) -> str:
    if action == "confirm":
        return "confirmed"
    if action == "correct":
        return "corrected"
    return "rejected"
