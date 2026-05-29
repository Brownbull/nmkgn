from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from api.models.case import Case
from api.models.document import (
    Document,
    DocumentAuditLog,
    VALID_RETENTION_TRANSITIONS,
)
from api.services.documents import (
    AccessDeniedError,
    DocumentNotFoundError,
    InvalidRetentionTransitionError,
    cancel_deletion,
    confirm_deletion,
    get_document,
    get_document_audit_log,
    list_documents,
    request_deletion,
)


def _seed_case(session: Session, *, owner_ref: str = "owner-a") -> Case:
    case = Case(
        owner_ref=owner_ref,
        title="Retention test",
        case_stage="after_signing",
        document_type="consumer_credit",
        analysis_plan="after_signing_discrepancy",
        institution_name="Banco Test",
    )
    session.add(case)
    session.flush()
    return case


def _seed_document(
    session: Session,
    case: Case,
    *,
    owner_ref: str = "owner-a",
    retention_state: str = "active",
) -> Document:
    doc = Document(
        case_id=case.id,
        owner_ref=owner_ref,
        role="primary",
        document_type="consumer_credit",
        original_filename="test.pdf",
        content_type="application/pdf",
        byte_size=1024,
        checksum_sha256="a" * 64,
        storage_key=f"{owner_ref}/{case.id}/test.pdf",
        upload_status="stored",
        retention_state=retention_state,
    )
    session.add(doc)
    session.flush()
    return doc


class TestValidRetentionTransitions:
    def test_active_can_transition_to_delete_requested(self) -> None:
        assert "delete_requested" in VALID_RETENTION_TRANSITIONS["active"]

    def test_active_cannot_transition_to_deleted(self) -> None:
        assert "deleted" not in VALID_RETENTION_TRANSITIONS["active"]

    def test_delete_requested_can_transition_to_deleted(self) -> None:
        assert "deleted" in VALID_RETENTION_TRANSITIONS["delete_requested"]

    def test_delete_requested_can_revert_to_active(self) -> None:
        assert "active" in VALID_RETENTION_TRANSITIONS["delete_requested"]

    def test_deleted_is_terminal(self) -> None:
        assert len(VALID_RETENTION_TRANSITIONS["deleted"]) == 0


