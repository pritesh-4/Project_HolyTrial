"""Case Management Application Service
"""

from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.case import Case, generate_case_id
from app.models.enums import CaseCategory, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate


def create_case(db: Session, case_in: CaseCreate) -> Case:
    """Create and persist a new Case docket."""
    # Validate uniqueness if custom case_id was provided
    case_id = case_in.case_id.strip() if case_in.case_id else generate_case_id()
    existing = db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()
    if existing:
        raise ValueError(f"Case with docket identifier '{case_id}' already exists.")

    db_case = Case(
        id=case_id,
        proposition=case_in.proposition,
        category=case_in.category,
        status=CaseStatus.AWAITING_EVIDENCE,
        notes=case_in.notes,
    )
    db.add(db_case)
    db.flush()
    db.refresh(db_case)
    return db_case


def get_case(db: Session, case_id: str) -> Optional[Case]:
    """Retrieve a single case by its docket identifier."""
    return db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()


def list_cases(
    db: Session,
    category: Optional[CaseCategory] = None,
    status: Optional[CaseStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Case], int]:
    """List cases with optional category and status filtering, plus pagination."""
    query = select(Case)
    count_query = select(func.count(Case.id))

    if category:
        query = query.where(Case.category == category)
        count_query = count_query.where(Case.category == category)

    if status:
        query = query.where(Case.status == status)
        count_query = count_query.where(Case.status == status)

    total = db.execute(count_query).scalar_one()
    items = (
        db.execute(
            query.order_by(Case.created_at.desc()).offset(offset).limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total


def update_case(db: Session, case_id: str, case_in: CaseUpdate) -> Optional[Case]:
    """Update editable fields of an existing case."""
    db_case = get_case(db, case_id)
    if not db_case:
        return None

    if case_in.category is not None:
        db_case.category = case_in.category
    if case_in.notes is not None:
        db_case.notes = case_in.notes
    if case_in.status is not None:
        db_case.status = case_in.status

    db.flush()
    db.refresh(db_case)
    return db_case


def delete_case(db: Session, case_id: str) -> bool:
    """Delete a case docket and cascade-delete its evidence and analyses."""
    db_case = get_case(db, case_id)
    if not db_case:
        return False

    db.delete(db_case)
    db.flush()
    return True
