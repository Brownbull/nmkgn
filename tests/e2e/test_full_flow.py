from __future__ import annotations

from pathlib import Path

import httpx
import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.e2e

FIXTURES_DIR = Path(__file__).resolve().parents[2] / "manual-test-cases" / "uploads"
SCOTIABANK_CONTRATO = FIXTURES_DIR / "credito_scotiabank_2022" / "710135786012_contrato.pdf"
SCOTIABANK_RESUMEN = FIXTURES_DIR / "credito_scotiabank_2022" / "710135786012_resumen.pdf"
ENCRYPTED_PDF = FIXTURES_DIR / "credito_edwards_2022" / "aviso_durante_credito.pdf"


class TestCaseLifecycleAPI:
    """Full case lifecycle via API: create → upload → extract → facts → analysis."""

    def test_create_case(self, api_url: str) -> None:
        resp = httpx.post(
            f"{api_url}/cases",
            json={
                "title": "E2E full flow test",
                "document_type": "consumer_credit",
                "case_stage": "before_signing",
                "institution_name": "Banco E2E Lifecycle",
            },
            timeout=30,
        )
        assert resp.status_code == 201
        case = resp.json()
        assert case["case_stage"] == "before_signing"
        self.__class__._case_id = case["id"]

    def test_upload_document(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        with open(SCOTIABANK_CONTRATO, "rb") as f:
            resp = httpx.post(
                f"{api_url}/cases/{case_id}/documents",
                files={"file": ("contrato.pdf", f, "application/pdf")},
                data={"role": "primary", "document_type": "consumer_credit"},
                timeout=60,
            )
        assert resp.status_code == 201
        doc = resp.json()
        assert doc["original_filename"] == "contrato.pdf"
        assert doc["content_type"] == "application/pdf"
        self.__class__._doc_id = doc["id"]

    def test_document_text_extracted(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        doc_id = self.__class__._doc_id
        resp = httpx.get(
            f"{api_url}/cases/{case_id}/documents/{doc_id}/text-segments",
            timeout=30,
        )
        assert resp.status_code == 200
        segments = resp.json()
        assert len(segments) > 0
        assert any(seg["text"] for seg in segments)

    def test_list_documents(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        resp = httpx.get(f"{api_url}/cases/{case_id}/documents", timeout=30)
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) >= 1
        assert any(d["id"] == self.__class__._doc_id for d in docs)

    def test_facts_extracted(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        resp = httpx.get(f"{api_url}/cases/{case_id}/facts", timeout=30)
        assert resp.status_code == 200
        facts = resp.json()
        assert isinstance(facts, list)

    def test_analysis_readiness(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        resp = httpx.get(
            f"{api_url}/cases/{case_id}/analysis-readiness", timeout=30
        )
        assert resp.status_code == 200

    def test_upload_second_document(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        with open(SCOTIABANK_RESUMEN, "rb") as f:
            resp = httpx.post(
                f"{api_url}/cases/{case_id}/documents",
                files={"file": ("resumen.pdf", f, "application/pdf")},
                data={"role": "simulation", "document_type": "consumer_credit"},
                timeout=60,
            )
        assert resp.status_code == 201

    def test_multiple_documents_listed(self, api_url: str) -> None:
        case_id = self.__class__._case_id
        resp = httpx.get(f"{api_url}/cases/{case_id}/documents", timeout=30)
        assert resp.status_code == 200
        assert len(resp.json()) >= 2


class TestEncryptedPDFHandling:
    """Encrypted PDF should fail gracefully, not crash."""

    def test_encrypted_pdf_does_not_crash(self, api_url: str) -> None:
        create_resp = httpx.post(
            f"{api_url}/cases",
            json={
                "title": "Encrypted PDF test",
                "document_type": "consumer_credit",
                "case_stage": "before_signing",
                "institution_name": "Banco Encrypted",
            },
            timeout=30,
        )
        assert create_resp.status_code == 201
        case_id = create_resp.json()["id"]

        with open(ENCRYPTED_PDF, "rb") as f:
            resp = httpx.post(
                f"{api_url}/cases/{case_id}/documents",
                files={"file": ("encrypted.pdf", f, "application/pdf")},
                data={"role": "primary", "document_type": "consumer_credit"},
                timeout=60,
            )
        assert resp.status_code == 201
        doc = resp.json()
        assert doc["extraction_status"] in ("failed", "needs_ocr")


class TestBrowserFullFlow:
    """Browser-driven test: login → case setup → upload screen."""

    def test_full_navigation_to_upload(self, page: Page, base_url: str) -> None:
        page.goto(base_url, wait_until="networkidle")
        expect(page.get_by_text("Continuar con Google")).to_be_visible()

        page.get_by_text("Continuar con Google").click()
        expect(page.locator("#proto-screen")).to_be_visible()

    def test_case_setup_form_visible(self, page: Page, base_url: str) -> None:
        page.goto(base_url, wait_until="networkidle")
        page.get_by_text("Continuar con Google").click()
        expect(page.get_by_role("textbox", name="Nombre del caso")).to_be_visible()
        expect(page.get_by_role("button", name="Crear caso y subir documentos")).to_be_visible()


class TestAPIErrorHandling:
    """API responds with proper errors, not 500s."""

    def test_upload_to_nonexistent_case(self, api_url: str) -> None:
        with open(SCOTIABANK_CONTRATO, "rb") as f:
            resp = httpx.post(
                f"{api_url}/cases/nonexistent-id/documents",
                files={"file": ("test.pdf", f, "application/pdf")},
                data={"role": "primary"},
                timeout=30,
            )
        assert resp.status_code == 404

    def test_get_nonexistent_case(self, api_url: str) -> None:
        resp = httpx.get(f"{api_url}/cases/nonexistent-id", timeout=30)
        assert resp.status_code == 404

    def test_invalid_case_stage(self, api_url: str) -> None:
        resp = httpx.post(
            f"{api_url}/cases",
            json={
                "title": "Bad stage",
                "case_stage": "invalid_stage",
                "institution_name": "Test",
            },
            timeout=30,
        )
        assert resp.status_code == 422

    def test_empty_title_rejected(self, api_url: str) -> None:
        resp = httpx.post(
            f"{api_url}/cases",
            json={
                "title": "",
                "case_stage": "before_signing",
                "institution_name": "Test",
            },
            timeout=30,
        )
        assert resp.status_code == 422
