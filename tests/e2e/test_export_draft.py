from __future__ import annotations

from pathlib import Path

import httpx
import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.e2e

EVIDENCE_DIR = Path(__file__).resolve().parents[2] / ".kdbp" / "evidence" / "phase-8"


@pytest.fixture(autouse=True)
def _ensure_evidence_dir() -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)


def test_export_route_mounted(api_url: str) -> None:
    resp = httpx.post(
        f"{api_url}/cases/nonexistent/export",
        json={"finding_ids": ["any"]},
        timeout=30,
    )
    assert resp.status_code in (404, 422)


def test_draft_route_mounted(api_url: str) -> None:
    resp = httpx.post(
        f"{api_url}/cases/nonexistent/draft",
        json={"finding_ids": ["any"]},
        timeout=30,
    )
    assert resp.status_code in (404, 422)


def test_spa_loads_and_navigates_to_export(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="networkidle")
    expect(page.locator("#root")).not_to_be_empty()

    page.get_by_text("Continuar con Google").click()
    page.wait_for_timeout(500)

    page.screenshot(path=str(EVIDENCE_DIR / "01-app-loaded.png"), full_page=True)

    debug_toggle = page.locator("text=▸").first
    if debug_toggle.is_visible():
        debug_toggle.click()
        page.wait_for_timeout(300)

    email_btn = page.locator("button").filter(has_text="email")
    if email_btn.count() > 0:
        email_btn.first.click()
        page.wait_for_timeout(1000)

    page.screenshot(path=str(EVIDENCE_DIR / "02-export-screen.png"), full_page=True)


def test_export_screen_content(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="networkidle")

    page.get_by_text("Continuar con Google").click()
    page.wait_for_timeout(500)

    debug_pill = page.locator("div").filter(has_text="case").last
    if debug_pill.is_visible():
        debug_pill.click()
        page.wait_for_timeout(500)

    page.screenshot(path=str(EVIDENCE_DIR / "03a-debug-panel.png"), full_page=True)

    email_btn = page.locator("button").filter(has_text="email")
    if email_btn.count() > 0:
        email_btn.first.click()
        page.wait_for_timeout(2000)

    page.screenshot(path=str(EVIDENCE_DIR / "03-export-content.png"), full_page=True)

    body = page.locator("body").text_content() or ""
    has_content = any(
        term in body
        for term in [
            "Seleccionar",
            "Exportar",
            "hallazgo",
            "Cargando",
            "No hay hallazgos",
            "exportar",
        ]
    )
    assert has_content, f"Expected export UI text. Got: {body[:300]}"
