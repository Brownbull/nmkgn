from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.config import get_stub_owner_ref
from api.schemas.facts import (
    ConsumerCreditFactRead,
    FactConfirmationCreate,
    FactConfirmationRead,
    FactReadinessRead,
)
from api.services import facts as fact_service
from api.services.database import get_session

router = APIRouter(prefix="/cases/{case_id}/facts", tags=["facts"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]


@router.get("", response_model=list[ConsumerCreditFactRead])
def list_facts(
    case_id: str, session: SessionDep, owner_ref: OwnerDep
) -> list[ConsumerCreditFactRead]:
    try:
        return fact_service.list_facts(session, case_id, owner_ref)
    except fact_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.get("/readiness", response_model=FactReadinessRead)
def get_case_readiness(
    case_id: str, session: SessionDep, owner_ref: OwnerDep
) -> FactReadinessRead:
    try:
        return fact_service.get_case_readiness(session, case_id, owner_ref)
    except fact_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.post(
    "/{fact_id}/confirmations",
    response_model=FactConfirmationRead,
    status_code=status.HTTP_201_CREATED,
)
def record_fact_confirmation(
    case_id: str,
    fact_id: str,
    payload: FactConfirmationCreate,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> FactConfirmationRead:
    if payload.fact_id != fact_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="fact_id mismatch"
        )
    try:
        return fact_service.record_confirmation(
            session=session,
            case_id=case_id,
            fact_id=fact_id,
            owner_ref=owner_ref,
            payload=payload,
        )
    except fact_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except fact_service.FactNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except fact_service.InvalidCorrectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=exc.detail
        ) from exc
