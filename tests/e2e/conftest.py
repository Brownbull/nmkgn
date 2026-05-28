from __future__ import annotations

import os
from pathlib import Path

import pytest

RAILWAY_URL = "https://nmkgn-app-production.up.railway.app"
LOCAL_URL = "http://127.0.0.1:18080"

EVIDENCE_DIR = Path(__file__).resolve().parents[2] / ".kdbp" / "evidence" / "phase-3"

MINIMAL_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
    b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    b"4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Credito test) Tj ET\n"
    b"endstream\nendobj\n"
    b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n"
    b"0000000058 00000 n \n0000000115 00000 n \n"
    b"0000000266 00000 n \n0000000360 00000 n \n"
    b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n429\n%%EOF"
)


def pytest_configure(config: pytest.Config) -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    if not config.getoption("base_url", default=None):
        config.option.base_url = os.getenv("E2E_BASE_URL", RAILWAY_URL)


@pytest.fixture(scope="session")
def api_url(base_url: str) -> str:
    return f"{base_url}/api"


@pytest.fixture(scope="session")
def test_pdf(tmp_path_factory: pytest.TempPathFactory) -> Path:
    p = tmp_path_factory.mktemp("fixtures") / "test_credito.pdf"
    p.write_bytes(MINIMAL_PDF)
    return p


@pytest.fixture(scope="session")
def test_pdf_alt(tmp_path_factory: pytest.TempPathFactory) -> Path:
    p = tmp_path_factory.mktemp("fixtures") / "test_resumen.pdf"
    p.write_bytes(MINIMAL_PDF)
    return p