class TestRequestDeletion:
    def test_transitions_active_to_delete_requested(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        result = request_deletion(session, case.id, doc.id, "owner-a")
        assert result.retention_state == "delete_requested"

    def test_rejects_from_deleted_state(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="deleted")
        session.commit()

        with pytest.raises(InvalidRetentionTransitionError, match="cannot transition"):
            request_deletion(session, case.id, doc.id, "owner-a")

    def test_rejects_already_delete_requested(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        with pytest.raises(InvalidRetentionTransitionError):
            request_deletion(session, case.id, doc.id, "owner-a")

    def test_creates_audit_log_entry(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        request_deletion(session, case.id, doc.id, "owner-a")
        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert len(logs) == 1
        assert logs[0].event_type == "retention_transition"
        assert logs[0].from_state == "active"
        assert logs[0].to_state == "delete_requested"
        assert logs[0].actor_ref == "owner-a"


class TestConfirmDeletion:
    def test_transitions_delete_requested_to_deleted(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        result = confirm_deletion(session, case.id, doc.id, "owner-a")
        assert result.retention_state == "deleted"

    def test_rejects_from_active_state(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        with pytest.raises(InvalidRetentionTransitionError, match="cannot transition"):
            confirm_deletion(session, case.id, doc.id, "owner-a")

    def test_creates_audit_log_entry(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        confirm_deletion(session, case.id, doc.id, "owner-a")
        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert len(logs) == 1
        assert logs[0].from_state == "delete_requested"
        assert logs[0].to_state == "deleted"


class TestCancelDeletion:
    def test_transitions_delete_requested_to_active(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        result = cancel_deletion(session, case.id, doc.id, "owner-a")
        assert result.retention_state == "active"

    def test_rejects_from_active_state(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        with pytest.raises(InvalidRetentionTransitionError):
            cancel_deletion(session, case.id, doc.id, "owner-a")

    def test_rejects_from_deleted_state(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="deleted")
        session.commit()

        with pytest.raises(InvalidRetentionTransitionError):
            cancel_deletion(session, case.id, doc.id, "owner-a")


class TestOwnerScopedAccess:
    def test_wrong_owner_raises_access_denied(self, session: Session) -> None:
        case = _seed_case(session, owner_ref="owner-a")
        doc = _seed_document(session, case, owner_ref="owner-a")
        session.commit()

        with pytest.raises(AccessDeniedError, match="access denied"):
            request_deletion(session, case.id, doc.id, "owner-b")

    def test_access_denied_creates_audit_log(self, session: Session) -> None:
        case = _seed_case(session, owner_ref="owner-a")
        doc = _seed_document(session, case, owner_ref="owner-a")
        session.commit()

        with pytest.raises(AccessDeniedError):
            request_deletion(session, case.id, doc.id, "owner-b")

        stmt = (
            session.query(DocumentAuditLog)
            .filter(DocumentAuditLog.document_id == doc.id)
            .all()
        )
        access_denied_logs = [e for e in stmt if e.event_type == "access_denied"]
        assert len(access_denied_logs) == 1
        assert access_denied_logs[0].actor_ref == "owner-b"

    def test_nonexistent_document_raises(self, session: Session) -> None:
        case = _seed_case(session)
        session.commit()

        with pytest.raises(DocumentNotFoundError):
            request_deletion(session, case.id, "nonexistent-id", "owner-a")


class TestDeletedDocumentFiltering:
    def test_list_excludes_deleted_by_default(self, session: Session) -> None:
        case = _seed_case(session)
        _seed_document(session, case, retention_state="active")
        _seed_document(session, case, retention_state="deleted")
        session.commit()

        docs = list_documents(session, case.id, "owner-a")
        assert len(docs) == 1
        assert docs[0].retention_state == "active"

    def test_list_includes_deleted_when_requested(self, session: Session) -> None:
        case = _seed_case(session)
        _seed_document(session, case, retention_state="active")
        _seed_document(session, case, retention_state="deleted")
        session.commit()

        docs = list_documents(session, case.id, "owner-a", include_deleted=True)
        assert len(docs) == 2

    def test_list_includes_delete_requested(self, session: Session) -> None:
        case = _seed_case(session)
        _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        docs = list_documents(session, case.id, "owner-a")
        assert len(docs) == 1

    def test_get_excludes_deleted_by_default(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="deleted")
        session.commit()

        result = get_document(session, case.id, doc.id, "owner-a")
        assert result is None

    def test_get_includes_deleted_when_requested(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="deleted")
        session.commit()

        result = get_document(
            session, case.id, doc.id, "owner-a", include_deleted=True
        )
        assert result is not None
        assert result.retention_state == "deleted"


class TestFullLifecycle:
    def test_active_to_delete_requested_to_deleted(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        doc = request_deletion(session, case.id, doc.id, "owner-a")
        assert doc.retention_state == "delete_requested"

        doc = confirm_deletion(session, case.id, doc.id, "owner-a")
        assert doc.retention_state == "deleted"

        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert len(logs) == 2
        assert logs[0].to_state == "delete_requested"
        assert logs[1].to_state == "deleted"

    def test_request_then_cancel_returns_to_active(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        doc = request_deletion(session, case.id, doc.id, "owner-a")
        assert doc.retention_state == "delete_requested"

        doc = cancel_deletion(session, case.id, doc.id, "owner-a")
        assert doc.retention_state == "active"

        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert len(logs) == 2
        assert logs[0].to_state == "delete_requested"
        assert logs[1].to_state == "active"

    def test_deleted_is_terminal(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case, retention_state="delete_requested")
        session.commit()

        confirm_deletion(session, case.id, doc.id, "owner-a")

        with pytest.raises(InvalidRetentionTransitionError):
            request_deletion(session, case.id, doc.id, "owner-a")

        with pytest.raises(InvalidRetentionTransitionError):
            cancel_deletion(session, case.id, doc.id, "owner-a")


class TestGetDocumentAuditLog:
    def test_returns_empty_for_no_events(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert logs == []

    def test_returns_events_in_order(self, session: Session) -> None:
        case = _seed_case(session)
        doc = _seed_document(session, case)
        session.commit()

        request_deletion(session, case.id, doc.id, "owner-a")
        cancel_deletion(session, case.id, doc.id, "owner-a")

        logs = get_document_audit_log(session, case.id, doc.id, "owner-a")
        assert len(logs) == 2
        assert logs[0].created_at <= logs[1].created_at
