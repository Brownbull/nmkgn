from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.config import (
    ConsumerCreditAgentSettings,
    get_consumer_credit_agent_settings,
    get_stub_owner_ref,
)
from api.schemas.analysis import AnalysisRunRead
from api.services import analysis as analysis_service
from api.services.database import get_session

router = APIRouter(prefix="/cases/{case_id}/analysis", tags=["analysis"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]
AgentSettingsDep = Annotated[
    ConsumerCreditAgentSettings, Depends(get_consumer_credit_agent_settings)
]


@router.get("/runs", response_model=list[AnalysisRunRead])
def list_runs(
    case_id: str, session: SessionDep, owner_ref: OwnerDep
) -> list[AnalysisRunRead]:
    try:
        return analysis_service.list_analysis_runs(
            session, case_id=case_id, owner_ref=owner_ref
        )
    except analysis_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.post(
    "/runs",
    response_model=AnalysisRunRead,
    status_code=status.HTTP_201_CREATED,
)
def start_analysis(
    case_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
    agent_settings: AgentSettingsDep,
) -> AnalysisRunRead:
    try:
        if agent_settings.enabled:
            return analysis_service.run_agent_analysis(
                session,
                case_id=case_id,
                owner_ref=owner_ref,
                agent_settings=agent_settings,
            )
        return analysis_service.run_deterministic_analysis(
            session, case_id=case_id, owner_ref=owner_ref
        )
    except analysis_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except analysis_service.NotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=exc.detail
        ) from exc


@router.get("/runs/{run_id}", response_model=AnalysisRunRead)
def get_run(
    case_id: str, run_id: str, session: SessionDep, owner_ref: OwnerDep
) -> AnalysisRunRead:
    try:
        return analysis_service.get_analysis_run(
            session, case_id=case_id, run_id=run_id, owner_ref=owner_ref
        )
    except analysis_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except analysis_service.RunNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
