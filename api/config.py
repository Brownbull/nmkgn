from __future__ import annotations

import os

DEFAULT_DATABASE_URL = "postgresql+psycopg://nmkgn:nmkgn@localhost:55432/nmkgn"
DEFAULT_OWNER_REF = "demo-user"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def get_stub_owner_ref() -> str:
    return os.getenv("NMKGN_STUB_OWNER_REF", DEFAULT_OWNER_REF)


def get_cors_origins() -> list[str]:
    raw = os.getenv("NMKGN_CORS_ORIGINS", "http://localhost:15179,http://127.0.0.1:15179")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]
