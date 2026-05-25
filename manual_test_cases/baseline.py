from __future__ import annotations

import json
import mimetypes
import os
import re
import time
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import fitz
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

BASELINE_SCHEMA_VERSION = "consumer_credit_baseline.v1"
DEFAULT_BASELINE_PROVIDER = "local-replay"
DEFAULT_BASELINE_MODEL = "claude-sonnet-4-5"
DEFAULT_BASELINE_MAX_PAGES = 12

BaselineProviderName = Literal["local-replay", "anthropic"]
BaselineStatus = Literal["completed", "failed"]
StageStatus = Literal["completed", "failed", "skipped"]
GapSeverity = Literal["low", "medium", "high"]
GapType = Literal[
    "missing_deterministic_field",
    "value_mismatch",
    "source_mismatch",
    "unsupported_relevant_field",
    "extraction_media_failure",
    "model_context_recommendation",
]

SENSITIVE_KEY_PARTS = (
    "authorization",
    "cookie",
    "password",
    "secret",
    "token",
)
DEFAULT_REDACT_KEYS = {
    "checksum_sha256",
    "data",
    "data_base64",
    "filename",
    "image_bytes",
    "original_filename",
    "path",
    "raw_payload",
    "rendered_images",
    "snippet",
    "source_snippet",
    "text",
}
SUPPORTED_FACT_KEYS = {
    "principal_amount",
    "currency",
    "contract_date",
    "term_months",
    "payment_count",
    "installment_amount",
    "interest_rate",
    "cae",
    "total_cost",
    "fee",
    "insurance",
    "linked_product",
    "clause",
}


class BaselineError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    detail: str


class BaselineSourceAnchor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_index: int | None = Field(default=None, ge=1)
    document_role: str | None = None
    page_number: int | None = Field(default=None, ge=1)
    start_offset: int | None = Field(default=None, ge=0)
    end_offset: int | None = Field(default=None, ge=0)
    snippet: str | None = None
    anchor_status: Literal["anchored", "unanchored", "partial"] = "anchored"


class BaselineDocumentObservation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_index: int | None = Field(default=None, ge=1)
    document_role: str | None = None
    fact_key: str | None = None
    field_label: str
    value_kind: Literal[
        "money",
        "currency",
        "date",
        "integer",
        "percentage",
        "text",
        "boolean",
        "unsupported",
        "unknown",
    ]
    value_text: str | None = None
    value_number: float | None = None
    value_currency: str | None = None
    value_date: str | None = None
    unit: str | None = None
    source: BaselineSourceAnchor = Field(default_factory=BaselineSourceAnchor)
    confidence: float = Field(ge=0, le=1)
    rationale: str | None = None


class BaselineExtractionGap(BaseModel):
    model_config = ConfigDict(extra="forbid")

    gap_type: GapType
    severity: GapSeverity = "medium"
    blocking: bool = False
    fact_key: str | None = None
    document_index: int | None = Field(default=None, ge=1)
    baseline_summary: str
    app_summary: str | None = None
    recommendation: str
    evidence: list[BaselineSourceAnchor] = Field(default_factory=list)


class BaselineHeuristicSuggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_fact_key: str | None = None
    label: str
    suggested_rule_type: Literal[
        "label_value_block",
        "adjacent_regex",
        "payment_schedule",
        "normalizer",
        "readiness_rule",
        "other",
    ] = "other"
    priority: Literal["low", "medium", "high"] = "medium"
    rationale: str
    example_source: BaselineSourceAnchor | None = None


class BaselineModelCallRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str
    context_needed: list[str] = Field(default_factory=list)
    media_needed: bool = False
    provider_hint: str | None = None
    reason: str
    risk: Literal["low", "medium", "high"] = "medium"


class BaselineStageResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str
    status: StageStatus
    summary: str
    warnings: list[str] = Field(default_factory=list)


class ConsumerCreditBaselineReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: str = BASELINE_SCHEMA_VERSION
    case_catalog_id: str
    provider: BaselineProviderName = DEFAULT_BASELINE_PROVIDER
    model_name: str | None = None
    status: BaselineStatus = "completed"
    generated_at: str = Field(default_factory=lambda: now_iso())
    stages: list[BaselineStageResult] = Field(default_factory=list)
    observations: list[BaselineDocumentObservation] = Field(default_factory=list)
    gaps: list[BaselineExtractionGap] = Field(default_factory=list)
    heuristic_suggestions: list[BaselineHeuristicSuggestion] = Field(
        default_factory=list
    )
    model_call_recommendations: list[BaselineModelCallRecommendation] = Field(
        default_factory=list
    )
    warnings: list[str] = Field(default_factory=list)
    error: BaselineError | None = None

    @field_validator("schema_version")
    @classmethod
    def _schema_version_is_current(cls, value: str) -> str:
        if value != BASELINE_SCHEMA_VERSION:
            raise ValueError(f"schema_version must be {BASELINE_SCHEMA_VERSION}")
        return value


@dataclass(frozen=True)
class BaselineRunOptions:
    provider: BaselineProviderName = DEFAULT_BASELINE_PROVIDER
    model: str | None = None
    max_pages: int = DEFAULT_BASELINE_MAX_PAGES
    allow_external_llm: bool = False
    include_sensitive_output: bool = False


@dataclass(frozen=True)
class BaselineImageMedia:
    page_number: int
    content_type: str
    data: bytes


@dataclass(frozen=True)
class BaselinePackedDocument:
    catalog_index: int
    role: str
    content_type: str
    media_kind: str
    media_page_count: int | None
    processed_page_count: int | None
    partial_coverage: bool
    text: str | None
    images: tuple[BaselineImageMedia, ...]
    warnings: tuple[str, ...] = ()
    error_code: str | None = None
    error_detail: str | None = None

    @property
    def ok(self) -> bool:
        return self.error_code is None

    def metadata(self) -> dict[str, Any]:
        return {
            "catalog_index": self.catalog_index,
            "role": self.role,
            "content_type": self.content_type,
            "media_kind": self.media_kind,
            "media_page_count": self.media_page_count,
            "processed_page_count": self.processed_page_count,
            "partial_coverage": self.partial_coverage,
            "image_count": len(self.images),
            "text_chars": len(self.text or ""),
            "warnings": list(self.warnings),
            "error_code": self.error_code,
            "error_detail": self.error_detail,
        }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_manual_baseline(
    *,
    case: dict[str, Any],
    run_dir: Path,
    manual_root: Path,
    options: BaselineRunOptions,
) -> dict[str, Any]:
    baseline_dir = run_dir / "baseline"
    baseline_dir.mkdir(parents=True, exist_ok=True)

    packed_documents = tuple(
        pack_catalog_document(
            document,
            manual_root=manual_root,
            catalog_index=index,
            max_pages=options.max_pages,
        )
        for index, document in enumerate(case.get("documents", []), start=1)
    )

    if options.provider == "local-replay":
        report = _load_local_replay_report(
            case_id=str(case["id"]),
            manual_root=manual_root,
        )
    elif options.provider == "anthropic":
        report = _run_anthropic_report(
            case=case,
            run_dir=run_dir,
            packed_documents=packed_documents,
            options=options,
        )
    else:  # pragma: no cover - argparse/type hints prevent this.
        report = _failed_report(
            case_id=str(case["id"]),
            provider=options.provider,
            model_name=options.model,
            code="unsupported_provider",
            detail=f"baseline provider {options.provider!r} is not supported",
        )

    media_gaps = _media_failure_gaps(packed_documents)
    comparison_gaps = (
        _compare_baseline_to_app_outputs(report, run_dir)
        if report.status == "completed"
        else []
    )
    final_gaps = _dedupe_gaps([*report.gaps, *media_gaps, *comparison_gaps])
    final_report = report.model_copy(update={"gaps": final_gaps})

    _write_baseline_artifacts(
        baseline_dir=baseline_dir,
        report=final_report,
        packed_documents=packed_documents,
        include_sensitive_output=options.include_sensitive_output,
    )
    return _baseline_summary(final_report, baseline_dir, run_dir)


