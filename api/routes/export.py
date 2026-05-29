from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.config import get_stub_owner_ref
from api.schemas.export import ExportRequest, ExportSummary
from api.services import export as export_service
from api.services.database import get_session
from api.services.draft import DraftServiceError, generate_draft

router = APIRouter(prefix="/cases/{case_id}", tags=["export"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]


@router.post("/export", response_model=ExportSummary)
def export_findings(
    case_id: str,
    body: ExportRequest,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> ExportSummary:
    try:
        return export_service.export_findings(
            session,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_ids=body.finding_ids,
        )
    except export_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except export_service.NoCompletedRunError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=exc.detail
        ) from exc
    except export_service.EmptySelectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.detail
        ) from exc


@router.post("/draft")
def generate_draft_endpoint(
    case_id: str,
    body: ExportRequest,
    session: SessionDep,
    owner_ref: OwnerDep,
) -> dict:
    try:
        export_summary = export_service.export_findings(
            session,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_ids=body.finding_ids,
        )
    except export_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except export_service.NoCompletedRunError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=exc.detail
        ) from exc
    except export_service.EmptySelectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.detail
        ) from exc

    try:
        result = generate_draft(export_summary)
    except DraftServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.detail
        ) from exc

    return {
        "case_id": result.case_id,
        "analysis_run_id": result.analysis_run_id,
        "generated_at": result.generated_at.isoformat(),
        "sections": [
            {"heading": s.heading, "body": s.body} for s in result.sections
        ],
        "filtered_phrases": result.filtered_phrases,
        "warnings": result.warnings,
    }
