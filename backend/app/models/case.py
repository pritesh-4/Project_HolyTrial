"""Case Domain Model
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SQLEnum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CaseCategory, CaseStatus

if TYPE_CHECKING:
    from app.models.evidence import Evidence
    from app.models.analysis import AnalysisRun


def generate_case_id() -> str:
    """Generate consistent case docket ID matching format CASE-YYYY-XXXX."""
    year = datetime.now(timezone.utc).year
    rand_suffix = uuid.uuid4().hex[:6].upper()
    return f"CASE-{year}-{rand_suffix}"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_case_id,
        index=True,
    )
    proposition: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    category: Mapped[CaseCategory] = mapped_column(
        SQLEnum(CaseCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=CaseCategory.TECH_AI,
    )
    status: Mapped[CaseStatus] = mapped_column(
        SQLEnum(CaseStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=CaseStatus.AWAITING_EVIDENCE,
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    evidence: Mapped[List["Evidence"]] = relationship(
        "Evidence",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Evidence.created_at",
    )
    analyses: Mapped[List["AnalysisRun"]] = relationship(
        "AnalysisRun",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="AnalysisRun.created_at.desc()",
    )
