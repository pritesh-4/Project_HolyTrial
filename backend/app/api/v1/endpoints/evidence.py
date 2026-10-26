"""Evidence Management Endpoints
"""

from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.security import SecurityError
from app.db.session import get_db
from app.schemas.evidence import (
    EvidenceListResponse,
    EvidenceResponse,
    EvidenceTextCreate,
    EvidenceUrlCreate,
)
from app.services.case_service import get_case
from app.services.evidence_service import (
    create_text_evidence,
    delete_evidence,
    get_evidence,
    ingest_url_evidence,
    list_evidence_for_case,
    upload_file_evidence,
)

router = APIRouter(tags=["Evidence Management"])


@router.post(
    "/cases/{case_id}/evidence/text",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach Text Evidence",
)
def attach_text_evidence(
    case_id: str,
    evidence_in: EvidenceTextCreate,
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Submit a verbatim text exhibit to the case docket."""
    try:
        evidence = create_text_evidence(db, case_id, evidence_in)
        return EvidenceResponse.model_validate(evidence)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post(
    "/cases/{case_id}/evidence/url",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Remote URL Evidence",
)
async def ingest_url_evidence_endpoint(
    case_id: str,
    evidence_in: EvidenceUrlCreate,
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Ingest content from a remote URL with SSRF guards."""
    try:
        evidence = await ingest_url_evidence(db, case_id, evidence_in)
        return EvidenceResponse.model_validate(evidence)
    except SecurityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security rejection: {str(e)}",
        ) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post(
    "/cases/{case_id}/evidence/upload",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Document Evidence",
)
async def upload_document_evidence(
    case_id: str,
    file: UploadFile = File(..., description="Document exhibit (PDF, TXT, MD, JSON, CSV)"),
    title: str = Form(..., description="Title of the exhibit"),
    provenance: Optional[str] = Form(None, description="Provenance / source"),
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Upload a file exhibit, calculate cryptographic checksum, and extract text."""
    try:
        evidence = await upload_file_evidence(
            db,
            case_id=case_id,
            file=file,
            title=title,
            provenance=provenance,
        )
        return EvidenceResponse.model_validate(evidence)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get(
    "/cases/{case_id}/evidence",
    response_model=EvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Case Evidence",
)
def get_case_evidence(
    case_id: str,
    db: Session = Depends(get_db),
) -> EvidenceListResponse:
    """Retrieve all evidence exhibits attached to a case docket."""
    case = get_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case docket '{case_id}' was not found.",
        )
    items = list_evidence_for_case(db, case_id)
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(i) for i in items],
        total=len(items),
    )


@router.get(
    "/evidence/{evidence_id}",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Evidence Exhibit",
)
def get_single_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Retrieve details and extracted text of a specific evidence exhibit."""
    evidence = get_evidence(db, evidence_id)
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence exhibit '{evidence_id}' was not found.",
        )
    return EvidenceResponse.model_validate(evidence)


@router.delete(
    "/evidence/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Evidence Exhibit",
)
def delete_evidence_endpoint(
    evidence_id: str,
    db: Session = Depends(get_db),
) -> None:
    """Delete an evidence exhibit."""
    success = delete_evidence(db, evidence_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence exhibit '{evidence_id}' was not found.",
        )
