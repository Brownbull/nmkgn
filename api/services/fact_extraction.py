from __future__ import annotations

import re
from collections import Counter
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
    r"\s+(?:de|del\s+ano)\s+\d{4}"
    r")"
)
REGEX_CANDIDATE_PRIORITY = 100
STRUCTURAL_CANDIDATE_PRIORITY = 20
PAYMENT_SCHEDULE_PRIORITY = 12

_MONEY_SEARCH = re.compile(_MONEY_VALUE)
_PERCENT_SEARCH = re.compile(_PERCENT_VALUE)
_DATE_SEARCH = re.compile(_DATE_VALUE)
_INTEGER_LINE = re.compile(r"^\s*(?P<number>\d{1,3})\s*$")
_PAYMENT_SCHEDULE_ROW = re.compile(
    r"^\s*(?P<number>\d{1,3})\s+"
    r"(?P<date>\d{1,2}/\d{1,2}/\d{4})\s+"
    r"(?P<interest>\d{1,3}(?:\.\d{3})*)\s+"
    r"(?P<capital>\d{1,3}(?:\.\d{3})*)\s+"
    r"(?P<installment>\d{1,3}(?:\.\d{3})*)\s+"
    r"(?P<balance>\d{1,3}(?:\.\d{3})*)\s*$"
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
    priority: int = REGEX_CANDIDATE_PRIORITY


@dataclass(frozen=True)
class TextLine:
    text: str
    searchable: str
    start: int
    end: int


@dataclass(frozen=True)
class TableValue:
    value: FactValue
    start: int
    end: int


@dataclass(frozen=True)
class TableLabelSpec:
    fact_key: str | None
    patterns: tuple[re.Pattern[str], ...]
    value_kind: str | None = None
    priority: int = STRUCTURAL_CANDIDATE_PRIORITY
    consumes_value: bool = True
    excluded_patterns: tuple[re.Pattern[str], ...] = ()


@dataclass(frozen=True)
class TableLabelMatch:
    spec: TableLabelSpec
    line: TextLine
    start: int
    end: int


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

    facts = build_consumer_credit_facts(document, segments)
    session.add_all(facts)
    session.flush()
    return facts


def build_consumer_credit_facts(
    document: Document, segments: Sequence[ExtractedTextSegment]
) -> list[ConsumerCreditFact]:
    if document.document_type != "consumer_credit" or not segments:
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

    for candidate in _collect_structural_candidates(rule, segments):
        key = (
            candidate.segment.id,
            candidate.match_start,
            candidate.match_end,
            candidate.value.signature,
        )
        if key in seen:
            continue
        seen.add(key)
        candidates.append(candidate)

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
                        priority=REGEX_CANDIDATE_PRIORITY,
                    )
                )
    return candidates


def _collect_structural_candidates(
    rule: FieldRule, segments: Sequence[ExtractedTextSegment]
) -> list[Candidate]:
    candidates: list[Candidate] = []
    candidates.extend(_payment_schedule_candidates(rule, segments))
    for segment in segments:
        candidates.extend(_label_value_candidates(rule, segment))
        candidates.extend(_contract_opening_date_candidates(rule, segment))
    return candidates


def _label_value_candidates(
    rule: FieldRule, segment: ExtractedTextSegment
) -> list[Candidate]:
    lines = _text_lines(segment.text)
    candidates: list[Candidate] = []

    for line in lines:
        label_match = _match_table_label(line)
        if label_match is None or label_match.spec.fact_key != rule.fact_key:
            continue
        value = _parse_table_value(
            label_match.spec.value_kind or rule.value_kind,
            line.text[label_match.end :],
            base_offset=line.start + label_match.end,
        )
        if value is None:
            continue
        candidates.append(
            Candidate(
                rule=rule,
                segment=segment,
                match_start=line.start + label_match.start,
                match_end=value.end,
                value=value.value,
                priority=label_match.spec.priority,
            )
        )

    candidates.extend(_paired_label_value_candidates(rule, segment, lines))
    return candidates


