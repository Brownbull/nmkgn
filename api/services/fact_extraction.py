from __future__ import annotations

import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment

EXTRACTION_PROVIDER = "local-facts-v1"
SNIPPET_RADIUS = 96

_TRANSLATION = str.maketrans(
    {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
        "Á": "a",
        "É": "e",
        "Í": "i",
        "Ó": "o",
        "Ú": "u",
        "Ü": "u",
        "Ñ": "n",
    }
)

_MONEY_VALUE = (
    r"(?P<amount>"
    r"(?:clp\s*)?(?:\$?\s*)\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?"
    r"|(?:clp\s*)?(?:\$?\s*)\d{4,12}(?:,\d{1,2})?"
    r"|\$\s*\d+(?:,\d{1,2})?"
    r")(?:\s*(?:clp|pesos))?"
)
_PERCENT_VALUE = r"(?P<percent>\d{1,3}(?:[,.]\d{1,2})?)\s*%"
_INTEGER_VALUE = r"(?P<number>\d{1,3})"
_DATE_VALUE = (
    r"(?P<date>"
    r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
    r"|\d{1,2}\s+de\s+"
    r"(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|"
    r"setiembre|octubre|noviembre|diciembre)"
    r"\s+de\s+\d{4}"
    r")"
)


@dataclass(frozen=True)
class FactValue:
    value_text: str | None = None
    value_number: float | None = None
    value_currency: str | None = None
    value_date: date | None = None

    @property
    def signature(self) -> tuple[str | float | date | None, ...]:
        return (
            self.value_text,
            self.value_number,
            self.value_currency,
            self.value_date,
        )


Parser = Callable[[re.Match[str], str], FactValue | None]


@dataclass(frozen=True)
class FieldRule:
    fact_key: str
    label: str
    value_kind: str
    patterns: tuple[re.Pattern[str], ...]
    parser: Parser
    unit: str | None = None
    high_impact: bool = True
    confidence: float = 0.74
    required: bool = False
    allow_multiple: bool = False


@dataclass(frozen=True)
class Candidate:
    rule: FieldRule
    segment: ExtractedTextSegment
    match_start: int
    match_end: int
    value: FactValue


def extract_consumer_credit_facts(
    session: Session, document: Document, *, clear_existing: bool = True
) -> list[ConsumerCreditFact]:
    if document.document_type != "consumer_credit":
        return []

    if clear_existing:
        clear_pending_facts(session, document.id)

    segments = _load_segments(session, document.id)
    if not segments:
        return []

    facts: list[ConsumerCreditFact] = []
    used_signatures: set[tuple[str, tuple[str | float | date | None, ...]]] = set()

    for rule in FACT_RULES:
        candidates = _collect_candidates(rule, segments)
        accepted = _select_candidates(rule, candidates, segments[0], document)
        for fact in accepted:
            signature = (fact.fact_key, _fact_signature(fact))
            if signature in used_signatures and not rule.allow_multiple:
                continue
            used_signatures.add(signature)
            facts.append(fact)

    currency_fact = _currency_fact_from_money(facts, segments[0], document)
    if currency_fact is not None:
        facts.append(currency_fact)

    session.add_all(facts)
    session.flush()
    return facts


def clear_pending_facts(session: Session, document_id: str) -> None:
    session.execute(
        delete(ConsumerCreditFact).where(
            ConsumerCreditFact.document_id == document_id,
            ConsumerCreditFact.confirmation_status == "pending",
        )
    )


def _load_segments(session: Session, document_id: str) -> list[ExtractedTextSegment]:
    stmt = (
        select(ExtractedTextSegment)
        .where(ExtractedTextSegment.document_id == document_id)
        .order_by(
            ExtractedTextSegment.page_number,
            ExtractedTextSegment.start_offset,
            ExtractedTextSegment.extracted_at,
        )
    )
    return list(session.scalars(stmt))


def _collect_candidates(
    rule: FieldRule, segments: Sequence[ExtractedTextSegment]
) -> list[Candidate]:
    candidates: list[Candidate] = []
    seen: set[tuple[str, int, int, tuple[str | float | date | None, ...]]] = set()

    for segment in segments:
        searchable = _searchable(segment.text)
        for pattern in rule.patterns:
            for match in pattern.finditer(searchable):
                value = rule.parser(match, segment.text)
                if value is None:
                    continue
                key = (segment.id, match.start(), match.end(), value.signature)
                if key in seen:
                    continue
                seen.add(key)
                candidates.append(
                    Candidate(
                        rule=rule,
                        segment=segment,
                        match_start=match.start(),
                        match_end=match.end(),
                        value=value,
                    )
                )
    return candidates


