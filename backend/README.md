# Holy Trial Backend — Python & FastAPI

Judicial backend for Holy Trial (The Obsidian Tribunal). Provides case lifecycle management, evidence exhibit ingestion with cryptographic verification, SSRF protection, and adversarial reasoning pipelines that examine claims against empirical evidence.

## Quick Start

### 1. Prerequisites

- Python 3.10+ (tested on Python 3.14)
- Virtual environment in `backend/.venv`

### 2. Setup Environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
cp .env.example .env
```

### 3. Run Database Migrations

```powershell
.\.venv\Scripts\python -m alembic upgrade head
```

### 4. Run Development Server

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)
- Liveness Probe: [http://localhost:8000/health/live](http://localhost:8000/health/live)
- Readiness Probe: [http://localhost:8000/health/ready](http://localhost:8000/health/ready)

### 5. Run Automated Tests

```powershell
.\.venv\Scripts\python -m pytest -v
```

## Directory Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan, exception handlers
│   ├── core/                # Configuration (pydantic-settings), security, logging
│   ├── db/                  # SQLAlchemy 2.0 engine, sessions, DeclarativeBase
│   ├── models/              # Persistent models: Case, Evidence, AnalysisRun, Finding, Verdict
│   ├── schemas/             # Pydantic v2 validation models
│   ├── services/            # Case service, evidence service, reasoning orchestration
│   ├── ai/                  # Reasoning provider interface, heuristic & external LLM adapters
│   └── api/v1/              # Versioned API endpoints (/cases, /evidence, /analyses, /health)
├── alembic/                 # Database migrations
├── tests/                   # Automated pytest suite (20 unit & integration tests)
├── API_CONTRACT.md          # Full documented API specification
└── requirements.txt         # Pinned backend dependencies
```