def _paired_label_value_candidates(
    rule: FieldRule,
    segment: ExtractedTextSegment,
    lines: Sequence[TextLine],
) -> list[Candidate]:
    candidates: list[Candidate] = []
    index = 0
    while index < len(lines):
        first = _match_table_label(lines[index])
        if first is None:
            index += 1
            continue

        labels: list[TableLabelMatch] = []
        while index < len(lines):
            label = _match_table_label(lines[index])
            if label is None:
                break
            labels.append(label)
            index += 1

        if len(labels) < 2:
            continue

        values = _candidate_value_lines(lines, index, len(labels))
        if len(values) < len([label for label in labels if label.spec.consumes_value]):
            continue

        value_index = 0
        for label in labels:
            if not label.spec.consumes_value:
                continue
            if value_index >= len(values):
                break
            value_line = values[value_index]
            value_index += 1
            if label.spec.fact_key != rule.fact_key:
                continue
            value = _parse_table_value(
                label.spec.value_kind or rule.value_kind,
                value_line.text,
                base_offset=value_line.start,
            )
            if value is None:
                continue
            candidates.append(
                Candidate(
                    rule=rule,
                    segment=segment,
                    match_start=label.line.start + label.start,
                    match_end=value.end,
                    value=value.value,
                    priority=label.spec.priority,
                )
            )
    return candidates


def _candidate_value_lines(
    lines: Sequence[TextLine], start_index: int, max_values: int
) -> list[TextLine]:
    values: list[TextLine] = []
    for line in lines[start_index:]:
        if _match_table_label(line) is not None:
            if values:
                break
            continue
        if _is_explanatory_line(line):
            continue
        if _looks_like_table_value(line):
            values.append(line)
        if len(values) >= max_values:
            break
    return values


def _contract_opening_date_candidates(
    rule: FieldRule, segment: ExtractedTextSegment
) -> list[Candidate]:
    if rule.fact_key != "contract_date":
        return []
    searchable = _searchable(segment.text)
    if "contrato de credito" not in searchable:
        return []
    pattern = re.compile(
        rf"\ben\s+[a-z\s]+,\s*a\s+{_DATE_VALUE}",
    )
    candidates: list[Candidate] = []
    for match in pattern.finditer(searchable):
        value = _parse_date(match.group("date"))
        if value is None:
            continue
        candidates.append(
            Candidate(
                rule=rule,
                segment=segment,
                match_start=match.start(),
                match_end=match.end(),
                value=FactValue(value_date=value),
                priority=10,
            )
        )
    return candidates


def _payment_schedule_candidates(
    rule: FieldRule, segments: Sequence[ExtractedTextSegment]
) -> list[Candidate]:
    if rule.fact_key not in {"payment_count", "installment_amount"}:
        return []
    rows: list[tuple[ExtractedTextSegment, TextLine, re.Match[str]]] = []
    for segment in segments:
        searchable = _searchable(segment.text)
        if not all(
            token in searchable for token in ("nro.cuota", "capital", "cuota", "saldo")
        ):
            continue
        for line in _text_lines(segment.text):
            match = _PAYMENT_SCHEDULE_ROW.match(line.text)
            if match is not None:
                rows.append((segment, line, match))
    if not rows:
        return []

    if rule.fact_key == "payment_count":
        segment, line, match = max(rows, key=lambda row: int(row[2].group("number")))
        return [
            Candidate(
                rule=rule,
                segment=segment,
                match_start=line.start + match.start("number"),
                match_end=line.start + match.end("number"),
                value=FactValue(value_number=float(int(match.group("number")))),
                priority=PAYMENT_SCHEDULE_PRIORITY,
            )
        ]

    installment_counts = Counter(match.group("installment") for _, _, match in rows)
    installment_text, _count = installment_counts.most_common(1)[0]
    for segment, line, match in rows:
        if match.group("installment") != installment_text:
            continue
        number = _parse_money_number(installment_text)
        if number is None:
            return []
        return [
            Candidate(
                rule=rule,
                segment=segment,
                match_start=line.start + match.start("installment"),
                match_end=line.start + match.end("installment"),
                value=FactValue(value_number=number),
                priority=PAYMENT_SCHEDULE_PRIORITY,
            )
        ]
    return []


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

    best_priority = min(candidate.priority for candidate in candidates)
    best_candidates = [
        candidate for candidate in candidates if candidate.priority == best_priority
    ]

    distinct_values = {candidate.value.signature for candidate in best_candidates}
    if len(distinct_values) > 1:
        first = best_candidates[0]
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
    return [_fact_from_candidate(best_candidates[0], document)]


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


