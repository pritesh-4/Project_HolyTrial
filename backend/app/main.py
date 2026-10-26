"""Holy Trial - FastAPI Main Application Entry Point

Lifespan, middleware, CORS, routers, and global exception handlers.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.health import router as health_root_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import SecurityError
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle management."""
    setup_logging()
    # Initialize database tables and upload storage directory
    Base.metadata.create_all(bind=engine)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Adversarial reasoning backend for Holy Trial (The Obsidian Tribunal). "
        "Provides case dossier registration, evidence exhibits management, "
        "and grounded judicial scrutiny engines."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount root health probes (e.g. GET /health/live, GET /health/ready)
app.include_router(health_root_router)

# Mount versioned API routes (e.g. /api/v1/cases, /api/v1/analyses, etc.)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(SecurityError)
async def security_error_handler(request: Request, exc: SecurityError) -> JSONResponse:
    """Handle SSRF or file security violations."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": f"Security violation: {str(exc)}"},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Handle domain validation errors."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )
