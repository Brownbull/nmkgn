from __future__ import annotations

from api.services.calculations import CalculationResult


FINDING_SPECS: dict[str, dict] = {
    "payment_count_delta": {
        "title": "Cantidad de cuotas no coincide con el plazo",
        "summary_template": (
            "El contrato indica {contract_payment_count} cuotas pero el plazo "
            "es de {expected_payment_count} meses (diferencia: {delta})."
        ),
        "severity": "high",
        "discrepancy_key": "has_discrepancy",
    },
    "total_paid_check": {
        "title": "Total pagado no coincide con cuota x cantidad",
        "summary_template": (
            "Cuota ({installment_amount}) x cantidad ({payment_count}) = "
            "{computed_total_paid}, pero el costo total declarado es "
            "{stated_total_cost} (diferencia: {difference})."
        ),
        "severity": "high",
        "discrepancy_key": "has_discrepancy",
    },
    "term_signal": {
        "title": "Plazo y cantidad de cuotas no son consistentes",
        "summary_template": (
            "El plazo es {term_months} meses pero hay {payment_count} cuotas."
        ),
        "severity": "medium",
        "discrepancy_key": "term_matches_count",
        "discrepancy_inverted": True,
    },
}


BEFORE_SIGNING_FINDING_SPECS: dict[str, dict] = {
    "bs_rate_comparison": {
        "calculation_key": "rate_cae_signal",
        "title": "Tasa de interés y CAE del crédito",
        "summary_template": (
            "La tasa de interés es {interest_rate}% y el CAE es {cae}% "
            "(diferencia: {spread} puntos). Vale la pena confirmar cómo "
            "se compara con las tasas máximas vigentes."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_total_cost": {
        "calculation_key": "total_paid_check",
        "title": "Costo total del crédito",
        "summary_template": (
            "Cuota ({installment_amount}) x cantidad ({payment_count}) = "
            "{computed_total_paid}. El costo total declarado es "
            "{stated_total_cost}."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_installment_ratio": {
        "calculation_key": "installment_signal",
        "title": "Relación cuota mensual vs capital",
        "summary_template": (
            "La cuota mínima sin interés sería {min_installment_no_interest}, "
            "pero la cuota declarada es {stated_installment} "
            "(ratio: {ratio_to_minimum}x)."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
    "bs_fee_summary": {
        "calculation_key": "fee_sum",
        "title": "Comisiones y cargos del crédito",
        "summary_template": (
            "Se detectaron {fee_count} cobros por un total de {total_fees}. "
            "Vale la pena confirmar si todos son obligatorios."
        ),
        "severity": "medium",
        "trigger": "any_result",
    },
    "bs_insurance_review": {
        "calculation_key": "insurance_signals",
        "title": "Seguros asociados al crédito",
        "summary_template": (
            "Se detectaron {detected_count} seguros asociados. "
            "Vale la pena confirmar cuáles son opcionales."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
    "bs_linked_products": {
        "calculation_key": "linked_product_signals",
        "title": "Productos vinculados al crédito",
        "summary_template": (
            "Se detectaron {detected_count} productos vinculados. "
            "Vale la pena confirmar si son requisito para obtener el crédito."
        ),
        "severity": "low",
        "trigger": "any_result",
    },
}


def should_fire_finding(spec: dict, calc: CalculationResult) -> bool:
    trigger = spec.get("trigger")
    if trigger == "any_result":
        return bool(calc.result) and not calc.missing_input_keys
    key = spec.get("discrepancy_key")
    if key is None:
        return False
    value = calc.result.get(key)
    if value is None:
        return False
    if spec.get("discrepancy_inverted"):
        return not value
    return bool(value)


def build_finding_summary(spec: dict, calc: CalculationResult) -> str:
    merged = {**calc.inputs, **calc.result}
    try:
        return spec["summary_template"].format(**merged)
    except KeyError:
        return spec["title"]


def specs_for_plan(analysis_plan: str) -> dict[str, dict]:
    if analysis_plan == "before_signing_review":
        return BEFORE_SIGNING_FINDING_SPECS
    return FINDING_SPECS
