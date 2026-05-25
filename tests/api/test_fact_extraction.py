from __future__ import annotations

from collections import defaultdict
from collections.abc import Generator
from datetime import date

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from api.models import Base
from api.models.case import Case
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.services.fact_extraction import extract_consumer_credit_facts


@pytest.fixture()
def session(tmp_path) -> Generator[Session, None, None]:
    engine = create_engine(f"sqlite+pysqlite:///{tmp_path / 'facts.db'}")
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)
    try:
        with TestingSessionLocal() as db_session:
            yield db_session
    finally:
        Base.metadata.drop_all(bind=engine)


def test_extracts_consumer_credit_facts_with_provenance(session: Session) -> None:
    text = """
    Contrato de credito de consumo
    Fecha de contrato: 15/05/2026
    Monto del credito: $3.500.000
    Plazo: 60 meses
    Numero de cuotas: 60
    Cuota mensual: $85.000
    Tasa de interes mensual: 1,5%
    CAE: 22,4% anual
    Costo total del credito: $5.100.000
    Comision de administracion: $20.000
    Seguro de desgravamen incluido.
    Producto asociado: cuenta corriente obligatoria.
    Clausula de prepago: el deudor podra prepagar anticipadamente.
    """
    document, segment = _document_with_segment(session, text, start_offset=12)

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    assert {
        "principal_amount",
        "currency",
        "contract_date",
        "term_months",
        "payment_count",
        "installment_amount",
        "interest_rate",
        "cae",
        "total_cost",
        "fee",
        "insurance",
        "linked_product",
        "clause",
    }.issubset(by_key)

    principal = by_key["principal_amount"][0]
    assert principal.value_number == 3_500_000
    assert principal.value_currency == "CLP"
    assert principal.text_segment_id == segment.id
    assert principal.source_start_offset is not None
    assert principal.source_start_offset >= 12
    assert "$3.500.000" in (principal.source_snippet or "")

    assert by_key["currency"][0].value_currency == "CLP"
    assert by_key["contract_date"][0].value_date == date(2026, 5, 15)
    assert by_key["term_months"][0].value_number == 60
    assert by_key["payment_count"][0].unit == "payments"
    assert by_key["installment_amount"][0].value_number == 85_000
    assert by_key["interest_rate"][0].value_number == 1.5
    assert by_key["cae"][0].value_number == 22.4
    assert by_key["total_cost"][0].value_number == 5_100_000
    assert by_key["fee"][0].value_number == 20_000
    assert "Seguro de desgravamen" in (by_key["insurance"][0].value_text or "")
    assert "cuenta corriente" in (by_key["linked_product"][0].value_text or "")
    assert "prepago" in (by_key["clause"][0].value_text or "")
    assert all(fact.confirmation_status == "pending" for fact in facts)


