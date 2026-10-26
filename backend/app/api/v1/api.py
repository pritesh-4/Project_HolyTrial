"""API V1 Router Aggregation
"""

from fastapi import APIRouter
from app.api.v1.endpoints import analyses, cases, evidence, health

api_router = APIRouter()

# Health endpoints are mounted both under root /health and /api/v1/health for flexibility
api_router.include_router(health.router)
api_router.include_router(cases.router)
api_router.include_router(evidence.router)
api_router.include_router(analyses.router)
