"""Deterministic Test Provider for Automated Testing
"""

from typing import List
from app.ai.base import (
    BaseReasoningProvider,
    FindingDraft,
    ReasoningContext,
    ReasoningResult,
    VerdictDraft,
)
from app.models.enums import Polarity, VerdictAssessment


class TestReasoningProvider(BaseReasoningProvider):
    """Deterministic reasoning provider for testing execution pipelines."""

    async def analyze(self, ctx: ReasoningContext) -> ReasoningResult:
        evidence_ids = [ev.id for ev in ctx.evidence]

        findings = [
            FindingDraft(
                polarity=Polarity.SUPPORTING,
                title="Verified Test Corroboration",
                explanation=f"Corroborates claim '{ctx.proposition}' for testing.",
                confidence=0.88,
                evidence_citations=evidence_ids[:1],
            ),
            FindingDraft(
                polarity=Polarity.OPPOSING,
                title="Verified Test Counter-Argument",
                explanation="Examines potential caveats under test scrutiny.",
                confidence=0.65,
                evidence_citations=evidence_ids[1:2] if len(evidence_ids) > 1 else evidence_ids[:1],
            ),
        ]

        verdict = VerdictDraft(
            assessment=VerdictAssessment.PLAUSIBLE_WITH_RESERVATIONS,
            confidence_score=0.74,
            reasoning_summary="Test deterministic adjudication verdict.",
            supporting_synthesis="Primary exhibits demonstrate viability.",
            opposing_synthesis="Secondary caveats warrant controlled reservation.",
            identified_contradictions="Minor tension in performance limits.",
            limitations="Test fixture limits apply.",
        )

        return ReasoningResult(findings=findings, verdict=verdict)
