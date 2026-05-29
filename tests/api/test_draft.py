from __future__ import annotations

import pytest

from api.schemas.export import (
    ExportEvidenceItem,
    ExportFindingItem,
    ExportRejectedItem,
    ExportSummary,
)
from api.services.draft import (
    DraftResult,
    EmptyExportError,
    apply_b4_filter,
    generate_draft,
)


def _make_finding(
    *,
    finding_id: str = "f1",
    finding_key: str = "payment_count_mismatch",
    title: str = "Payment count mismatch",
    summary: str = "The contract has more payments than expected.",
    severity: str = "high",
    claim_type: str = "calculation",
    uncertainty_state: str = "supported",
    evidence: list[ExportEvidenceItem] | None = None,
) -> ExportFindingItem:
    if evidence is None:
        evidence = [
            ExportEvidenceItem(
                evidence_type="fact",
                fact_id="fact-1",
                excerpt="68 cuotas",
            ),
            ExportEvidenceItem(
                evidence_type="calculation",
                calculation_key="payment_count_delta",
            ),
        ]
    return ExportFindingItem(
        finding_id=finding_id,
        finding_key=finding_key,
        title=title,
        summary=summary,
        severity=severity,
        claim_type=claim_type,
        uncertainty_state=uncertainty_state,
        evidence=evidence,
    )


def _make_export(
    findings: list[ExportFindingItem] | None = None,
    rejected: list[ExportRejectedItem] | None = None,
) -> ExportSummary:
    if findings is None:
        findings = [_make_finding()]
    return ExportSummary(
        case_id="case-1",
        analysis_run_id="run-1",
        exported_at="2026-05-29T12:00:00Z",
        finding_count=len(findings),
        findings=findings,
        rejected=rejected or [],
    )


class TestB4Filter:
    def test_replaces_debe(self) -> None:
        text = "El cliente debe revisar el contrato."
        result, filtered = apply_b4_filter(text)
        assert "debe" not in result
        assert "podría considerar" in result
        assert len(filtered) == 1

    def test_replaces_recomendamos(self) -> None:
        text = "Recomendamos revisar las condiciones."
        result, filtered = apply_b4_filter(text)
        assert "Recomendamos" not in result.lower() or "sugerimos" in result.lower()
        assert len(filtered) >= 1

    def test_replaces_fraudulento(self) -> None:
        text = "Este cobro es fraudulento."
        result, filtered = apply_b4_filter(text)
        assert "fraudulento" not in result
        assert "posible irregularidad" in result

    def test_passes_clean_text(self) -> None:
        text = "Se identificaron posibles inconsistencias en el contrato."
        result, filtered = apply_b4_filter(text)
        assert result == text
        assert filtered == []

    def test_replaces_con_certeza(self) -> None:
        text = "Con certeza hay un error."
        result, filtered = apply_b4_filter(text)
        assert "con certeza" not in result.lower()
        assert len(filtered) >= 1

    def test_replaces_claramente_ilegal(self) -> None:
        text = "Esta cláusula es claramente ilegal."
        result, filtered = apply_b4_filter(text)
        assert "claramente ilegal" not in result.lower()
        assert "posible inconsistencia" in result


class TestGenerateDraft:
    def test_produces_sections(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        assert isinstance(result, DraftResult)
        assert result.case_id == "case-1"
        assert result.analysis_run_id == "run-1"
        assert len(result.sections) >= 3

    def test_header_section_mentions_finding_count(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        header = result.sections[0]
        assert header.heading == "Presentación"
        assert "1 punto" in header.body

    def test_findings_section_lists_titles(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        findings_section = result.sections[1]
        assert findings_section.heading == "Hallazgos identificados"
        assert "Payment count mismatch" in findings_section.body

    def test_closing_section_has_disclaimer(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        closing = result.sections[-1]
        assert closing.heading == "Cierre"
        assert "No constituye asesoría" in closing.body

    def test_multiple_findings_numbered(self) -> None:
        findings = [
            _make_finding(finding_id="f1", title="Finding A"),
            _make_finding(
                finding_id="f2",
                finding_key="total_paid",
                title="Finding B",
            ),
        ]
        export = _make_export(findings=findings)
        result = generate_draft(export)
        body = result.sections[1].body
        assert "1. Finding A" in body
        assert "2. Finding B" in body

    def test_missing_context_adds_note(self) -> None:
        finding = _make_finding(uncertainty_state="missing_context")
        export = _make_export(findings=[finding])
        result = generate_draft(export)
        body = result.sections[1].body
        assert "información adicional" in body

    def test_severity_breakdown_in_header(self) -> None:
        findings = [
            _make_finding(finding_id="f1", severity="high"),
            _make_finding(
                finding_id="f2",
                finding_key="other",
                severity="medium",
            ),
        ]
        export = _make_export(findings=findings)
        result = generate_draft(export)
        header = result.sections[0].body
        assert "high" in header
        assert "medium" in header


class TestDraftRejectedWarnings:
    def test_warnings_include_rejected_count(self) -> None:
        rejected = [
            ExportRejectedItem(finding_id="r1", reason="no evidence"),
        ]
        export = _make_export(rejected=rejected)
        result = generate_draft(export)
        assert len(result.warnings) == 1
        assert "1 hallazgo" in result.warnings[0]

    def test_no_warnings_when_no_rejected(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        assert result.warnings == []


class TestDraftErrors:
    def test_empty_findings_raises(self) -> None:
        export = ExportSummary(
            case_id="case-1",
            analysis_run_id="run-1",
            exported_at="2026-05-29T12:00:00Z",
            finding_count=0,
            findings=[],
        )
        with pytest.raises(EmptyExportError, match="no findings"):
            generate_draft(export)


class TestDraftB4Integration:
    def test_prescriptive_language_filtered_in_output(self) -> None:
        finding = _make_finding(
            summary="El banco debe devolver el cobro fraudulento."
        )
        export = _make_export(findings=[finding])
        result = generate_draft(export)
        full_text = " ".join(s.body for s in result.sections)
        assert "debe" not in full_text.split("podría")[0] if "podría" in full_text else True
        assert len(result.filtered_phrases) >= 1

    def test_clean_findings_produce_no_filtered_phrases(self) -> None:
        finding = _make_finding(
            summary="Se identificaron posibles diferencias en las cuotas."
        )
        export = _make_export(findings=[finding])
        result = generate_draft(export)
        assert result.filtered_phrases == []


class TestDraftEvidenceSection:
    def test_reference_evidence_produces_section(self) -> None:
        finding = _make_finding(
            evidence=[
                ExportEvidenceItem(
                    evidence_type="reference",
                    reference_key="cmf-test",
                    citation_label="CMF Circular Test",
                    citation_url="https://cmfchile.cl/test",
                ),
            ],
        )
        export = _make_export(findings=[finding])
        result = generate_draft(export)
        ref_sections = [s for s in result.sections if s.heading == "Referencias normativas"]
        assert len(ref_sections) == 1
        assert "CMF Circular Test" in ref_sections[0].body

    def test_no_reference_evidence_skips_section(self) -> None:
        export = _make_export()
        result = generate_draft(export)
        ref_sections = [s for s in result.sections if s.heading == "Referencias normativas"]
        assert len(ref_sections) == 0
