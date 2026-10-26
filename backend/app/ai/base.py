"""Base Types and Provider Interface for Adversarial Reasoning
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional

from app.models.enums import Polarity, VerdictAssessment


@dataclass
class EvidenceItem:
    id: str
    title: str
    content: str
    source: str
    checksum: Optional[str] = None


@dataclass
class ReasoningContext:
    case_id: str
    proposition: str
    category: str
    evidence: List[EvidenceItem] = field(default_factory=list)


@dataclass
class FindingDraft:
    polarity: Polarity
    title: str
    explanation: str
    confidence: float
    evidence_citations: List[str] = field(default_factory=list)


@dataclass
class VerdictDraft:
    assessment: VerdictAssessment
    confidence_score: float
    reasoning_summary: str
    supporting_synthesis: str
    opposing_synthesis: str
    limitations: str
    identified_contradictions: Optional[str] = None


@dataclass
class ReasoningResult:
    findings: List[FindingDraft]
    verdict: VerdictDraft


class BaseReasoningProvider(ABC):
    """Abstract interface for adversarial reasoning engines."""

    @abstractmethod
    async def analyze(self, ctx: ReasoningContext) -> ReasoningResult:
        """Execute adversarial examination of proposition against evidence."""
        pass