def _select_candidates(
    rule: FieldRule,
    candidates: Sequence[Candidate],
    anchor_segment: ExtractedTextSegment,
    document: Document,
) -> list[ConsumerCreditFact]:
    if not candidates:
        if rule.required:
            return [
                _warning_fact(
                    rule=rule,
                    segment=anchor_segment,
                    document=document,
                    warning_code="not_detected",
                    warning_message=f"{rule.label} was not detected in extracted text.",
                )
            ]
        return []

    if rule.allow_multiple:
        return [_fact_from_candidate(candidate, document) for candidate in candidates]

    distinct_values = {candidate.value.signature for candidate in candidates}
    if len(distinct_values) > 1:
        first = candidates[0]
        return [
            _warning_fact(
                rule=rule,
                segment=first.segment,
                document=document,
                warning_code="ambiguous_value",
                warning_message=(
                    f"Multiple different values were detected for {rule.label}."
                ),
                match_start=first.match_start,
                match_end=first.match_end,
            )
        ]
    return [_fact_from_candidate(candidates[0], document)]


def _fact_from_candidate(
    candidate: Candidate, document: Document
) -> ConsumerCreditFact:
    segment = candidate.segment
    snippet = _snippet_around(segment.text, candidate.match_start, candidate.match_end)
    source_start = _absolute_offset(segment, candidate.match_start)
    source_end = _absolute_offset(segment, candidate.match_end)
    confidence = _combined_confidence(candidate.rule.confidence, segment.confidence)

    return ConsumerCreditFact(
        case_id=document.case_id,
        document_id=document.id,
        text_segment_id=segment.id,
        fact_key=candidate.rule.fact_key,
        label=candidate.rule.label,
        value_kind=candidate.rule.value_kind,
        value_text=candidate.value.value_text,
        value_number=candidate.value.value_number,
        value_currency=candidate.value.value_currency,
        value_date=candidate.value.value_date,
        unit=candidate.rule.unit,
        high_impact=candidate.rule.high_impact,
        confirmation_status="pending",
        source_type="uploaded_document",
        source_page_number=segment.page_number,
        source_start_offset=source_start,
        source_end_offset=source_end,
        source_snippet=snippet,
        extraction_provider=EXTRACTION_PROVIDER,
        confidence=confidence,
        warning_code=segment.warning_code,
        warning_message=segment.warning_message,
    )


def _warning_fact(
    *,
    rule: FieldRule,
    segment: ExtractedTextSegment,
    document: Document,
    warning_code: str,
    warning_message: str,
    match_start: int | None = None,
    match_end: int | None = None,
) -> ConsumerCreditFact:
    snippet = (
        _snippet_around(segment.text, match_start, match_end)
        if match_start is not None and match_end is not None
        else _first_snippet(segment.text)
    )
    source_start = (
        _absolute_offset(segment, match_start) if match_start is not None else None
    )
    source_end = _absolute_offset(segment, match_end) if match_end is not None else None

    return ConsumerCreditFact(
        case_id=document.case_id,
        document_id=document.id,
        text_segment_id=segment.id,
        fact_key=rule.fact_key,
        label=rule.label,
        value_kind=rule.value_kind,
        unit=rule.unit,
        high_impact=rule.high_impact,
        confirmation_status="pending",
        source_type="uploaded_document",
        source_page_number=segment.page_number,
        source_start_offset=source_start,
        source_end_offset=source_end,
        source_snippet=snippet,
        extraction_provider=EXTRACTION_PROVIDER,
        warning_code=warning_code,
        warning_message=warning_message,
    )


def _currency_fact_from_money(
    facts: Sequence[ConsumerCreditFact],
    anchor_segment: ExtractedTextSegment,
    document: Document,
) -> ConsumerCreditFact | None:
    money_fact = next(
        (
            fact
            for fact in facts
            if fact.value_kind == "money" and fact.value_currency == "CLP"
        ),
        None,
    )
    if money_fact is None:
        return None

    return ConsumerCreditFact(
        case_id=document.case_id,
        document_id=document.id,
        text_segment_id=money_fact.text_segment_id or anchor_segment.id,
        fact_key="currency",
        label="Moneda",
        value_kind="currency",
        value_text="CLP",
        value_currency="CLP",
        high_impact=True,
        confirmation_status="pending",
        source_type="uploaded_document",
        source_page_number=money_fact.source_page_number,
        source_start_offset=money_fact.source_start_offset,
        source_end_offset=money_fact.source_end_offset,
        source_snippet=money_fact.source_snippet,
        extraction_provider=EXTRACTION_PROVIDER,
        confidence=money_fact.confidence,
        warning_code=money_fact.warning_code,
        warning_message=money_fact.warning_message,
    )


