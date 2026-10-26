"""Health and Readiness Probes
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthLiveResponse, HealthReadyResponse

router = APIRouter(tags=["Health & Readiness"])


@router.get(
    "/health/live",
    response_model=HealthLiveResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness Probe",
)
def liveness() -> HealthLiveResponse:
    """Verify that the FastAPI application is alive and accepting traffic."""
    return HealthLiveResponse(
        status="live",
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/health/ready",
    response_model=HealthReadyResponse,
    status_code=status.HTTP_200_OK,
    summary="Readiness Probe",
)
def readiness(db: Session = Depends(get_db)) -> HealthReadyResponse:
    """Verify that database connectivity and evidence storage are fully operational."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    storage_status = "accessible"
    try:
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        probe_file = settings.UPLOAD_DIR / ".ready_check"
        probe_file.write_text("ok", encoding="utf-8")
        probe_file.unlink(missing_ok=True)
    except Exception:
        storage_status = "error"

    overall_status = "ready" if db_status == "connected" and storage_status == "accessible" else "degraded"

    return HealthReadyResponse(
        status=overall_status,
        database=db_status,
        storage=storage_status,
        timestamp=datetime.now(timezone.utc),
    )