def pack_catalog_document(
    document: dict[str, Any],
    *,
    manual_root: Path,
    catalog_index: int,
    max_pages: int,
) -> BaselinePackedDocument:
    raw_path = str(document.get("path") or "")
    path = _resolve_manual_path(raw_path, manual_root)
    role = str(document.get("role") or "unknown")
    content_type = _content_type_for(path, document.get("expected_content_type"))
    if not path.exists() or not path.is_file():
        return _packed_error(
            catalog_index,
            role,
            content_type,
            "missing_file",
            "fixture document was not found",
        )

    if content_type == "text/plain":
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            return _packed_error(
                catalog_index,
                role,
                content_type,
                "media_read_failed",
                f"could not read text document: {exc}",
            )
        return BaselinePackedDocument(
            catalog_index=catalog_index,
            role=role,
            content_type=content_type,
            media_kind="text",
            media_page_count=0,
            processed_page_count=0,
            partial_coverage=False,
            text=text,
            images=(),
        )

    if content_type in {"image/jpeg", "image/png"}:
        try:
            data = path.read_bytes()
        except OSError as exc:
            return _packed_error(
                catalog_index,
                role,
                content_type,
                "media_read_failed",
                f"could not read image document: {exc}",
            )
        return BaselinePackedDocument(
            catalog_index=catalog_index,
            role=role,
            content_type=content_type,
            media_kind="image",
            media_page_count=1,
            processed_page_count=1,
            partial_coverage=False,
            text=None,
            images=(BaselineImageMedia(1, content_type, data),),
        )

    if content_type == "application/pdf":
        return _pack_pdf_document(
            path=path,
            catalog_index=catalog_index,
            role=role,
            max_pages=max_pages,
        )

    return _packed_error(
        catalog_index,
        role,
        content_type,
        "unsupported_media",
        f"fixture content type {content_type!r} is not supported",
    )


def _pack_pdf_document(
    *,
    path: Path,
    catalog_index: int,
    role: str,
    max_pages: int,
) -> BaselinePackedDocument:
    try:
        pdf = fitz.open(path)
    except Exception as exc:
        return _packed_error(
            catalog_index,
            role,
            "application/pdf",
            "malformed_document",
            f"could not open PDF: {exc}",
        )

    try:
        if pdf.needs_pass:
            password = _password_from_info_file(path.parent / "info.json")
            if not password:
                return _packed_error(
                    catalog_index,
                    role,
                    "application/pdf",
                    "encrypted_document",
                    "PDF requires a password and no local info.json password was found",
                )
            if not pdf.authenticate(password):
                return _packed_error(
                    catalog_index,
                    role,
                    "application/pdf",
                    "bad_password",
                    "PDF password from local info.json was rejected",
                )

        page_count = pdf.page_count
        processed_count = min(page_count, max_pages)
        images: list[BaselineImageMedia] = []
        text_parts: list[str] = []
        for index in range(processed_count):
            page = pdf.load_page(index)
            page_text = page.get_text("text").strip()
            if page_text:
                text_parts.append(f"[page {index + 1}]\n{page_text}")
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            images.append(
                BaselineImageMedia(
                    page_number=index + 1,
                    content_type="image/png",
                    data=pixmap.tobytes("png"),
                )
            )
    except Exception as exc:
        return _packed_error(
            catalog_index,
            role,
            "application/pdf",
            "media_render_failed",
            f"could not render PDF pages: {exc}",
        )
    finally:
        pdf.close()

    partial = page_count > processed_count
    warnings = (
        (f"processed {processed_count} of {page_count} pages",) if partial else ()
    )
    return BaselinePackedDocument(
        catalog_index=catalog_index,
        role=role,
        content_type="application/pdf",
        media_kind="pdf_images",
        media_page_count=page_count,
        processed_page_count=processed_count,
        partial_coverage=partial,
        text="\n\n".join(text_parts) if text_parts else None,
        images=tuple(images),
        warnings=warnings,
    )


