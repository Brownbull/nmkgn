from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.case import Case
from api.schemas.cases import CaseCreate, default_analysis_plan


def create_case(session: Session, payload: CaseCreate, owner_ref: str) -> Case:
    case = Case(
        owner_ref=owner_ref,
        title=payload.title,
        case_stage=payload.case_stage,
        document_type=payload.document_type,
        analysis_plan=payload.analysis_plan or default_analysis_plan(payload.case_stage),
        institution_name=payload.institution_name,
        requested_amount_clp=payload.requested_amount_clp,
        expected_term_months=payload.expected_term_months,
    )
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


def list_cases(session: Session, owner_ref: str) -> list[Case]:
    stmt = select(Case).where(Case.owner_ref == owner_ref).order_by(Case.created_at.desc())
    return list(session.scalars(stmt))


def get_case(session: Session, case_id: str, owner_ref: str) -> Case | None:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    return session.scalar(stmt)
