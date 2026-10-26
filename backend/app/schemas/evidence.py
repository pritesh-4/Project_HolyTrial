"""Evidence Schemas
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EvidenceStatus, EvidenceType


class EvidenceTextCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Descriptive title of the evidence exhibit.",
    )
    content: str = Field(
        ...,
        min_length=5,
        max_length=500000,
        description="Verbatim text content or documentation.",
    )
    provenance: Optional[str] = Field(
        default=None,
        max_length=512,
        description="Attribution, author, publication, or date of the material.",
    )


class EvidenceUrlCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Descriptive title of the remote evidence source.",
    )
    source_url: str = Field(
        ...,
        max_length=2048,
        description="HTTP or HTTPS URL to ingest.",
    )
    provenance: Optional[str] = Field(
        default=None,
        max_length=512,
        description="Source publisher or organization.",
    )


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    type: EvidenceType
    title: str
    content: Optional[str] = None
    source_url: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    provenance: Optional[str] = None
    status: EvidenceStatus
    error_message: Optional[str] = None
    created_at: datetime


class EvidenceListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[EvidenceResponse]
    total: int
