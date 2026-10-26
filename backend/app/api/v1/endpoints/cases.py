"""Case Management Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import Case
from app.models.enums import CaseCategory, CaseStatus
from app.schemas.case import (
    CaseCreate,
    CaseListResponse,
    CaseResponse,
    CaseUpdate,
)
from app.services.case_service import (
    create_case,
    delete_case,
    get_case,
    list_cases,
    update_case,
)

router = APIRouter(prefix="/cases", tags=["Case Management"])


def _to_case_response(case: Case) -> CaseResponse:
    latest_v = None
    if case.analyses and case.analyses[0].verdict:
        latest_v = case.analyses[0].verdict.assessment.value

    return CaseResponse(
        id=case.id,
        proposition=case.proposition,
        category=case.category,
        status=case.status,
        notes=case.notes,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidence_count=len(case.evidence) if case.evidence else 0,
        analysis_count=len(case.analyses) if case.analyses else 0,
        latest_verdict=latest_v,
    )


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Case Docket",
)
def create_new_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
) -> CaseResponse:
    """Register a new case proposition into the judicial register."""
    try:
        case = create_case(db, case_in)
        return _to_case_response(case)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "",
    response_model=CaseListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Case Dockets",
)
def get_cases(
    category: Optional[CaseCategory] = Query(None, description="Filter by jurisdictional category"),
    status_filter: Optional[CaseStatus] = Query(None, alias="status", description="Filter by case status"),
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
) -> CaseListResponse:
    """Retrieve case dockets with optional filtering and pagination."""
    items, total = list_cases(
        db,
        category=category,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return CaseListResponse(
        items=[_to_case_response(c) for c in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Case Docket",
)
def get_single_case(
    case_id: str,
    db: Session = Depends(get_db),
) -> CaseResponse:
    """Retrieve a single case by its docket ID."""
    case = get_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case docket '{case_id}' was not found.",
        )
    return _to_case_response(case)


@router.patch(
    "/{case_id}",
    response_model=CaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Case Docket",
)
def update_case_endpoint(
    case_id: str,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
) -> CaseResponse:
    """Update editable fields of a case docket."""
    updated = update_case(db, case_id, case_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case docket '{case_id}' was not found.",
        )
    return _to_case_response(updated)


@router.delete(
    "/{case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Case Docket",
)
def delete_case_endpoint(
    case_id: str,
    db: Session = Depends(get_db),
) -> None:
    """Delete a case docket and its associated evidence records."""
    success = delete_case(db, case_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case docket '{case_id}' was not found.",
        )
