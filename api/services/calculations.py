from __future__ import annotations

from dataclasses import dataclass
from typing import Any


FORMULA_VERSION = "consumer_credit_calculations.v1"


@dataclass(frozen=True)
class CalculationResult:
    calculation_key: str
    label: str
    inputs: dict[str, Any]
    result: dict[str, Any]
    input_fact_ids: list[str]
    missing_input_keys: list[str]


@dataclass(frozen=True)
class FactInput:
    fact_id: str
    fact_key: str
    value_number: float | None
    value_text: str | None


def _num(facts: dict[str, list[FactInput]], key: str) -> tuple[float | None, str | None]:
    entries = facts.get(key, [])
    if not entries:
        return None, None
    first = entries[0]
    return first.value_number, first.fact_id


def _all_entries(facts: dict[str, list[FactInput]], key: str) -> list[FactInput]:
    return facts.get(key, [])


def calc_payment_count_delta(facts: dict[str, list[FactInput]]) -> CalculationResult:
    contract_count, count_id = _num(facts, "payment_count")
    term_months, term_id = _num(facts, "term_months")

    input_fact_ids = [fid for fid in [count_id, term_id] if fid]
    missing = []
    if contract_count is None:
        missing.append("payment_count")
    if term_months is None:
        missing.append("term_months")

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    if contract_count is not None:
        inputs["contract_payment_count"] = int(contract_count)
    if term_months is not None:
        inputs["expected_payment_count"] = int(term_months)

    if contract_count is not None and term_months is not None:
        delta = int(contract_count) - int(term_months)
        result["delta"] = delta
        result["has_discrepancy"] = delta != 0

    return CalculationResult(
        calculation_key="payment_count_delta",
        label="Diferencia en cantidad de cuotas",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_total_paid(facts: dict[str, list[FactInput]]) -> CalculationResult:
    installment, inst_id = _num(facts, "installment_amount")
    count, count_id = _num(facts, "payment_count")
    total_cost, cost_id = _num(facts, "total_cost")

    input_fact_ids = [fid for fid in [inst_id, count_id, cost_id] if fid]
    missing = []
    if installment is None:
        missing.append("installment_amount")
    if count is None:
        missing.append("payment_count")
    if total_cost is None:
        missing.append("total_cost")

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    if installment is not None:
        inputs["installment_amount"] = installment
    if count is not None:
        inputs["payment_count"] = int(count)
    if total_cost is not None:
        inputs["stated_total_cost"] = total_cost

    if installment is not None and count is not None:
        computed = round(installment * int(count), 2)
        inputs["computed_total_paid"] = computed
        result["computed_total_paid"] = computed
        if total_cost is not None:
            diff = round(computed - total_cost, 2)
            result["difference"] = diff
            result["has_discrepancy"] = abs(diff) > 0.01

    return CalculationResult(
        calculation_key="total_paid_check",
        label="Verificacion del total pagado",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_installment_signal(facts: dict[str, list[FactInput]]) -> CalculationResult:
    principal, princ_id = _num(facts, "principal_amount")
    count, count_id = _num(facts, "payment_count")
    installment, inst_id = _num(facts, "installment_amount")

    input_fact_ids = [fid for fid in [princ_id, count_id, inst_id] if fid]
    missing = []
    if principal is None:
        missing.append("principal_amount")
    if count is None:
        missing.append("payment_count")
    if installment is None:
        missing.append("installment_amount")

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    if principal is not None:
        inputs["principal_amount"] = principal
    if count is not None:
        inputs["payment_count"] = int(count)
    if installment is not None:
        inputs["stated_installment"] = installment

    if principal is not None and count is not None and int(count) > 0:
        min_installment = round(principal / int(count), 2)
        result["min_installment_no_interest"] = min_installment
        if installment is not None:
            ratio = round(installment / min_installment, 4) if min_installment > 0 else None
            result["ratio_to_minimum"] = ratio

    return CalculationResult(
        calculation_key="installment_signal",
        label="Senal de cuota vs capital",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_term_signal(facts: dict[str, list[FactInput]]) -> CalculationResult:
    term, term_id = _num(facts, "term_months")
    count, count_id = _num(facts, "payment_count")

    input_fact_ids = [fid for fid in [term_id, count_id] if fid]
    missing = []
    if term is None:
        missing.append("term_months")
    if count is None:
        missing.append("payment_count")

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    if term is not None:
        inputs["term_months"] = int(term)
    if count is not None:
        inputs["payment_count"] = int(count)

    if term is not None and count is not None:
        consistent = int(term) == int(count)
        result["term_matches_count"] = consistent

    return CalculationResult(
        calculation_key="term_signal",
        label="Consistencia plazo vs cuotas",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_rate_cae_signal(facts: dict[str, list[FactInput]]) -> CalculationResult:
    rate, rate_id = _num(facts, "interest_rate")
    cae, cae_id = _num(facts, "cae")

    input_fact_ids = [fid for fid in [rate_id, cae_id] if fid]
    missing = []
    if rate is None:
        missing.append("interest_rate")
    if cae is None:
        missing.append("cae")

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    if rate is not None:
        inputs["interest_rate"] = rate
    if cae is not None:
        inputs["cae"] = cae

    if rate is not None and cae is not None:
        result["cae_exceeds_rate"] = cae > rate
        result["spread"] = round(cae - rate, 4)

    return CalculationResult(
        calculation_key="rate_cae_signal",
        label="Senal tasa vs CAE",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_fee_sum(facts: dict[str, list[FactInput]]) -> CalculationResult:
    fee_entries = _all_entries(facts, "fee")
    input_fact_ids = [e.fact_id for e in fee_entries]
    missing: list[str] = [] if fee_entries else ["fee"]

    inputs: dict[str, Any] = {}
    result: dict[str, Any] = {}

    fees = []
    for entry in fee_entries:
        if entry.value_number is not None:
            fees.append(entry.value_number)

    inputs["fee_count"] = len(fee_entries)
    inputs["fee_amounts"] = fees

    if fees:
        total = round(sum(fees), 2)
        result["total_fees"] = total
        result["fee_count"] = len(fees)

    return CalculationResult(
        calculation_key="fee_sum",
        label="Suma de comisiones y cargos",
        inputs=inputs,
        result=result,
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_insurance_signals(facts: dict[str, list[FactInput]]) -> CalculationResult:
    entries = _all_entries(facts, "insurance")
    input_fact_ids = [e.fact_id for e in entries]
    missing: list[str] = [] if entries else ["insurance"]

    texts = [e.value_text for e in entries if e.value_text]

    return CalculationResult(
        calculation_key="insurance_signals",
        label="Seguros asociados detectados",
        inputs={"insurance_count": len(entries), "insurance_texts": texts},
        result={"detected_count": len(entries), "texts": texts},
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


def calc_linked_product_signals(facts: dict[str, list[FactInput]]) -> CalculationResult:
    entries = _all_entries(facts, "linked_product")
    input_fact_ids = [e.fact_id for e in entries]
    missing: list[str] = [] if entries else ["linked_product"]

    texts = [e.value_text for e in entries if e.value_text]

    return CalculationResult(
        calculation_key="linked_product_signals",
        label="Productos vinculados detectados",
        inputs={"linked_product_count": len(entries), "linked_product_texts": texts},
        result={"detected_count": len(entries), "texts": texts},
        input_fact_ids=input_fact_ids,
        missing_input_keys=missing,
    )


ALL_CALCULATIONS = (
    calc_payment_count_delta,
    calc_total_paid,
    calc_installment_signal,
    calc_term_signal,
    calc_rate_cae_signal,
    calc_fee_sum,
    calc_insurance_signals,
    calc_linked_product_signals,
)


def run_all_calculations(
    facts: dict[str, list[FactInput]],
) -> list[CalculationResult]:
    return [calc(facts) for calc in ALL_CALCULATIONS]
