"""create document_audit_log table for retention lifecycle events

Revision ID: 20260528_0008
Revises: 20260527_0007
Create Date: 2026-05-28 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260528_0008"
down_revision = "20260527_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "document_audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "document_id",
            sa.String(36),
            sa.ForeignKey("documents.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("actor_ref", sa.String(64), nullable=False),
        sa.Column("from_state", sa.String(32), nullable=True),
        sa.Column("to_state", sa.String(32), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "event_type in ('retention_transition', 'access_denied', 'storage_purged')",
            name="ck_document_audit_log_event_type",
        ),
    )


def downgrade() -> None:
    op.drop_table("document_audit_log")
