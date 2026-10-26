"""Health and Readiness Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class HealthLiveResponse(BaseModel):
    status: str = Field(default="live", description="Liveness indicator")
    timestamp: datetime = Field(..., description="Timestamp of the health check")


class HealthReadyResponse(BaseModel):
    status: str = Field(..., description="Overall readiness: 'ready' or 'degraded'")
    database: str = Field(..., description="Database connection health")
    storage: str = Field(..., description="Evidence storage accessibility")
    timestamp: datetime = Field(..., description="Timestamp of the readiness check")
