# Holy Trial — Backend API & Integration Contract

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api/v1`  
**OpenAPI Specification:** `http://localhost:8000/api/v1/openapi.json`  
**Interactive Documentation:** `http://localhost:8000/docs`

---

## 1. Overview & Architecture

The Holy Trial backend is built using **Python and FastAPI**, backed by **SQLAlchemy 2.0**, **Alembic** migrations, and an adversarial reasoning pipeline.

### Core Lifecycle

1. **Case Registration (`POST /api/v1/cases`)**: The user files a declarative proposition (15–400 characters, no trailing question marks).
2. **Evidence Ingestion (`POST /api/v1/cases/{id}/evidence/...`)**: Empirical exhibits are submitted as text, remote URLs (with SSRF protection), or uploaded documents (PDF/TXT/MD with SHA-256 cryptographic verification).
3. **Adversarial Analysis (`POST /api/v1/cases/{id}/analyses`)**: An asynchronous analysis run is queued (`202 Accepted`). Background workers scrutinize the claim against all attached evidence.
4. **Adjudication Findings (`GET /api/v1/analyses/{id}`)**: Findings are categorized into **supporting**, **opposing**, **contradiction**, and **uncertainty**, with explicit citations referencing the exact `evidence_id`s that ground each conclusion.

---

## 2. Health & Readiness Probes

### Liveness Probe

- **Path:** `GET /health/live` or `GET /api/v1/health/live`
- **Response `200 OK`:**

```json
{
  "status": "live",
  "timestamp": "2026-10-26T17:30:00Z"
}
```

### Readiness Probe

- **Path:** `GET /health/ready` or `GET /api/v1/health/ready`
- **Response `200 OK`:**

```json
{
  "status": "ready",
  "database": "connected",
  "storage": "accessible",
  "timestamp": "2026-10-26T17:30:00Z"
}
```

---

## 3. Case Docket Management

### Register a New Case

- **Method:** `POST /api/v1/cases`
- **Request Body (`application/json`):**

```json
{
  "proposition": "Autonomous verification systems will eliminate 80% of software regression bugs by 2027.",
  "category": "Technology & AI",
  "case_id": "CASE-2026-ABCD",
  "notes": "Optional background notes or jurisdictional bounds"
}
```

_Validation Rules:_

- `proposition`: Minimum 15 characters, maximum 400 characters.
- Must be formulated as a declarative assertion (cannot end with a question mark `?`).
- `category` must be one of:
  - `"Technology & AI"`
  - `"Science & Energy"`
  - `"Products & Business"`
  - `"History & Governance"`
  - `"Predictions & Opinions"`
  - `"Other / Unspecified"`
- `case_id`: Optional. If omitted, generates `CASE-YYYY-XXXX`.

- **Response `201 Created`:**

```json
{
  "id": "CASE-2026-ABCD",
  "proposition": "Autonomous verification systems will eliminate 80% of software regression bugs by 2027.",
  "category": "Technology & AI",
  "status": "awaiting_evidence",
  "notes": "Optional background notes or jurisdictional bounds",
  "created_at": "2026-10-26T17:30:00Z",
  "updated_at": "2026-10-26T17:30:00Z",
  "evidence_count": 0,
  "analysis_count": 0,
  "latest_verdict": null
}
```

### List Case Dockets

- **Method:** `GET /api/v1/cases`
- **Query Parameters:**
  - `category` (string, optional)
  - `status` (`draft` | `awaiting_evidence` | `analyzing` | `adjudicated` | `dismissed`, optional)
  - `limit` (integer, default 50, max 100)
  - `offset` (integer, default 0)
- **Response `200 OK`:**

```json
{
  "items": [ ... ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

### Retrieve a Single Case Docket

- **Method:** `GET /api/v1/cases/{case_id}`
- **Response `200 OK`:** `CaseResponse`

### Update Case Docket

- **Method:** `PATCH /api/v1/cases/{case_id}`
- **Request Body (`application/json`):**

```json
{
  "category": "Science & Energy",
  "notes": "Updated scope definition",
  "status": "draft"
}
```

### Delete Case Docket

- **Method:** `DELETE /api/v1/cases/{case_id}`
- **Response:** `204 No Content` (cascades to all associated evidence and analyses).

---

## 4. Evidence Management

### Ingest Text Evidence

- **Method:** `POST /api/v1/cases/{case_id}/evidence/text`
- **Request Body (`application/json`):**

```json
{
  "title": "Stanford Empirical System Audit",
  "content": "Full text of study showing measured decrease in defect discovery intervals...",
  "provenance": "Stanford Department of Computer Science (Published Q1 2026)"
}
```

- **Response `201 Created`:**

```json
{
  "id": "c1f7a188-4665-4f4c-8ab5-d14cf3e4c495",
  "case_id": "CASE-2026-ABCD",
  "type": "text",
  "title": "Stanford Empirical System Audit",
  "content": "Full text of study showing measured decrease...",
  "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "provenance": "Stanford Department of Computer Science (Published Q1 2026)",
  "status": "processed",
  "created_at": "2026-10-26T17:31:00Z"
}
```

### Ingest Remote Web URL Evidence

- **Method:** `POST /api/v1/cases/{case_id}/evidence/url`
- **Request Body (`application/json`):**

```json
{
  "title": "Reuters Industry Report",
  "source_url": "https://example.com/industry-audit.html",
  "provenance": "Reuters Technology Bureau"
}
```

_Security Protection:_ Rejects loopback (`127.0.0.1`), private RFC1918 ranges, internal domains (`.local`, `.internal`), link-local IPs, and non-HTTP protocols.

### Upload Document Evidence

- **Method:** `POST /api/v1/cases/{case_id}/evidence/upload`
- **Request Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: Binary file (`.pdf`, `.txt`, `.md`, `.json`, `.csv`, max 10MB)
  - `title`: String
  - `provenance`: Optional string

### List Case Exhibits

- **Method:** `GET /api/v1/cases/{case_id}/evidence`
- **Response `200 OK`:**

```json
{
  "items": [ ... ],
  "total": 3
}
```

### Retrieve Evidence Exhibit

- **Method:** `GET /api/v1/evidence/{evidence_id}`

---

## 5. Adversarial Reasoning & Adjudication

### Initiate Adversarial Analysis

- **Method:** `POST /api/v1/cases/{case_id}/analyses`
- **Request Body (`application/json`):**

```json
{
  "provider": "local_heuristic"
}
```

_Providers:_

- `"local_heuristic"` (default offline semantic polarity & contradiction engine).
- `"external"` (NVIDIA NIM / OpenAI compatible model, requires `REASONING_API_KEY`).
- `"test"` (deterministic test provider).

- **Response `202 Accepted`:**

```json
{
  "id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
  "case_id": "CASE-2026-ABCD",
  "status": "queued",
  "provider_used": "local_heuristic",
  "created_at": "2026-10-26T17:35:00Z",
  "findings": [],
  "verdict": null
}
```

### Poll Analysis Status & Retrieve Verdict

- **Method:** `GET /api/v1/analyses/{analysis_id}`
- **Response `200 OK`:**

```json
{
  "id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
  "case_id": "CASE-2026-ABCD",
  "status": "completed",
  "provider_used": "local_heuristic",
  "started_at": "2026-10-26T17:35:01Z",
  "completed_at": "2026-10-26T17:35:03Z",
  "created_at": "2026-10-26T17:35:00Z",
  "findings": [
    {
      "id": "b18b418a-f881-4e7f-b4b1-91340a6b6f72",
      "analysis_run_id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
      "case_id": "CASE-2026-ABCD",
      "polarity": "supporting",
      "title": "Corroborating Exhibit: Stanford Operating Cost Audit 2026",
      "explanation": "Exhibit corroborates core elements of the proposition...",
      "confidence": 0.82,
      "evidence_citations": ["c1f7a188-4665-4f4c-8ab5-d14cf3e4c495"],
      "created_at": "2026-10-26T17:35:02Z"
    },
    {
      "id": "99b9cf9a-a8c9-4b6a-939a-df4fa6b6f721",
      "analysis_run_id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
      "case_id": "CASE-2026-ABCD",
      "polarity": "opposing",
      "title": "Scrutiny Challenge from: Retrieval Noise Report",
      "explanation": "Empirical scrutiny reveals severe limitations and flaws...",
      "confidence": 0.78,
      "evidence_citations": ["d2e8b299-5776-5f5d-9bc6-e25df4e5d506"],
      "created_at": "2026-10-26T17:35:02Z"
    },
    {
      "id": "77a8bf8a-e9d8-4c5b-828a-ce3fa5a5e610",
      "analysis_run_id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
      "case_id": "CASE-2026-ABCD",
      "polarity": "contradiction",
      "title": "Direct Evidentiary Divergence Detected",
      "explanation": "A structural contradiction exists between corroborating exhibits and scrutiny exhibits...",
      "confidence": 0.82,
      "evidence_citations": [
        "c1f7a188-4665-4f4c-8ab5-d14cf3e4c495",
        "d2e8b299-5776-5f5d-9bc6-e25df4e5d506"
      ],
      "created_at": "2026-10-26T17:35:02Z"
    }
  ],
  "verdict": {
    "id": "f82b7eea-b7e1-4c6d-961a-4d2fa8e7f123",
    "analysis_run_id": "e82c6eea-d1f5-4e91-876a-b3c6685fe0fd",
    "case_id": "CASE-2026-ABCD",
    "assessment": "PLAUSIBLE_WITH_RESERVATIONS",
    "confidence_score": 0.58,
    "reasoning_summary": "Equally weighted competing interpretations exist. Corroborating and opposing evidence leave the ultimate proposition subject to substantial reservations.",
    "supporting_synthesis": "Observed 1 corroborating exhibit(s) providing direct validation of terms.",
    "opposing_synthesis": "Observed 1 opposing exhibit(s) identifying constraints, caveats, or failure modes.",
    "identified_contradictions": "Tension between corroborating exhibits and opposing exhibits (1 vs 1).",
    "limitations": "Adjudication based upon 2 exhibit(s). External verification and retrial remain available as new evidence emerges.",
    "created_at": "2026-10-26T17:35:03Z"
  }
}
```

---

## 6. Frontend Integration Guidelines

1. **Origin & CORS:** Backend allows `http://localhost:5173` and `http://127.0.0.1:5173`.
2. **Case Creation (`src/components/CaseDossier.tsx`):**
   ```typescript
   const response = await fetch('http://localhost:8000/api/v1/cases', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       proposition: confirmedClaim,
       category: selectedCategory,
     }),
   });
   const newCase = await response.json();
   ```
3. **Evidence Upload:** Use `FormData` with field `file`, `title`, and optional `provenance`.
4. **Trigger Analysis:** POST `/api/v1/cases/{caseId}/analyses`, poll `GET /api/v1/analyses/{analysisId}` until `status === 'completed' | 'failed'`.
