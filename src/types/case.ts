export type CaseCategory =
  | 'Technology & AI'
  | 'Science & Energy'
  | 'Products & Business'
  | 'History & Governance'
  | 'Predictions & Opinions'
  | 'Other / Unspecified';

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
