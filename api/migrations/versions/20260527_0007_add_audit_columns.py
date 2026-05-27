"""add audit timeline, warnings, suppressed findings columns to analysis_runs

Revision ID: 20260527_0007
Revises: 20260526_0006
Create Date: 2026-05-27 20:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260527_0007"
down_revision = "20260526_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("analysis_runs") as batch_op:
        batch_op.add_column(
            sa.Column("timeline_events", sa.JSON(), nullable=False, server_default="[]")
        )
        batch_op.add_column(
            sa.Column("warnings", sa.JSON(), nullable=False, server_default="[]")
        )
        batch_op.add_column(
            sa.Column(
                "suppressed_finding_keys",
                sa.JSON(),
                nullable=False,
                server_default="[]",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("analysis_runs") as batch_op:
        batch_op.drop_column("suppressed_finding_keys")
        batch_op.drop_column("warnings")
        batch_op.drop_column("timeline_events")
