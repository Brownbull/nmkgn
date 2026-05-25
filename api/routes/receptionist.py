from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.config import (
    ReceptionistSettings,
    UploadStorageSettings,
    get_receptionist_settings,
    get_stub_owner_ref,
    get_upload_storage_settings,
)
from api.schemas.receptionist import (
    AnalysisReadinessRead,
    DocumentExtractionGapRead,
    DocumentReceptionistRunDetailRead,
    DocumentReceptionistRunRead,
    GapResolutionCreate,
    GapResolutionRead,
)
from api.services import receptionist as receptionist_service
from api.services import receptionist_gaps as gaps_service
from api.services.database import get_session

router = APIRouter(prefix="/cases/{case_id}", tags=["receptionist"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]
ReceptionistSettingsDep = Annotated[
    ReceptionistSettings, Depends(get_receptionist_settings)
]
UploadSettingsDep = Annotated[
    UploadStorageSettings, Depends(get_upload_storage_settings)
]


@router.post(
    "/documents/{document_id}/receptionist-runs",
    response_model=DocumentReceptionistRunRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_receptionist_run(
    case_id: str,
    document_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
    receptionist_settings: ReceptionistSettingsDep,
    upload_settings: UploadSettingsDep,
) -> DocumentReceptionistRunRead:
    try:
        return receptionist_service.start_document_receptionist_run(
            session=session,
            case_id=case_id,
            document_id=document_id,
            owner_ref=owner_ref,
            receptionist_settings=receptionist_settings,
            upload_settings=upload_settings,
        )
    except receptionist_service.ReceptionistCaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except receptionist_service.ReceptionistDocumentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except receptionist_service.ReceptionistDisabledError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.detail,
        ) from exc


@router.get(
    "/documents/{document_id}/receptionist-runs/{run_id}",
    response_model=DocumentReceptionistRunDetailRead,
)
def get_receptionist_run(
    case_id: str,
    document_id: str,
    run_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> DocumentReceptionistRunDetailRead:
    try:
        return receptionist_service.get_document_receptionist_run(
            session=session,
            case_id=case_id,
            document_id=document_id,
            run_id=run_id,
            owner_ref=owner_ref,
        )
    except receptionist_service.ReceptionistCaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except receptionist_service.ReceptionistRunNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.get("/receptionist/gaps", response_model=list[DocumentExtractionGapRead])
def list_receptionist_gaps(
    case_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
    gap_status: Annotated[str | None, Query(alias="status")] = None,
) -> list[DocumentExtractionGapRead]:
    try:
        return gaps_service.list_case_gaps(
            session=session,
            case_id=case_id,
            owner_ref=owner_ref,
            status=gap_status,
        )
    except receptionist_service.ReceptionistCaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.post(
    "/receptionist/gaps/{gap_id}/resolution",
    response_model=GapResolutionRead,
    status_code=status.HTTP_201_CREATED,
)
def resolve_receptionist_gap(
    case_id: str,
    gap_id: str,
    payload: GapResolutionCreate,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> GapResolutionRead:
    try:
        return gaps_service.resolve_gap(
            session=session,
            case_id=case_id,
            gap_id=gap_id,
            owner_ref=owner_ref,
            payload=payload,
        )
    except receptionist_service.ReceptionistCaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except receptionist_service.ReceptionistGapNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except receptionist_service.ReceptionistResolutionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=exc.detail,
        ) from exc


@router.get("/analysis-readiness", response_model=AnalysisReadinessRead)
def get_analysis_readiness(
    case_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> AnalysisReadinessRead:
    try:
        return gaps_service.get_analysis_readiness(
            session=session,
            case_id=case_id,
            owner_ref=owner_ref,
        )
    except receptionist_service.ReceptionistCaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
