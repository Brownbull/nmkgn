#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
from collections import Counter
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - exercised only in lean envs.
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[1]
MANUAL_ROOT = Path(__file__).resolve().parent

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from manual_test_cases.baseline import (  # noqa: E402
    DEFAULT_BASELINE_MAX_PAGES,
    DEFAULT_BASELINE_MODEL,
    DEFAULT_BASELINE_PROVIDER,
    BaselineRunOptions,
    run_manual_baseline,
)

ALWAYS_REDACT_KEY_PARTS = (
    "authorization",
    "cookie",
    "password",
    "secret",
    "token",
)
DEFAULT_REDACT_KEYS = {
    "bounding_box",
    "checksum_sha256",
    "corrected_value_currency",
    "corrected_value_date",
    "corrected_value_number",
    "corrected_value_text",
    "deterministic_value",
    "filename",
    "original_filename",
    "path",
    "raw_payload",
    "receptionist_value",
    "source_snippet",
    "snippet",
    "text",
    "value_currency",
    "value_date",
    "value_number",
    "value_text",
}
DEFAULT_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".txt": "text/plain",
}


@dataclass
class ApiResult:
    method: str
    path: str
    status_code: int | None
    json_body: Any | None
    text_body: str | None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.status_code is not None and 200 <= self.status_code < 300


class RecordingApiClient:
    def __init__(self, client: Any, *, include_sensitive_output: bool) -> None:
        self.client = client
        self.include_sensitive_output = include_sensitive_output
        self.transcript: list[dict[str, Any]] = []

    def get(self, path: str, **kwargs: Any) -> ApiResult:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> ApiResult:
        return self.request("POST", path, **kwargs)

    def request(self, method: str, path: str, **kwargs: Any) -> ApiResult:
        request_summary = self._summarize_request(kwargs)
        try:
            response = self.client.request(method, path, **kwargs)
        except Exception as exc:  # pragma: no cover - defensive runner behavior.
            result = ApiResult(
                method=method,
                path=path,
                status_code=None,
                json_body=None,
                text_body=None,
                error=f"{type(exc).__name__}: {exc}",
            )
            self._record(result, request_summary)
            return result

        json_body: Any | None
        text_body: str | None
        try:
            json_body = response.json()
            text_body = None
        except ValueError:
            json_body = None
            text_body = response.text

        result = ApiResult(
            method=method,
            path=path,
            status_code=response.status_code,
            json_body=json_body,
            text_body=text_body,
        )
        self._record(result, request_summary)
        return result

    def _record(self, result: ApiResult, request_summary: dict[str, Any]) -> None:
        self.transcript.append(
            {
                "method": result.method,
                "path": result.path,
                "status_code": result.status_code,
                "ok": result.ok,
                "request": sanitize(
                    request_summary,
                    include_sensitive_output=self.include_sensitive_output,
                ),
                "response": sanitize(
                    result.json_body
                    if result.json_body is not None
                    else result.text_body,
                    include_sensitive_output=self.include_sensitive_output,
                ),
                "error": result.error,
            }
        )

    @staticmethod
    def _summarize_request(kwargs: dict[str, Any]) -> dict[str, Any]:
        summary: dict[str, Any] = {}
        if "json" in kwargs:
            summary["json"] = kwargs["json"]
        if "data" in kwargs:
            summary["data"] = kwargs["data"]
        if "params" in kwargs:
            summary["params"] = kwargs["params"]
        files = kwargs.get("files")
        if files:
            summary["files"] = summarize_files(files)
        return summary


def summarize_files(files: Any) -> Any:
    if isinstance(files, dict):
        return {key: summarize_file_tuple(value) for key, value in files.items()}
    if isinstance(files, list):
        return [summarize_file_tuple(item) for item in files]
    return "[file payload]"


def summarize_file_tuple(value: Any) -> dict[str, Any] | str:
    if isinstance(value, tuple) and value:
        filename = str(value[0])
        content_type = value[2] if len(value) >= 3 else None
        return {
            "filename": filename,
            "content_type": content_type,
        }
    return "[file payload]"


