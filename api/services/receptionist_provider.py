from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Protocol

from api.config import ReceptionistSettings
from api.models.document import Document
from api.models.extraction import ConsumerCreditFact, ExtractedTextSegment
from api.models.receptionist import RECEPTIONIST_SCHEMA_VERSION
from api.schemas.receptionist import (
    ReceptionistAgentReview,
    ReceptionistObservationCreate,
    ReceptionistSourceAnchor,
)
from api.services.fact_extraction import build_consumer_credit_facts
from api.services.receptionist_media import DocumentMediaBundle, PackedTextSegment

SNIPPET_RADIUS = 96


class ReceptionistProviderError(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class ReceptionistProviderResult:
    review: ReceptionistAgentReview
    latency_ms: int
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    cost_usd: float | None = None


class ReceptionistProvider(Protocol):
    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
        settings: ReceptionistSettings,
    ) -> ReceptionistProviderResult: ...


def get_receptionist_provider(settings: ReceptionistSettings) -> ReceptionistProvider:
    if settings.provider == "fake":
        return FakeReceptionistProvider()
    if settings.provider == "fake-timeout":
        return TimeoutReceptionistProvider()
    if settings.provider == "fake-invalid":
        return InvalidReceptionistProvider()
    return UnavailableReceptionistProvider(settings.provider)


class FakeReceptionistProvider:
    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
        settings: ReceptionistSettings,
    ) -> ReceptionistProviderResult:
        del settings
        started = time.monotonic()
        observations = _observations_from_text(document, media_bundle.text_segments)
        observations.extend(
            _unsupported_observations_from_text(media_bundle.text_segments)
        )
        warnings = list(media_bundle.warnings)
        if media_bundle.pages and not media_bundle.text_segments:
            warnings.append("fake provider does not inspect rendered image pixels")
        review = ReceptionistAgentReview(
            schema_version=RECEPTIONIST_SCHEMA_VERSION,
            document_id=document.id,
            observations=observations,
            warnings=warnings,
            partial_coverage=media_bundle.partial_coverage,
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        token_estimate = sum(
            len(segment.text.split()) for segment in media_bundle.text_segments
        )
        return ReceptionistProviderResult(
            review=review,
            latency_ms=latency_ms,
            prompt_tokens=token_estimate,
            completion_tokens=max(1, len(observations) * 12) if observations else 0,
            cost_usd=0.0,
        )


class TimeoutReceptionistProvider:
    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
        settings: ReceptionistSettings,
    ) -> ReceptionistProviderResult:
        del document, media_bundle, settings
        raise ReceptionistProviderError("timeout", "receptionist provider timed out")


class InvalidReceptionistProvider:
    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
        settings: ReceptionistSettings,
    ) -> ReceptionistProviderResult:
        del document, media_bundle, settings
        raise ReceptionistProviderError(
            "invalid_output",
            "receptionist provider returned output outside the schema",
        )


class UnavailableReceptionistProvider:
    def __init__(self, provider_name: str) -> None:
        self.provider_name = provider_name

    def review_document(
        self,
        *,
        document: Document,
        media_bundle: DocumentMediaBundle,
        settings: ReceptionistSettings,
    ) -> ReceptionistProviderResult:
        del document, media_bundle, settings
        raise ReceptionistProviderError(
            "provider_unavailable",
            f"receptionist provider {self.provider_name!r} is not configured",
        )


def _observations_from_text(
    document: Document,
    segments: tuple[PackedTextSegment, ...],
) -> list[ReceptionistObservationCreate]:
    facts = build_consumer_credit_facts(document, _fact_segments(document, segments))
    observations: list[ReceptionistObservationCreate] = []
    for fact in facts:
        if fact.warning_code is not None:
            continue
        observations.append(_observation_from_fact(fact))
    return observations


def _fact_segments(
    document: Document, segments: tuple[PackedTextSegment, ...]
) -> list[ExtractedTextSegment]:
    return [
        ExtractedTextSegment(
            id=segment.id,
            document_id=document.id,
            page_number=segment.page_number,
            start_offset=segment.start_offset,
            end_offset=segment.end_offset,
            text=segment.text,
            extraction_provider="receptionist-fake-text",
            confidence=1.0 if segment.warning_code is None else None,
            warning_code=segment.warning_code,
            warning_message=segment.warning_message,
        )
        for segment in segments
    ]


UNSUPPORTED_SIGNALS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"\b(?:gastos?\s+de\s+)?notari[ao][^\n.;]*", re.IGNORECASE),
        "Gasto notarial no soportado",
    ),
    (
        re.compile(r"\b(?:gastos?\s+de\s+)?cobranza[^\n.;]*", re.IGNORECASE),
        "Gasto de cobranza no soportado",
    ),
)


def _unsupported_observations_from_text(
    segments: tuple[PackedTextSegment, ...],
) -> list[ReceptionistObservationCreate]:
    observations: list[ReceptionistObservationCreate] = []
    for segment in segments:
        for pattern, label in UNSUPPORTED_SIGNALS:
            match = pattern.search(segment.text)
            if match is None:
                continue
            start, end = match.span()
            observations.append(
                ReceptionistObservationCreate(
                    field_label=label,
                    value_kind="unsupported",
                    value_text=_compact_text(match.group(0)),
                    source=ReceptionistSourceAnchor(
                        page_number=segment.page_number,
                        start_offset=_absolute_offset(segment, start),
                        end_offset=_absolute_offset(segment, end),
                        snippet=_snippet_around(segment.text, start, end),
                    ),
                    anchor_status="anchored",
                    confidence=0.62,
                    raw_payload={"provider": "fake", "pattern": pattern.pattern},
                )
            )
    return observations


def _observation_from_fact(fact: ConsumerCreditFact) -> ReceptionistObservationCreate:
    return ReceptionistObservationCreate(
        fact_key=fact.fact_key,  # type: ignore[arg-type]
        field_label=fact.label,
        value_kind=fact.value_kind,  # type: ignore[arg-type]
        value_text=fact.value_text,
        value_number=fact.value_number,
        value_currency=fact.value_currency,
        value_date=fact.value_date,
        unit=fact.unit,
        source=ReceptionistSourceAnchor(
            page_number=fact.source_page_number,
            start_offset=fact.source_start_offset,
            end_offset=fact.source_end_offset,
            snippet=fact.source_snippet,
        ),
        anchor_status="anchored",
        confidence=fact.confidence,
        raw_payload={
            "provider": "fake",
            "source": "deterministic-structural-core",
            "fact_provider": fact.extraction_provider,
        },
    )


def _absolute_offset(
    segment: PackedTextSegment, local_offset: int | None
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


def _compact_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()
