export type CaseCategory =
  | 'Technology & AI'
  | 'Science & Energy'
  | 'Products & Business'
  | 'History & Governance'
  | 'Predictions & Opinions'
  | 'Other / Unspecified';

export type CaseStatus = 'draft' | 'awaiting_evidence' | 'analyzing' | 'adjudicated' | 'dismissed';

export type EvidenceType = 'text' | 'document' | 'url' | 'file';
export type EvidenceStatus = 'pending' | 'processed' | 'failed';
export type Polarity = 'supporting' | 'opposing' | 'contradiction' | 'uncertainty';
export type VerdictAssessment =
  'SUBSTANTIATED' | 'REFUTED' | 'PLAUSIBLE_WITH_RESERVATIONS' | 'INCONCLUSIVE';

export type ProductStage = 'dossier' | 'evidence' | 'scrutiny' | 'verdict';

export interface DraftCase {
  caseId: string;
  originalClaim: string;
  confirmedClaim: string;
  category: CaseCategory;
  createdAt: string;
  status: 'Awaiting evidence';
}

export interface ExampleClaim {
  id: string;
  tag: string;
  category: CaseCategory;
  text: string;
}

export interface CaseDocket {
  id: string;
  proposition: string;
  category: CaseCategory;
  status: CaseStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  analysis_count: number;
  latest_verdict?: string | null;
}

export interface EvidenceExhibit {
  id: string;
  case_id: string;
  type: EvidenceType;
  title: string;
  content?: string | null;
  source_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  checksum?: string | null;
  provenance?: string | null;
  status: EvidenceStatus;
  error_message?: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  analysis_run_id: string;
  case_id: string;
  polarity: Polarity;
  title: string;
  explanation: string;
  confidence: number;
  evidence_citations: string[];
  created_at: string;
}

export interface Verdict {
  id: string;
  analysis_run_id: string;
  case_id: string;
  assessment: VerdictAssessment;
  confidence_score: number;
  reasoning_summary: string;
  supporting_synthesis: string;
  opposing_synthesis: string;
  identified_contradictions?: string | null;
  limitations: string;
  created_at: string;
}

export interface AnalysisRun {
  id: string;
  case_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  provider_used?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  created_at: string;
  findings: Finding[];
  verdict?: Verdict | null;
}
