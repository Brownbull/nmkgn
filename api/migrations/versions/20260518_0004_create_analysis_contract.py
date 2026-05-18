"""create consumer credit analysis contract tables

Revision ID: 20260518_0004
Revises: 20260515_0003
Create Date: 2026-05-18 12:48:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260518_0004"
down_revision = "20260515_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("consumer_credit_facts") as batch_op:
        batch_op.create_unique_constraint(
            "uq_consumer_credit_facts_id_case_id",
            ["id", "case_id"],
        )

    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column(
            "schema_version",
            sa.String(length=80),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("readiness_snapshot", sa.JSON(), nullable=False),
        sa.Column("input_fact_ids", sa.JSON(), nullable=False),
        sa.Column("agent_provider", sa.String(length=80), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=True),
        sa.Column("prompt_version", sa.String(length=80), nullable=True),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status in ('pending', 'running', 'completed', 'failed')",
            name="ck_analysis_runs_status",
        ),
        sa.CheckConstraint(
            "schema_version <> ''", name="ck_analysis_runs_schema_version"
        ),
        sa.CheckConstraint(
            "prompt_tokens is null or prompt_tokens >= 0",
            name="ck_analysis_runs_prompt_tokens",
        ),
        sa.CheckConstraint(
            "completion_tokens is null or completion_tokens >= 0",
            name="ck_analysis_runs_completion_tokens",
        ),
        sa.CheckConstraint(
            "latency_ms is null or latency_ms >= 0",
            name="ck_analysis_runs_latency_ms",
        ),
        sa.CheckConstraint(
            "cost_usd is null or cost_usd >= 0",
            name="ck_analysis_runs_cost_usd",
        ),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "case_id", name="uq_analysis_runs_id_case_id"),
    )
    op.create_index("ix_analysis_runs_case_id", "analysis_runs", ["case_id"])
    op.create_index("ix_analysis_runs_owner_ref", "analysis_runs", ["owner_ref"])

    op.create_table(
        "analysis_calculations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("analysis_run_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("calculation_key", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("formula_version", sa.String(length=80), nullable=False),
        sa.Column("input_fact_ids", sa.JSON(), nullable=False),
        sa.Column("inputs", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("missing_input_keys", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "calculation_key <> ''",
            name="ck_analysis_calculations_key",
        ),
        sa.CheckConstraint("label <> ''", name="ck_analysis_calculations_label"),
        sa.CheckConstraint(
            "formula_version <> ''",
            name="ck_analysis_calculations_formula_version",
        ),
        sa.ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_calculations_run_case",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "id",
            "analysis_run_id",
            "case_id",
            name="uq_analysis_calculations_id_run_case",
        ),
    )
    op.create_index(
        "ix_analysis_calculations_analysis_run_id",
        "analysis_calculations",
        ["analysis_run_id"],
    )
    op.create_index(
        "ix_analysis_calculations_case_id", "analysis_calculations", ["case_id"]
    )
    op.create_index(
        "ix_analysis_calculations_calculation_key",
        "analysis_calculations",
        ["calculation_key"],
    )

    op.create_table(
        "analysis_findings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("analysis_run_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("owner_ref", sa.String(length=64), nullable=False),
        sa.Column("finding_key", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=32), nullable=False),
        sa.Column("claim_type", sa.String(length=32), nullable=False),
        sa.Column("uncertainty_state", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "severity in ('low', 'medium', 'high', 'critical')",
            name="ck_analysis_findings_severity",
        ),
        sa.CheckConstraint(
            "claim_type in ('fact', 'calculation', 'reference', 'inference')",
            name="ck_analysis_findings_claim_type",
        ),
        sa.CheckConstraint(
            "uncertainty_state in ('supported', 'uncertain', 'missing_context')",
            name="ck_analysis_findings_uncertainty_state",
        ),
        sa.CheckConstraint(
            "confidence is null or (confidence >= 0 and confidence <= 1)",
            name="ck_analysis_findings_confidence",
        ),
        sa.CheckConstraint("finding_key <> ''", name="ck_analysis_findings_key"),
        sa.CheckConstraint("title <> ''", name="ck_analysis_findings_title"),
        sa.ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_findings_run_case",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "analysis_run_id",
            "finding_key",
            name="uq_analysis_findings_run_key",
        ),
        sa.UniqueConstraint(
            "id",
            "analysis_run_id",
            "case_id",
            name="uq_analysis_findings_id_run_case",
        ),
    )
    op.create_index(
        "ix_analysis_findings_analysis_run_id",
        "analysis_findings",
        ["analysis_run_id"],
    )
    op.create_index("ix_analysis_findings_case_id", "analysis_findings", ["case_id"])
    op.create_index(
        "ix_analysis_findings_owner_ref", "analysis_findings", ["owner_ref"]
    )

    op.create_table(
        "analysis_evidence",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("analysis_run_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("finding_id", sa.String(length=36), nullable=False),
        sa.Column("evidence_type", sa.String(length=32), nullable=False),
        sa.Column("fact_id", sa.String(length=36), nullable=True),
        sa.Column("calculation_id", sa.String(length=36), nullable=True),
        sa.Column("calculation_key", sa.String(length=80), nullable=True),
        sa.Column("reference_key", sa.String(length=120), nullable=True),
        sa.Column("citation_url", sa.String(length=500), nullable=True),
        sa.Column("citation_label", sa.String(length=240), nullable=True),
        sa.Column("citation_retrieved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("citation_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("inference_summary", sa.Text(), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=True),
        sa.Column("schema_version", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "evidence_type in ('fact', 'calculation', 'reference', 'inference')",
            name="ck_analysis_evidence_type",
        ),
        sa.CheckConstraint(
            "("
            "(evidence_type = 'fact' and fact_id is not null) or "
            "(evidence_type = 'calculation' and (calculation_id is not null or calculation_key is not null)) or "
            "(evidence_type = 'reference' and citation_url is not null and citation_label is not null) or "
            "(evidence_type = 'inference' and inference_summary is not null and model_name is not null)"
            ")",
            name="ck_analysis_evidence_locator",
        ),
        sa.ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_evidence_run_case",
        ),
        sa.ForeignKeyConstraint(
            ["finding_id", "analysis_run_id", "case_id"],
            [
                "analysis_findings.id",
                "analysis_findings.analysis_run_id",
                "analysis_findings.case_id",
            ],
            ondelete="CASCADE",
            name="fk_analysis_evidence_finding_run_case",
        ),
        sa.ForeignKeyConstraint(
            ["calculation_id", "analysis_run_id", "case_id"],
            [
                "analysis_calculations.id",
                "analysis_calculations.analysis_run_id",
                "analysis_calculations.case_id",
            ],
            ondelete="CASCADE",
            name="fk_analysis_evidence_calculation_run_case",
        ),
        sa.ForeignKeyConstraint(
            ["fact_id", "case_id"],
            ["consumer_credit_facts.id", "consumer_credit_facts.case_id"],
            ondelete="CASCADE",
            name="fk_analysis_evidence_fact_case",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_analysis_evidence_analysis_run_id",
        "analysis_evidence",
        ["analysis_run_id"],
    )
    op.create_index("ix_analysis_evidence_case_id", "analysis_evidence", ["case_id"])
    op.create_index(
        "ix_analysis_evidence_finding_id", "analysis_evidence", ["finding_id"]
    )
    op.create_index("ix_analysis_evidence_fact_id", "analysis_evidence", ["fact_id"])
    op.create_index(
        "ix_analysis_evidence_calculation_id",
        "analysis_evidence",
        ["calculation_id"],
    )
    op.create_index(
        "ix_analysis_evidence_calculation_key",
        "analysis_evidence",
        ["calculation_key"],
    )
    op.create_index(
        "ix_analysis_evidence_reference_key",
        "analysis_evidence",
        ["reference_key"],
    )

    op.create_table(
        "unsupported_analysis_outputs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("analysis_run_id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("output_key", sa.String(length=120), nullable=False),
        sa.Column("raw_output", sa.JSON(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "output_key <> ''",
            name="ck_unsupported_analysis_outputs_key",
        ),
        sa.CheckConstraint(
            "reason <> ''",
            name="ck_unsupported_analysis_outputs_reason",
        ),
        sa.ForeignKeyConstraint(
            ["analysis_run_id", "case_id"],
            ["analysis_runs.id", "analysis_runs.case_id"],
            ondelete="CASCADE",
            name="fk_unsupported_analysis_outputs_run_case",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_unsupported_analysis_outputs_analysis_run_id",
        "unsupported_analysis_outputs",
        ["analysis_run_id"],
    )
    op.create_index(
        "ix_unsupported_analysis_outputs_case_id",
        "unsupported_analysis_outputs",
        ["case_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_unsupported_analysis_outputs_case_id",
        table_name="unsupported_analysis_outputs",
    )
    op.drop_index(
        "ix_unsupported_analysis_outputs_analysis_run_id",
        table_name="unsupported_analysis_outputs",
    )
    op.drop_table("unsupported_analysis_outputs")
    op.drop_index("ix_analysis_evidence_reference_key", table_name="analysis_evidence")
    op.drop_index(
        "ix_analysis_evidence_calculation_key", table_name="analysis_evidence"
    )
    op.drop_index("ix_analysis_evidence_calculation_id", table_name="analysis_evidence")
    op.drop_index("ix_analysis_evidence_fact_id", table_name="analysis_evidence")
    op.drop_index("ix_analysis_evidence_finding_id", table_name="analysis_evidence")
    op.drop_index("ix_analysis_evidence_case_id", table_name="analysis_evidence")
    op.drop_index(
        "ix_analysis_evidence_analysis_run_id", table_name="analysis_evidence"
    )
    op.drop_table("analysis_evidence")
    op.drop_index("ix_analysis_findings_owner_ref", table_name="analysis_findings")
    op.drop_index("ix_analysis_findings_case_id", table_name="analysis_findings")
    op.drop_index(
        "ix_analysis_findings_analysis_run_id", table_name="analysis_findings"
    )
    op.drop_table("analysis_findings")
    op.drop_index(
        "ix_analysis_calculations_calculation_key",
        table_name="analysis_calculations",
    )
    op.drop_index(
        "ix_analysis_calculations_case_id", table_name="analysis_calculations"
    )
    op.drop_index(
        "ix_analysis_calculations_analysis_run_id",
        table_name="analysis_calculations",
    )
    op.drop_table("analysis_calculations")
    op.drop_index("ix_analysis_runs_owner_ref", table_name="analysis_runs")
    op.drop_index("ix_analysis_runs_case_id", table_name="analysis_runs")
    op.drop_table("analysis_runs")
    with op.batch_alter_table("consumer_credit_facts") as batch_op:
        batch_op.drop_constraint("uq_consumer_credit_facts_id_case_id", type_="unique")