def _load_local_replay_report(
    *, case_id: str, manual_root: Path
) -> ConsumerCreditBaselineReport:
    path = manual_root / "baselines.local" / case_id / "baseline.json"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return _failed_report(
            case_id=case_id,
            provider="local-replay",
            model_name=None,
            code="local_replay_missing",
            detail=f"missing local replay baseline at {path.relative_to(manual_root)}",
        )
    except json.JSONDecodeError as exc:
        return _failed_report(
            case_id=case_id,
            provider="local-replay",
            model_name=None,
            code="local_replay_invalid_json",
            detail=f"could not parse local replay baseline: {exc}",
        )

    try:
        report = ConsumerCreditBaselineReport.model_validate(payload)
    except ValidationError as exc:
        return _failed_report(
            case_id=case_id,
            provider="local-replay",
            model_name=None,
            code="local_replay_invalid_schema",
            detail=f"local replay baseline failed schema validation: {exc}",
        )

    if report.case_catalog_id != case_id:
        return _failed_report(
            case_id=case_id,
            provider="local-replay",
            model_name=None,
            code="local_replay_case_mismatch",
            detail=(
                "local replay baseline case_catalog_id "
                f"{report.case_catalog_id!r} does not match {case_id!r}"
            ),
        )

    return report.model_copy(update={"provider": "local-replay"})


def _run_anthropic_report(
    *,
    case: dict[str, Any],
    run_dir: Path,
    packed_documents: tuple[BaselinePackedDocument, ...],
    options: BaselineRunOptions,
) -> ConsumerCreditBaselineReport:
    case_id = str(case["id"])
    model_name = options.model or os.getenv("NMKGN_BASELINE_MODEL")
    if not options.allow_external_llm:
        return _failed_report(
            case_id=case_id,
            provider="anthropic",
            model_name=model_name,
            code="external_llm_not_allowed",
            detail="anthropic baseline requires --allow-external-llm",
        )
    if not model_name:
        return _failed_report(
            case_id=case_id,
            provider="anthropic",
            model_name=None,
            code="missing_baseline_model",
            detail="anthropic baseline requires --baseline-model or NMKGN_BASELINE_MODEL",
        )
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _failed_report(
            case_id=case_id,
            provider="anthropic",
            model_name=model_name,
            code="missing_anthropic_api_key",
            detail="ANTHROPIC_API_KEY is required for anthropic baseline runs",
        )

    try:
        return _call_anthropic_agent(
            case=case,
            run_dir=run_dir,
            packed_documents=packed_documents,
            model_name=model_name,
            api_key=api_key,
        )
    except Exception as exc:  # pragma: no cover - network/provider defensive path.
        return _failed_report(
            case_id=case_id,
            provider="anthropic",
            model_name=model_name,
            code="baseline_provider_failed",
            detail=f"{type(exc).__name__}: {exc}",
        )


