"""create official reference catalog table

Revision ID: 20260526_0006
Revises: 20260518_0005
Create Date: 2026-05-26 12:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260526_0006"
down_revision = "20260518_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "official_references",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("reference_key", sa.String(length=120), nullable=False),
        sa.Column("source_category", sa.String(length=32), nullable=False),
        sa.Column("display_label", sa.String(length=240), nullable=False),
        sa.Column("marketplace_safe_label", sa.String(length=240), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("retrieved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("schema_version", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_key", name="uq_official_references_key"),
        sa.CheckConstraint(
            "source_category in ('cmf', 'sernac', 'ley_chile', 'benchmark')",
            name="ck_official_references_source_category",
        ),
    )
    op.create_index(
        "ix_official_references_reference_key",
        "official_references",
        ["reference_key"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_official_references_reference_key",
        table_name="official_references",
    )
    op.drop_table("official_references")
