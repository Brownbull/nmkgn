from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExportRequest(BaseModel):
    finding_ids: list[str] = Field(min_length=1)

    @field_validator("finding_ids")
    @classmethod
    def strip_and_deduplicate(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for item in value:
            stripped = item.strip()
            if not stripped:
                raise ValueError("finding_ids must not contain blank entries")
            if stripped not in seen:
                seen.add(stripped)
                result.append(stripped)
        return result


class ExportEvidenceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    evidence_type: str
    fact_id: str | None = None
    calculation_key: str | None = None
    reference_key: str | None = None
    citation_label: str | None = None
    citation_url: str | None = None
    excerpt: str | None = None


class ExportFindingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    finding_id: str
    finding_key: str
    title: str
    summary: str
    severity: str
    claim_type: str
    uncertainty_state: str
    confidence: float | None = None
    evidence: list[ExportEvidenceItem] = Field(default_factory=list)


class ExportRejectedItem(BaseModel):
    finding_id: str
    reason: str


class ExportSummary(BaseModel):
    case_id: str
    analysis_run_id: str
    exported_at: datetime
    finding_count: int
    findings: list[ExportFindingItem]
    rejected: list[ExportRejectedItem] = Field(default_factory=list)