def _call_anthropic_agent(
    *,
    case: dict[str, Any],
    run_dir: Path,
    packed_documents: tuple[BaselinePackedDocument, ...],
    model_name: str,
    api_key: str,
) -> ConsumerCreditBaselineReport:
    from pydantic_ai import Agent
    from pydantic_ai.messages import BinaryContent
    from pydantic_ai.models.anthropic import AnthropicModel
    from pydantic_ai.providers.anthropic import AnthropicProvider

    provider = AnthropicProvider(api_key=api_key)
    model = AnthropicModel(model_name, provider=provider)
    agent = Agent(
        model,
        output_type=ConsumerCreditBaselineReport,
        system_prompt=_baseline_prompt(),
    )
    payload = _anthropic_payload(case, run_dir, packed_documents)
    user_content: list[Any] = [
        (
            "Produce a ConsumerCreditBaselineReport for this manual fixture. "
            "Do not mutate app state. Use source anchors when available.\n\n"
            f"{json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True)}"
        )
    ]
    for packed in packed_documents:
        for image in packed.images:
            user_content.append(
                BinaryContent(data=image.data, media_type=image.content_type)
            )

    started = time.monotonic()
    result = agent.run_sync(user_content)
    output = getattr(result, "output", None) or getattr(result, "data")
    latency_ms = int((time.monotonic() - started) * 1000)
    return output.model_copy(
        update={
            "provider": "anthropic",
            "model_name": model_name,
            "warnings": [
                *output.warnings,
                f"anthropic baseline latency_ms={latency_ms}",
            ],
        }
    )


def _anthropic_payload(
    case: dict[str, Any],
    run_dir: Path,
    packed_documents: tuple[BaselinePackedDocument, ...],
) -> dict[str, Any]:
    return {
        "case": _case_for_prompt(case),
        "document_media": [document.metadata() for document in packed_documents],
        "document_text": [
            {
                "catalog_index": document.catalog_index,
                "role": document.role,
                "text": document.text,
            }
            for document in packed_documents
            if document.text
        ],
        "app_outputs": _load_current_app_outputs(run_dir),
        "supported_fact_keys": sorted(SUPPORTED_FACT_KEYS),
    }


def _case_for_prompt(case: dict[str, Any]) -> dict[str, Any]:
    allowed_keys = {
        "id",
        "title",
        "case_stage",
        "document_type",
        "institution_name",
        "requested_amount_clp",
        "expected_term_months",
        "analysis_plan",
    }
    return {key: value for key, value in case.items() if key in allowed_keys}


def _baseline_prompt() -> str:
    path = (
        Path(__file__).resolve().parent / "prompts" / "consumer_credit_baseline_v1.md"
    )
    return path.read_text(encoding="utf-8")


