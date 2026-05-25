from __future__ import annotations

import json
from pathlib import Path

import fitz

from manual_test_cases.baseline import (
    BASELINE_SCHEMA_VERSION,
    BaselineRunOptions,
    pack_catalog_document,
    run_manual_baseline,
)


def test_local_replay_writes_artifacts_and_comparison_gap(tmp_path: Path) -> None:
    manual_root = tmp_path / "manual-test-cases"
    run_dir = manual_root / "runs" / "base-case" / "20260518T000000Z"
    baseline_dir = manual_root / "baselines.local" / "base-case"
    baseline_dir.mkdir(parents=True)
    run_dir.mkdir(parents=True)
    write_json(
        baseline_dir / "baseline.json",
        {
            "schema_version": BASELINE_SCHEMA_VERSION,
            "case_catalog_id": "base-case",
            "provider": "local-replay",
            "status": "completed",
            "stages": [
                {
                    "stage": "document_review",
                    "status": "completed",
                    "summary": "reviewed fixture",
                }
            ],
            "observations": [
                {
                    "document_index": 1,
                    "document_role": "primary",
                    "fact_key": "principal_amount",
                    "field_label": "Monto liquido del credito",
                    "value_kind": "money",
                    "value_number": 20000000,
                    "value_currency": "CLP",
                    "source": {
                        "document_index": 1,
                        "document_role": "primary",
                        "page_number": 1,
                        "snippet": "Monto liquido del credito $20.000.000",
                    },
                    "confidence": 0.91,
                }
            ],
        },
    )
    write_json(run_dir / "facts.json", [{"fact_key": "cae"}])
    write_json(run_dir / "receptionist-gaps.json", [])
    write_json(run_dir / "analysis-readiness.json", {"ready_for_analysis": True})

    summary = run_manual_baseline(
        case={"id": "base-case", "documents": []},
        run_dir=run_dir,
        manual_root=manual_root,
        options=BaselineRunOptions(),
    )

    gaps = json.loads((run_dir / "baseline" / "gaps.json").read_text())
    assert summary["status"] == "completed"
    assert summary["gap_count"] == 1
    assert gaps[0]["gap_type"] == "missing_deterministic_field"
    assert gaps[0]["blocking"] is True
    assert (run_dir / "baseline" / "output.json").exists()
    assert (run_dir / "baseline" / "model-call-plan.json").exists()
    assert (run_dir / "baseline" / "report.md").exists()


def test_missing_local_replay_writes_structured_error(tmp_path: Path) -> None:
    manual_root = tmp_path / "manual-test-cases"
    run_dir = manual_root / "runs" / "missing-case" / "20260518T000000Z"
    run_dir.mkdir(parents=True)

    summary = run_manual_baseline(
        case={"id": "missing-case", "documents": []},
        run_dir=run_dir,
        manual_root=manual_root,
        options=BaselineRunOptions(),
    )

    error = json.loads((run_dir / "baseline" / "error.json").read_text())
    assert summary["status"] == "failed"
    assert error["code"] == "local_replay_missing"
    assert (run_dir / "baseline" / "output.json").exists()


def test_invalid_local_replay_writes_validation_error(tmp_path: Path) -> None:
    manual_root = tmp_path / "manual-test-cases"
    run_dir = manual_root / "runs" / "invalid-case" / "20260518T000000Z"
    baseline_dir = manual_root / "baselines.local" / "invalid-case"
    baseline_dir.mkdir(parents=True)
    run_dir.mkdir(parents=True)
    write_json(baseline_dir / "baseline.json", {"schema_version": "wrong"})

    summary = run_manual_baseline(
        case={"id": "invalid-case", "documents": []},
        run_dir=run_dir,
        manual_root=manual_root,
        options=BaselineRunOptions(),
    )

    error = json.loads((run_dir / "baseline" / "error.json").read_text())
    assert summary["status"] == "failed"
    assert error["code"] == "local_replay_invalid_schema"