def _text_lines(text: str) -> list[TextLine]:
    lines: list[TextLine] = []
    offset = 0
    for raw_line in text.splitlines(keepends=True):
        line_without_break = raw_line.rstrip("\r\n")
        stripped = line_without_break.strip()
        if stripped:
            leading = len(line_without_break) - len(line_without_break.lstrip())
            start = offset + leading
            end = start + len(stripped)
            lines.append(
                TextLine(
                    text=stripped,
                    searchable=_searchable(stripped),
                    start=start,
                    end=end,
                )
            )
        offset += len(raw_line)
    return lines


def _match_table_label(line: TextLine) -> TableLabelMatch | None:
    for spec in TABLE_LABEL_SPECS:
        if any(pattern.search(line.searchable) for pattern in spec.excluded_patterns):
            continue
        for pattern in spec.patterns:
            match = pattern.search(line.searchable)
            if match is None:
                continue
            return TableLabelMatch(
                spec=spec,
                line=line,
                start=match.start(),
                end=match.end(),
            )
    return None


def _parse_table_value(
    value_kind: str, text: str, *, base_offset: int
) -> TableValue | None:
    if value_kind == "money":
        match = _MONEY_SEARCH.search(text)
        if match is None:
            return None
        value = _parse_money(match, text)
        if value is None:
            return None
        return TableValue(
            value=value,
            start=base_offset + match.start("amount"),
            end=base_offset + match.end("amount"),
        )

    if value_kind == "percentage":
        match = _PERCENT_SEARCH.search(text)
        if match is None:
            return None
        value = _parse_percentage(match, text)
        if value is None:
            return None
        return TableValue(
            value=value,
            start=base_offset + match.start("percent"),
            end=base_offset + match.end("percent"),
        )

    if value_kind == "integer":
        match = _INTEGER_LINE.match(text)
        if match is None:
            return None
        return TableValue(
            value=FactValue(value_number=float(int(match.group("number")))),
            start=base_offset + match.start("number"),
            end=base_offset + match.end("number"),
        )

    if value_kind == "date":
        match = _DATE_SEARCH.search(text)
        if match is None:
            return None
        value = _parse_date(match.group("date"))
        if value is None:
            return None
        return TableValue(
            value=FactValue(value_date=value),
            start=base_offset + match.start("date"),
            end=base_offset + match.end("date"),
        )
    return None


def _looks_like_table_value(line: TextLine) -> bool:
    if _MONEY_SEARCH.search(line.text) is not None:
        return True
    if _PERCENT_SEARCH.search(line.text) is not None:
        return True
    if _DATE_SEARCH.search(line.text) is not None:
        return True
    if _INTEGER_LINE.match(line.text) is not None:
        return True
    return bool(line.text) and len(line.text) <= 120


def _is_explanatory_line(line: TextLine) -> bool:
    if line.text.startswith(("(*)", "(**)")):
        return True
    if len(line.text) > 140:
        return True
    explanatory_markers = (
        "indicador",
        "calcular",
        "corresponde",
        "contempla",
        "periodo anual",
        "valor presente",
    )
    return any(marker in line.searchable for marker in explanatory_markers)


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
        r"(?P<day>\d{1,2})\s+de\s+(?P<month>[a-z]+)\s+"
        r"(?:de|del\s+ano)\s+(?P<year>\d{4})",
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

