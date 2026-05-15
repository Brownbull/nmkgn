"""create consumer credit fact and confirmation tables

Revision ID: 20260515_0003
Revises: 20260514_0002
Create Date: 2026-05-15 15:53:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260515_0003"
down_revision = "20260514_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.create_unique_constraint(
            "uq_documents_id_case_id", ["id", "case_id"]
        )
    with op.batch_alter_table("extracted_text_segments") as batch_op:
        batch_op.create_unique_constraint(
            "uq_extracted_text_id_document_id", ["id", "document_id"]
        )

    op.create_table(
        "consumer_credit_facts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("text_segment_id", sa.String(length=36), nullable=True),
        sa.Column("fact_key", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("value_kind", sa.String(length=32), nullable=False),
        sa.Column("value_text", sa.Text(), nullable=True),
        sa.Column("value_number", sa.Float(), nullable=True),
        sa.Column("value_currency", sa.String(length=3), nullable=True),
        sa.Column("value_date", sa.Date(), nullable=True),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("high_impact", sa.Boolean(), nullable=False),
        sa.Column("confirmation_status", sa.String(length=32), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("source_page_number", sa.Integer(), nullable=True),
        sa.Column("source_start_offset", sa.Integer(), nullable=True),
        sa.Column("source_end_offset", sa.Integer(), nullable=True),
        sa.Column("source_snippet", sa.Text(), nullable=True),
        sa.Column("extraction_provider", sa.String(length=80), nullable=False),
        sa.Column("extracted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("warning_code", sa.String(length=80), nullable=True),
        sa.Column("warning_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "fact_key in ("
            "'principal_amount', 'currency', 'contract_date', 'term_months', "
            "'payment_count', 'installment_amount', 'interest_rate', 'cae', "
            "'total_cost', 'fee', 'insurance', 'linked_product', 'clause'"
            ")",
            name="ck_consumer_credit_facts_key",
        ),
        sa.CheckConstraint(
            "value_kind in ('money', 'currency', 'date', 'integer', 'percentage', 'text', 'boolean')",
            name="ck_consumer_credit_facts_value_kind",
        ),
        sa.CheckConstraint(
            "confirmation_status in ('pending', 'confirmed', 'corrected', 'rejected')",
            name="ck_consumer_credit_facts_confirmation_status",
        ),
        sa.CheckConstraint(
            "source_type = 'uploaded_document'",
            name="ck_consumer_credit_facts_source_type",
        ),
        sa.CheckConstraint(
            "source_page_number is null or source_page_number >= 1",
            name="ck_consumer_credit_facts_page_positive",
        ),
        sa.CheckConstraint(
            "source_start_offset is null or source_start_offset >= 0",
            name="ck_consumer_credit_facts_start_positive",
        ),
        sa.CheckConstraint(
            "source_end_offset is null or source_end_offset >= 0",
            name="ck_consumer_credit_facts_end_positive",
        ),
        sa.CheckConstraint(
            "source_start_offset is null or source_end_offset is null or source_end_offset >= source_start_offset",
            name="ck_consumer_credit_facts_span_order",
        ),
        sa.CheckConstraint(
            "(source_start_offset is null and source_end_offset is null) or "
            "(source_start_offset is not null and source_end_offset is not null)",
            name="ck_consumer_credit_facts_span_pair",
        ),
        sa.CheckConstraint(
            "text_segment_id is not null or source_page_number is not null or source_start_offset is not null",
            name="ck_consumer_credit_facts_source_locator",
        ),
        sa.CheckConstraint(
            "value_text is not null or value_number is not null or value_currency is not null or "
            "value_date is not null or warning_code is not null",
            name="ck_consumer_credit_facts_value_or_warning",
        ),
        sa.CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_consumer_credit_facts_confidence",
        ),
        sa.ForeignKeyConstraint(
            ["document_id", "case_id"],
            ["documents.id", "documents.case_id"],
            ondelete="CASCADE",
            name="fk_consumer_credit_facts_document_case",
        ),
        sa.ForeignKeyConstraint(
            ["text_segment_id"],
            ["extracted_text_segments.id"],
            ondelete="SET NULL",
            name="fk_consumer_credit_facts_text_segment",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_consumer_credit_facts_case_id", "consumer_credit_facts", ["case_id"]
    )
    op.create_index(
        "ix_consumer_credit_facts_document_id", "consumer_credit_facts", ["document_id"]
    )
    op.create_index(
        "ix_consumer_credit_facts_text_segment_id",
        "consumer_credit_facts",
        ["text_segment_id"],
    )
    op.create_index(
        "ix_consumer_credit_facts_fact_key", "consumer_credit_facts", ["fact_key"]
    )

    op.create_table(
        "fact_confirmations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("fact_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("corrected_value_text", sa.Text(), nullable=True),
        sa.Column("corrected_value_number", sa.Float(), nullable=True),
        sa.Column("corrected_value_currency", sa.String(length=3), nullable=True),
        sa.Column("corrected_value_date", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "action in ('confirm', 'correct', 'reject')",
            name="ck_fact_confirmations_action",
        ),
        sa.CheckConstraint(
            "(action = 'correct' and ("
            "corrected_value_text is not null or corrected_value_number is not null or "
            "corrected_value_currency is not null or corrected_value_date is not null"
            ")) or (action in ('confirm', 'reject') and "
            "corrected_value_text is null and corrected_value_number is null and "
            "corrected_value_currency is null and corrected_value_date is null)",
            name="ck_fact_confirmations_action_value",
        ),
        sa.ForeignKeyConstraint(
            ["fact_id"], ["consumer_credit_facts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_fact_confirmations_fact_id", "fact_confirmations", ["fact_id"])
    op.create_index(
        "ix_fact_confirmations_owner_ref", "fact_confirmations", ["owner_ref"]
    )


def downgrade() -> None:
    op.drop_index("ix_fact_confirmations_owner_ref", table_name="fact_confirmations")
    op.drop_index("ix_fact_confirmations_fact_id", table_name="fact_confirmations")
    op.drop_table("fact_confirmations")
    op.drop_index(
        "ix_consumer_credit_facts_fact_key", table_name="consumer_credit_facts"
    )
    op.drop_index(
        "ix_consumer_credit_facts_text_segment_id", table_name="consumer_credit_facts"
    )
    op.drop_index(
        "ix_consumer_credit_facts_document_id", table_name="consumer_credit_facts"
    )
    op.drop_index(
        "ix_consumer_credit_facts_case_id", table_name="consumer_credit_facts"
    )
    op.drop_table("consumer_credit_facts")
    with op.batch_alter_table("extracted_text_segments") as batch_op:
        batch_op.drop_constraint(
            "uq_extracted_text_id_document_id", type_="unique"
        )
    with op.batch_alter_table("documents") as batch_op:
        batch_op.drop_constraint("uq_documents_id_case_id", type_="unique")
