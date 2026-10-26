"""Reasoning and Analysis Orchestration Service

Coordinates the lifecycle of adversarial analyses:
1. Queuing analysis runs for cases.
2. Background task execution with persistent database state transitions.
3. Grounding findings with exact evidence citations.
4. Adjudication synthesis and verdict persistence.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.base import EvidenceItem, ReasoningContext
from app.ai.factory import get_reasoning_provider
from app.db.session import SessionLocal
from app.models.analysis import AnalysisRun, Finding, Verdict
from app.models.case import Case
from app.models.enums import AnalysisStatus, CaseStatus, EvidenceStatus
from app.models.evidence import Evidence
from app.schemas.analysis import AnalysisRunCreate

logger = logging.getLogger(__name__)


def create_analysis_run(
    db: Session, case_id: str, run_in: AnalysisRunCreate
) -> AnalysisRun:
    """Initialize and persist a queued AnalysisRun for a case."""
    case = db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()
    if not case:
        raise ValueError(f"Case with docket identifier '{case_id}' not found.")

    run = AnalysisRun(
        case_id=case_id,
        status=AnalysisStatus.QUEUED,
        provider_used=run_in.provider,
        config_snapshot=run_in.custom_config,
    )
    db.add(run)

    # Transition case lifecycle
    case.status = CaseStatus.ANALYZING
    db.flush()
    db.refresh(run)
    return run


async def execute_analysis_run_async(analysis_id: str) -> None:
    """Asynchronous background worker execution for an AnalysisRun.
    
    Opens an isolated database session to process the reasoning workflow
    safely across asynchronous boundaries.
    """
    db: Session = SessionLocal()
    try:
        run = db.execute(
            select(AnalysisRun).where(AnalysisRun.id == analysis_id)
        ).scalar_one_or_none()

        if not run:
            logger.error("AnalysisRun %s not found for execution", analysis_id)
            return

        if run.status in (AnalysisStatus.COMPLETED, AnalysisStatus.RUNNING):
            logger.info("AnalysisRun %s already in state %s; skipping duplicate execution", analysis_id, run.status)
            return

        run.status = AnalysisStatus.RUNNING
        run.started_at = datetime.now(timezone.utc)
        db.commit()

        # Load Case and its processed evidence
        case = db.execute(select(Case).where(Case.id == run.case_id)).scalar_one()
        evidence_records = (
            db.execute(
                select(Evidence).where(
                    Evidence.case_id == case.id,
                    Evidence.status == EvidenceStatus.PROCESSED,
                )
            )
            .scalars()
            .all()
        )

        ctx_evidence = [
            EvidenceItem(
                id=ev.id,
                title=ev.title,
                content=ev.content or "",
                source=ev.provenance or ev.source_url or ev.file_name or "Direct Submission",
                checksum=ev.checksum,
            )
            for ev in evidence_records
        ]

        ctx = ReasoningContext(
            case_id=case.id,
            proposition=case.proposition,
            category=case.category.value,
            evidence=ctx_evidence,
        )

        # Resolve provider
        provider = get_reasoning_provider(run.provider_used)
        result = await provider.analyze(ctx)

        # Persist findings
        for f_draft in result.findings:
            db_finding = Finding(
                analysis_run_id=run.id,
                case_id=case.id,
                polarity=f_draft.polarity,
                title=f_draft.title,
                explanation=f_draft.explanation,
                confidence=f_draft.confidence,
                evidence_citations=f_draft.evidence_citations,
            )
            db.add(db_finding)

        # Persist final judicial verdict
        v_draft = result.verdict
        db_verdict = Verdict(
            analysis_run_id=run.id,
            case_id=case.id,
            assessment=v_draft.assessment,
            confidence_score=v_draft.confidence_score,
            reasoning_summary=v_draft.reasoning_summary,
            supporting_synthesis=v_draft.supporting_synthesis,
            opposing_synthesis=v_draft.opposing_synthesis,
            identified_contradictions=v_draft.identified_contradictions,
            limitations=v_draft.limitations,
        )
        db.add(db_verdict)

        # Finalize status
        run.status = AnalysisStatus.COMPLETED
        run.completed_at = datetime.now(timezone.utc)
        case.status = CaseStatus.ADJUDICATED
        db.commit()
        logger.info("AnalysisRun %s completed successfully", analysis_id)

    except Exception as exc:
        logger.exception("AnalysisRun %s failed: %s", analysis_id, exc)
        db.rollback()
        # Record failure state
        failed_run = db.execute(
            select(AnalysisRun).where(AnalysisRun.id == analysis_id)
        ).scalar_one_or_none()
        if failed_run:
            failed_run.status = AnalysisStatus.FAILED
            failed_run.error_message = str(exc)
            failed_run.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


def get_analysis_run(db: Session, analysis_id: str) -> Optional[AnalysisRun]:
    """Retrieve an AnalysisRun with its findings and verdict."""
    return db.execute(
        select(AnalysisRun).where(AnalysisRun.id == analysis_id)
    ).scalar_one_or_none()


def list_analyses_for_case(db: Session, case_id: str) -> List[AnalysisRun]:
    """List all analysis runs associated with a case."""
    return list(
        db.execute(
            select(AnalysisRun)
            .where(AnalysisRun.case_id == case_id)
            .order_by(AnalysisRun.created_at.desc())
        )
        .scalars()
        .all()
    )