def load_catalog(path: Path) -> dict[str, Any]:
    if yaml is None:
        raise RuntimeError(
            "PyYAML is required to read catalog files. Install it or run through "
            "the project environment where yaml is available."
        )
    with path.open("r", encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle) or {}
    if not isinstance(loaded, dict) or not isinstance(loaded.get("cases"), list):
        raise ValueError("catalog must contain a top-level cases list")
    return loaded


def sanitize(value: Any, *, include_sensitive_output: bool = False) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            key_lower = key.lower()
            if any(part in key_lower for part in ALWAYS_REDACT_KEY_PARTS):
                sanitized[key] = "[redacted]"
            elif not include_sensitive_output and key_lower in DEFAULT_REDACT_KEYS:
                sanitized[key] = redaction_summary(item, key=key_lower)
            else:
                sanitized[key] = sanitize(
                    item, include_sensitive_output=include_sensitive_output
                )
        return sanitized
    if isinstance(value, list):
        return [
            sanitize(item, include_sensitive_output=include_sensitive_output)
            for item in value
        ]
    return value


def redaction_summary(value: Any, *, key: str) -> str:
    if key == "original_filename" and isinstance(value, str):
        suffix = Path(value).suffix
        return f"[redacted filename{': ' + suffix if suffix else ''}]"
    if isinstance(value, str):
        return f"[redacted string, chars={len(value)}]"
    if isinstance(value, list):
        return f"[redacted list, items={len(value)}]"
    if isinstance(value, dict):
        return f"[redacted object, keys={len(value)}]"
    if value is None:
        return "[redacted null]"
    return f"[redacted {type(value).__name__}]"


def timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2, sort_keys=True)
        handle.write("\n")


def resolve_manual_path(raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (MANUAL_ROOT / path).resolve()


def content_type_for(path: Path, configured: str | None) -> str:
    if configured:
        return configured
    guessed = mimetypes.guess_type(path.name)[0]
    return guessed or DEFAULT_CONTENT_TYPES.get(
        path.suffix.lower(), "application/octet-stream"
    )


@contextmanager
def in_process_api(run_dir: Path) -> Generator[RecordingApiClient, None, None]:
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session, sessionmaker

    from api.config import (
        ReceptionistSettings,
        UploadStorageSettings,
        get_receptionist_settings,
        get_upload_storage_settings,
    )
    from api.main import app
    from api.models import Base
    from api.services.database import get_session

    runtime_dir = run_dir / "_runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite+pysqlite:///{runtime_dir / 'manual-run.db'}",
        connect_args={"check_same_thread": False},
    )
    session_local = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    previous_overrides = dict(app.dependency_overrides)

    def override_session() -> Generator[Session, None, None]:
        with session_local() as session:
            yield session

    def override_upload_settings() -> UploadStorageSettings:
        return UploadStorageSettings(
            root_path=runtime_dir / "uploads",
            max_bytes=25 * 1024 * 1024,
            retention_days=30,
            allowed_content_types=(
                "application/pdf",
                "image/jpeg",
                "image/png",
                "text/plain",
            ),
            production_uploads_enabled=False,
        )

    def override_receptionist_settings() -> ReceptionistSettings:
        return ReceptionistSettings(
            enabled=True,
            provider="fake",
            model="fake-receptionist-v1",
            max_pages=12,
            timeout_seconds=30,
        )

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_upload_storage_settings] = override_upload_settings
    app.dependency_overrides[get_receptionist_settings] = override_receptionist_settings

    try:
        client = TestClient(app, raise_server_exceptions=False)
        yield RecordingApiClient(client, include_sensitive_output=False)
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
        engine.dispose()


@contextmanager
def http_api(
    api_base_url: str, *, include_sensitive_output: bool
) -> Generator[RecordingApiClient, None, None]:
    import httpx

    with httpx.Client(base_url=api_base_url, timeout=60.0) as client:
        yield RecordingApiClient(
            client, include_sensitive_output=include_sensitive_output
        )


