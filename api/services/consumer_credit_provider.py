from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Protocol

from api.config import ConsumerCreditAgentSettings
from api.models.analysis import CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
from api.schemas.analysis import (
    AnalysisEvidenceCreate,
    AnalysisFindingCreate,
    AnalysisInferenceMetadata,
    ConsumerCreditAnalysis,
)
from api.services.calculations import CalculationResult


FAKE_PROMPT_VERSION = "consumer-credit-agent-v1"


class ConsumerCreditProviderError(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class ConsumerCreditAgentInput:
    analysis_run_id: str
    case_id: str
    confirmed_fact_ids: list[str]
    calculation_results: list[CalculationResult]
    reference_keys: list[str]


@dataclass(frozen=True)
class ConsumerCreditProviderResult:
    analysis: ConsumerCreditAnalysis
    latency_ms: int
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    cost_usd: float | None = None


class ConsumerCreditProvider(Protocol):
    def analyze(
        self,
        *,
        agent_input: ConsumerCreditAgentInput,
        settings: ConsumerCreditAgentSettings,
    ) -> ConsumerCreditProviderResult: ...


def get_consumer_credit_provider(
    settings: ConsumerCreditAgentSettings,
) -> ConsumerCreditProvider:
    if settings.provider == "fake":
        return FakeConsumerCreditProvider()
    if settings.provider == "fake-timeout":
        return TimeoutConsumerCreditProvider()
    return UnavailableConsumerCreditProvider(settings.provider)


class FakeConsumerCreditProvider:
    def analyze(
        self,
        *,
        agent_input: ConsumerCreditAgentInput,
        settings: ConsumerCreditAgentSettings,
    ) -> ConsumerCreditProviderResult:
        del settings
        started = time.monotonic()

        findings = _findings_from_calculations(agent_input)
        summary = _build_summary(agent_input, findings)

        analysis = ConsumerCreditAnalysis(
            analysis_run_id=agent_input.analysis_run_id,
            case_id=agent_input.case_id,
            status="completed",
            summary=summary,
            findings=findings,
            calculations=[],
            unsupported_outputs=[],
            warnings=[],
            next_actions=_build_next_actions(findings),
            inference_metadata=AnalysisInferenceMetadata(
                provider="fake",
                model_name="fake-consumer-credit-v1",
                prompt_version=FAKE_PROMPT_VERSION,
                schema_version=CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION,
                confidence=1.0,
            ),
        )
        elapsed = int((time.monotonic() - started) * 1000)
        return ConsumerCreditProviderResult(
            analysis=analysis,
            latency_ms=elapsed,
            prompt_tokens=0,
            completion_tokens=0,
            cost_usd=0.0,
        )


class TimeoutConsumerCreditProvider:
    def analyze(
        self,
        *,
        agent_input: ConsumerCreditAgentInput,
        settings: ConsumerCreditAgentSettings,
    ) -> ConsumerCreditProviderResult:
        del agent_input
        raise ConsumerCreditProviderError(
            "timeout",
            f"consumer credit agent timed out after {settings.timeout_seconds}s",
        )


class UnavailableConsumerCreditProvider:
    def __init__(self, provider_name: str) -> None:
        self.provider_name = provider_name

    def analyze(
        self,
        *,
        agent_input: ConsumerCreditAgentInput,
        settings: ConsumerCreditAgentSettings,
    ) -> ConsumerCreditProviderResult:
        del agent_input, settings
        raise ConsumerCreditProviderError(
            "unavailable",
            f"consumer credit provider not available: {self.provider_name}",
        )


def _findings_from_calculations(
    agent_input: ConsumerCreditAgentInput,
) -> list[AnalysisFindingCreate]:
    findings: list[AnalysisFindingCreate] = []
    order = 0
    for calc in agent_input.calculation_results:
        if not calc.result.get("has_discrepancy"):
            term_matches = calc.result.get("term_matches_count")
            if term_matches is not None and not term_matches:
                pass
            else:
                continue

        evidence: list[AnalysisEvidenceCreate] = [
            AnalysisEvidenceCreate(
                evidence_type="calculation",
                calculation_key=calc.calculation_key,
            )
        ]
        for fact_id in calc.input_fact_ids:
            evidence.append(
                AnalysisEvidenceCreate(
                    evidence_type="fact",
                    fact_id=fact_id,
                )
            )

        findings.append(
            AnalysisFindingCreate(
                finding_key=calc.calculation_key,
                title=calc.label,
                summary=_calc_summary(calc),
                severity="high" if calc.result.get("has_discrepancy") else "medium",
                claim_type="calculation",
                uncertainty_state="supported",
                confidence=1.0,
                display_order=order,
                evidence=evidence,
            )
        )
        order += 1

    return findings


def _calc_summary(calc: CalculationResult) -> str:
    merged = {**calc.inputs, **calc.result}
    parts = [f"{k}={v}" for k, v in sorted(merged.items()) if v is not None]
    return f"{calc.label}: {', '.join(parts)}" if parts else calc.label


def _build_summary(
    agent_input: ConsumerCreditAgentInput,
    findings: list[AnalysisFindingCreate],
) -> str:
    n_facts = len(agent_input.confirmed_fact_ids)
    n_calcs = len(agent_input.calculation_results)
    n_findings = len(findings)
    return (
        f"Análisis basado en {n_facts} hechos confirmados y "
        f"{n_calcs} cálculos determinísticos. "
        f"Se encontraron {n_findings} hallazgos."
    )


def _build_next_actions(
    findings: list[AnalysisFindingCreate],
) -> list[str]:
    if not findings:
        return ["Revisar el contrato: no se detectaron discrepancias."]
    actions = []
    high_count = sum(1 for f in findings if f.severity in ("high", "critical"))
    if high_count:
        actions.append(
            f"Revisar {high_count} hallazgo(s) de alta severidad con la institución financiera."
        )
    actions.append(
        "Comparar las condiciones del contrato con las tasas y condiciones publicadas por la CMF."
    )
    return actions