TABLE_LABEL_SPECS: tuple[TableLabelSpec, ...] = (
    TableLabelSpec(None, _compile(r"\bfecha\s+primer\s+pago\b")),
    TableLabelSpec(None, _compile(r"\bvalor\s+ultima\s+cuota\b")),
    TableLabelSpec(None, _compile(r"\bvalor\s+cuota\s+referencia\b")),
    TableLabelSpec(
        None,
        _compile(r"\bplazo\s+de\s+aviso\b", r"\bplazo[^\n]*prepago\b"),
    ),
    TableLabelSpec(
        "principal_amount",
        _compile(
            r"\bmonto\s+liquido\s+del\s+credito\b",
            r"\bmonto\s+total\s+que\s+efectivamente\s+recibe\b",
        ),
        value_kind="money",
        priority=8,
    ),
    TableLabelSpec(
        "principal_amount",
        _compile(
            r"\bmonto\s+(?:(?:bruto\s+)?del\s+)?credito\b",
            r"\bcapital\s+(?:prestado|financiado)\b",
        ),
        value_kind="money",
        priority=30,
    ),
    TableLabelSpec(
        "contract_date",
        _compile(r"\bfecha\b"),
        value_kind="date",
        priority=30,
        excluded_patterns=_compile(r"\bfecha\s+primer\s+pago\b"),
    ),
    TableLabelSpec(
        "term_months",
        _compile(
            r"\bplazo\s+(?:para\s+el\s+pago\s+del\s+credito|del\s+credito)\b",
            r"\bplazo\b",
        ),
        value_kind="integer",
        priority=10,
        excluded_patterns=_compile(r"\baviso\b", r"\bprepago\b"),
    ),
    TableLabelSpec(
        "payment_count",
        _compile(r"\bnumero\s+de\s+cuotas\b", r"\bnro\.?\s*cuotas\b"),
        value_kind="integer",
        priority=10,
    ),
    TableLabelSpec(
        "installment_amount",
        _compile(
            r"\bvalor\s+(?:de\s+)?(?:la\s+)?cuota(?:\s+mensual)?\b",
            r"\bcuota\s+mensual\b",
        ),
        value_kind="money",
        priority=10,
        excluded_patterns=_compile(r"\bultima\b", r"\breferencia\b"),
    ),
    TableLabelSpec(
        "interest_rate",
        _compile(
            r"\btasa\s+(?:de\s+)?interes(?:\s+anualizada|\s+anual)?\b",
            r"\btasa\s+anual\b",
        ),
        value_kind="percentage",
        priority=15,
    ),
    TableLabelSpec(
        "cae",
        _compile(r"\bcae\b", r"\bcarga\s+anual\s+equivalente\b"),
        value_kind="percentage",
        priority=10,
    ),
    TableLabelSpec(
        "total_cost",
        _compile(
            r"\bcosto\s+(?:final\s+o\s+)?total\s+(?:del\s+)?credito\b",
            r"\bcosto\s+total\s+(?:del\s+)?credito\b",
            r"\btotal\s+a\s+pagar\b",
        ),
        value_kind="money",
        priority=10,
    ),
    TableLabelSpec(None, _compile(r"\bnombre(?:\s+y\s+apellidos)?\b")),
    TableLabelSpec(None, _compile(r"\bdomicilio\b")),
    TableLabelSpec(None, _compile(r"\brut\b")),
    TableLabelSpec(None, _compile(r"\btipo\s+credito\b")),
    TableLabelSpec(None, _compile(r"\bsucursal\b")),
    TableLabelSpec(None, _compile(r"\bfrecuencia\s+de\s+pago\b")),
    TableLabelSpec(None, _compile(r"\bperiodicidad\b")),
    TableLabelSpec(None, _compile(r"\bdia\s+de\s+vencimiento\b")),
    TableLabelSpec(
        None,
        _compile(r"\b(?:1er|primer|2do|segundo)\s+mes\b", r"\bmes\s*[12]\b"),
        consumes_value=False,
    ),
    TableLabelSpec(
        None,
        _compile(r"\bmeses?\s+(?:de\s+)?(?:gracia|no\s+pago)\b"),
        consumes_value=False,
    ),
    TableLabelSpec(None, _compile(r"\bsuma\s+de\s+intereses\b")),
    TableLabelSpec(None, _compile(r"\binteres\s+del\s+credito\b")),
    TableLabelSpec(
        None,
        _compile(r"\bgastos?\s+(?:o\s+cargos|asociados)\b"),
        consumes_value=False,
    ),
    TableLabelSpec(None, _compile(r"\bimpuestos?\b")),
    TableLabelSpec(None, _compile(r"\bgastos?\s+notariales\b")),
    TableLabelSpec(None, _compile(r"\bautorizacion\s+notarial\b")),
    TableLabelSpec(None, _compile(r"\bprima\s+seguros?\s+voluntarios\b")),
    TableLabelSpec(None, _compile(r"\btotal\s+gastos\s+asociados\b")),
    TableLabelSpec(None, _compile(r"\bgarantias?\s+asociadas\b")),
)

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