def build_case_payload(case: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "title": case["title"],
        "case_stage": case["case_stage"],
        "document_type": "consumer_credit",
        "institution_name": case["institution_name"],
    }
    for key in ("requested_amount_clp", "expected_term_months"):
        value = case.get(key)
        if value is not None:
            payload[key] = value
    if case.get("analysis_plan"):
        payload["analysis_plan"] = case["analysis_plan"]
    return payload


def run_case(
    case: dict[str, Any],
    api: RecordingApiClient,
    run_dir: Path,
    *,
    include_sensitive_output: bool,
    skip_receptionist: bool,
    stop_on_error: bool,
    baseline_options: BaselineRunOptions | None = None,
) -> dict[str, Any]:
    case_id = case["id"]
    started_at = datetime.now(timezone.utc).isoformat()
    summary: dict[str, Any] = {
        "case_catalog_id": case_id,
        "mode": "manual-catalog",
        "started_at": started_at,
        "catalog_expected_file": case.get("expected_file"),
        "run_dir": str(run_dir.relative_to(MANUAL_ROOT)),
        "app_case_id": None,
        "documents": [],
        "facts": {},
        "receptionist": {},
        "baseline": {"enabled": False},
        "stage_failures": [],
    }

    create_response = api.post("/api/cases", json=build_case_payload(case))
    if not create_response.ok or not isinstance(create_response.json_body, dict):
        summary["stage_failures"].append(
            {
                "stage": "case_creation",
                "status_code": create_response.status_code,
                "error": create_response.error,
            }
        )
        return finalize_case(summary, api, run_dir, include_sensitive_output)

    app_case_id = str(create_response.json_body["id"])
    summary["app_case_id"] = app_case_id

    for index, document in enumerate(case.get("documents", []), start=1):
        document_summary = run_document(
            app_case_id,
            index,
            document,
            api,
            skip_receptionist=skip_receptionist,
        )
        summary["documents"].append(document_summary)
        if document_summary.get("upload_ok") is False:
            summary["stage_failures"].append(
                {
                    "stage": "document_upload",
                    "document_index": index,
                    "status_code": document_summary.get("upload_status_code"),
                }
            )
        if stop_on_error and document_summary.get("upload_ok") is False:
            break

    collect_case_outputs(
        app_case_id,
        api,
        run_dir,
        summary,
        include_sensitive_output=include_sensitive_output,
    )
    if baseline_options is not None:
        summary["baseline"] = run_manual_baseline(
            case=case,
            run_dir=run_dir,
            manual_root=MANUAL_ROOT,
            options=baseline_options,
        )
    return finalize_case(summary, api, run_dir, include_sensitive_output)


