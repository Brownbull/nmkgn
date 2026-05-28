"""create document and extracted text tables

Revision ID: 20260514_0002
Revises: 20260513_0001
Create Date: 2026-05-14 10:35:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260514_0002"
down_revision = "20260513_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("document_type", sa.String(length=64), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("upload_status", sa.String(length=32), nullable=False),
        sa.Column("extraction_status", sa.String(length=32), nullable=False),
        sa.Column("retention_state", sa.String(length=32), nullable=False),
        sa.Column("delete_after", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("byte_size > 0", name="ck_documents_byte_size_positive"),
        sa.CheckConstraint(
            "role in ('primary', 'simulation', 'offer', 'payment', 'email', 'comparator_loan')",
            name="ck_documents_role",
        ),
        sa.CheckConstraint(
            "document_type = 'consumer_credit'", name="ck_documents_document_type"
        ),
        sa.CheckConstraint(
            "upload_status in ('pending', 'stored', 'failed')",
            name="ck_documents_upload_status",
        ),
        sa.CheckConstraint(
            "extraction_status in ('pending', 'extracting', 'extracted', 'needs_ocr', 'failed')",
            name="ck_documents_extraction_status",
        ),
        sa.CheckConstraint(
            "retention_state in ('active', 'delete_requested', 'deleted')",
            name="ck_documents_retention_state",
        ),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_documents_case_id", "documents", ["case_id"])
    op.create_index("ix_documents_owner_ref", "documents", ["owner_ref"])

    op.create_table(
        "extracted_text_segments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("start_offset", sa.Integer(), nullable=True),
        sa.Column("end_offset", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("extraction_provider", sa.String(length=80), nullable=False),
        sa.Column("extracted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("warning_code", sa.String(length=80), nullable=True),
        sa.Column("warning_message", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "page_number is null or page_number >= 1",
            name="ck_extracted_text_page_positive",
        ),
        sa.CheckConstraint(
            "start_offset is null or start_offset >= 0",
            name="ck_extracted_text_start_positive",
        ),
        sa.CheckConstraint(
            "end_offset is null or end_offset >= 0",
            name="ck_extracted_text_end_positive",
        ),
        sa.CheckConstraint(
            "start_offset is null or end_offset is null or end_offset >= start_offset",
            name="ck_extracted_text_span_order",
        ),
        sa.CheckConstraint(
            "(start_offset is null and end_offset is null) or "
            "(start_offset is not null and end_offset is not null)",
            name="ck_extracted_text_span_pair",
        ),
        sa.CheckConstraint(
            "page_number is not null or start_offset is not null",
            name="ck_extracted_text_source_locator",
        ),
        sa.CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_extracted_text_confidence",
        ),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_extracted_text_segments_document_id",
        "extracted_text_segments",
        ["document_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_extracted_text_segments_document_id", table_name="extracted_text_segments"
    )
    op.drop_table("extracted_text_segments")
    op.drop_index("ix_documents_owner_ref", table_name="documents")
    op.drop_index("ix_documents_case_id", table_name="documents")
    op.drop_table("documents")
