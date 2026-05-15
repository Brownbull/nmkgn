from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from api.config import (
    UploadStorageSettings,
    get_stub_owner_ref,
    get_upload_storage_settings,
)
from api.schemas.documents import DocumentRead, DocumentRole, DocumentType
from api.services import documents as document_service
from api.services.database import get_session

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])

SessionDep = Annotated[Session, Depends(get_session)]
OwnerDep = Annotated[str, Depends(get_stub_owner_ref)]
UploadSettingsDep = Annotated[
    UploadStorageSettings, Depends(get_upload_storage_settings)
]


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    case_id: str,
    session: SessionDep,
    owner_ref: OwnerDep,
    settings: UploadSettingsDep,
    file: Annotated[UploadFile, File(...)],
    role: Annotated[DocumentRole, Form(...)],
    document_type: Annotated[DocumentType, Form()] = "consumer_credit",
) -> DocumentRead:
    try:
        return document_service.store_document_upload(
            session=session,
            case_id=case_id,
            owner_ref=owner_ref,
            role=role,
            document_type=document_type,
            upload=file,
            settings=settings,
        )
    except document_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    except document_service.UnsupportedContentTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=exc.detail
        ) from exc
    except document_service.UploadTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=exc.detail
        ) from exc
    except document_service.EmptyUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=exc.detail
        ) from exc
    except document_service.StorageWriteError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=exc.detail
        ) from exc


@router.get("", response_model=list[DocumentRead])
def list_documents(
    case_id: str, session: SessionDep, owner_ref: OwnerDep
) -> list[DocumentRead]:
    try:
        return document_service.list_documents(session, case_id, owner_ref)
    except document_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    case_id: str, document_id: str, session: SessionDep, owner_ref: OwnerDep
) -> DocumentRead:
    try:
        document = document_service.get_document(
            session, case_id, document_id, owner_ref
        )
    except document_service.CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail
        ) from exc
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="document not found"
        )
    return document
