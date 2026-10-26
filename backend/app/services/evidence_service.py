"""Evidence Processing and Ingestion Service

Handles:
- Direct text evidence registration with SHA-256 checksumming.
- Secure file upload handling (PDF, text, markdown) with text extraction.
- SSRF-protected remote URL ingestion with size and timeout guards.
"""

import io
import re
from pathlib import Path
from typing import List, Optional
import httpx
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.core.config import settings
from app.core.security import (
    compute_sha256,
    is_allowed_extension,
    sanitize_filename,
    validate_safe_url,
    SecurityError,
)
from app.models.case import Case
from app.models.enums import EvidenceStatus, EvidenceType
from app.models.evidence import Evidence
from app.schemas.evidence import EvidenceTextCreate, EvidenceUrlCreate


def _strip_html_tags(html_text: str) -> str:
    """Basic HTML tag stripping for extracted webpage content."""
    clean = re.sub(r"<script[^>]*?>.*?</script>", " ", html_text, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r"<style[^>]*?>.*?</style>", " ", clean, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r"<[^>]+>", " ", clean)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()


def create_text_evidence(
    db: Session, case_id: str, evidence_in: EvidenceTextCreate
) -> Evidence:
    """Store direct textual evidence with verifiable checksum."""
    case = db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()
    if not case:
        raise ValueError(f"Case with docket '{case_id}' does not exist.")

    content_bytes = evidence_in.content.encode("utf-8")
    checksum = compute_sha256(content_bytes)

    evidence = Evidence(
        case_id=case_id,
        type=EvidenceType.TEXT,
        title=evidence_in.title,
        content=evidence_in.content,
        provenance=evidence_in.provenance,
        file_size_bytes=len(content_bytes),
        checksum=checksum,
        status=EvidenceStatus.PROCESSED,
    )
    db.add(evidence)
    db.flush()
    db.refresh(evidence)
    return evidence


async def ingest_url_evidence(
    db: Session, case_id: str, evidence_in: EvidenceUrlCreate
) -> Evidence:
    """Safely fetch and ingest content from a remote URL after SSRF validation."""
    case = db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()
    if not case:
        raise ValueError(f"Case with docket '{case_id}' does not exist.")

    # Validate against SSRF
    validate_safe_url(evidence_in.source_url)

    extracted_text = ""
    checksum = None
    error_message = None
    status = EvidenceStatus.PENDING

    try:
        async with httpx.AsyncClient(
            timeout=settings.HTTP_CLIENT_TIMEOUT_SECONDS,
            follow_redirects=True,
            max_redirects=3,
        ) as client:
            response = await client.get(
                evidence_in.source_url,
                headers={"User-Agent": "HolyTrial-Auditor/1.0"},
            )
            response.raise_for_status()

            # Enforce max content size limit
            content_bytes = response.content[: settings.MAX_REMOTE_CONTENT_BYTES]
            checksum = compute_sha256(content_bytes)

            content_type = response.headers.get("content-type", "").lower()
            raw_text = content_bytes.decode("utf-8", errors="replace")

            if "html" in content_type:
                extracted_text = _strip_html_tags(raw_text)
            else:
                extracted_text = raw_text

            status = EvidenceStatus.PROCESSED

    except Exception as e:
        status = EvidenceStatus.FAILED
        error_message = f"Failed to ingest remote source: {str(e)}"

    evidence = Evidence(
        case_id=case_id,
        type=EvidenceType.URL,
        title=evidence_in.title,
        source_url=evidence_in.source_url,
        content=extracted_text if status == EvidenceStatus.PROCESSED else None,
        provenance=evidence_in.provenance or evidence_in.source_url,
        file_size_bytes=len(extracted_text.encode("utf-8")) if extracted_text else 0,
        checksum=checksum,
        status=status,
        error_message=error_message,
    )
    db.add(evidence)
    db.flush()
    db.refresh(evidence)
    return evidence


async def upload_file_evidence(
    db: Session,
    case_id: str,
    file: UploadFile,
    title: str,
    provenance: Optional[str] = None,
) -> Evidence:
    """Safely store an uploaded file and extract textual findings."""
    case = db.execute(select(Case).where(Case.id == case_id)).scalar_one_or_none()
    if not case:
        raise ValueError(f"Case with docket '{case_id}' does not exist.")

    raw_filename = file.filename or "uploaded_evidence"
    if not is_allowed_extension(raw_filename):
        raise ValueError(
            f"File extension not permitted. Allowed: {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
        )

    clean_filename = sanitize_filename(raw_filename)
    safe_case_dir = settings.UPLOAD_DIR / sanitize_filename(case_id)
    safe_case_dir.mkdir(parents=True, exist_ok=True)

    destination_path = safe_case_dir / clean_filename

    # Read content with bounded size enforcement
    file_bytes = await file.read(settings.MAX_UPLOAD_SIZE_BYTES + 1)
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ValueError(
            f"File exceeds maximum permissible size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # Save to disk
    with open(destination_path, "wb") as f:
        f.write(file_bytes)

    checksum = compute_sha256(file_bytes)
    extracted_text = ""
    error_msg = None
    status = EvidenceStatus.PROCESSED

    # Extract text content based on format
    suffix = Path(clean_filename).suffix.lower()
    try:
        if suffix == ".pdf":
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for idx, page in enumerate(reader.pages[:50]):  # Limit to first 50 pages
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append(f"--- [Page {idx + 1}] ---\n{text}")
            extracted_text = "\n\n".join(pages_text)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        status = EvidenceStatus.FAILED
        error_msg = f"Extraction failed: {str(e)}"

    evidence = Evidence(
        case_id=case_id,
        type=EvidenceType.FILE,
        title=title,
        content=extracted_text if status == EvidenceStatus.PROCESSED else None,
        file_path=str(destination_path),
        file_name=clean_filename,
        mime_type=file.content_type,
        file_size_bytes=len(file_bytes),
        checksum=checksum,
        provenance=provenance or clean_filename,
        status=status,
        error_message=error_msg,
    )
    db.add(evidence)
    db.flush()
    db.refresh(evidence)
    return evidence


def get_evidence(db: Session, evidence_id: str) -> Optional[Evidence]:
    """Retrieve an evidence record by ID."""
    return db.execute(select(Evidence).where(Evidence.id == evidence_id)).scalar_one_or_none()


def list_evidence_for_case(db: Session, case_id: str) -> List[Evidence]:
    """List all evidence attached to a specific case docket."""
    return list(
        db.execute(
            select(Evidence)
            .where(Evidence.case_id == case_id)
            .order_by(Evidence.created_at.asc())
        )
        .scalars()
        .all()
    )


def delete_evidence(db: Session, evidence_id: str) -> bool:
    """Delete an evidence record and its underlying stored file if present."""
    evidence = get_evidence(db, evidence_id)
    if not evidence:
        return False

    if evidence.file_path:
        file_p = Path(evidence.file_path)
        if file_p.exists():
            try:
                file_p.unlink()
            except OSError:
                pass

    db.delete(evidence)
    db.flush()
    return True
