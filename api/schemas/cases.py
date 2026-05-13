from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

CaseStage = Literal["before_signing", "after_signing"]
DocumentType = Literal["consumer_credit"]
AnalysisPlan = Literal["before_signing_review", "after_signing_discrepancy"]


def default_analysis_plan(case_stage: CaseStage) -> AnalysisPlan:
    if case_stage == "before_signing":
        return "before_signing_review"
    return "after_signing_discrepancy"


class CaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    case_stage: CaseStage
    document_type: DocumentType = "consumer_credit"
    analysis_plan: AnalysisPlan | None = None
    institution_name: str = Field(min_length=1, max_length=160)
    requested_amount_clp: int | None = Field(default=None, gt=0)
    expected_term_months: int | None = Field(default=None, ge=1, le=600)

    @field_validator("title", "institution_name")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("required field cannot be blank")
        return stripped

    @model_validator(mode="after")
    def validate_stage_plan_match(self) -> CaseCreate:
        if self.analysis_plan is not None:
            expected = default_analysis_plan(self.case_stage)
            if self.analysis_plan != expected:
                raise ValueError(
                    f"analysis_plan '{self.analysis_plan}' does not match "
                    f"case_stage '{self.case_stage}'"
                )
        return self


class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_ref: str
    title: str
    case_stage: CaseStage
    document_type: DocumentType
    analysis_plan: AnalysisPlan
    institution_name: str
    requested_amount_clp: int | None
    expected_term_months: int | None
    created_at: datetime
    updated_at: datetime
