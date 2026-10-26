"""External LLM Provider Adapter (OpenAI / NVIDIA NIM / Gemini compatible)

Connects to OpenAI-compatible endpoints using server-side configuration.
Returns actionable errors when credentials or model services are unavailable.
"""

import json
from typing import Any, Dict, List
import httpx

from app.ai.base import (
    BaseReasoningProvider,
    FindingDraft,
    ReasoningContext,
    ReasoningResult,
    VerdictDraft,
)
from app.core.config import settings
from app.models.enums import Polarity, VerdictAssessment


class ProviderConfigurationError(RuntimeError):
    """Raised when an external model provider is missing configuration or credentials."""
    pass


SYSTEM_PROMPT = """You are the adversarial judicial reasoning engine of Holy Trial (The Obsidian Tribunal).
You examine claims against submitted evidentiary exhibits.

Given a proposition and attached evidence exhibits:
1. Examine each exhibit strictly based on its provided content.
2. Develop supporting arguments (Polarity: supporting) citing exact evidence IDs.
3. Develop opposing counter-arguments and failure modes (Polarity: opposing) citing exact evidence IDs.
4. Detect contradictions between exhibits (Polarity: contradiction) citing conflicting evidence IDs.
5. Identify epistemic uncertainty, gaps, or sample limitations (Polarity: uncertainty).
6. Formulate an honest, calibrated verdict assessment (SUBSTANTIATED, REFUTED, INCONCLUSIVE, or PLAUSIBLE_WITH_RESERVATIONS).

Return ONLY valid JSON matching this schema:
{
  "findings": [
    {
      "polarity": "supporting" | "opposing" | "contradiction" | "uncertainty",
      "title": "string",
      "explanation": "string",
      "confidence": float (0.0 to 1.0),
      "evidence_citations": ["evidence_id_1"]
    }
  ],
  "verdict": {
    "assessment": "SUBSTANTIATED" | "REFUTED" | "INCONCLUSIVE" | "PLAUSIBLE_WITH_RESERVATIONS",
    "confidence_score": float (0.0 to 1.0),
    "reasoning_summary": "string",
    "supporting_synthesis": "string",
    "opposing_synthesis": "string",
    "identified_contradictions": "string",
    "limitations": "string"
  }
}
"""


class ExternalModelProvider(BaseReasoningProvider):
    """OpenAI/NIM API-compatible external reasoning provider."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model_name: str | None = None,
        timeout_seconds: float | None = None,
    ):
        self.api_key = api_key or settings.REASONING_API_KEY
        self.base_url = (base_url or settings.REASONING_BASE_URL).rstrip("/")
        self.model_name = model_name or settings.REASONING_MODEL_NAME
        self.timeout_seconds = timeout_seconds or settings.REASONING_TIMEOUT_SECONDS

    async def analyze(self, ctx: ReasoningContext) -> ReasoningResult:
        if not self.api_key:
            raise ProviderConfigurationError(
                "External reasoning provider requested, but REASONING_API_KEY is not configured. "
                "Set REASONING_API_KEY in backend/.env or configure REASONING_PROVIDER='local_heuristic'."
            )

        evidence_payload = [
            {
                "id": ev.id,
                "title": ev.title,
                "provenance": ev.source,
                "content_excerpt": (ev.content[:1500] if ev.content else ""),
            }
            for ev in ctx.evidence
        ]

        user_content = json.dumps(
            {
                "case_id": ctx.case_id,
                "proposition": ctx.proposition,
                "category": ctx.category,
                "exhibits": evidence_payload,
            },
            indent=2,
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        body: Dict[str, Any] = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            try:
                resp = await client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPStatusError as e:
                raise ProviderConfigurationError(
                    f"External model provider HTTP error ({e.response.status_code}): {e.response.text}"
                ) from e
            except httpx.RequestError as e:
                raise ProviderConfigurationError(
                    f"External model provider connection failed: {str(e)}"
                ) from e

        try:
            content_str = data["choices"][0]["message"]["content"]
            parsed = json.loads(content_str)

            findings: List[FindingDraft] = []
            for f in parsed.get("findings", []):
                findings.append(
                    FindingDraft(
                        polarity=Polarity(f["polarity"]),
                        title=f["title"],
                        explanation=f["explanation"],
                        confidence=float(f.get("confidence", 0.7)),
                        evidence_citations=f.get("evidence_citations", []),
                    )
                )

            v_raw = parsed["verdict"]
            verdict = VerdictDraft(
                assessment=VerdictAssessment(v_raw["assessment"]),
                confidence_score=float(v_raw.get("confidence_score", 0.5)),
                reasoning_summary=v_raw["reasoning_summary"],
                supporting_synthesis=v_raw["supporting_synthesis"],
                opposing_synthesis=v_raw["opposing_synthesis"],
                identified_contradictions=v_raw.get("identified_contradictions"),
                limitations=v_raw["limitations"],
            )

            return ReasoningResult(findings=findings, verdict=verdict)

        except Exception as e:
            raise ProviderConfigurationError(
                f"Failed to parse structured reasoning output from external model: {str(e)}"
            ) from e