def test_ambiguous_single_value_fact_is_stored_as_warning(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        Monto del credito: $3.500.000
        Fecha de contrato: 15/05/2026
        Plazo: 60 meses
        Numero de cuotas: 60
        Cuota mensual: $85.000
        CAE: 22,4%
        CAE: 24,0%
        Costo total del credito: $5.100.000
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    cae_facts = _facts_by_key(facts)["cae"]
    assert len(cae_facts) == 1
    assert cae_facts[0].value_number is None
    assert cae_facts[0].warning_code == "ambiguous_value"
    assert "Multiple different values" in (cae_facts[0].warning_message or "")
    assert "CAE" in (cae_facts[0].source_snippet or "")


def test_missing_required_facts_remain_visible_as_warnings(
    session: Session,
) -> None:
    document, segment = _document_with_segment(
        session,
        "Contrato con texto legible, pero sin condiciones financieras claras.",
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    warnings = {
        fact.fact_key: fact for fact in facts if fact.warning_code == "not_detected"
    }
    assert {
        "principal_amount",
        "contract_date",
        "term_months",
        "payment_count",
        "installment_amount",
        "cae",
        "total_cost",
    } == set(warnings)
    assert all(fact.text_segment_id == segment.id for fact in warnings.values())
    assert all(fact.value_number is None for fact in warnings.values())
    assert all(fact.source_snippet for fact in warnings.values())


def test_label_value_block_recovers_offer_summary_fields(session: Session) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        HOJA RESUMEN / COTIZACION CREDITO DE CONSUMO
        Fecha: 02/12/2022
        Producto Principal
        Monto Liquido del Credito. Anexo
        Plazo del Credito. Anexo
        Valor de la Cuota. Anexo
        Costo Total del Credito (**). Anexo
        CAE(*) Carga Anual Equivalente
        $ 20.000.000
        68
        $ 504.456
        $ 34.316.064
        20,28 %
        Informacion Adicional
        Numero de Cuotas
        Tasa Anual
        Meses de No Pago
        68
        17,88 %
        No solicitado
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    assert by_key["contract_date"][0].value_date == date(2022, 12, 2)
    assert by_key["principal_amount"][0].value_number == 20_000_000
    assert by_key["principal_amount"][0].value_currency == "CLP"
    assert by_key["term_months"][0].value_number == 68
    assert by_key["installment_amount"][0].value_number == 504_456
    assert by_key["total_cost"][0].value_number == 34_316_064
    assert by_key["cae"][0].value_number == 20.28
    assert by_key["payment_count"][0].value_number == 68
    assert by_key["interest_rate"][0].value_number == 17.88
    assert all(
        fact.warning_code is None
        for key in (
            "principal_amount",
            "contract_date",
            "term_months",
            "payment_count",
            "installment_amount",
            "cae",
            "total_cost",
        )
        for fact in by_key[key]
    )


def test_contract_continuation_block_recovers_terms_and_opening_date(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        En SANTIAGO, a 2 de DICIEMBRE del año 2022
        CONTINUACION CONTRATO DE CREDITO DE CONSUMO
        Monto del Credito
        Plazo para el Pago del Credito
        Tasa de Interes Anualizada
        Numero de Cuotas
        Valor Cuota Mensual
        Costo Final o Total del Credito
        Carga Anual Equivalente
        $ 21.195.572
        68
        17,88 %
        68
        $ 504.456
        $ 34.316.064
        20,28 %
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    assert by_key["contract_date"][0].value_date == date(2022, 12, 2)
    assert by_key["principal_amount"][0].value_number == 21_195_572
    assert by_key["term_months"][0].value_number == 68
    assert by_key["interest_rate"][0].value_number == 17.88
    assert by_key["payment_count"][0].value_number == 68
    assert by_key["installment_amount"][0].value_number == 504_456
    assert by_key["total_cost"][0].value_number == 34_316_064
    assert by_key["cae"][0].value_number == 20.28


def test_label_priority_prefers_liquid_amount_over_gross_amount(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        HOJA RESUMEN CREDITO DE CONSUMO
        Monto Liquido del Credito
        Monto Bruto del Credito
        $ 20.000.000
        $ 21.195.572
        Fecha: 02/12/2022
        Plazo del Credito: 68 meses
        Numero de cuotas: 68
        Valor de la cuota: $ 504.456
        CAE: 20,28 %
        Costo total del credito: $ 34.316.064
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    principal = _facts_by_key(facts)["principal_amount"][0]
    assert principal.value_number == 20_000_000
    assert principal.warning_code is None


def test_last_installment_does_not_replace_regular_installment(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        HOJA RESUMEN CREDITO DE CONSUMO
        Valor de la Cuota
        Valor Ultima Cuota
        $ 504.456
        $ 517.513
        Monto del credito: $20.000.000
        Fecha de contrato: 02/12/2022
        Plazo: 68 meses
        Numero de cuotas: 68
        CAE: 20,28 %
        Costo total del credito: $34.316.064
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    installment = _facts_by_key(facts)["installment_amount"][0]
    assert installment.value_number == 504_456
    assert installment.warning_code is None


def test_payment_schedule_derives_count_and_recurring_installment(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        ANEXO N1: Cuadro de Pago del Credito
        Nro.Cuota Fecha Intereses Capital Cuota Saldo
        1 16/01/2023 473.721 30.735 504.456 21.164.836
        2 16/02/2023 325.868 178.588 504.456 20.986.248
        3 16/03/2023 291.849 212.607 504.456 20.773.640
        4 17/04/2023 330.162 174.294 517.513 0
        Monto del credito: 21195572
        Fecha de contrato: 02/12/2022
        Plazo: 4 meses
        CAE: 20,28 %
        Costo total del credito: 34316064
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    assert by_key["payment_count"][0].value_number == 4
    assert by_key["installment_amount"][0].value_number == 504_456
    assert by_key["installment_amount"][0].value_currency is None
    assert "currency" not in by_key


def test_malformed_payment_schedule_does_not_create_schedule_values(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        ANEXO N1: Cuadro de Pago del Credito
        Nro.Cuota Fecha Intereses Capital Cuota Saldo
        1 16/01/2023 473.721 30.735
        Monto del credito: $21.195.572
        Fecha de contrato: 02/12/2022
        Plazo: 4 meses
        CAE: 20,28 %
        Costo total del credito: $34.316.064
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    assert by_key["payment_count"][0].warning_code == "not_detected"
    assert by_key["installment_amount"][0].warning_code == "not_detected"


def test_fact_extraction_rerun_replaces_pending_candidates(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        Monto del credito: $3.500.000
        Fecha de contrato: 15/05/2026
        Plazo: 60 meses
        Numero de cuotas: 60
        Cuota mensual: $85.000
        CAE: 22,4%
        Costo total del credito: $5.100.000
        """,
    )

    first = extract_consumer_credit_facts(session, document)
    second = extract_consumer_credit_facts(session, document)
    session.commit()
    stored = session.scalars(select(ConsumerCreditFact)).all()

    assert len(second) == len(first)
    assert len(stored) == len(second)


def test_bare_monetary_amount_without_currency_marker_leaves_currency_unresolved(
    session: Session,
) -> None:
    document, _segment = _document_with_segment(
        session,
        """
        Monto del credito: 3500000
        Fecha de contrato: 15/05/2026
        Plazo: 60 meses
        Numero de cuotas: 60
        Cuota mensual: 85000
        CAE: 22,4%
        Costo total del credito: 5100000
        """,
    )

    facts = extract_consumer_credit_facts(session, document)
    session.commit()

    by_key = _facts_by_key(facts)
    principal = by_key["principal_amount"][0]
    assert principal.value_number == 3_500_000
    assert principal.value_currency is None

    installment = by_key["installment_amount"][0]
    assert installment.value_number == 85_000
    assert installment.value_currency is None

    total = by_key["total_cost"][0]
    assert total.value_number == 5_100_000
    assert total.value_currency is None

    assert "currency" not in by_key


def _document_with_segment(
    session: Session, text: str, *, start_offset: int = 0
) -> tuple[Document, ExtractedTextSegment]:
    normalized_text = text.strip()
    case = Case(
        owner_ref="demo-user",
        title="Credito casa",
        case_stage="before_signing",
        document_type="consumer_credit",
        analysis_plan="before_signing_review",
        institution_name="Banco Demo",
    )
    session.add(case)
    session.flush()

    document = Document(
        case_id=case.id,
        owner_ref="demo-user",
        role="primary",
        document_type="consumer_credit",
        original_filename="contrato.txt",
        content_type="text/plain",
        byte_size=len(normalized_text.encode("utf-8")),
        checksum_sha256="a" * 64,
        storage_key=f"demo-user/{case.id}/contrato.txt",
        upload_status="stored",
        extraction_status="extracted",
        retention_state="active",
    )
    session.add(document)
    session.flush()

    segment = ExtractedTextSegment(
        document_id=document.id,
        start_offset=start_offset,
        end_offset=start_offset + len(normalized_text),
        text=normalized_text,
        extraction_provider="local-text",
        confidence=1.0,
    )
    session.add(segment)
    session.flush()
    return document, segment


def _facts_by_key(
    facts: list[ConsumerCreditFact],
) -> dict[str, list[ConsumerCreditFact]]:
    by_key: dict[str, list[ConsumerCreditFact]] = defaultdict(list)
    for fact in facts:
        by_key[fact.fact_key].append(fact)
    return by_key