def run_document(
    app_case_id: str,
    index: int,
    document: dict[str, Any],
    api: RecordingApiClient,
    *,
    skip_receptionist: bool,
) -> dict[str, Any]:
    raw_path = str(document["path"])
    path = resolve_manual_path(raw_path)
    content_type = content_type_for(path, document.get("expected_content_type"))
    document_summary: dict[str, Any] = {
        "catalog_index": index,
        "role": document["role"],
        "path": raw_path,
        "content_type": content_type,
        "exists": path.exists(),
        "upload_ok": False,
        "upload_status_code": None,
        "app_document_id": None,
    }
    if not path.exists():
        document_summary["error"] = "missing file"
        return document_summary

    with path.open("rb") as handle:
        upload_response = api.post(
            f"/api/cases/{app_case_id}/documents",
            data={
                "role": document["role"],
                "document_type": document.get("document_type", "consumer_credit"),
            },
            files={"file": (path.name, handle, content_type)},
        )

    document_summary["upload_status_code"] = upload_response.status_code
    document_summary["upload_ok"] = upload_response.ok
    if not upload_response.ok or not isinstance(upload_response.json_body, dict):
        document_summary["upload_error"] = upload_response.error
        document_summary["upload_response"] = sanitize(upload_response.json_body)
        return document_summary

    uploaded = upload_response.json_body
    app_document_id = str(uploaded["id"])
    document_summary.update(
        {
            "app_document_id": app_document_id,
            "extraction_status": uploaded.get("extraction_status"),
            "byte_size": uploaded.get("byte_size"),
        }
    )

    segments_response = api.get(
        f"/api/cases/{app_case_id}/documents/{app_document_id}/text-segments"
    )
    segments = (
        segments_response.json_body
        if isinstance(segments_response.json_body, list)
        else []
    )
    document_summary["text_segments"] = summarize_segments(segments)

    if not skip_receptionist:
        run_response = api.post(
            f"/api/cases/{app_case_id}/documents/{app_document_id}/receptionist-runs"
        )
        document_summary["receptionist_run_status_code"] = run_response.status_code
        document_summary["receptionist_run_ok"] = run_response.ok
        if run_response.ok and isinstance(run_response.json_body, dict):
            run_body = run_response.json_body
            run_id = str(run_body["id"])
            document_summary["receptionist_run_id"] = run_id
            document_summary["receptionist_status"] = run_body.get("status")
            document_summary["receptionist_media_kind"] = run_body.get("media_kind")
            document_summary["receptionist_partial_coverage"] = run_body.get(
                "partial_coverage"
            )
            detail_response = api.get(
                f"/api/cases/{app_case_id}/documents/{app_document_id}"
                f"/receptionist-runs/{run_id}"
            )
            detail = (
                detail_response.json_body
                if isinstance(detail_response.json_body, dict)
                else {}
            )
            document_summary["receptionist_detail"] = summarize_receptionist_detail(
                detail
            )
        else:
            document_summary["receptionist_error"] = run_response.error

    return document_summary


def summarize_segments(segments: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "count": len(segments),
        "total_chars": sum(len(str(segment.get("text") or "")) for segment in segments),
        "page_numbers": sorted(
            {
                segment["page_number"]
                for segment in segments
                if segment.get("page_number") is not None
            }
        ),
        "warning_codes": sorted(
            {
                segment["warning_code"]
                for segment in segments
                if segment.get("warning_code")
            }
        ),
    }


def summarize_receptionist_detail(detail: dict[str, Any]) -> dict[str, Any]:
    observations = detail.get("observations") or []
    gaps = detail.get("gaps") or []
    return {
        "observation_count": len(observations),
        "observation_fact_keys": sorted(
            {
                observation["fact_key"]
                for observation in observations
                if observation.get("fact_key")
            }
        ),
        "gap_count": len(gaps),
        "blocking_gap_count": sum(1 for gap in gaps if gap.get("blocking")),
        "gap_types": dict(Counter(gap.get("gap_type") for gap in gaps)),
    }


def collect_case_outputs(
    app_case_id: str,
    api: RecordingApiClient,
    run_dir: Path,
    summary: dict[str, Any],
    *,
    include_sensitive_output: bool,
) -> None:
    outputs = {
        "documents": api.get(f"/api/cases/{app_case_id}/documents"),
        "facts": api.get(f"/api/cases/{app_case_id}/facts"),
        "fact-readiness": api.get(f"/api/cases/{app_case_id}/facts/readiness"),
        "receptionist-gaps": api.get(f"/api/cases/{app_case_id}/receptionist/gaps"),
        "analysis-readiness": api.get(f"/api/cases/{app_case_id}/analysis-readiness"),
    }
    for name, result in outputs.items():
        body = result.json_body if result.json_body is not None else result.text_body
        write_json(
            run_dir / f"{name}.json",
            sanitize(body, include_sensitive_output=include_sensitive_output),
        )

    facts = (
        outputs["facts"].json_body
        if isinstance(outputs["facts"].json_body, list)
        else []
    )
    readiness = (
        outputs["fact-readiness"].json_body
        if isinstance(outputs["fact-readiness"].json_body, dict)
        else {}
    )
    gaps = (
        outputs["receptionist-gaps"].json_body
        if isinstance(outputs["receptionist-gaps"].json_body, list)
        else []
    )
    analysis_readiness = (
        outputs["analysis-readiness"].json_body
        if isinstance(outputs["analysis-readiness"].json_body, dict)
        else {}
    )

    summary["facts"] = {
        "count": len(facts),
        "fact_keys": dict(Counter(fact.get("fact_key") for fact in facts)),
        "confirmation_statuses": dict(
            Counter(fact.get("confirmation_status") for fact in facts)
        ),
        "readiness": sanitize(
            readiness, include_sensitive_output=include_sensitive_output
        ),
    }
    summary["receptionist"] = {
        "gap_count": len(gaps),
        "blocking_gap_count": sum(1 for gap in gaps if gap.get("blocking")),
        "gap_types": dict(Counter(gap.get("gap_type") for gap in gaps)),
        "gap_statuses": dict(Counter(gap.get("status") for gap in gaps)),
        "analysis_readiness": sanitize(
            analysis_readiness, include_sensitive_output=include_sensitive_output
        ),
    }