def _fact_signature(fact: ConsumerCreditFact) -> tuple[str | float | date | None, ...]:
    return (
        fact.value_text,
        fact.value_number,
        fact.value_currency,
        fact.value_date,
        fact.warning_code,
    )


def _combined_confidence(
    rule_confidence: float, segment_confidence: float | None
) -> float:
    if segment_confidence is None:
        return rule_confidence
    return min(rule_confidence, segment_confidence)


def _absolute_offset(
    segment: ExtractedTextSegment, local_offset: int | None
) -> int | None:
    if local_offset is None:
        return None
    if segment.start_offset is None:
        return local_offset
    return segment.start_offset + local_offset


def _snippet_around(text: str, start: int, end: int) -> str:
    snippet_start = max(0, start - SNIPPET_RADIUS)
    snippet_end = min(len(text), end + SNIPPET_RADIUS)
    return _compact_text(text[snippet_start:snippet_end])


def _first_snippet(text: str) -> str:
    return _compact_text(text[: SNIPPET_RADIUS * 2])


def _compact_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _searchable(text: str) -> str:
    return text.translate(_TRANSLATION).lower()


def _parse_money(match: re.Match[str], original_text: str) -> FactValue | None:
    del original_text
    number = _parse_money_number(match.group("amount"))
    if number is None:
        return None
    full = match.group(0)
    has_marker = "$" in full or "clp" in full or "pesos" in full
    return FactValue(value_number=number, value_currency="CLP" if has_marker else None)


def _parse_percentage(match: re.Match[str], original_text: str) -> FactValue | None:
    del original_text
    number = _parse_decimal(match.group("percent"))
    if number is None:
        return None
    return FactValue(value_number=number)


def _parse_integer(match: re.Match[str], original_text: str) -> FactValue | None:
    del original_text
    try:
        return FactValue(value_number=float(int(match.group("number"))))
    except ValueError:
        return None


def _parse_date_value(match: re.Match[str], original_text: str) -> FactValue | None:
    del original_text
    value = _parse_date(match.group("date"))
    if value is None:
        return None
    return FactValue(value_date=value)


def _parse_text_signal(match: re.Match[str], original_text: str) -> FactValue | None:
    start, end = match.span("signal")
    value = _compact_text(original_text[start:end])
    if not value:
        return None
    return FactValue(value_text=value)


def _parse_money_number(value: str) -> float | None:
    cleaned = (
        value.lower()
        .replace("clp", "")
        .replace("pesos", "")
        .replace("$", "")
        .replace(" ", "")
    )
    if "," in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    else:
        cleaned = cleaned.replace(".", "")
    if not cleaned or any(char not in "0123456789." for char in cleaned):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_decimal(value: str) -> float | None:
    cleaned = value.strip()
    if "," in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_date(value: str) -> date | None:
    normalized = value.strip().lower()
    if "/" in normalized or "-" in normalized:
        separator = "/" if "/" in normalized else "-"
        parts = normalized.split(separator)
        if len(parts) != 3:
            return None
        try:
            day, month, year = (int(part) for part in parts)
        except ValueError:
            return None
        if year < 100:
            year += 2000
        return _safe_date(year, month, day)

    match = re.fullmatch(
        r"(?P<day>\d{1,2})\s+de\s+(?P<month>[a-z]+)\s+de\s+(?P<year>\d{4})",
        normalized,
    )
    if match is None:
        return None
    month = MONTHS.get(match.group("month"))
    if month is None:
        return None
    return _safe_date(int(match.group("year")), month, int(match.group("day")))


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None


def _compile(*patterns: str) -> tuple[re.Pattern[str], ...]:
    return tuple(re.compile(pattern) for pattern in patterns)


MONTHS = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}

