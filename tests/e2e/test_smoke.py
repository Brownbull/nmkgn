from __future__ import annotations

import httpx
import pytest
from playwright.sync_api import Page, expect


pytestmark = pytest.mark.e2e


def test_health_endpoint(api_url: str) -> None:
    resp = httpx.get(f"{api_url}/health", timeout=30)
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_spa_loads(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="networkidle")
    expect(page.locator("#root")).not_to_be_empty()


def test_login_screen_renders(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="networkidle")
    expect(page.get_by_text("Continuar con Google")).to_be_visible()


def test_login_to_case_setup_navigation(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="networkidle")
    page.get_by_text("Continuar con Google").click()
    expect(page.locator("#proto-screen")).to_be_visible()


def test_cases_api_returns_list(api_url: str) -> None:
    resp = httpx.get(f"{api_url}/cases", timeout=30)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


def test_case_create_and_list(api_url: str) -> None:
    create_resp = httpx.post(
        f"{api_url}/cases",
        json={
            "title": "E2E smoke test case",
            "document_type": "consumer_credit",
            "case_stage": "before_signing",
            "institution_name": "Banco E2E Test",
        },
        timeout=30,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "E2E smoke test case"
    case_id = created["id"]

    list_resp = httpx.get(f"{api_url}/cases", timeout=30)
    assert list_resp.status_code == 200
    ids = [c["id"] for c in list_resp.json()]
    assert case_id in ids
