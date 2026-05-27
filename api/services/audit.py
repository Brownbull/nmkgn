from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.extraction import ConsumerCreditFact
from api.services.calculations import FactInput


CONFIRMED_STATUSES = {"confirmed", "corrected"}

VALID_ANALYSIS_PLANS = {"before_signing_review", "after_signing_discrepancy"}


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


@dataclass(frozen=True)
class AuditEvent:
    timestamp: str
    event_type: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "timestamp": self.timestamp,
            "event_type": self.event_type,
        }
        if self.details:
            result["details"] = self.details
        return result


class RunAuditTimeline:
    def __init__(self) -> None:
        self._events: list[AuditEvent] = []
        self._warnings: list[str] = []
        self._suppressed_finding_keys: list[str] = []

    def record(self, event_type: str, **details: Any) -> None:
        self._events.append(
            AuditEvent(
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type=event_type,
                details=details if details else {},
            )
        )

    def add_warning(self, warning: str) -> None:
        self._warnings.append(warning)

    def suppress_finding(self, finding_key: str) -> None:
        self._suppressed_finding_keys.append(finding_key)

    @property
    def events(self) -> list[dict[str, Any]]:
        return [e.to_dict() for e in self._events]

    @property
    def warnings(self) -> list[str]:
        return list(self._warnings)

    @property
    def suppressed_finding_keys(self) -> list[str]:
        return list(self._suppressed_finding_keys)


@dataclass(frozen=True)
class AnalysisSetup:
    case: Case
    analysis_plan: str
    confirmed_facts: list[ConsumerCreditFact]
    fact_map: dict[str, list[FactInput]]
    readiness_snapshot: dict[str, Any]


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


def prepare_analysis(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
) -> AnalysisSetup:
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

    return AnalysisSetup(
        case=case,
        analysis_plan=analysis_plan,
        confirmed_facts=confirmed_facts,
        fact_map=fact_map,
        readiness_snapshot=readiness_snapshot,
    )
