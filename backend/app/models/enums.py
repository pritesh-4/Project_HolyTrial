"""Domain Enums and Categorization Constants

Maintains strict consistency with frontend contracts and judicial domain concepts.
"""

from enum import Enum


class CaseStatus(str, Enum):
    DRAFT = "draft"
    AWAITING_EVIDENCE = "awaiting_evidence"
    ANALYZING = "analyzing"
    ADJUDICATED = "adjudicated"
    DISMISSED = "dismissed"


class CaseCategory(str, Enum):
    TECH_AI = "Technology & AI"
    SCIENCE_ENERGY = "Science & Energy"
    PRODUCTS_BUSINESS = "Products & Business"
    HISTORY_GOVERNANCE = "History & Governance"
    PREDICTIONS_OPINIONS = "Predictions & Opinions"
    OTHER = "Other / Unspecified"


class EvidenceType(str, Enum):
    TEXT = "text"
    DOCUMENT = "document"
    URL = "url"
    FILE = "file"


class EvidenceStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"


class AnalysisStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Polarity(str, Enum):
    SUPPORTING = "supporting"
    OPPOSING = "opposing"
    CONTRADICTION = "contradiction"
    UNCERTAINTY = "uncertainty"


class VerdictAssessment(str, Enum):
    SUBSTANTIATED = "SUBSTANTIATED"
    REFUTED = "REFUTED"
    INCONCLUSIVE = "INCONCLUSIVE"
    PLAUSIBLE_WITH_RESERVATIONS = "PLAUSIBLE_WITH_RESERVATIONS"
