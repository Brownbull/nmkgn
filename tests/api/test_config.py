from __future__ import annotations

import os

from api.config import get_database_url


def test_database_url_default_uses_psycopg() -> None:
    result = get_database_url()
    assert result.startswith("postgresql+psycopg://")


def test_database_url_normalizes_plain_postgresql(monkeypatch: object) -> None:
    import pytest

    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host:5432/db")  # type: ignore[attr-defined]
    result = get_database_url()
    assert result == "postgresql+psycopg://user:pass@host:5432/db"


def test_database_url_preserves_psycopg_scheme(monkeypatch: object) -> None:
    import pytest

    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://user:pass@host:5432/db")  # type: ignore[attr-defined]
    result = get_database_url()
    assert result == "postgresql+psycopg://user:pass@host:5432/db"
