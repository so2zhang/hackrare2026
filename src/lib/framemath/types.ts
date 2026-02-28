export type Phase = 0 | 1 | 2;

export interface ExonInfo {
  number: number;
  startPhase: Phase;
  endPhase: Phase;
  lengthBp: number;
  skippable: boolean;
  criticalDomains: string[];
}

export interface GeneProfile {
  gene: string;
  disease: string;
  transcript: string;
  totalExons: number;
  exons: ExonInfo[];
  proteinLength: number;
}

export type MutationType = "deletion" | "duplication" | "point" | "insertion";

export interface MutationInput {
  gene: string;
  mutationType: MutationType;
  affectedExons: number[];
  description?: string;
}

export interface SkipStrategy {
  exonsToSkip: number[];
  restoredFrame: boolean;
  totalSkippedBp: number;
  predictedProteinLength: number;
  percentWildtype: number;
  lostDomains: string[];
  confidence: "high" | "medium" | "low";
  rationale: string;
}

export interface AnalysisResult {
  mutation: MutationInput;
  originalFrameShift: number;
  isFrameshift: boolean;
  strategies: SkipStrategy[];
  bestStrategy: SkipStrategy | null;
  therapies: TherapyMatch[];
  warnings: string[];
}

export interface TherapyMatch {
  drugName: string;
  genericName?: string;
  targetExons: number[];
  status: "approved" | "phase3" | "phase2" | "phase1" | "preclinical";
  sponsor?: string;
  trialId?: string;
  notes: string;
}
