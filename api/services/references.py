from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.reference import REFERENCE_SCHEMA_VERSION, OfficialReference
from api.schemas.references import ReferenceCreate


class ReferenceServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class ReferenceNotFoundError(ReferenceServiceError):
    pass


class DuplicateReferenceKeyError(ReferenceServiceError):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_reference(
    session: Session,
    *,
    data: ReferenceCreate,
) -> OfficialReference:
    existing = session.scalar(
        select(OfficialReference).where(
            OfficialReference.reference_key == data.reference_key
        )
    )
    if existing is not None:
        raise DuplicateReferenceKeyError(
            f"reference key already exists: {data.reference_key}"
        )

    ref = OfficialReference(
        reference_key=data.reference_key,
        source_category=data.source_category,
        display_label=data.display_label,
        marketplace_safe_label=data.marketplace_safe_label,
        source_url=data.source_url,
        description=data.description,
        retrieved_at=data.retrieved_at or _utcnow(),
        verified_at=data.verified_at,
        schema_version=REFERENCE_SCHEMA_VERSION,
    )
    session.add(ref)
    session.flush()
    return ref


def get_reference(
    session: Session,
    *,
    reference_id: str,
) -> OfficialReference:
    ref = session.get(OfficialReference, reference_id)
    if ref is None:
        raise ReferenceNotFoundError("reference not found")
    return ref


def get_reference_by_key(
    session: Session,
    *,
    reference_key: str,
) -> OfficialReference:
    ref = session.scalar(
        select(OfficialReference).where(
            OfficialReference.reference_key == reference_key
        )
    )
    if ref is None:
        raise ReferenceNotFoundError(f"reference not found: {reference_key}")
    return ref


def list_references(
    session: Session,
    *,
    source_category: str | None = None,
    active_only: bool = True,
) -> list[OfficialReference]:
    stmt = select(OfficialReference).order_by(
        OfficialReference.source_category,
        OfficialReference.reference_key,
    )
    if source_category is not None:
        stmt = stmt.where(OfficialReference.source_category == source_category)
    if active_only:
        stmt = stmt.where(OfficialReference.is_active.is_(True))
    return list(session.scalars(stmt))


SEED_REFERENCES: list[dict] = [
    {
        "reference_key": "cmf-tasa-maxima-convencional",
        "source_category": "cmf",
        "display_label": "CMF — Tasa Máxima Convencional vigente",
        "marketplace_safe_label": "Tasa máxima convencional (CMF)",
        "source_url": "https://www.cmfchile.cl/portal/estadisticas/606/w3-propertyvalue-20153.html",
        "description": (
            "Tasa máxima convencional publicada por la Comisión para el "
            "Mercado Financiero. Se actualiza periódicamente y aplica a "
            "créditos de consumo en pesos chilenos."
        ),
    },
    {
        "reference_key": "sernac-derechos-credito-consumo",
        "source_category": "sernac",
        "display_label": "SERNAC — Derechos del consumidor en créditos",
        "marketplace_safe_label": "Derechos del consumidor en créditos (SERNAC)",
        "source_url": "https://www.sernac.cl/portal/617/w3-propertyvalue-702.html",
        "description": (
            "Guía de derechos del consumidor en operaciones de crédito "
            "de consumo según la Ley del Consumidor."
        ),
    },
    {
        "reference_key": "ley-chile-18010-operaciones-credito",
        "source_category": "ley_chile",
        "display_label": "Ley 18.010 — Operaciones de crédito de dinero",
        "marketplace_safe_label": "Ley 18.010 operaciones de crédito",
        "source_url": "https://www.bcn.cl/leychile/navegar?idNorma=29412",
        "description": (
            "Ley que regula las operaciones de crédito de dinero en Chile, "
            "incluyendo intereses, reajustes y comisiones."
        ),
    },
    {
        "reference_key": "ley-chile-19496-proteccion-consumidor",
        "source_category": "ley_chile",
        "display_label": "Ley 19.496 — Protección de los derechos del consumidor",
        "marketplace_safe_label": "Ley 19.496 protección al consumidor",
        "source_url": "https://www.bcn.cl/leychile/navegar?idNorma=61438",
        "description": (
            "Ley que establece normas sobre protección de los derechos "
            "de los consumidores, aplicable a productos y servicios "
            "financieros de consumo."
        ),
    },
    {
        "reference_key": "benchmark-cae-promedio-mercado",
        "source_category": "benchmark",
        "display_label": "CAE promedio de mercado — referencia comparativa",
        "marketplace_safe_label": "CAE promedio de mercado (referencia)",
        "source_url": "https://www.cmfchile.cl/portal/estadisticas/606/w3-propertyvalue-20153.html",
        "description": (
            "Referencia comparativa del Costo Anual Equivalente promedio "
            "del mercado para créditos de consumo. No constituye una "
            "oferta personalizada."
        ),
    },
]


def seed_references(session: Session) -> dict[str, int]:
    created = 0
    skipped = 0
    for seed in SEED_REFERENCES:
        existing = session.scalar(
            select(OfficialReference).where(
                OfficialReference.reference_key == seed["reference_key"]
            )
        )
        if existing is not None:
            skipped += 1
            continue
        ref = OfficialReference(
            reference_key=seed["reference_key"],
            source_category=seed["source_category"],
            display_label=seed["display_label"],
            marketplace_safe_label=seed["marketplace_safe_label"],
            source_url=seed["source_url"],
            description=seed["description"],
            schema_version=REFERENCE_SCHEMA_VERSION,
        )
        session.add(ref)
        created += 1
    session.flush()
    return {"created": created, "skipped": skipped, "total": len(SEED_REFERENCES)}