FACT_RULES: tuple[FieldRule, ...] = (
    FieldRule(
        fact_key="principal_amount",
        label="Monto del credito",
        value_kind="money",
        patterns=_compile(
            rf"\bmonto\s+(?:del\s+)?(?:credito|prestamo|financiado|solicitado)\s*[:：-]?\s*{_MONEY_VALUE}",
            rf"\bcapital\s+(?:prestado|financiado)\s*[:：-]?\s*{_MONEY_VALUE}",
        ),
        parser=_parse_money,
        required=True,
        confidence=0.78,
    ),
    FieldRule(
        fact_key="contract_date",
        label="Fecha de contrato",
        value_kind="date",
        patterns=_compile(
            rf"\bfecha\s+(?:de\s+)?(?:contrato|otorgamiento|firma|suscripcion)\s*[:：-]?\s*{_DATE_VALUE}",
            rf"\b(?:firmado|suscrito)\s+el\s+{_DATE_VALUE}",
        ),
        parser=_parse_date_value,
        required=True,
        confidence=0.77,
    ),
    FieldRule(
        fact_key="term_months",
        label="Plazo en meses",
        value_kind="integer",
        patterns=_compile(
            rf"\b(?:plazo|duracion)\s*[:：-]?\s*{_INTEGER_VALUE}\s*(?:meses|mensualidades)\b",
        ),
        parser=_parse_integer,
        unit="months",
        required=True,
        confidence=0.76,
    ),
    FieldRule(
        fact_key="payment_count",
        label="Numero de cuotas",
        value_kind="integer",
        patterns=_compile(
            rf"\b(?:numero|nro\.?|no\.)\s+(?:de\s+)?cuotas\s*[:：-]?\s*{_INTEGER_VALUE}\b",
            rf"\b{_INTEGER_VALUE}\s*(?:cuotas|dividendos|pagos)\b",
        ),
        parser=_parse_integer,
        unit="payments",
        required=True,
        confidence=0.76,
    ),
    FieldRule(
        fact_key="installment_amount",
        label="Valor de cuota",
        value_kind="money",
        patterns=_compile(
            rf"\b(?:valor|monto|importe)\s+(?:de\s+)?(?:la\s+)?cuota\s*[:：-]?\s*{_MONEY_VALUE}",
            rf"\b(?:cuota|dividendo)\s+(?:mensual|final)?\s*[:：-]?\s*{_MONEY_VALUE}",
        ),
        parser=_parse_money,
        required=True,
        confidence=0.76,
    ),
    FieldRule(
        fact_key="interest_rate",
        label="Tasa de interes",
        value_kind="percentage",
        patterns=_compile(
            rf"\btasa\s+(?:de\s+)?interes(?:\s+(?:mensual|anual))?\s*[:：-]?\s*{_PERCENT_VALUE}",
        ),
        parser=_parse_percentage,
        unit="percent",
        confidence=0.72,
    ),
    FieldRule(
        fact_key="cae",
        label="CAE",
        value_kind="percentage",
        patterns=_compile(
            rf"\bcae(?:\s+anual)?\s*[:：-]?\s*{_PERCENT_VALUE}",
        ),
        parser=_parse_percentage,
        unit="percent_annual",
        required=True,
        confidence=0.82,
    ),
    FieldRule(
        fact_key="total_cost",
        label="Costo total",
        value_kind="money",
        patterns=_compile(
            rf"\b(?:costo\s+total(?:\s+del\s+credito)?|total\s+a\s+pagar)\s*[:：-]?\s*{_MONEY_VALUE}",
        ),
        parser=_parse_money,
        required=True,
        confidence=0.78,
    ),
    FieldRule(
        fact_key="fee",
        label="Comision o cargo",
        value_kind="money",
        patterns=_compile(
            rf"\b(?:comision(?:\s+(?:de\s+)?(?:administracion|apertura|mantencion|prepago))?|gastos?\s+(?:operacional(?:es)?|notarial(?:es)?|administrativ(?:o|os|a|as)|de\s+administracion))\s*[:：-]?\s*{_MONEY_VALUE}",
        ),
        parser=_parse_money,
        allow_multiple=True,
        confidence=0.7,
    ),
    FieldRule(
        fact_key="insurance",
        label="Seguro asociado",
        value_kind="text",
        patterns=_compile(
            r"\b(?P<signal>seguro\s+(?:de\s+)?(?:desgravamen|cesantia|incendio|asociado|obligatorio)[^\n.;]*)",
        ),
        parser=_parse_text_signal,
        allow_multiple=True,
        confidence=0.68,
    ),
    FieldRule(
        fact_key="linked_product",
        label="Producto vinculado",
        value_kind="text",
        patterns=_compile(
            r"\b(?P<signal>(?:producto\s+(?:asociado|vinculado)|contratacion\s+(?:de\s+)?(?:cuenta\s+corriente|tarjeta)|cuenta\s+corriente|tarjeta\s+de\s+credito)[^\n.;]*)",
        ),
        parser=_parse_text_signal,
        allow_multiple=True,
        confidence=0.66,
    ),
    FieldRule(
        fact_key="clause",
        label="Clausula relevante",
        value_kind="text",
        patterns=_compile(
            r"\b(?P<signal>(?:clausula|prepago|aceleracion|mandato)[^\n]*(?:\.|$))",
        ),
        parser=_parse_text_signal,
        allow_multiple=True,
        confidence=0.64,
    ),
)