def _compare_baseline_to_app_outputs(
    report: ConsumerCreditBaselineReport, run_dir: Path
) -> list[BaselineExtractionGap]:
    outputs = _load_current_app_outputs(run_dir)
    facts = outputs.get("facts") if isinstance(outputs.get("facts"), list) else []
    fact_keys = {
        str(fact.get("fact_key"))
        for fact in facts
        if isinstance(fact, dict) and fact.get("fact_key")
    }
    warning_fact_keys = {
        str(fact.get("fact_key"))
        for fact in facts
        if isinstance(fact, dict) and fact.get("fact_key") and fact.get("warning_code")
    }

    generated: list[BaselineExtractionGap] = []
    for observation in report.observations:
        if observation.value_kind == "unsupported":
            generated.append(
                BaselineExtractionGap(
                    gap_type="unsupported_relevant_field",
                    severity="medium",
                    blocking=False,
                    fact_key=observation.fact_key,
                    document_index=observation.document_index,
                    baseline_summary=(
                        f"Baseline observed unsupported field "
                        f"{observation.field_label!r}."
                    ),
                    app_summary="No trusted deterministic fact key currently stores it.",
                    recommendation="Track as backlog evidence; do not promote to facts.",
                    evidence=[observation.source],
                )
            )
            continue
        if observation.fact_key and observation.fact_key not in fact_keys:
            generated.append(
                BaselineExtractionGap(
                    gap_type="missing_deterministic_field",
                    severity=(
                        "high"
                        if observation.fact_key in _required_high_impact_keys()
                        else "medium"
                    ),
                    blocking=observation.fact_key in _required_high_impact_keys(),
                    fact_key=observation.fact_key,
                    document_index=observation.document_index,
                    baseline_summary=(
                        f"Baseline found {observation.fact_key} "
                        f"from {observation.field_label!r}."
                    ),
                    app_summary="Deterministic extraction did not emit that fact key.",
                    recommendation=(
                        "Evaluate whether a generic deterministic parser or "
                        "receptionist promotion path should cover this field."
                    ),
                    evidence=[observation.source],
                )
            )
        elif observation.fact_key and observation.fact_key in warning_fact_keys:
            generated.append(
                BaselineExtractionGap(
                    gap_type="missing_deterministic_field",
                    severity=(
                        "high"
                        if observation.fact_key in _required_high_impact_keys()
                        else "medium"
                    ),
                    blocking=observation.fact_key in _required_high_impact_keys(),
                    fact_key=observation.fact_key,
                    document_index=observation.document_index,
                    baseline_summary=(
                        f"Baseline found a concrete value for {observation.fact_key}."
                    ),
                    app_summary=(
                        "Deterministic extraction emitted only a warning placeholder."
                    ),
                    recommendation=(
                        "Inspect the source pattern and consider a deterministic "
                        "parser improvement before relying on an LLM-only path."
                    ),
                    evidence=[observation.source],
                )
            )

    receptionist_gaps = outputs.get("receptionist-gaps")
    if isinstance(receptionist_gaps, list):
        generated.extend(_receptionist_gap_summaries(receptionist_gaps))

    analysis_readiness = outputs.get("analysis-readiness")
    if isinstance(analysis_readiness, dict) and not analysis_readiness.get(
        "ready_for_analysis", True
    ):
        generated.append(
            BaselineExtractionGap(
                gap_type="model_context_recommendation",
                severity="medium",
                blocking=False,
                baseline_summary="App composite readiness is still blocked.",
                app_summary="analysis-readiness reports ready_for_analysis=false.",
                recommendation=(
                    "Use the baseline report to prioritize deterministic fixes and "
                    "receptionist review before consumer-credit analysis runs."
                ),
            )
        )

    return generated


def _receptionist_gap_summaries(gaps: list[Any]) -> list[BaselineExtractionGap]:
    generated: list[BaselineExtractionGap] = []
    for gap in gaps:
        if not isinstance(gap, dict):
            continue
        gap_type = str(gap.get("gap_type") or "")
        if gap_type not in {"value_conflict", "source_conflict"}:
            continue
        generated.append(
            BaselineExtractionGap(
                gap_type="value_mismatch"
                if gap_type == "value_conflict"
                else "source_mismatch",
                severity="high" if gap.get("blocking") else "medium",
                blocking=bool(gap.get("blocking")),
                fact_key=gap.get("fact_key"),
                baseline_summary="Receptionist comparator already found a conflict.",
                app_summary=str(gap.get("status") or "open"),
                recommendation="Resolve through the receptionist gap review workflow.",
            )
        )
    return generated


def _media_failure_gaps(
    packed_documents: tuple[BaselinePackedDocument, ...],
) -> list[BaselineExtractionGap]:
    gaps: list[BaselineExtractionGap] = []
    for document in packed_documents:
        if document.error_code:
            gaps.append(
                BaselineExtractionGap(
                    gap_type="extraction_media_failure",
                    severity="high",
                    blocking=True,
                    document_index=document.catalog_index,
                    baseline_summary=(
                        f"Baseline media packing failed for document "
                        f"{document.catalog_index}: {document.error_code}."
                    ),
                    app_summary=document.error_detail,
                    recommendation=(
                        "Fix fixture access or document media handling before "
                        "using this baseline as a reference packet."
                    ),
                )
            )
        elif document.partial_coverage:
            gaps.append(
                BaselineExtractionGap(
                    gap_type="extraction_media_failure",
                    severity="high",
                    blocking=True,
                    document_index=document.catalog_index,
                    baseline_summary=(
                        f"Baseline packed only {document.processed_page_count} of "
                        f"{document.media_page_count} pages."
                    ),
                    app_summary="Document exceeded the configured baseline page limit.",
                    recommendation="Raise the baseline page limit or split the fixture.",
                )
            )
    return gaps


