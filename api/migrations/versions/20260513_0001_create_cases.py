"""create cases table

Revision ID: 20260513_0001
Revises:
Create Date: 2026-05-13 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260513_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cases",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("case_stage", sa.String(length=32), nullable=False),
        sa.Column("document_type", sa.String(length=64), nullable=False),
        sa.Column("analysis_plan", sa.String(length=64), nullable=False),
        sa.Column("institution_name", sa.String(length=160), nullable=False),
        sa.Column("requested_amount_clp", sa.Integer(), nullable=True),
        sa.Column("expected_term_months", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cases_owner_ref", "cases", ["owner_ref"])


def downgrade() -> None:
    op.drop_index("ix_cases_owner_ref", table_name="cases")
    op.drop_table("cases")
