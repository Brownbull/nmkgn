from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.analysis import (
    CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
    AnalysisEvidence,
    AnalysisFinding,
    AnalysisRun,
)
from api.models.reference import OfficialReference
from api.services.calculations import FactInput


FACT_REFERENCE_MAP: dict[str, list[str]] = {
    "interest_rate": ["cmf-tasa-maxima-convencional"],
    "cae": [
        "cmf-tasa-maxima-convencional",
        "benchmark-cae-promedio-mercado",
    ],
    "fee": [
        "ley-chile-18010-operaciones-credito",
        "ley-chile-19496-proteccion-consumidor",
    ],
    "insurance": ["sernac-derechos-credito-consumo"],
    "linked_product": ["sernac-derechos-credito-consumo"],
    "total_cost": ["ley-chile-18010-operaciones-credito"],
    "installment_amount": ["ley-chile-18010-operaciones-credito"],
}

BEFORE_SIGNING_OPTIONAL_FACTS: list[str] = [
    "interest_rate",
    "fee",
    "insurance",
    "linked_product",
]

MISSING_INFO_LABELS: dict[str, tuple[str, str]] = {
    "interest_rate": (
        "Tasa de interés no confirmada",
        "No se encontró la tasa de interés en los datos confirmados. "
        "Sin este dato no es posible comparar con las tasas máximas vigentes.",
    ),
    "fee": (
        "Comisiones y cargos no confirmados",
        "No se encontraron comisiones ni cargos en los datos confirmados. "
        "Vale la pena confirmar si existen cobros adicionales al crédito.",
    ),
    "insurance": (
        "Seguros asociados no confirmados",
        "No se encontraron seguros asociados en los datos confirmados. "
        "Vale la pena confirmar si el crédito incluye seguros obligatorios u opcionales.",
    ),
    "linked_product": (
        "Productos vinculados no confirmados",
        "No se encontraron productos vinculados en los datos confirmados. "
        "Vale la pena confirmar si el crédito requiere contratar productos adicionales.",
    ),
}

NEGOTIATION_QUESTION_SPECS: list[dict[str, str]] = [
    {
        "finding_key": "bs_question_early_payment",
        "title": "Condiciones de pago anticipado",
        "summary": (
            "Vale la pena confirmar si el contrato contempla condiciones "
            "de pago anticipado y si aplican costos asociados "
            "(Ley 18.010, Art. 10)."
        ),
        "reference_key": "ley-chile-18010-operaciones-credito",
    },
    {
        "finding_key": "bs_question_mandatory_insurance",
        "title": "Seguros obligatorios vs opcionales",
        "summary": (
            "Vale la pena confirmar cuáles seguros son obligatorios para "
            "el crédito y cuáles son opcionales, y si es posible "
            "contratar los opcionales con otro proveedor."
        ),
        "reference_key": "sernac-derechos-credito-consumo",
    },
    {
        "finding_key": "bs_question_fee_breakdown",
        "title": "Desglose de comisiones y cargos",
        "summary": (
            "Vale la pena solicitar un desglose detallado de todas las "
            "comisiones y cargos incluidos en el crédito, y confirmar "
            "cuáles son negociables (Ley 19.496)."
        ),
        "reference_key": "ley-chile-19496-proteccion-consumidor",
    },
    {
        "finding_key": "bs_question_rate_type",
        "title": "Tipo de tasa de interés",
        "summary": (
            "Vale la pena confirmar si la tasa de interés es fija o "
            "variable, y en caso de ser variable, cuál es el mecanismo "
            "de ajuste y tope máximo."
        ),
        "reference_key": "cmf-tasa-maxima-convencional",
    },
]


def _load_references_by_keys(
    session: Session, reference_keys: list[str]
) -> dict[str, OfficialReference]:
    if not reference_keys:
        return {}
    stmt = select(OfficialReference).where(
        OfficialReference.reference_key.in_(reference_keys),
        OfficialReference.is_active.is_(True),
    )
    refs = list(session.scalars(stmt))
    return {r.reference_key: r for r in refs}


def _finding_fact_keys(finding_key: str) -> list[str]:
    """Map a before-signing finding_key to the fact_keys it covers."""
    from api.services.analysis import BEFORE_SIGNING_FINDING_SPECS

    spec = BEFORE_SIGNING_FINDING_SPECS.get(finding_key)
    if spec is None:
        return []
    calc_key = spec.get("calculation_key", finding_key)
    mapping: dict[str, list[str]] = {
        "rate_cae_signal": ["interest_rate", "cae"],
        "total_paid_check": ["installment_amount", "total_cost"],
        "installment_signal": ["principal_amount", "installment_amount"],
        "fee_sum": ["fee"],
        "insurance_signals": ["insurance"],
        "linked_product_signals": ["linked_product"],
    }
    return mapping.get(calc_key, [])


