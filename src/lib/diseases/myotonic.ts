import { MutationInput, AnalysisResult, TherapyMatch } from "@/lib/framemath/types";

/**
 * Myotonic Dystrophy analysis.
 *
 * Key biology:
 * - DM1 (DMPK gene): CTG trinucleotide repeat expansion in the 3' UTR
 * - DM2 (CNBP/ZNF9 gene): CCTG tetranucleotide repeat expansion in intron 1
 * - These are NOT classic frameshift mutations — they're repeat expansions
 *   that cause toxic RNA gain-of-function
 * - The mRNA with expanded repeats sequesters MBNL splicing factors
 * - Treatment approach: antisense oligonucleotides to degrade toxic RNA
 *   or small molecules to free sequestered splicing factors
 *
 * We include this for completeness but note the different mechanism.
 */

const DM_THERAPIES: TherapyMatch[] = [
  {
    drugName: "DYNE-101",
    genericName: "anti-DMPK ASO",
    targetExons: [],
    status: "phase2",
    sponsor: "Dyne Therapeutics",
    trialId: "NCT05481879",
    notes: "Antibody-conjugated antisense oligonucleotide targeting DMPK mRNA. Reduces toxic RNA. Phase 1/2 ACHIEVE trial.",
  },
  {
    drugName: "Erdiafitinib",
    targetExons: [],
    status: "phase2",
    sponsor: "Avidity Biosciences",
    trialId: "NCT05497531",
    notes: "AOC 1001 — antibody-oligonucleotide conjugate targeting DMPK mRNA in skeletal muscle. Phase 1/2 MARINA trial.",
  },
];

export function analyzeMyotonic(mutation: MutationInput): AnalysisResult {
  const warnings: string[] = [
    "Myotonic Dystrophy is caused by repeat expansions, not classic exon deletions. The frameshift analysis model does not directly apply.",
    "DM1: CTG repeat expansion in DMPK 3' UTR causes toxic RNA gain-of-function.",
    "DM2: CCTG repeat expansion in CNBP intron 1 causes similar toxic RNA effects.",
    "Therapeutic approaches focus on degrading toxic RNA rather than exon skipping.",
  ];

  return {
    mutation,
    originalFrameShift: 0,
    isFrameshift: false,
    strategies: [],
    bestStrategy: null,
    therapies: DM_THERAPIES,
    warnings,
  };
}
