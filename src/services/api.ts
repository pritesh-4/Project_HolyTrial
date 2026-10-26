/**
 * Judicial API Client
 *
 * Connects the frontend to the real FastAPI backend on port 8000.
 * Handles case registration, evidence intake, and adversarial analysis polling.
 */

import type {
  CaseDocket,
  CaseCategory,
  CaseStatus,
  EvidenceExhibit,
  AnalysisRun,
} from '../types/case';

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';
const HEALTH_URL =
  (import.meta.env?.VITE_BACKEND_HEALTH_URL as string) || 'http://localhost:8000/health/live';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error [${status}]: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorJson = await response.json();
      detail = errorJson.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

export async function checkBackendLive(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createCaseApi(params: {
  proposition: string;
  category: CaseCategory;
  case_id?: string;
  notes?: string;
}): Promise<CaseDocket> {
  const res = await fetch(`${API_BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<CaseDocket>(res);
}

export async function getCaseApi(caseId: string): Promise<CaseDocket> {
  const res = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}`);
  return handleResponse<CaseDocket>(res);
}

export async function listCasesApi(params?: {
  category?: CaseCategory;
  status?: CaseStatus;
  limit?: number;
  offset?: number;
}): Promise<{ items: CaseDocket[]; total: number; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const url = `${API_BASE_URL}/cases${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function addTextEvidenceApi(params: {
  caseId: string;
  title: string;
  content: string;
  provenance?: string;
}): Promise<EvidenceExhibit> {
  const res = await fetch(
    `${API_BASE_URL}/cases/${encodeURIComponent(params.caseId)}/evidence/text`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        content: params.content,
        provenance: params.provenance,
      }),
    }
  );
  return handleResponse<EvidenceExhibit>(res);
}

export async function addUrlEvidenceApi(params: {
  caseId: string;
  title: string;
  source_url: string;
  provenance?: string;
}): Promise<EvidenceExhibit> {
  const res = await fetch(
    `${API_BASE_URL}/cases/${encodeURIComponent(params.caseId)}/evidence/url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        source_url: params.source_url,
        provenance: params.provenance,
      }),
    }
  );
  return handleResponse<EvidenceExhibit>(res);
}

export async function uploadFileEvidenceApi(params: {
  caseId: string;
  file: File;
  title: string;
  provenance?: string;
}): Promise<EvidenceExhibit> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('title', params.title);
  if (params.provenance) {
    formData.append('provenance', params.provenance);
  }

  const res = await fetch(
    `${API_BASE_URL}/cases/${encodeURIComponent(params.caseId)}/evidence/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  return handleResponse<EvidenceExhibit>(res);
}

export async function listCaseEvidenceApi(
  caseId: string
): Promise<{ items: EvidenceExhibit[]; total: number }> {
  const res = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/evidence`);
  return handleResponse<{ items: EvidenceExhibit[]; total: number }>(res);
}

export async function deleteEvidenceApi(evidenceId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/evidence/${encodeURIComponent(evidenceId)}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(res);
}

export async function initiateAnalysisApi(params: {
  caseId: string;
  provider?: string;
}): Promise<AnalysisRun> {
  const res = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(params.caseId)}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: params.provider || 'local_heuristic' }),
  });
  return handleResponse<AnalysisRun>(res);
}

export async function getAnalysisApi(analysisId: string): Promise<AnalysisRun> {
  const res = await fetch(`${API_BASE_URL}/analyses/${encodeURIComponent(analysisId)}`);
  return handleResponse<AnalysisRun>(res);
}

export async function listCaseAnalysesApi(
  caseId: string
): Promise<{ items: AnalysisRun[]; total: number }> {
  const res = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/analyses`);
  return handleResponse<{ items: AnalysisRun[]; total: number }>(res);
}
