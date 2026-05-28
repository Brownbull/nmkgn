from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_DATABASE_URL = "postgresql+psycopg://nmkgn:nmkgn@localhost:55432/nmkgn"
DEFAULT_OWNER_REF = "demo-user"
DEFAULT_UPLOAD_STORAGE_DIR = "var/uploads"
DEFAULT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024
DEFAULT_UPLOAD_RETENTION_DAYS = 30
DEFAULT_UPLOAD_CONTENT_TYPES = (
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
)
DEFAULT_CONSUMER_CREDIT_AGENT_ENABLED = True
DEFAULT_CONSUMER_CREDIT_AGENT_PROVIDER = "fake"
DEFAULT_CONSUMER_CREDIT_AGENT_MODEL = "fake-consumer-credit-v1"
DEFAULT_CONSUMER_CREDIT_AGENT_TIMEOUT_SECONDS = 60

DEFAULT_RECEPTIONIST_ENABLED = True
DEFAULT_RECEPTIONIST_PROVIDER = "fake"
DEFAULT_RECEPTIONIST_MODEL = "fake-receptionist-v1"
DEFAULT_RECEPTIONIST_MAX_PAGES = 12
DEFAULT_RECEPTIONIST_TIMEOUT_SECONDS = 30


@dataclass(frozen=True)
class UploadStorageSettings:
    root_path: Path
    max_bytes: int
    retention_days: int
    allowed_content_types: tuple[str, ...]
    production_uploads_enabled: bool


@dataclass(frozen=True)
class ConsumerCreditAgentSettings:
    enabled: bool
    provider: str
    model: str
    timeout_seconds: int


@dataclass(frozen=True)
class ReceptionistSettings:
    enabled: bool
    provider: str
    model: str
    max_pages: int
    timeout_seconds: int


def _positive_int_env(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    value = int(raw)
    if value <= 0:
        raise ValueError(f"{name} must be greater than 0")
    return value


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def get_stub_owner_ref() -> str:
    return os.getenv("NMKGN_STUB_OWNER_REF", DEFAULT_OWNER_REF)


def get_cors_origins() -> list[str]:
    raw = os.getenv(
        "NMKGN_CORS_ORIGINS", "http://localhost:15179,http://127.0.0.1:15179"
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def get_upload_storage_settings() -> UploadStorageSettings:
    content_types = os.getenv("NMKGN_UPLOAD_ALLOWED_CONTENT_TYPES")
    allowed_content_types = (
        tuple(item.strip() for item in content_types.split(",") if item.strip())
        if content_types
        else DEFAULT_UPLOAD_CONTENT_TYPES
    )
    if not allowed_content_types:
        raise ValueError(
            "NMKGN_UPLOAD_ALLOWED_CONTENT_TYPES must include at least one content type"
        )

    root_path = os.getenv(
        "NMKGN_UPLOAD_STORAGE_DIR", DEFAULT_UPLOAD_STORAGE_DIR
    ).strip()
    if not root_path:
        raise ValueError("NMKGN_UPLOAD_STORAGE_DIR must not be blank")

    return UploadStorageSettings(
        root_path=Path(root_path),
        max_bytes=_positive_int_env("NMKGN_UPLOAD_MAX_BYTES", DEFAULT_UPLOAD_MAX_BYTES),
        retention_days=_positive_int_env(
            "NMKGN_UPLOAD_RETENTION_DAYS", DEFAULT_UPLOAD_RETENTION_DAYS
        ),
        allowed_content_types=allowed_content_types,
        production_uploads_enabled=os.getenv("NMKGN_ENABLE_PRODUCTION_UPLOADS", "false")
        .strip()
        .lower()
        == "true",
    )


def get_receptionist_settings() -> ReceptionistSettings:
    provider = os.getenv(
        "NMKGN_RECEPTIONIST_PROVIDER", DEFAULT_RECEPTIONIST_PROVIDER
    ).strip()
    if not provider:
        raise ValueError("NMKGN_RECEPTIONIST_PROVIDER must not be blank")

    model = os.getenv("NMKGN_RECEPTIONIST_MODEL", DEFAULT_RECEPTIONIST_MODEL).strip()
    if not model:
        raise ValueError("NMKGN_RECEPTIONIST_MODEL must not be blank")

    return ReceptionistSettings(
        enabled=os.getenv("NMKGN_RECEPTIONIST_ENABLED", "true").strip().lower()
        == "true",
        provider=provider,
        model=model,
        max_pages=_positive_int_env(
            "NMKGN_RECEPTIONIST_MAX_PAGES", DEFAULT_RECEPTIONIST_MAX_PAGES
        ),
        timeout_seconds=_positive_int_env(
            "NMKGN_RECEPTIONIST_TIMEOUT_SECONDS",
            DEFAULT_RECEPTIONIST_TIMEOUT_SECONDS,
        ),
    )


def get_consumer_credit_agent_settings() -> ConsumerCreditAgentSettings:
    provider = os.getenv(
        "NMKGN_CONSUMER_CREDIT_AGENT_PROVIDER",
        DEFAULT_CONSUMER_CREDIT_AGENT_PROVIDER,
    ).strip()
    if not provider:
        raise ValueError("NMKGN_CONSUMER_CREDIT_AGENT_PROVIDER must not be blank")

    model = os.getenv(
        "NMKGN_CONSUMER_CREDIT_AGENT_MODEL",
        DEFAULT_CONSUMER_CREDIT_AGENT_MODEL,
    ).strip()
    if not model:
        raise ValueError("NMKGN_CONSUMER_CREDIT_AGENT_MODEL must not be blank")

    return ConsumerCreditAgentSettings(
        enabled=os.getenv(
            "NMKGN_CONSUMER_CREDIT_AGENT_ENABLED", "true"
        ).strip().lower()
        == "true",
        provider=provider,
        model=model,
        timeout_seconds=_positive_int_env(
            "NMKGN_CONSUMER_CREDIT_AGENT_TIMEOUT_SECONDS",
            DEFAULT_CONSUMER_CREDIT_AGENT_TIMEOUT_SECONDS,
        ),
    )
