"""Analysis and Adversarial Reasoning Schemas
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AnalysisStatus, Polarity, VerdictAssessment


class AnalysisRunCreate(BaseModel):
    provider: Optional[str] = Field(
        default=None,
        description="Override reasoning provider ('local_heuristic', 'external', 'test').",
    )
    custom_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional provider configuration snapshot.",
    )


class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    polarity: Polarity
    title: str
    explanation: str
    confidence: float
    evidence_citations: List[str] = []
    created_at: datetime


class VerdictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    analysis_run_id: str
    case_id: str
    assessment: VerdictAssessment
    confidence_score: float
    reasoning_summary: str
    supporting_synthesis: str
    opposing_synthesis: str
    identified_contradictions: Optional[str] = None
    limitations: str
    created_at: datetime


class AnalysisRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    status: AnalysisStatus
    provider_used: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    findings: List[FindingResponse] = []
    verdict: Optional[VerdictResponse] = None


class AnalysisRunListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[AnalysisRunResponse]
    total: int
