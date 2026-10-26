"""Adversarial Analysis Endpoints
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analysis import (
    AnalysisRunCreate,
    AnalysisRunListResponse,
    AnalysisRunResponse,
    FindingResponse,
    VerdictResponse,
)
from app.services.case_service import get_case
from app.services.reasoning_service import (
    create_analysis_run,
    execute_analysis_run_async,
    get_analysis_run,
    list_analyses_for_case,
)

router = APIRouter(tags=["Adversarial Analysis"])


def _to_analysis_response(run) -> AnalysisRunResponse:
    findings = [
        FindingResponse(
            id=f.id,
            analysis_run_id=f.analysis_run_id,
            case_id=f.case_id,
            polarity=f.polarity,
            title=f.title,
            explanation=f.explanation,
            confidence=f.confidence,
            evidence_citations=f.evidence_citations or [],
            created_at=f.created_at,
        )
        for f in (run.findings or [])
    ]

    verdict_resp = None
    if run.verdict:
        v = run.verdict
        verdict_resp = VerdictResponse(
            id=v.id,
            analysis_run_id=v.analysis_run_id,
            case_id=v.case_id,
            assessment=v.assessment,
            confidence_score=v.confidence_score,
            reasoning_summary=v.reasoning_summary,
            supporting_synthesis=v.supporting_synthesis,
            opposing_synthesis=v.opposing_synthesis,
            identified_contradictions=v.identified_contradictions,
            limitations=v.limitations,
            created_at=v.created_at,
        )

    return AnalysisRunResponse(
        id=run.id,
        case_id=run.case_id,
        status=run.status,
        provider_used=run.provider_used,
        started_at=run.started_at,
        completed_at=run.completed_at,
        error_message=run.error_message,
        created_at=run.created_at,
        findings=findings,
        verdict=verdict_resp,
    )


@router.post(
    "/cases/{case_id}/analyses",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Initiate Adversarial Analysis Run",
)
def initiate_analysis(
    case_id: str,
    run_in: AnalysisRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    """Initiate an adversarial scrutiny run against the case and its evidence.
    
    Returns 202 Accepted with a tracking identifier. Processing proceeds
    asynchronously in the background and can be polled via GET /api/v1/analyses/{analysis_id}.
    """
    try:
        run = create_analysis_run(db, case_id, run_in)
        db.commit()
        background_tasks.add_task(execute_analysis_run_async, run.id)
        return _to_analysis_response(run)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get(
    "/analyses/{analysis_id}",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Analysis Run Status and Findings",
)
def get_single_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    """Retrieve an analysis run, its current status, findings, and judicial verdict."""
    run = get_analysis_run(db, analysis_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run '{analysis_id}' was not found.",
        )
    return _to_analysis_response(run)


@router.get(
    "/cases/{case_id}/analyses",
    response_model=AnalysisRunListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Analysis Runs for Case",
)
def get_case_analyses(
    case_id: str,
    db: Session = Depends(get_db),
) -> AnalysisRunListResponse:
    """List all analysis runs conducted for a specific case docket."""
    case = get_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case docket '{case_id}' was not found.",
        )
    runs = list_analyses_for_case(db, case_id)
    return AnalysisRunListResponse(
        items=[_to_analysis_response(r) for r in runs],
        total=len(runs),
    )
