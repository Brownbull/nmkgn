from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Protocol

from api.config import ConsumerCreditAgentSettings
from api.models.analysis import CONSUMER_CREDIT_ANALYSIS_SCHEMA_VERSION
from api.schemas.analysis import (
    AnalysisCitation,
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
    analysis_plan: str
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

        if agent_input.analysis_plan == "before_signing_review":
            findings = _bs_findings_from_calculations(agent_input)
            summary = _bs_build_summary(agent_input, findings)
            next_actions = _bs_build_next_actions(findings)
        else:
            findings = _findings_from_calculations(agent_input)
            summary = _build_summary(agent_input, findings)
            next_actions = _build_next_actions(findings)

        analysis = ConsumerCreditAnalysis(
            analysis_run_id=agent_input.analysis_run_id,
            case_id=agent_input.case_id,
            status="completed",
            summary=summary,
            findings=findings,
            calculations=[],
            unsupported_outputs=[],
            warnings=[],
            next_actions=next_actions,
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


BS_CALC_FINDING_MAP: dict[str, dict[str, str]] = {
    "rate_cae_signal": {
        "finding_key": "bs_rate_comparison",
        "title": "Tasa de interés y CAE del crédito",
        "template": (
            "La tasa de interés es {interest_rate}% y el CAE es {cae}%. "
            "Vale la pena confirmar cómo se compara con las tasas máximas vigentes."
        ),
        "severity": "medium",
    },
    "total_paid_check": {
        "finding_key": "bs_total_cost",
        "title": "Costo total del crédito",
        "template": (
            "Cuota ({installment_amount}) x cantidad ({payment_count}) = "
            "{computed_total_paid}. El costo total declarado es {stated_total_cost}."
        ),
        "severity": "medium",
    },
    "installment_signal": {
        "finding_key": "bs_installment_ratio",
        "title": "Relación cuota mensual vs capital",
        "template": (
            "La cuota mínima sin interés sería {min_installment_no_interest}, "
            "pero la cuota declarada es {stated_installment}."
        ),
        "severity": "low",
    },
}

BS_QUESTION_SPECS: list[dict[str, str]] = [
    {
        "finding_key": "bs_question_early_payment",
        "title": "Condiciones de pago anticipado",
        "summary": (
            "Vale la pena confirmar si el contrato contempla condiciones "
            "de pago anticipado y si aplican costos asociados."
        ),
    },
    {
        "finding_key": "bs_question_fee_breakdown",
        "title": "Desglose de comisiones y cargos",
        "summary": (
            "Vale la pena solicitar un desglose detallado de todas las "
            "comisiones y cargos incluidos en el crédito."
        ),
    },
]


def _bs_findings_from_calculations(
    agent_input: ConsumerCreditAgentInput,
) -> list[AnalysisFindingCreate]:
    findings: list[AnalysisFindingCreate] = []
    order = 0

    for calc in agent_input.calculation_results:
        spec = BS_CALC_FINDING_MAP.get(calc.calculation_key)
        if spec is None:
            continue
        if not calc.result or calc.missing_input_keys:
            continue

        merged = {**calc.inputs, **calc.result}
        try:
            summary = spec["template"].format(**merged)
        except KeyError:
            summary = spec["title"]

        evidence: list[AnalysisEvidenceCreate] = [
            AnalysisEvidenceCreate(
                evidence_type="calculation",
                calculation_key=calc.calculation_key,
            )
        ]
        for fact_id in calc.input_fact_ids:
            evidence.append(
                AnalysisEvidenceCreate(evidence_type="fact", fact_id=fact_id)
            )

        findings.append(
            AnalysisFindingCreate(
                finding_key=spec["finding_key"],
                title=spec["title"],
                summary=summary,
                severity=spec["severity"],
                claim_type="calculation",
                uncertainty_state="supported",
                confidence=1.0,
                display_order=order,
                evidence=evidence,
            )
        )
        order += 1

    for q_spec in BS_QUESTION_SPECS:
        if not agent_input.reference_keys:
            continue
        findings.append(
            AnalysisFindingCreate(
                finding_key=q_spec["finding_key"],
                title=q_spec["title"],
                summary=q_spec["summary"],
                severity="low",
                claim_type="reference",
                uncertainty_state="supported",
                confidence=1.0,
                display_order=order,
                evidence=[
                    AnalysisEvidenceCreate(
                        evidence_type="reference",
                        citation=AnalysisCitation(
                            label="Referencia normativa",
                            url="https://cmfchile.cl",
                            reference_key=agent_input.reference_keys[0],
                        ),
                    )
                ],
            )
        )
        order += 1

    return findings


def _bs_build_summary(
    agent_input: ConsumerCreditAgentInput,
    findings: list[AnalysisFindingCreate],
) -> str:
    n_facts = len(agent_input.confirmed_fact_ids)
    n_findings = len(findings)
    return (
        f"Revisión pre-firma basada en {n_facts} hechos confirmados. "
        f"Se identificaron {n_findings} puntos a revisar antes de firmar."
    )


def _bs_build_next_actions(
    findings: list[AnalysisFindingCreate],
) -> list[str]:
    if not findings:
        return [
            "Los datos del crédito fueron revisados y no se identificaron "
            "puntos adicionales a consultar antes de firmar."
        ]
    actions = [
        "Revisar los puntos identificados con la institución financiera antes de firmar.",
        "Confirmar que todas las condiciones del contrato coincidan con lo ofrecido.",
    ]
    questions = [f for f in findings if f.claim_type == "reference"]
    if questions:
        actions.append(
            f"Considerar {len(questions)} pregunta(s) de negociación antes de firmar."
        )
    return actions
