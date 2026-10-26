"""Reasoning Provider Factory

Resolves appropriate provider based on application configuration or request overrides.
"""

from typing import Optional
from app.ai.base import BaseReasoningProvider
from app.ai.adapters.external_model import ExternalModelProvider
from app.ai.adapters.local_heuristic import LocalHeuristicProvider
from app.ai.adapters.test_provider import TestReasoningProvider
from app.core.config import settings


def get_reasoning_provider(override_name: Optional[str] = None) -> BaseReasoningProvider:
    """Resolve and instantiate the configured reasoning engine."""
    provider_name = (override_name or settings.REASONING_PROVIDER).lower().strip()

    if provider_name in ("test", "test_provider"):
        return TestReasoningProvider()
    elif provider_name in ("external", "llm", "nvidia", "openai"):
        return ExternalModelProvider()
    elif provider_name in ("local_heuristic", "local", "heuristic"):
        return LocalHeuristicProvider()
    else:
        raise ValueError(
            f"Unknown reasoning provider '{provider_name}'. "
            f"Supported providers: 'local_heuristic', 'external', 'test'."
        )
