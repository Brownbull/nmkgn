from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from api.agents.document_receptionist import DocumentReceptionistAgent
from api.config import ReceptionistSettings, UploadStorageSettings
from api.models.case import Case
from api.models.document import Document
from api.models.receptionist import (
    RECEPTIONIST_SCHEMA_VERSION,
    DocumentExtractionGap,
    DocumentReceptionistObservation,
    DocumentReceptionistRun,
)
from api.schemas.receptionist import (
    ReceptionistObservationCreate,
)
from api.services.receptionist_media import (
    DocumentMediaBundle,
    MediaPackingError,
    build_document_media_bundle,
)
from api.services.receptionist_provider import (
    ReceptionistProviderError,
)

PROMPT_VERSION = "document-receptionist-v1"


class ReceptionistServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class ReceptionistCaseNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistDocumentNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistRunNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistGapNotFoundError(ReceptionistServiceError):
    pass


class ReceptionistDisabledError(ReceptionistServiceError):
    pass


class ReceptionistResolutionError(ReceptionistServiceError):
    pass


def ensure_case(session: Session, case_id: str, owner_ref: str) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.owner_ref == owner_ref)
    case = session.scalar(stmt)
    if case is None:
        raise ReceptionistCaseNotFoundError("case not found")
    return case


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


from api.services.receptionist_gaps import create_comparison_gaps  # noqa: E402


def start_document_receptionist_run(
    session: Session,
    *,
    case_id: str,
    document_id: str,
    owner_ref: str,
    receptionist_settings: ReceptionistSettings,
    upload_settings: UploadStorageSettings,
) -> DocumentReceptionistRun:
    if not receptionist_settings.enabled:
        raise ReceptionistDisabledError("receptionist gate is disabled")

    ensure_case(session, case_id, owner_ref)
    document = _get_document(session, case_id, document_id, owner_ref)
    if document is None:
        raise ReceptionistDocumentNotFoundError("document not found")

    now = utcnow()
    run = DocumentReceptionistRun(
        case_id=case_id,
        document_id=document_id,
        owner_ref=owner_ref,
        provider=receptionist_settings.provider,
        model_name=receptionist_settings.model,
        prompt_version=PROMPT_VERSION,
        schema_version=RECEPTIONIST_SCHEMA_VERSION,
        status="running",
        media_kind=_media_kind_for_document(document),
        media_page_count=None,
        processed_page_count=None,
        partial_coverage=False,
        started_at=now,
    )
    session.add(run)
    session.flush()

    try:
        media_bundle = build_document_media_bundle(
            session,
            document,
            receptionist_settings,
            upload_settings,
        )
        _apply_media_bundle(run, media_bundle)
        result = DocumentReceptionistAgent(receptionist_settings).review_document(
            document=document,
            media_bundle=media_bundle,
        )
        if result.review.document_id != document.id:
            raise ReceptionistProviderError(
                "invalid_output",
                "receptionist output referenced a different document",
            )
        if result.review.schema_version != RECEPTIONIST_SCHEMA_VERSION:
            raise ReceptionistProviderError(
                "invalid_output",
                "receptionist output used an unsupported schema version",
            )
        observations = _persist_observations(
            session,
            run=run,
            review_observations=result.review.observations,
        )
        run.latency_ms = result.latency_ms
        run.prompt_tokens = result.prompt_tokens
        run.completion_tokens = result.completion_tokens
        run.cost_usd = result.cost_usd
        run.partial_coverage = run.partial_coverage or result.review.partial_coverage
        create_comparison_gaps(
            session,
            run=run,
            observations=observations,
            media_bundle=media_bundle,
        )
        run.status = "completed"
        run.completed_at = utcnow()
    except MediaPackingError as exc:
        _fail_run(session, run, exc.code, exc.detail)
    except ReceptionistProviderError as exc:
        _fail_run(session, run, exc.code, exc.detail)
    except Exception:
        session.rollback()
        raise

    session.commit()
    return get_document_receptionist_run(
        session,
        case_id=case_id,
        document_id=document_id,
        run_id=run.id,
        owner_ref=owner_ref,
    )


def get_document_receptionist_run(
    session: Session,
    *,
    case_id: str,
    document_id: str,
    run_id: str,
    owner_ref: str,
) -> DocumentReceptionistRun:
    ensure_case(session, case_id, owner_ref)
    stmt = (
        select(DocumentReceptionistRun)
        .options(
            selectinload(DocumentReceptionistRun.observations),
            selectinload(DocumentReceptionistRun.gaps),
        )
        .join(Document, DocumentReceptionistRun.document_id == Document.id)
        .where(
            DocumentReceptionistRun.id == run_id,
            DocumentReceptionistRun.case_id == case_id,
            DocumentReceptionistRun.document_id == document_id,
            Document.owner_ref == owner_ref,
        )
    )
    run = session.scalar(stmt)
    if run is None:
        raise ReceptionistRunNotFoundError("receptionist run not found")
    return run


def _get_document(
    session: Session, case_id: str, document_id: str, owner_ref: str
) -> Document | None:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.case_id == case_id,
        Document.owner_ref == owner_ref,
        Document.upload_status == "stored",
        Document.retention_state == "active",
    )
    return session.scalar(stmt)


def _apply_media_bundle(
    run: DocumentReceptionistRun, media_bundle: DocumentMediaBundle
) -> None:
    run.media_kind = media_bundle.media_kind
    run.media_page_count = media_bundle.media_page_count
    run.processed_page_count = media_bundle.processed_page_count
    run.partial_coverage = media_bundle.partial_coverage


def _persist_observations(
    session: Session,
    *,
    run: DocumentReceptionistRun,
    review_observations: list[ReceptionistObservationCreate],
) -> list[DocumentReceptionistObservation]:
    observations = [
        DocumentReceptionistObservation(
            run_id=run.id,
            case_id=run.case_id,
            document_id=run.document_id,
            fact_key=observation.fact_key,
            field_label=observation.field_label,
            value_kind=observation.value_kind,
            value_text=observation.value_text,
            value_number=observation.value_number,
            value_currency=observation.value_currency,
            value_date=observation.value_date,
            unit=observation.unit,
            source_page_number=observation.source.page_number,
            source_start_offset=observation.source.start_offset,
            source_end_offset=observation.source.end_offset,
            source_snippet=observation.source.snippet,
            bounding_box=observation.source.bounding_box,
            anchor_status=observation.anchor_status,
            confidence=observation.confidence,
            raw_payload=observation.raw_payload,
        )
        for observation in review_observations
    ]
    session.add_all(observations)
    session.flush()
    return observations


def _fail_run(
    session: Session,
    run: DocumentReceptionistRun,
    error_code: str,
    error_message: str,
) -> None:
    run.status = "failed"
    run.error_code = error_code
    run.error_message = error_message
    run.completed_at = utcnow()
    session.add(
        DocumentExtractionGap(
            case_id=run.case_id,
            document_id=run.document_id,
            run_id=run.id,
            observation_id=None,
            fact_id=None,
            fact_key=None,
            gap_type="receptionist_unavailable",
            severity="high",
            blocking=True,
            status="open",
            detail=f"Receptionist run failed: {error_message}",
            deterministic_value=None,
            receptionist_value={
                "error_code": error_code,
                "error_message": error_message,
            },
            source_summary=None,
        )
    )


def _media_kind_for_document(document: Document) -> str:
    if document.content_type == "application/pdf":
        return "pdf_images"
    if document.content_type in {"image/jpeg", "image/png"}:
        return "image"
    return "text"
