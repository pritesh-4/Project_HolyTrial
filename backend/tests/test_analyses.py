"""Adversarial Reasoning and Analysis Lifecycle Tests
"""

import pytest
from app.ai.adapters.external_model import ExternalModelProvider, ProviderConfigurationError
from app.ai.base import ReasoningContext
from app.services.reasoning_service import execute_analysis_run_async


@pytest.mark.asyncio
async def test_analysis_run_without_evidence_generates_uncertainty(client, db_session):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Synthetic data fine-tuning improves mathematical reasoning without degradation.",
            "category": "Technology & AI",
        },
    )
    case_id = create_resp.json()["id"]

    run_resp = client.post(
        f"/api/v1/cases/{case_id}/analyses",
        json={"provider": "local_heuristic"},
    )
    assert run_resp.status_code == 202
    run_id = run_resp.json()["id"]

    # Fetch completed analysis (executed by TestClient BackgroundTasks)
    get_resp = client.get(f"/api/v1/analyses/{run_id}")
    assert get_resp.status_code == 200
    run_data = get_resp.json()
    assert run_data["status"] == "completed"

    # Confirm uncertainty finding and inconclusive assessment
    findings = run_data["findings"]
    assert len(findings) >= 1
    assert any(f["polarity"] == "uncertainty" for f in findings)

    verdict = run_data["verdict"]
    assert verdict is not None
    assert verdict["assessment"] == "INCONCLUSIVE"
    assert verdict["confidence_score"] <= 0.20
    assert "no attached exhibits" in findings[0]["explanation"].lower() or "insufficient" in verdict["reasoning_summary"].lower()


@pytest.mark.asyncio
async def test_adversarial_analysis_with_competing_evidence(client, db_session):
    # 1. Formulate proposition
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Modern retrieval augmented generation completely eliminates LLM hallucinations in enterprise search.",
            "category": "Technology & AI",
        },
    )
    case_id = create_resp.json()["id"]

    # 2. Attach Corroborating Evidence
    ev1_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/text",
        json={
            "title": "Enterprise RAG Benchmark 2026",
            "content": (
                "Empirical retrieval tests confirm significant performance. "
                "The audited vector pipeline validates that grounded documents "
                "demonstrate substantial increase in factual precision across document search."
            ),
            "provenance": "MIT Enterprise NLP Group",
        },
    )
    ev1_id = ev1_resp.json()["id"]

    # 3. Attach Opposing / Scrutiny Evidence
    ev2_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/text",
        json={
            "title": "Retrieval Noise and Residual Failure Report",
            "content": (
                "Empirical scrutiny reveals severe limitations and flaws. "
                "Retrieval pipelines fail to eliminate hallucinations when source context is contradictory. "
                "Out of 5,000 queries, hallucination risks persisted with invalid citations and failure modes."
            ),
            "provenance": "Carnegie Mellon AI Safety Lab",
        },
    )
    ev2_id = ev2_resp.json()["id"]

    # 4. Initiate Adversarial Analysis
    run_resp = client.post(
        f"/api/v1/cases/{case_id}/analyses",
        json={"provider": "local_heuristic"},
    )
    assert run_resp.status_code == 202
    run_id = run_resp.json()["id"]

    # 5. Retrieve analysis results and inspect findings (executed by TestClient BackgroundTasks)
    get_resp = client.get(f"/api/v1/analyses/{run_id}")
    assert get_resp.status_code == 200
    run_data = get_resp.json()
    assert run_data["status"] == "completed"

    findings = run_data["findings"]
    assert len(findings) >= 2

    # Verify both supporting and opposing polarities exist
    polarities = [f["polarity"] for f in findings]
    assert "supporting" in polarities
    assert "opposing" in polarities

    # Verify every finding cites actual evidence IDs
    for f in findings:
        if f["polarity"] in ("supporting", "opposing"):
            assert len(f["evidence_citations"]) >= 1
            assert any(cid in (ev1_id, ev2_id) for cid in f["evidence_citations"])

    # Verify Verdict details
    verdict = run_data["verdict"]
    assert verdict is not None
    assert verdict["assessment"] in ("PLAUSIBLE_WITH_RESERVATIONS", "REFUTED", "INCONCLUSIVE")
    assert verdict["confidence_score"] > 0.0
    assert len(verdict["reasoning_summary"]) > 10
    assert len(verdict["limitations"]) > 10

    # Verify Case Docket status updated to adjudicated
    case_resp = client.get(f"/api/v1/cases/{case_id}")
    assert case_resp.json()["status"] == "adjudicated"
    assert case_resp.json()["latest_verdict"] == verdict["assessment"]


@pytest.mark.asyncio
async def test_external_provider_without_api_key_raises_honest_error():
    provider = ExternalModelProvider(api_key=None)
    ctx = ReasoningContext(
        case_id="CASE-TEST-1234",
        proposition="Test proposition for external credential validation.",
        category="Technology & AI",
        evidence=[],
    )
    with pytest.raises(ProviderConfigurationError) as exc_info:
        await provider.analyze(ctx)

    assert "REASONING_API_KEY is not configured" in str(exc_info.value)
