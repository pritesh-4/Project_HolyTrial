import type { CaseDocket, DraftCase, ProductStage } from '../types/case';

const DOCKET_STORAGE_KEY = 'holy_trial_active_docket';
const STAGE_STORAGE_KEY = 'holy_trial_active_stage';
const RECENT_CASES_KEY = 'holy_trial_recent_cases';
const LEGACY_STORAGE_KEY = 'hype_court_active_case';

export function generateCaseId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CASE-${year}-${randomPart}`;
}

export function generateDraftId(): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DRAFT-${randomPart}`;
}

export function saveDocketToStorage(docket: CaseDocket): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(DOCKET_STORAGE_KEY, JSON.stringify(docket));

    // Also append to recent dockets list
    const recents = loadRecentCasesFromStorage();
    const filtered = recents.filter((c) => c.id !== docket.id);
    filtered.unshift(docket);
    localStorage.setItem(RECENT_CASES_KEY, JSON.stringify(filtered.slice(0, 10)));
    return true;
  } catch {
    return false;
  }
}

export function loadDocketFromStorage(): CaseDocket | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DOCKET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CaseDocket;
  } catch {
    return null;
  }
}

export function clearDocketFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DOCKET_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function saveActiveStageToStorage(stage: ProductStage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAGE_STORAGE_KEY, stage);
  } catch {
    // Ignore
  }
}

export function loadActiveStageFromStorage(): ProductStage {
  if (typeof window === 'undefined') return 'dossier';
  try {
    const stage = localStorage.getItem(STAGE_STORAGE_KEY);
    if (
      stage === 'dossier' ||
      stage === 'evidence' ||
      stage === 'scrutiny' ||
      stage === 'verdict'
    ) {
      return stage;
    }
    return 'dossier';
  } catch {
    return 'dossier';
  }
}

export function loadRecentCasesFromStorage(): CaseDocket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_CASES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseDocket[];
  } catch {
    return [];
  }
}

// ── Legacy Compatibility ──────────────────────────────────────────────
export function saveCaseToStorage(draftCase: DraftCase): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(draftCase));
    return true;
  } catch {
    return false;
  }
}

export function loadCaseFromStorage(): DraftCase | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftCase;
  } catch {
    return null;
  }
}

export function clearCaseFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
