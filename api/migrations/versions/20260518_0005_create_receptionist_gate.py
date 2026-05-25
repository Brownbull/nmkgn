"""create receptionist extraction gate tables

Revision ID: 20260518_0005
Revises: 20260518_0004
Create Date: 2026-05-18 17:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260518_0005"
down_revision = "20260518_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "document_receptionist_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("prompt_version", sa.String(length=80), nullable=False),
        sa.Column("schema_version", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("media_kind", sa.String(length=32), nullable=False),
        sa.Column("media_page_count", sa.Integer(), nullable=True),
        sa.Column("processed_page_count", sa.Integer(), nullable=True),
        sa.Column("partial_coverage", sa.Boolean(), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Float(), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status in ('pending', 'running', 'completed', 'failed')",
            name="ck_document_receptionist_runs_status",
        ),
        sa.CheckConstraint(
            "media_kind in ('text', 'image', 'pdf_images')",
            name="ck_document_receptionist_runs_media_kind",
        ),
        sa.CheckConstraint(
            "media_page_count is null or media_page_count >= 0",
            name="ck_document_receptionist_runs_media_page_count",
        ),
        sa.CheckConstraint(
            "processed_page_count is null or processed_page_count >= 0",
            name="ck_document_receptionist_runs_processed_page_count",
        ),
        sa.CheckConstraint(
            "processed_page_count is null or media_page_count is null or "
            "processed_page_count <= media_page_count",
            name="ck_document_receptionist_runs_page_order",
        ),
        sa.CheckConstraint(
            "prompt_tokens is null or prompt_tokens >= 0",
            name="ck_document_receptionist_runs_prompt_tokens",
        ),
        sa.CheckConstraint(
            "completion_tokens is null or completion_tokens >= 0",
            name="ck_document_receptionist_runs_completion_tokens",
        ),
        sa.CheckConstraint(
            "latency_ms is null or latency_ms >= 0",
            name="ck_document_receptionist_runs_latency_ms",
        ),
        sa.CheckConstraint(
            "cost_usd is null or cost_usd >= 0",
            name="ck_document_receptionist_runs_cost_usd",
        ),
        sa.ForeignKeyConstraint(
            ["document_id", "case_id"],
            ["documents.id", "documents.case_id"],
            ondelete="CASCADE",
            name="fk_document_receptionist_runs_document_case",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_receptionist_runs_id_case",
        ),
        sa.UniqueConstraint(
            "id",
            "document_id",
            "case_id",
            name="uq_document_receptionist_runs_id_document_case",
        ),
    )
    op.create_index(
        "ix_document_receptionist_runs_case_id",
        "document_receptionist_runs",
        ["case_id"],
    )
    op.create_index(
        "ix_document_receptionist_runs_document_id",
        "document_receptionist_runs",
        ["document_id"],
    )
    op.create_index(
        "ix_document_receptionist_runs_owner_ref",
        "document_receptionist_runs",
        ["owner_ref"],
    )

    op.create_table(
        "document_receptionist_observations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("run_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("fact_key", sa.String(length=80), nullable=True),
        sa.Column("field_label", sa.String(length=160), nullable=False),
        sa.Column("value_kind", sa.String(length=32), nullable=False),
        sa.Column("value_text", sa.Text(), nullable=True),
        sa.Column("value_number", sa.Float(), nullable=True),
        sa.Column("value_currency", sa.String(length=3), nullable=True),
        sa.Column("value_date", sa.Date(), nullable=True),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("source_page_number", sa.Integer(), nullable=True),
        sa.Column("source_start_offset", sa.Integer(), nullable=True),
        sa.Column("source_end_offset", sa.Integer(), nullable=True),
        sa.Column("source_snippet", sa.Text(), nullable=True),
        sa.Column("bounding_box", sa.JSON(), nullable=True),
        sa.Column("anchor_status", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "value_kind in ('money', 'currency', 'date', 'integer', 'percentage', 'text', 'boolean', 'unsupported')",
            name="ck_document_receptionist_observations_value_kind",
        ),
        sa.CheckConstraint(
            "anchor_status in ('anchored', 'unanchored', 'partial')",
            name="ck_document_receptionist_observations_anchor_status",
        ),
        sa.CheckConstraint(
            "source_page_number is null or source_page_number >= 1",
            name="ck_document_receptionist_observations_page_positive",
        ),
        sa.CheckConstraint(
            "source_start_offset is null or source_start_offset >= 0",
            name="ck_document_receptionist_observations_start_positive",
        ),
        sa.CheckConstraint(
            "source_end_offset is null or source_end_offset >= 0",
            name="ck_document_receptionist_observations_end_positive",
        ),
        sa.CheckConstraint(
            "source_start_offset is null or source_end_offset is null or "
            "source_end_offset >= source_start_offset",
            name="ck_document_receptionist_observations_span_order",
        ),
        sa.CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_document_receptionist_observations_confidence",
        ),
        sa.ForeignKeyConstraint(
            ["run_id", "document_id", "case_id"],
            [
                "document_receptionist_runs.id",
                "document_receptionist_runs.document_id",
                "document_receptionist_runs.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_receptionist_observations_run_document_case",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_receptionist_observations_id_case",
        ),
        sa.UniqueConstraint(
            "id",
            "run_id",
            "case_id",
            name="uq_document_receptionist_observations_id_run_case",
        ),
    )
    op.create_index(
        "ix_document_receptionist_observations_case_id",
        "document_receptionist_observations",
        ["case_id"],
    )
    op.create_index(
        "ix_document_receptionist_observations_document_id",
        "document_receptionist_observations",
        ["document_id"],
    )
    op.create_index(
        "ix_document_receptionist_observations_fact_key",
        "document_receptionist_observations",
        ["fact_key"],
    )
    op.create_index(
        "ix_document_receptionist_observations_run_id",
        "document_receptionist_observations",
        ["run_id"],
    )

    op.create_table(
        "document_extraction_gaps",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("run_id", sa.String(length=36), nullable=False),
        sa.Column("observation_id", sa.String(length=36), nullable=True),
        sa.Column("fact_id", sa.String(length=36), nullable=True),
        sa.Column("fact_key", sa.String(length=80), nullable=True),
        sa.Column("gap_type", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=32), nullable=False),
        sa.Column("blocking", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("deterministic_value", sa.JSON(), nullable=True),
        sa.Column("receptionist_value", sa.JSON(), nullable=True),
        sa.Column("source_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "gap_type in ("
            "'missing_in_deterministic', 'missing_in_receptionist', 'value_conflict', "
            "'source_conflict', 'deterministic_warning_resolved', 'llm_unanchored_claim', "
            "'unsupported_field', 'receptionist_unavailable', 'partial_document_coverage'"
            ")",
            name="ck_document_extraction_gaps_type",
        ),
        sa.CheckConstraint(
            "severity in ('low', 'medium', 'high')",
            name="ck_document_extraction_gaps_severity",
        ),
        sa.CheckConstraint(
            "status in ('open', 'resolved')",
            name="ck_document_extraction_gaps_status",
        ),
        sa.ForeignKeyConstraint(
            ["run_id", "document_id", "case_id"],
            [
                "document_receptionist_runs.id",
                "document_receptionist_runs.document_id",
                "document_receptionist_runs.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_extraction_gaps_run_document_case",
        ),
        sa.ForeignKeyConstraint(
            ["observation_id", "run_id", "case_id"],
            [
                "document_receptionist_observations.id",
                "document_receptionist_observations.run_id",
                "document_receptionist_observations.case_id",
            ],
            ondelete="CASCADE",
            name="fk_document_extraction_gaps_observation_run_case",
        ),
        sa.ForeignKeyConstraint(
            ["fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gaps_fact_case",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "id",
            "case_id",
            name="uq_document_extraction_gaps_id_case",
        ),
    )
    op.create_index(
        "ix_document_extraction_gaps_case_id",
        "document_extraction_gaps",
        ["case_id"],
    )
    op.create_index(
        "ix_document_extraction_gaps_document_id",
        "document_extraction_gaps",
        ["document_id"],
    )
    op.create_index(
        "ix_document_extraction_gaps_fact_id",
        "document_extraction_gaps",
        ["fact_id"],
    )
    op.create_index(
        "ix_document_extraction_gaps_fact_key",
        "document_extraction_gaps",
        ["fact_key"],
    )
    op.create_index(
        "ix_document_extraction_gaps_observation_id",
        "document_extraction_gaps",
        ["observation_id"],
    )
    op.create_index(
        "ix_document_extraction_gaps_run_id",
        "document_extraction_gaps",
        ["run_id"],
    )

    op.create_table(
        "document_extraction_gap_resolutions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("gap_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_fact_id", sa.String(length=36), nullable=True),
        sa.Column("corrected_fact_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "action in ('confirm_deterministic', 'accept_receptionist', 'reject_receptionist', 'defer_unsupported')",
            name="ck_document_extraction_gap_resolutions_action",
        ),
        sa.ForeignKeyConstraint(
            ["gap_id", "case_id"],
            ["document_extraction_gaps.id", "document_extraction_gaps.case_id"],
            ondelete="CASCADE",
            name="fk_document_extraction_gap_resolutions_gap_case",
        ),
        sa.ForeignKeyConstraint(
            ["created_fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gap_resolutions_created_fact_case",
        ),
        sa.ForeignKeyConstraint(
            ["corrected_fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            name="fk_document_extraction_gap_resolutions_corrected_fact_case",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_document_extraction_gap_resolutions_case_id",
        "document_extraction_gap_resolutions",
        ["case_id"],
    )
    op.create_index(
        "ix_document_extraction_gap_resolutions_corrected_fact_id",
        "document_extraction_gap_resolutions",
        ["corrected_fact_id"],
    )
    op.create_index(
        "ix_document_extraction_gap_resolutions_created_fact_id",
        "document_extraction_gap_resolutions",
        ["created_fact_id"],
    )
    op.create_index(
        "ix_document_extraction_gap_resolutions_gap_id",
        "document_extraction_gap_resolutions",
        ["gap_id"],
    )
    op.create_index(
        "ix_document_extraction_gap_resolutions_owner_ref",
        "document_extraction_gap_resolutions",
        ["owner_ref"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_document_extraction_gap_resolutions_owner_ref",
        table_name="document_extraction_gap_resolutions",
    )
    op.drop_index(
        "ix_document_extraction_gap_resolutions_gap_id",
        table_name="document_extraction_gap_resolutions",
    )
    op.drop_index(
        "ix_document_extraction_gap_resolutions_created_fact_id",
        table_name="document_extraction_gap_resolutions",
    )
    op.drop_index(
        "ix_document_extraction_gap_resolutions_corrected_fact_id",
        table_name="document_extraction_gap_resolutions",
    )
    op.drop_index(
        "ix_document_extraction_gap_resolutions_case_id",
        table_name="document_extraction_gap_resolutions",
    )
    op.drop_table("document_extraction_gap_resolutions")
    op.drop_index(
        "ix_document_extraction_gaps_run_id",
        table_name="document_extraction_gaps",
    )
    op.drop_index(
        "ix_document_extraction_gaps_observation_id",
        table_name="document_extraction_gaps",
    )
    op.drop_index(
        "ix_document_extraction_gaps_fact_key",
        table_name="document_extraction_gaps",
    )
    op.drop_index(
        "ix_document_extraction_gaps_fact_id",
        table_name="document_extraction_gaps",
    )
    op.drop_index(
        "ix_document_extraction_gaps_document_id",
        table_name="document_extraction_gaps",
    )
    op.drop_index(
        "ix_document_extraction_gaps_case_id",
        table_name="document_extraction_gaps",
    )
    op.drop_table("document_extraction_gaps")
    op.drop_index(
        "ix_document_receptionist_observations_run_id",
        table_name="document_receptionist_observations",
    )
    op.drop_index(
        "ix_document_receptionist_observations_fact_key",
        table_name="document_receptionist_observations",
    )
    op.drop_index(
        "ix_document_receptionist_observations_document_id",
        table_name="document_receptionist_observations",
    )
    op.drop_index(
        "ix_document_receptionist_observations_case_id",
        table_name="document_receptionist_observations",
    )
    op.drop_table("document_receptionist_observations")
    op.drop_index(
        "ix_document_receptionist_runs_owner_ref",
        table_name="document_receptionist_runs",
    )
    op.drop_index(
        "ix_document_receptionist_runs_document_id",
        table_name="document_receptionist_runs",
    )
    op.drop_index(
        "ix_document_receptionist_runs_case_id",
        table_name="document_receptionist_runs",
    )
    op.drop_table("document_receptionist_runs")
