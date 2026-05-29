from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

from api.schemas.export import ExportFindingItem, ExportSummary


@dataclass(frozen=True)
class DraftSection:
    heading: str
    body: str


@dataclass(frozen=True)
class DraftResult:
    case_id: str
    analysis_run_id: str
    generated_at: datetime
    sections: list[DraftSection]
    filtered_phrases: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class DraftServiceError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class EmptyExportError(DraftServiceError):
    pass


PRESCRIPTIVE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bdebe(n|ría|rían)?\b", re.IGNORECASE),
    re.compile(r"\btiene[ns]?\s+que\b", re.IGNORECASE),
    re.compile(r"\bes\s+obligatorio\b", re.IGNORECASE),
    re.compile(r"\brecomendamos\b", re.IGNORECASE),
    re.compile(r"\ble\s+aconsejamos\b", re.IGNORECASE),
    re.compile(r"\bgarantizamos\b", re.IGNORECASE),
    re.compile(r"\bsin\s+duda\b", re.IGNORECASE),
    re.compile(r"\bclaramente\s+ilegal\b", re.IGNORECASE),
    re.compile(r"\bcon\s+certeza\b", re.IGNORECASE),
    re.compile(r"\bfraudulento\b", re.IGNORECASE),
]

B4_REPLACEMENTS: dict[str, str] = {
    "debe": "podría considerar",
    "debería": "podría considerar",
    "deberían": "podrían considerar",
    "deben": "podrían considerar",
    "tiene que": "vale la pena revisar si",
    "tienen que": "vale la pena revisar si",
    "es obligatorio": "es un punto a confirmar",
    "recomendamos": "sugerimos revisar",
    "le aconsejamos": "vale la pena considerar",
    "garantizamos": "según los datos disponibles",
    "sin duda": "según los datos revisados",
    "claramente ilegal": "posible inconsistencia",
    "con certeza": "según lo observado",
    "fraudulento": "posible irregularidad",
}


def apply_b4_filter(text: str) -> tuple[str, list[str]]:
    filtered_phrases: list[str] = []
    result = text
    for pattern in PRESCRIPTIVE_PATTERNS:
        matches = pattern.findall(result)
        if matches:
            for match in matches:
                full_match = pattern.search(result)
                if full_match:
                    original = full_match.group(0)
                    replacement = _find_replacement(original)
                    if replacement:
                        filtered_phrases.append(original)
                        result = result[:full_match.start()] + replacement + result[full_match.end():]
    return result, filtered_phrases


def _find_replacement(phrase: str) -> str | None:
    lower = phrase.lower().strip()
    if lower in B4_REPLACEMENTS:
        return B4_REPLACEMENTS[lower]
    for key, value in B4_REPLACEMENTS.items():
        if lower.startswith(key):
            return value
    return None


def generate_draft(export_summary: ExportSummary) -> DraftResult:
    if not export_summary.findings:
        raise EmptyExportError("no findings to generate draft from")

    sections: list[DraftSection] = []
    all_filtered: list[str] = []
    warnings: list[str] = []

    sections.append(_build_header_section(export_summary))
    sections.append(_build_findings_section(export_summary.findings))

    evidence_section = _build_evidence_section(export_summary.findings)
    if evidence_section:
        sections.append(evidence_section)

    sections.append(_build_closing_section(export_summary))

    filtered_sections: list[DraftSection] = []
    for section in sections:
        filtered_body, phrases = apply_b4_filter(section.body)
        all_filtered.extend(phrases)
        filtered_sections.append(
            DraftSection(heading=section.heading, body=filtered_body)
        )

    if export_summary.rejected:
        warnings.append(
            f"{len(export_summary.rejected)} hallazgo(s) excluido(s) del borrador "
            f"por falta de respaldo o tipo no soportado"
        )

    return DraftResult(
        case_id=export_summary.case_id,
        analysis_run_id=export_summary.analysis_run_id,
        generated_at=datetime.now(timezone.utc),
        sections=filtered_sections,
        filtered_phrases=all_filtered,
        warnings=warnings,
    )


def _build_header_section(export: ExportSummary) -> DraftSection:
    severity_counts: dict[str, int] = {}
    for f in export.findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    severity_parts = []
    for sev in ("critical", "high", "medium", "low"):
        count = severity_counts.get(sev, 0)
        if count:
            severity_parts.append(f"{count} de severidad {sev}")

    body = (
        f"Estimado/a,\n\n"
        f"Tras revisar la documentación del crédito de consumo asociado a este caso, "
        f"se identificaron {len(export.findings)} punto(s) que vale la pena revisar"
    )
    if severity_parts:
        body += f" ({', '.join(severity_parts)})"
    body += ".\n\nA continuación se presenta un resumen de los hallazgos."

    return DraftSection(heading="Presentación", body=body)


def _build_findings_section(
    findings: list[ExportFindingItem],
) -> DraftSection:
    lines: list[str] = []
    for i, finding in enumerate(findings, 1):
        lines.append(f"{i}. {finding.title}")
        lines.append(f"   {finding.summary}")
        if finding.uncertainty_state == "missing_context":
            lines.append(
                "   Nota: este punto requiere información adicional para confirmar."
            )
        lines.append("")

    return DraftSection(
        heading="Hallazgos identificados",
        body="\n".join(lines).rstrip(),
    )


def _build_evidence_section(
    findings: list[ExportFindingItem],
) -> DraftSection | None:
    lines: list[str] = []
    for finding in findings:
        refs = [
            e for e in finding.evidence
            if e.evidence_type == "reference" and e.citation_label
        ]
        if refs:
            labels = ", ".join(r.citation_label for r in refs if r.citation_label)
            lines.append(f"- {finding.title}: {labels}")

    if not lines:
        return None

    return DraftSection(
        heading="Referencias normativas",
        body="\n".join(lines),
    )


def _build_closing_section(export: ExportSummary) -> DraftSection:
    body = (
        "Este resumen se basa en los datos extraídos y los cálculos determinísticos "
        "realizados sobre la documentación proporcionada. No constituye asesoría "
        "legal ni financiera. Se sugiere revisar los puntos señalados con la "
        "institución financiera correspondiente.\n\n"
        "Atentamente."
    )
    return DraftSection(heading="Cierre", body=body)
