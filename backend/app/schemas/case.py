"""Case Schemas and Input Validation

Enforces the 15-400 character proposition constraint and declarative form rule.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import CaseCategory, CaseStatus


class CaseCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    proposition: str = Field(
        ...,
        min_length=15,
        max_length=400,
        description="The declarative claim or hypothesis under judicial examination.",
        examples=["Autonomous AI agents will replace 30% of software testing workflows by 2027."],
    )
    category: CaseCategory = Field(
        default=CaseCategory.TECH_AI,
        description="Jurisdictional domain of the inquiry.",
    )
    case_id: Optional[str] = Field(
        default=None,
        description="Optional custom docket identifier (e.g., CASE-2026-ABCD).",
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Additional context, scope limitations, or background notes.",
    )

    @field_validator("proposition")
    @classmethod
    def validate_proposition(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 15:
            raise ValueError("Proposition must contain at least 15 characters.")
        if len(trimmed) > 400:
            raise ValueError("Proposition cannot exceed 400 characters.")
        if trimmed.endswith("?"):
            raise ValueError(
                "Judicial rule: The proposition must be formulated as a declarative assertion, not an interrogative question."
            )
        return trimmed


class CaseUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: Optional[CaseCategory] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[CaseStatus] = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    proposition: str
    category: CaseCategory
    status: CaseStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    analysis_count: int = 0
    latest_verdict: Optional[str] = None


class CaseListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[CaseResponse]
    total: int
    limit: int
    offset: int