def finalize_case(
    summary: dict[str, Any],
    api: RecordingApiClient,
    run_dir: Path,
    include_sensitive_output: bool,
) -> dict[str, Any]:
    summary["completed_at"] = datetime.now(timezone.utc).isoformat()
    summary["transcript_file"] = "api-transcript.json"
    write_json(
        run_dir / "api-transcript.json",
        sanitize(api.transcript, include_sensitive_output=include_sensitive_output),
    )
    write_json(
        run_dir / "summary.json",
        sanitize(summary, include_sensitive_output=include_sensitive_output),
    )
    return summary


def select_cases(
    catalog: dict[str, Any], requested_case_ids: set[str]
) -> list[dict[str, Any]]:
    cases = catalog["cases"]
    if not requested_case_ids:
        return cases
    selected = [case for case in cases if case.get("id") in requested_case_ids]
    found_ids = {case.get("id") for case in selected}
    missing = sorted(requested_case_ids - found_ids)
    if missing:
        raise ValueError(f"case id(s) not found in catalog: {', '.join(missing)}")
    return selected


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run local manual upload fixtures through the nmkgn API pipeline."
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=MANUAL_ROOT / "catalog.local.yml",
        help="Catalog YAML to run. Defaults to manual-test-cases/catalog.local.yml.",
    )
    parser.add_argument(
        "--case-id",
        action="append",
        default=[],
        help="Catalog case id to run. Repeat to run multiple cases. Defaults to all.",
    )
    parser.add_argument(
        "--mode",
        choices=("in-process", "http"),
        default="in-process",
        help="Use FastAPI TestClient with isolated SQLite, or an already-running API.",
    )
    parser.add_argument(
        "--api-base-url",
        default="http://127.0.0.1:18080",
        help="Base URL for --mode http.",
    )
    parser.add_argument(
        "--include-sensitive-output",
        action="store_true",
        help="Keep extracted values and snippets in run artifacts. Password keys are still redacted.",
    )
    parser.add_argument(
        "--skip-receptionist",
        action="store_true",
        help="Only run case creation, upload, text extraction, and facts/readiness reads.",
    )
    parser.add_argument(
        "--stop-on-error",
        action="store_true",
        help="Stop uploading remaining documents in a case after the first upload failure.",
    )
    parser.add_argument(
        "--baseline-agent",
        action="store_true",
        help="Run the manual ConsumerCreditBaselineAgent harness after app snapshots.",
    )
    parser.add_argument(
        "--baseline-provider",
        choices=("local-replay", "anthropic"),
        default=os.getenv("NMKGN_BASELINE_PROVIDER", DEFAULT_BASELINE_PROVIDER),
        help="Baseline provider. Defaults to local-replay or NMKGN_BASELINE_PROVIDER.",
    )
    parser.add_argument(
        "--baseline-model",
        default=os.getenv("NMKGN_BASELINE_MODEL", DEFAULT_BASELINE_MODEL),
        help="Model name for external baseline providers.",
    )
    parser.add_argument(
        "--baseline-max-pages",
        type=int,
        default=_int_env("NMKGN_BASELINE_MAX_PAGES", DEFAULT_BASELINE_MAX_PAGES),
        help="Maximum PDF pages rendered for baseline media packing.",
    )
    parser.add_argument(
        "--allow-external-llm",
        action="store_true",
        help="Required before anthropic baseline runs may call an external model.",
    )
    return parser.parse_args()