def test_anthropic_provider_requires_explicit_external_llm_opt_in(
    tmp_path: Path,
) -> None:
    manual_root = tmp_path / "manual-test-cases"
    run_dir = manual_root / "runs" / "anthropic-case" / "20260518T000000Z"
    run_dir.mkdir(parents=True)

    summary = run_manual_baseline(
        case={"id": "anthropic-case", "documents": []},
        run_dir=run_dir,
        manual_root=manual_root,
        options=BaselineRunOptions(
            provider="anthropic",
            model="claude-sonnet-4-5",
            allow_external_llm=False,
        ),
    )

    error = json.loads((run_dir / "baseline" / "error.json").read_text())
    assert summary["status"] == "failed"
    assert error["code"] == "external_llm_not_allowed"


def test_media_packer_handles_text_image_pdf_and_page_limits(tmp_path: Path) -> None:
    manual_root = tmp_path / "manual-test-cases"
    upload_dir = manual_root / "uploads" / "case"
    upload_dir.mkdir(parents=True)
    (upload_dir / "document.txt").write_text("CAE 20,28%", encoding="utf-8")
    (upload_dir / "image.png").write_bytes(b"\x89PNG\r\n\x1a\nfake")
    (upload_dir / "contract.pdf").write_bytes(pdf_bytes(page_count=3))

    text = pack_catalog_document(
        {"path": "uploads/case/document.txt", "role": "terms"},
        manual_root=manual_root,
        catalog_index=1,
        max_pages=2,
    )
    image = pack_catalog_document(
        {
            "path": "uploads/case/image.png",
            "role": "photo",
            "expected_content_type": "image/png",
        },
        manual_root=manual_root,
        catalog_index=2,
        max_pages=2,
    )
    pdf = pack_catalog_document(
        {
            "path": "uploads/case/contract.pdf",
            "role": "primary",
            "expected_content_type": "application/pdf",
        },
        manual_root=manual_root,
        catalog_index=3,
        max_pages=2,
    )

    assert text.ok is True
    assert text.media_kind == "text"
    assert text.text == "CAE 20,28%"
    assert image.ok is True
    assert image.media_kind == "image"
    assert len(image.images) == 1
    assert pdf.ok is True
    assert pdf.media_kind == "pdf_images"
    assert pdf.media_page_count == 3
    assert pdf.processed_page_count == 2
    assert pdf.partial_coverage is True
    assert len(pdf.images) == 2


def test_media_packer_uses_local_info_json_for_encrypted_pdf(
    tmp_path: Path,
) -> None:
    manual_root = tmp_path / "manual-test-cases"
    upload_dir = manual_root / "uploads" / "encrypted"
    upload_dir.mkdir(parents=True)
    (upload_dir / "contract.pdf").write_bytes(
        encrypted_pdf_bytes(password="fixture-password")
    )
    write_json(upload_dir / "info.json", {"password": "fixture-password"})

    packed = pack_catalog_document(
        {
            "path": "uploads/encrypted/contract.pdf",
            "role": "primary",
            "expected_content_type": "application/pdf",
        },
        manual_root=manual_root,
        catalog_index=1,
        max_pages=1,
    )

    assert packed.ok is True
    assert packed.media_kind == "pdf_images"
    assert len(packed.images) == 1
    assert "password" not in json.dumps(packed.metadata()).lower()


def test_media_packer_reports_malformed_pdf_without_raising(tmp_path: Path) -> None:
    manual_root = tmp_path / "manual-test-cases"
    upload_dir = manual_root / "uploads" / "malformed"
    upload_dir.mkdir(parents=True)
    (upload_dir / "broken.pdf").write_bytes(b"%PDF-not-a-complete-document")

    packed = pack_catalog_document(
        {
            "path": "uploads/malformed/broken.pdf",
            "role": "primary",
            "expected_content_type": "application/pdf",
        },
        manual_root=manual_root,
        catalog_index=1,
        max_pages=1,
    )

    assert packed.ok is False
    assert packed.error_code == "malformed_document"


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def pdf_bytes(*, page_count: int) -> bytes:
    pdf = fitz.open()
    for index in range(page_count):
        page = pdf.new_page(width=96, height=96)
        page.insert_text((8, 48), f"CAE {index + 1}")
    data = pdf.tobytes()
    pdf.close()
    return data


def encrypted_pdf_bytes(*, password: str) -> bytes:
    pdf = fitz.open()
    page = pdf.new_page(width=96, height=96)
    page.insert_text((8, 48), "CAE 20,28%")
    data = pdf.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        owner_pw="owner-password",
        user_pw=password,
    )
    pdf.close()
    return data
