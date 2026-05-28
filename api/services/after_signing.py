from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.models.analysis import (
    CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
    AnalysisEvidence,
    AnalysisFinding,
    AnalysisRun,
)
from api.models.document import Document
from api.models.reference import OfficialReference


COMPARISON_ROLES: frozenset[str] = frozenset(
    {
        "simulation",
        "offer",
        "comparator_loan",
    }
)

AS_FACT_REFERENCE_MAP: dict[str, list[str]] = {
    "payment_count": ["ley-chile-18010-operaciones-credito"],
    "term_months": ["ley-chile-18010-operaciones-credito"],
    "installment_amount": ["ley-chile-18010-operaciones-credito"],
    "total_cost": [
        "ley-chile-18010-operaciones-credito",
        "ley-chile-19496-proteccion-consumidor",
    ],
}

_AS_CALC_FACT_MAP: dict[str, list[str]] = {
    "payment_count_delta": ["payment_count", "term_months"],
    "total_paid_check": ["installment_amount", "total_cost"],
    "term_signal": ["term_months", "payment_count"],
}

MISSING_COMPARISON_LABELS: dict[str, tuple[str, str]] = {
    "simulation": (
        "Cotización o simulación no adjunta",
        "No se encontró una cotización o simulación asociada al caso. "
        "Si dispone de este documento, adjuntarlo permite comparar los "
        "términos ofrecidos con los del contrato firmado.",
    ),
    "offer": (
        "Oferta formal no adjunta",
        "No se encontró una oferta formal del proveedor. "
        "Si dispone de este documento, adjuntarlo permite verificar "
        "si las condiciones ofrecidas coinciden con las del contrato.",
    ),
}

ESCALATION_QUESTION_SPECS: list[dict[str, str]] = [
    {
        "finding_key": "as_question_sernac_complaint",
        "title": "Reclamo ante SERNAC",
        "summary": (
            "Si se confirman inconsistencias en el contrato, es posible "
            "presentar un reclamo ante SERNAC. El reclamo es gratuito y "
            "puede realizarse en línea (Ley 19.496, Art. 58)."
        ),
        "reference_key": "sernac-derechos-credito-consumo",
    },
    {
        "finding_key": "as_question_detailed_statement",
        "title": "Solicitar estado de cuenta detallado",
        "summary": (
            "Vale la pena solicitar al proveedor un estado de cuenta "
            "detallado que incluya capital, intereses, comisiones y "
            "seguros por cada cuota (Ley 18.010, Art. 11)."
        ),
        "reference_key": "ley-chile-18010-operaciones-credito",
    },
    {
        "finding_key": "as_question_prepayment_rights",
        "title": "Derechos de pago anticipado",
        "summary": (
            "El consumidor tiene derecho a prepagar total o parcialmente "
            "el crédito en cualquier momento. El proveedor no puede cobrar "
            "comisión de prepago superior a un mes de interés "
            "(Ley 18.010, Art. 10)."
        ),
        "reference_key": "ley-chile-18010-operaciones-credito",
    },
    {
        "finding_key": "as_question_contract_copy",
        "title": "Solicitar copia íntegra del contrato",
        "summary": (
            "El consumidor tiene derecho a obtener una copia íntegra del "
            "contrato y sus anexos. Si no se entregó al momento de la "
            "firma, se puede solicitar formalmente (Ley 19.496, Art. 17)."
        ),
        "reference_key": "ley-chile-19496-proteccion-consumidor",
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
    from api.services.analysis import FINDING_SPECS

    spec = FINDING_SPECS.get(finding_key)
    if spec is None:
        return []
    calc_key = spec.get("calculation_key", finding_key)
    return _AS_CALC_FACT_MAP.get(calc_key, [])


def _load_case_document_roles(session: Session, case_id: str) -> set[str]:
    stmt = (
        select(Document.role)
        .where(
            Document.case_id == case_id,
            Document.retention_state == "active",
        )
        .distinct()
    )
    return set(session.scalars(stmt))


def attach_discrepancy_evidence(
    session: Session,
    findings: list[AnalysisFinding],
    run: AnalysisRun,
    case_id: str,
) -> int:
    all_ref_keys: set[str] = set()
    for finding in findings:
        for fk in _finding_fact_keys(finding.finding_key):
            all_ref_keys.update(AS_FACT_REFERENCE_MAP.get(fk, []))

    if not all_ref_keys:
        return 0

    ref_map = _load_references_by_keys(session, list(all_ref_keys))
    if not ref_map:
        return 0

    count = 0
    for finding in findings:
        needed_keys: set[str] = set()
        for fk in _finding_fact_keys(finding.finding_key):
            needed_keys.update(AS_FACT_REFERENCE_MAP.get(fk, []))

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


def generate_comparison_context_findings(
    session: Session,
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    start_display_order: int = 0,
) -> list[AnalysisFinding]:
    existing_roles = _load_case_document_roles(session, case_id)
    if existing_roles & COMPARISON_ROLES:
        return []

    ref_map = _load_references_by_keys(
        session, ["ley-chile-19496-proteccion-consumidor"]
    )

    created: list[AnalysisFinding] = []
    display_order = start_display_order

    for role, (title, summary) in MISSING_COMPARISON_LABELS.items():
        finding = AnalysisFinding(
            analysis_run_id=run.id,
            case_id=case_id,
            owner_ref=owner_ref,
            finding_key=f"as_missing_{role}",
            title=title,
            summary=summary,
            severity="low",
            claim_type="fact",
            uncertainty_state="missing_context",
            confidence=1.0,
            display_order=display_order,
        )
        session.add(finding)
        session.flush()
        display_order += 1
        created.append(finding)

        ref = ref_map.get("ley-chile-19496-proteccion-consumidor")
        if ref is not None:
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


def generate_escalation_questions(
    session: Session,
    run: AnalysisRun,
    case_id: str,
    owner_ref: str,
    start_display_order: int = 0,
) -> list[AnalysisFinding]:
    all_ref_keys = [s["reference_key"] for s in ESCALATION_QUESTION_SPECS]
    ref_map = _load_references_by_keys(session, all_ref_keys)

    created: list[AnalysisFinding] = []
    display_order = start_display_order

    for spec in ESCALATION_QUESTION_SPECS:
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