def run_selected_cases(args: argparse.Namespace) -> list[dict[str, Any]]:
    catalog = load_catalog(args.catalog.resolve())
    cases = select_cases(catalog, set(args.case_id))
    run_summaries: list[dict[str, Any]] = []
    baseline_options = baseline_options_from_args(args)

    for case in cases:
        case_id = str(case["id"])
        run_dir = MANUAL_ROOT / "runs" / case_id / timestamp()
        run_dir.mkdir(parents=True, exist_ok=False)
        if args.mode == "in-process":
            with in_process_api(run_dir) as api:
                api.include_sensitive_output = args.include_sensitive_output
                summary = run_case(
                    case,
                    api,
                    run_dir,
                    include_sensitive_output=args.include_sensitive_output,
                    skip_receptionist=args.skip_receptionist,
                    stop_on_error=args.stop_on_error,
                    baseline_options=baseline_options,
                )
        else:
            with http_api(
                args.api_base_url,
                include_sensitive_output=args.include_sensitive_output,
            ) as api:
                summary = run_case(
                    case,
                    api,
                    run_dir,
                    include_sensitive_output=args.include_sensitive_output,
                    skip_receptionist=args.skip_receptionist,
                    stop_on_error=args.stop_on_error,
                    baseline_options=baseline_options,
                )
        summary["run_dir"] = str(run_dir.relative_to(MANUAL_ROOT))
        run_summaries.append(summary)

    return run_summaries


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def baseline_options_from_args(
    args: argparse.Namespace,
) -> BaselineRunOptions | None:
    if not args.baseline_agent:
        return None
    if args.baseline_max_pages <= 0:
        raise ValueError("--baseline-max-pages must be greater than 0")
    return BaselineRunOptions(
        provider=args.baseline_provider,
        model=args.baseline_model,
        max_pages=args.baseline_max_pages,
        allow_external_llm=args.allow_external_llm,
        include_sensitive_output=args.include_sensitive_output,
    )


def main() -> int:
    args = parse_args()
    try:
        summaries = run_selected_cases(args)
    except Exception as exc:
        print(
            f"manual catalog run failed: {type(exc).__name__}: {exc}", file=sys.stderr
        )
        return 1

    print(json.dumps(summarize_cli_output(summaries), indent=2, sort_keys=True))
    return 0


def summarize_cli_output(summaries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for summary in summaries:
        output.append(
            {
                "case_catalog_id": summary.get("case_catalog_id"),
                "run_dir": summary.get("run_dir"),
                "app_case_id": summary.get("app_case_id"),
                "document_count": len(summary.get("documents", [])),
                "uploaded_count": sum(
                    1
                    for document in summary.get("documents", [])
                    if document.get("upload_ok")
                ),
                "fact_count": summary.get("facts", {}).get("count"),
                "gap_count": summary.get("receptionist", {}).get("gap_count"),
                "blocking_gap_count": summary.get("receptionist", {}).get(
                    "blocking_gap_count"
                ),
                "ready_for_analysis": summary.get("receptionist", {})
                .get("analysis_readiness", {})
                .get("ready_for_analysis"),
                "baseline_status": summary.get("baseline", {}).get("status"),
                "baseline_gap_count": summary.get("baseline", {}).get("gap_count"),
                "baseline_blocking_gap_count": summary.get("baseline", {}).get(
                    "blocking_gap_count"
                ),
                "stage_failures": summary.get("stage_failures", []),
            }
        )
    return output


if __name__ == "__main__":
    raise SystemExit(main())
