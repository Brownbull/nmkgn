from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from api.models.analysis import AnalysisEvidence, AnalysisFinding, AnalysisRun
from api.models.case import Case
from api.schemas.export import (
    ExportEvidenceItem,
    ExportFindingItem,
    ExportRejectedItem,
    ExportSummary,
)


class ExportServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class CaseNotFoundError(ExportServiceError):
    pass


class NoCompletedRunError(ExportServiceError):
    pass


class EmptySelectionError(ExportServiceError):
    pass


UNSUPPORTED_CLAIM_TYPES = frozenset({"inference"})


def export_findings(
    session: Session,
    *,
    case_id: str,
    owner_ref: str,
    finding_ids: list[str],
) -> ExportSummary:
    case = _ensure_case(session, case_id, owner_ref)

    run = _latest_completed_run(session, case.id, owner_ref)
    if run is None:
        raise NoCompletedRunError("no completed analysis run for this case")

    findings = _load_findings(session, run.id, case.id, finding_ids)

    exported: list[ExportFindingItem] = []
    rejected: list[ExportRejectedItem] = []

    requested_set = set(finding_ids)
    found_ids = {f.id for f in findings}
    for missing_id in requested_set - found_ids:
        rejected.append(
            ExportRejectedItem(
                finding_id=missing_id,
                reason="finding not found in the latest completed run",
            )
        )

    for finding in findings:
        if finding.claim_type in UNSUPPORTED_CLAIM_TYPES:
            rejected.append(
                ExportRejectedItem(
                    finding_id=finding.id,
                    reason=f"unsupported claim type: {finding.claim_type}",
                )
            )
            continue

        evidence_items = _build_evidence(finding.evidence)
        if not evidence_items:
            rejected.append(
                ExportRejectedItem(
                    finding_id=finding.id,
                    reason="finding has no evidence backing",
                )
            )
            continue

        exported.append(
            ExportFindingItem(
                finding_id=finding.id,
                finding_key=finding.finding_key,
                title=finding.title,
                summary=finding.summary,
                severity=finding.severity,
                claim_type=finding.claim_type,
                uncertainty_state=finding.uncertainty_state,
                confidence=finding.confidence,
                evidence=evidence_items,
            )
        )

    if not exported:
        raise EmptySelectionError(
            "no exportable findings — all selections were rejected"
        )

    return ExportSummary(
        case_id=case.id,
        analysis_run_id=run.id,
        exported_at=datetime.now(timezone.utc),
        finding_count=len(exported),
        findings=exported,
        rejected=rejected,
    )


def _ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise CaseNotFoundError("case not found")
    return case


def _latest_completed_run(
    session: Session, case_id: str, owner_ref: str
) -> AnalysisRun | None:
    stmt = (
        select(AnalysisRun)
        .where(
            AnalysisRun.case_id == case_id,
            AnalysisRun.owner_ref == owner_ref,
            AnalysisRun.status == "completed",
        )
        .order_by(AnalysisRun.created_at.desc())
        .limit(1)
    )
    return session.scalar(stmt)


def _load_findings(
    session: Session, run_id: str, case_id: str, finding_ids: list[str]
) -> list[AnalysisFinding]:
    stmt = (
        select(AnalysisFinding)
        .where(
            AnalysisFinding.analysis_run_id == run_id,
            AnalysisFinding.case_id == case_id,
            AnalysisFinding.id.in_(finding_ids),
        )
        .options(selectinload(AnalysisFinding.evidence))
        .order_by(AnalysisFinding.display_order)
    )
    return list(session.scalars(stmt))


def _build_evidence(evidence: list[AnalysisEvidence]) -> list[ExportEvidenceItem]:
    return [
        ExportEvidenceItem(
            evidence_type=e.evidence_type,
            fact_id=e.fact_id,
            calculation_key=e.calculation_key,
            reference_key=e.reference_key,
            citation_label=e.citation_label,
            citation_url=e.citation_url,
            excerpt=e.excerpt,
        )
        for e in evidence
    ]