def _write_baseline_artifacts(
    *,
    baseline_dir: Path,
    report: ConsumerCreditBaselineReport,
    packed_documents: tuple[BaselinePackedDocument, ...],
    include_sensitive_output: bool,
) -> None:
    output_payload = report.model_dump(mode="json")
    media_payload = [document.metadata() for document in packed_documents]
    _write_json(
        baseline_dir / "output.json",
        _sanitize(
            {
                "report": output_payload,
                "media": media_payload,
            },
            include_sensitive_output=include_sensitive_output,
        ),
    )
    _write_json(
        baseline_dir / "gaps.json",
        _sanitize(
            [gap.model_dump(mode="json") for gap in report.gaps],
            include_sensitive_output=include_sensitive_output,
        ),
    )
    _write_json(
        baseline_dir / "model-call-plan.json",
        _sanitize(
            [
                recommendation.model_dump(mode="json")
                for recommendation in report.model_call_recommendations
            ],
            include_sensitive_output=include_sensitive_output,
        ),
    )
    (baseline_dir / "report.md").write_text(
        _render_markdown_report(report),
        encoding="utf-8",
    )
    if report.status == "failed" or report.error is not None:
        _write_json(
            baseline_dir / "error.json",
            report.error.model_dump(mode="json")
            if report.error is not None
            else {"code": "baseline_failed", "detail": "baseline status failed"},
        )


def _render_markdown_report(report: ConsumerCreditBaselineReport) -> str:
    gap_counts = Counter(gap.gap_type for gap in report.gaps)
    lines = [
        "# Consumer Credit Baseline Report",
        "",
        f"- Schema: `{report.schema_version}`",
        f"- Case: `{report.case_catalog_id}`",
        f"- Provider: `{report.provider}`",
        f"- Status: `{report.status}`",
        f"- Observations: {len(report.observations)}",
        f"- Gaps: {len(report.gaps)}",
    ]
    if report.error:
        lines.append(f"- Error: `{report.error.code}`")
    if gap_counts:
        lines.extend(["", "## Gap Types"])
        for gap_type, count in sorted(gap_counts.items()):
            lines.append(f"- `{gap_type}`: {count}")
    if report.heuristic_suggestions:
        lines.extend(["", "## Heuristic Suggestions"])
        for suggestion in report.heuristic_suggestions:
            target = suggestion.target_fact_key or "unsupported"
            lines.append(f"- `{target}`: {suggestion.label}")
    if report.model_call_recommendations:
        lines.extend(["", "## Model Call Plan"])
        for recommendation in report.model_call_recommendations:
            lines.append(f"- `{recommendation.stage}`: {recommendation.reason}")
    return "\n".join(lines) + "\n"


def _baseline_summary(
    report: ConsumerCreditBaselineReport, baseline_dir: Path, run_dir: Path
) -> dict[str, Any]:
    return {
        "enabled": True,
        "provider": report.provider,
        "model_name": report.model_name,
        "status": report.status,
        "artifact_dir": str(baseline_dir.relative_to(run_dir)),
        "observation_count": len(report.observations),
        "gap_count": len(report.gaps),
        "blocking_gap_count": sum(1 for gap in report.gaps if gap.blocking),
        "gap_types": dict(Counter(gap.gap_type for gap in report.gaps)),
        "error": report.error.model_dump(mode="json") if report.error else None,
    }


def _failed_report(
    *,
    case_id: str,
    provider: BaselineProviderName,
    model_name: str | None,
    code: str,
    detail: str,
) -> ConsumerCreditBaselineReport:
    return ConsumerCreditBaselineReport(
        case_catalog_id=case_id,
        provider=provider,
        model_name=model_name,
        status="failed",
        stages=[
            BaselineStageResult(
                stage="baseline_provider",
                status="failed",
                summary=detail,
            )
        ],
        warnings=[detail],
        error=BaselineError(code=code, detail=detail),
    )


