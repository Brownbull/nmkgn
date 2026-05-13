from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.config import get_stub_owner_ref
from api.schemas.cases import CaseCreate, CaseRead
from api.services import cases as case_service
from api.services.database import get_session

router = APIRouter(prefix="/cases", tags=["cases"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, session: SessionDep, owner_ref: OwnerDep) -> CaseRead:
    return case_service.create_case(session, payload, owner_ref)


@router.get("", response_model=list[CaseRead])
def list_cases(session: SessionDep, owner_ref: OwnerDep) -> list[CaseRead]:
    return case_service.list_cases(session, owner_ref)


@router.get("/{case_id}", response_model=CaseRead)
def get_case(case_id: str, session: SessionDep, owner_ref: OwnerDep) -> CaseRead:
    case = case_service.get_case(session, case_id, owner_ref)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case not found")
    return case
