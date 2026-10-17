import type { DraftCase } from '../types/case';

const STORAGE_KEY = 'hype_court_active_case';

export function generateCaseId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CASE-${year}-${randomPart}`;
}

export function generateDraftId(): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DRAFT-${randomPart}`;
}

export function saveCaseToStorage(draftCase: DraftCase): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftCase));
    return true;
  } catch {
    return false;
  }
}

export function loadCaseFromStorage(): DraftCase | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftCase;
  } catch {
    return null;
  }
}

export function clearCaseFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