def attach_reference_evidence(
    session: Session,
    findings: list[AnalysisFinding],
    run: AnalysisRun,
    case_id: str,
) -> int:
    all_ref_keys: set[str] = set()
    for finding in findings:
        for fk in _finding_fact_keys(finding.finding_key):
            all_ref_keys.update(FACT_REFERENCE_MAP.get(fk, []))

    if not all_ref_keys:
        return 0

    ref_map = _load_references_by_keys(session, list(all_ref_keys))
    if not ref_map:
        return 0

    count = 0
    for finding in findings:
        needed_keys: set[str] = set()
        for fk in _finding_fact_keys(finding.finding_key):
            needed_keys.update(FACT_REFERENCE_MAP.get(fk, []))

        for rk in sorted(needed_keys):
            ref = ref_map.get(rk)
            if ref is None:
                continue
            evidence = AnalysisEvidence(
                analysis_run_id=run.id,
                case_id=case_id,
                finding_id=finding.id,
                evidence_type="reference",
                reference_key=ref.reference_key,
                citation_url=ref.source_url,
                citation_label=ref.marketplace_safe_label,
                citation_retrieved_at=ref.retrieved_at,
                citation_verified_at=ref.verified_at,
                schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
            )
            session.add(evidence)
            count += 1

    return count


def generate_missing_info_findings(
    fact_map: dict[str, list[FactInput]],
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    session: Session,
    start_display_order: int = 0,
) -> list[AnalysisFinding]:
    created: list[AnalysisFinding] = []
    display_order = start_display_order

    all_ref_keys: set[str] = set()
    for fk in BEFORE_SIGNING_OPTIONAL_FACTS:
        if not fact_map.get(fk, []):
            all_ref_keys.update(FACT_REFERENCE_MAP.get(fk, []))
    ref_map = _load_references_by_keys(session, list(all_ref_keys))

    for fact_key in BEFORE_SIGNING_OPTIONAL_FACTS:
        entries = fact_map.get(fact_key, [])
        if entries:
            continue

        labels = MISSING_INFO_LABELS.get(fact_key)
        if labels is None:
            continue

        title, summary = labels
        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=f"bs_missing_{fact_key}",
            title=title,
            summary=summary,
            severity="medium",
            claim_type="fact",
            uncertainty_state="missing_context",
            confidence=1.0,
            display_order=display_order,
        )
        session.add(finding)
        session.flush()
        display_order += 1
        created.append(finding)

        for rk in sorted(FACT_REFERENCE_MAP.get(fact_key, [])):
            ref = ref_map.get(rk)
            if ref is None:
                continue
            evidence = AnalysisEvidence(
                analysis_run_id=run.id,
                case_id=case_id,
                finding_id=finding.id,
                evidence_type="reference",
                reference_key=ref.reference_key,
                citation_url=ref.source_url,
                citation_label=ref.marketplace_safe_label,
                citation_retrieved_at=ref.retrieved_at,
                citation_verified_at=ref.verified_at,
                schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
            )
            session.add(evidence)

    return created


def generate_negotiation_questions(
    session: Session,
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    start_display_order: int = 0,
) -> list[AnalysisFinding]:
    all_ref_keys = [s["reference_key"] for s in NEGOTIATION_QUESTION_SPECS]
    ref_map = _load_references_by_keys(session, all_ref_keys)

    created: list[AnalysisFinding] = []
    display_order = start_display_order

    for spec in NEGOTIATION_QUESTION_SPECS:
        ref = ref_map.get(spec["reference_key"])
        if ref is None:
            continue

        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=spec["finding_key"],
            title=spec["title"],
            summary=spec["summary"],
            severity="low",
            claim_type="reference",
            uncertainty_state="supported",
            confidence=1.0,
            display_order=display_order,
        )
        session.add(finding)
        session.flush()
        display_order += 1
        created.append(finding)

        evidence = AnalysisEvidence(
            analysis_run_id=run.id,
            case_id=case_id,
            finding_id=finding.id,
            evidence_type="reference",
            reference_key=ref.reference_key,
            citation_url=ref.source_url,
            citation_label=ref.marketplace_safe_label,
            citation_retrieved_at=ref.retrieved_at,
            citation_verified_at=ref.verified_at,
            schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
        )
        session.add(evidence)

    return created
