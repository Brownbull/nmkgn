from __future__ import annotations

import os
from pathlib import Path

import pytest

RAILWAY_URL = "https://nmkgn-app-production.up.railway.app"
LOCAL_URL = "http://127.0.0.1:18080"

EVIDENCE_DIR = Path(__file__).resolve().parents[2] / ".kdbp" / "evidence" / "phase-3"


def pytest_configure(config: pytest.Config) -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    if not config.getoption("base_url", default=None):
        config.option.base_url = os.getenv("E2E_BASE_URL", RAILWAY_URL)


@pytest.fixture(scope="session")
def api_url(base_url: str) -> str:
    return f"{base_url}/api"
