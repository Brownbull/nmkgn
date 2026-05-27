"""Playwright evidence capture for Phase 3 — after-signing grouped layout.

Injects sessionStorage nav state + intercepts the analysis runs API
to return mock after-signing findings with all 3 groups (discrepancies,
escalation, missing_context). No database required.
"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

VITE_URL = "http://127.0.0.1:15179"
EVIDENCE_DIR = Path(__file__).parent
CASE_ID = "mock-case-001"

NAV_STATE = json.dumps({
    "step": "findings",
    "history": ["login", "case", "plan"],
    "docType": "bank",
    "docLabel": "Crédito bancario",
    "fileName": "contrato-firmado.pdf",
    "detectionScenario": "ready",
    "caseId": CASE_ID,
    "caseTitle": "Crédito Consumo – Banco Ejemplo",
    "caseStage": "after_signing",
    "analysisPlan": "after_signing_discrepancy",
    "mockAnalysisAcknowledged": True,
    "factReviewReady": True,
    "analysisRunId": "run-mock-001",
})

NOW = "2026-05-27T12:00:00Z"

MOCK_RUN = {
    "id": "run-mock-001",
    "case_id": CASE_ID,
    "owner_ref": "consumer_credit",
    "schema_version": "1.0",
    "status": "completed",
    "readiness_snapshot": {},
    "input_fact_ids": [],
    "agent_provider": "fake-provider",
    "model_name": None,
    "prompt_version": None,
    "prompt_tokens": None,
    "completion_tokens": None,
    "latency_ms": 342,
    "cost_usd": None,
    "error_message": None,
    "started_at": NOW,
    "completed_at": NOW,
    "created_at": NOW,
    "updated_at": NOW,
    "calculations": [
        {
            "id": "calc-001",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "calculation_key": "payment_count_check",
            "label": "Verificación cantidad de cuotas",
            "formula_version": "1.0",
            "input_fact_ids": [],
            "inputs": {"contract_payment_count": 68, "expected_payment_count": 60},
            "result": {"delta": 8, "match": False},
            "missing_input_keys": [],
            "created_at": NOW,
        },
        {
            "id": "calc-002",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "calculation_key": "total_paid_check",
            "label": "Verificación total pagado",
            "formula_version": "1.0",
            "input_fact_ids": [],
            "inputs": {"total_paid": 15200000, "expected_total": 12800000},
            "result": {"excess": 2400000, "ratio": 1.1875},
            "missing_input_keys": [],
            "created_at": NOW,
        },
    ],
    "findings": [
        {
            "id": "f-disc-001",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "payment_count_delta",
            "title": "Posible inconsistencia en cantidad de cuotas",
            "summary": "Se detectó una diferencia entre la cantidad de cuotas (68) y el plazo del crédito (60 meses). Diferencia: 8.",
            "severity": "high",
            "claim_type": "calculation",
            "uncertainty_state": "supported",
            "confidence": 0.95,
            "display_order": 1,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-001",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-disc-001",
                    "evidence_type": "calculation",
                    "fact_id": None,
                    "calculation_id": "calc-001",
                    "calculation_key": "payment_count_check",
                    "citation": None,
                    "excerpt": None,
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
                {
                    "id": "ev-002",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-disc-001",
                    "evidence_type": "reference",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": {
                        "label": "Ley 18.010 Art. 5 – Operaciones de crédito",
                        "url": "https://www.leychile.cl/Navegar?idNorma=29412",
                        "reference_key": "ley-chile-18010-operaciones-credito",
                        "retrieved_at": None,
                        "verified_at": None,
                    },
                    "excerpt": "Las obligaciones del deudor deben constar con claridad, incluyendo el número de cuotas.",
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-disc-002",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "total_paid_check",
            "title": "Posible inconsistencia en total pagado",
            "summary": "El total pagado ($15.200.000) excede el monto esperado ($12.800.000) en $2.400.000. Ratio: 1.19x.",
            "severity": "high",
            "claim_type": "calculation",
            "uncertainty_state": "supported",
            "confidence": 0.92,
            "display_order": 2,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-003",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-disc-002",
                    "evidence_type": "calculation",
                    "fact_id": None,
                    "calculation_id": "calc-002",
                    "calculation_key": "total_paid_check",
                    "citation": None,
                    "excerpt": None,
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
                {
                    "id": "ev-004",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-disc-002",
                    "evidence_type": "reference",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": {
                        "label": "Ley 19.496 Art. 17 – Protección al consumidor",
                        "url": "https://www.leychile.cl/Navegar?idNorma=61438",
                        "reference_key": "ley-chile-19496-proteccion-consumidor",
                        "retrieved_at": None,
                        "verified_at": None,
                    },
                    "excerpt": "El proveedor debe informar al consumidor el precio total del crédito.",
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-disc-003",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "term_signal",
            "title": "Señal de plazo inusual",
            "summary": "El plazo del crédito (68 meses) no corresponde a un plazo estándar del mercado. Los plazos habituales son 12, 24, 36, 48 o 60 meses.",
            "severity": "medium",
            "claim_type": "fact",
            "uncertainty_state": "uncertain",
            "confidence": 0.78,
            "display_order": 3,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-005",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-disc-003",
                    "evidence_type": "fact",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": None,
                    "excerpt": "Plazo contractual: 68 meses",
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-esc-001",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "as_question_sernac_complaint",
            "title": "Reclamo ante SERNAC",
            "summary": "Puede presentar un reclamo formal ante SERNAC si considera que las condiciones del crédito no fueron informadas correctamente.",
            "severity": "medium",
            "claim_type": "reference",
            "uncertainty_state": "supported",
            "confidence": None,
            "display_order": 10,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-006",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-esc-001",
                    "evidence_type": "reference",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": {
                        "label": "SERNAC – Derechos del consumidor financiero",
                        "url": "https://www.sernac.cl/portal/619/w3-propertyvalue-20962.html",
                        "reference_key": "sernac-derechos-credito-consumo",
                        "retrieved_at": None,
                        "verified_at": None,
                    },
                    "excerpt": None,
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-esc-002",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "as_question_detailed_statement",
            "title": "Solicitar estado de cuenta detallado",
            "summary": "Solicite un estado de cuenta detallado con desglose de capital, intereses y seguros por cada cuota pagada.",
            "severity": "medium",
            "claim_type": "reference",
            "uncertainty_state": "supported",
            "confidence": None,
            "display_order": 11,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-007",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-esc-002",
                    "evidence_type": "reference",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": {
                        "label": "Ley 18.010 Art. 5 – Operaciones de crédito",
                        "url": "https://www.leychile.cl/Navegar?idNorma=29412",
                        "reference_key": "ley-chile-18010-operaciones-credito",
                        "retrieved_at": None,
                        "verified_at": None,
                    },
                    "excerpt": None,
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-esc-003",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "as_question_prepayment_rights",
            "title": "Derechos de prepago",
            "summary": "La Ley 18.010 le permite prepagar total o parcialmente el crédito en cualquier momento, reduciendo los intereses futuros.",
            "severity": "medium",
            "claim_type": "reference",
            "uncertainty_state": "supported",
            "confidence": None,
            "display_order": 12,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [
                {
                    "id": "ev-008",
                    "analysis_run_id": "run-mock-001",
                    "case_id": CASE_ID,
                    "finding_id": "f-esc-003",
                    "evidence_type": "reference",
                    "fact_id": None,
                    "calculation_id": None,
                    "calculation_key": None,
                    "citation": {
                        "label": "Ley 18.010 Art. 10 – Prepago",
                        "url": "https://www.leychile.cl/Navegar?idNorma=29412",
                        "reference_key": "ley-chile-18010-operaciones-credito",
                        "retrieved_at": None,
                        "verified_at": None,
                    },
                    "excerpt": None,
                    "inference_summary": None,
                    "model_name": None,
                    "schema_version": None,
                    "created_at": NOW,
                },
            ],
        },
        {
            "id": "f-miss-001",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "as_missing_simulation",
            "title": "Simulación de crédito no adjunta",
            "summary": "No se encontró una simulación de crédito para comparar con las condiciones del contrato firmado. Adjunte la simulación original para habilitar la comparación.",
            "severity": "medium",
            "claim_type": "fact",
            "uncertainty_state": "missing_context",
            "confidence": None,
            "display_order": 20,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [],
        },
        {
            "id": "f-miss-002",
            "analysis_run_id": "run-mock-001",
            "case_id": CASE_ID,
            "owner_ref": "consumer_credit",
            "finding_key": "as_missing_offer",
            "title": "Oferta comercial no adjunta",
            "summary": "No se encontró la oferta comercial original. Adjunte la oferta para comparar con las condiciones firmadas.",
            "severity": "medium",
            "claim_type": "fact",
            "uncertainty_state": "missing_context",
            "confidence": None,
            "display_order": 21,
            "created_at": NOW,
            "updated_at": NOW,
            "evidence": [],
        },
    ],
    "unsupported_outputs": [],
}


def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        page.route(
            f"**/api/cases/{CASE_ID}/analysis/runs",
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([MOCK_RUN]),
            ),
        )

        page.goto(VITE_URL, wait_until="domcontentloaded")
        page.evaluate(
            """(state) => sessionStorage.setItem('letra-proto-state-v1', state)""",
            NAV_STATE,
        )
        page.reload(wait_until="networkidle")

        page.wait_for_timeout(1500)

        # Screenshot 1: Full after-signing grouped layout
        page.screenshot(
            path=str(EVIDENCE_DIR / "03-after-signing-grouped-layout.png"),
            full_page=True,
        )
        print("✓ 03-after-signing-grouped-layout.png")

        # Scroll to discrepancies section
        discrepancy_heading = page.locator("text=Posibles inconsistencias").first
        if discrepancy_heading.is_visible():
            discrepancy_heading.scroll_into_view_if_needed()
            page.wait_for_timeout(300)
            page.screenshot(
                path=str(EVIDENCE_DIR / "04-discrepancies-section.png"),
                full_page=False,
            )
            print("✓ 04-discrepancies-section.png")

        # Click first discrepancy card to expand evidence chain
        first_card = page.locator("text=Posible inconsistencia en cantidad de cuotas").first
        if first_card.is_visible():
            first_card.click()
            page.wait_for_timeout(500)
            page.screenshot(
                path=str(EVIDENCE_DIR / "05-discrepancy-expanded-evidence.png"),
                full_page=False,
            )
            print("✓ 05-discrepancy-expanded-evidence.png")

        # Scroll to escalation section
        escalation_heading = page.locator("text=Vias de consulta").first
        if escalation_heading.is_visible():
            escalation_heading.scroll_into_view_if_needed()
            page.wait_for_timeout(300)
            page.screenshot(
                path=str(EVIDENCE_DIR / "06-escalation-section.png"),
                full_page=False,
            )
            print("✓ 06-escalation-section.png")

        # Click first escalation card to expand
        esc_card = page.locator("text=Reclamo ante SERNAC").first
        if esc_card.is_visible():
            esc_card.click()
            page.wait_for_timeout(500)
            page.screenshot(
                path=str(EVIDENCE_DIR / "07-escalation-expanded.png"),
                full_page=False,
            )
            print("✓ 07-escalation-expanded.png")

        # Scroll to missing context section
        missing_heading = page.locator("text=Documentos de comparacion pendientes").first
        if missing_heading.is_visible():
            missing_heading.scroll_into_view_if_needed()
            page.wait_for_timeout(300)
            page.screenshot(
                path=str(EVIDENCE_DIR / "08-missing-context-section.png"),
                full_page=False,
            )
            print("✓ 08-missing-context-section.png")

        browser.close()
        print("\nAll after-signing evidence screenshots captured.")


if __name__ == "__main__":
    capture()