def _packed_error(
    catalog_index: int,
    role: str,
    content_type: str,
    code: str,
    detail: str,
) -> BaselinePackedDocument:
    return BaselinePackedDocument(
        catalog_index=catalog_index,
        role=role,
        content_type=content_type,
        media_kind="error",
        media_page_count=None,
        processed_page_count=None,
        partial_coverage=False,
        text=None,
        images=(),
        error_code=code,
        error_detail=detail,
    )


def _load_current_app_outputs(run_dir: Path) -> dict[str, Any]:
    outputs: dict[str, Any] = {}
    for name in (
        "documents",
        "facts",
        "fact-readiness",
        "receptionist-gaps",
        "analysis-readiness",
    ):
        path = run_dir / f"{name}.json"
        if not path.exists():
            continue
        try:
            outputs[name] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            outputs[name] = {"error": "invalid_json"}
    return outputs


def _dedupe_gaps(gaps: list[BaselineExtractionGap]) -> list[BaselineExtractionGap]:
    seen: set[tuple[Any, ...]] = set()
    deduped: list[BaselineExtractionGap] = []
    for gap in gaps:
        key = (
            gap.gap_type,
            gap.fact_key,
            gap.document_index,
            _compact(gap.baseline_summary),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(gap)
    return deduped


def _required_high_impact_keys() -> set[str]:
    return {
        "principal_amount",
        "contract_date",
        "term_months",
        "payment_count",
        "installment_amount",
        "cae",
        "total_cost",
    }


def _resolve_manual_path(raw_path: str, manual_root: Path) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (manual_root / path).resolve()


def _content_type_for(path: Path, configured: Any) -> str:
    if isinstance(configured, str) and configured:
        return configured
    guessed = mimetypes.guess_type(path.name)[0]
    if guessed:
        return guessed
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".txt": "text/plain",
    }.get(path.suffix.lower(), "application/octet-stream")


def _password_from_info_file(path: Path) -> str | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None
    return _find_password(payload)


def _find_password(value: Any) -> str | None:
    if isinstance(value, dict):
        for key, item in value.items():
            if "password" in str(key).lower() and isinstance(item, str):
                return item
        for item in value.values():
            found = _find_password(item)
            if found:
                return found
    if isinstance(value, list):
        for item in value:
            found = _find_password(item)
            if found:
                return found
    return None


def _sanitize(value: Any, *, include_sensitive_output: bool = False) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            key_lower = key.lower()
            if any(part in key_lower for part in SENSITIVE_KEY_PARTS):
                sanitized[key] = "[redacted]"
            elif not include_sensitive_output and key_lower in DEFAULT_REDACT_KEYS:
                sanitized[key] = _redaction_summary(item, key=key_lower)
            else:
                sanitized[key] = _sanitize(
                    item, include_sensitive_output=include_sensitive_output
                )
        return sanitized
    if isinstance(value, list):
        return [
            _sanitize(item, include_sensitive_output=include_sensitive_output)
            for item in value
        ]
    return value


def _redaction_summary(value: Any, *, key: str) -> str:
    if key == "original_filename" and isinstance(value, str):
        suffix = Path(value).suffix
        return f"[redacted filename{': ' + suffix if suffix else ''}]"
    if isinstance(value, str):
        return f"[redacted string, chars={len(value)}]"
    if isinstance(value, bytes):
        return f"[redacted bytes, bytes={len(value)}]"
    if isinstance(value, list):
        return f"[redacted list, items={len(value)}]"
    if isinstance(value, dict):
        return f"[redacted object, keys={len(value)}]"
    if value is None:
        return "[redacted null]"
    return f"[redacted {type(value).__name__}]"


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2, sort_keys=True)
        handle.write("\n")


def _compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().lower()
