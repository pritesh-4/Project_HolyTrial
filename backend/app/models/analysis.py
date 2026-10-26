"""Adversarial Analysis Domain Models

Includes:
- AnalysisRun: Lifecycle and execution tracking of an adversarial scrutiny pass.
- Finding: Granular arguments (supporting, opposing, contradictions, uncertainties) referencing evidence.
- Verdict: Final judicial synthesis, calibrated confidence, limitations, and reasoning summary.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AnalysisStatus, Polarity, VerdictAssessment

if TYPE_CHECKING:
    from app.models.case import Case


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[AnalysisStatus] = mapped_column(
        SQLEnum(AnalysisStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AnalysisStatus.QUEUED,
        index=True,
    )
    provider_used: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    config_snapshot: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    case: Mapped["Case"] = relationship(
        "Case",
        back_populates="analyses",
    )
    findings: Mapped[List["Finding"]] = relationship(
        "Finding",
        back_populates="analysis_run",
        cascade="all, delete-orphan",
        order_by="Finding.created_at",
    )
    verdict: Mapped[Optional["Verdict"]] = relationship(
        "Verdict",
        back_populates="analysis_run",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    analysis_run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    polarity: Mapped[Polarity] = mapped_column(
        SQLEnum(Polarity, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.5,
    )
    # Stored as JSON list of Evidence IDs cited in this specific finding
    evidence_citations: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    analysis_run: Mapped["AnalysisRun"] = relationship(
        "AnalysisRun",
        back_populates="findings",
    )


class Verdict(Base):
    __tablename__ = "verdicts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    analysis_run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment: Mapped[VerdictAssessment] = mapped_column(
        SQLEnum(VerdictAssessment, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    reasoning_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    supporting_synthesis: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    opposing_synthesis: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    identified_contradictions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    limitations: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    analysis_run: Mapped["AnalysisRun"] = relationship(
        "AnalysisRun",
        back_populates="verdict",
    )
