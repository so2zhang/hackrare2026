import { MutationInput, AnalysisResult } from "@/lib/framemath/types";
import { getGeneProfile, calculateFrameShift } from "@/lib/framemath/engine";
import { findSkipStrategies } from "@/lib/framemath/skip-finder";
import { getTherapiesForSkip } from "@/lib/therapies/mapping";

/**
 * Usher Syndrome Type 2A (USH2A) analysis rules.
 *
 * Key biology (NP_996816.3, 5202 aa, NM_206933.4, UniProt O75445):
 * - Usherin (USH2A) has 72 exons; 4 non-skippable: exon 1 (5-UTR only), 70 (TM aa 5043-5063), 71 (intracellular), 72 (stop/3-UTR)
 * - Exon 1 is entirely 5-UTR (235 bp); CDS begins in exon 2 at mRNA pos 440
 * - Domain structure: LamN, EGF-like 1-10, FN3 1-34, LamG-1/2, TM, intracellular, PDZ-binding (5200-5202)
 * - Exon 13: 642 bp, phase 1→1 — primary clinical target. c.2299delG (CDS pos 2299, aa ~767) causes frameshift rescued by skipping exon 13 itself (QR-421a/Ultevursen)
 * - Exon 41 deletion: frameshift (1→0), rescued by skipping exon 44 (phase 1→1)
 * - Exon skipping for USH2A is in active clinical development
 */

const USH2A_ESSENTIAL_REGIONS = [
  { start: 1, end: 1, reason: "Exon 1 is entirely 5-UTR; CDS begins in exon 2" },
  { start: 70, end: 70, reason: "Exon 70 contains the TM domain (aa 5043-5063) essential for membrane anchoring" },
  { start: 71, end: 71, reason: "Exon 71 encodes the intracellular C-terminal critical for PDZ scaffold" },
  { start: 72, end: 72, reason: "Exon 72 contains the stop codon and 3'-UTR" },
];

export function analyzeUsher(mutation: MutationInput): AnalysisResult {
  const profile = getGeneProfile("USH2A");
  if (!profile) throw new Error("USH2A gene profile not found");

  const warnings: string[] = [];
  const frameShift = calculateFrameShift(profile, mutation.affectedExons);
  const isFs = frameShift !== 0;

  if (!isFs) {
    warnings.push(
      "This deletion is in-frame. The FN3 repeat region is partially redundant, so a shortened protein may retain partial function."
    );
  }

  const affectsExon13 = mutation.affectedExons.includes(13);
  if (affectsExon13 && isFs) {
    warnings.push(
      "Exon 13 (642 bp, phase 1→1) is the most clinically studied USH2A exon-skipping target. c.2299delG causes frameshift rescued by skipping exon 13 itself. QR-421a/Ultevursen in clinical trials."
    );
  }

  const affectsExon41 = mutation.affectedExons.includes(41);
  if (affectsExon41 && isFs) {
    warnings.push(
      "Exon 41 deletion causes frameshift (1→0). Skipping exon 44 (phase 1→1) can restore the reading frame with minimal domain loss."
    );
  }

  for (const region of USH2A_ESSENTIAL_REGIONS) {
    const affectsEssential = mutation.affectedExons.some(
      (e) => e >= region.start && e <= region.end
    );
    if (affectsEssential) {
      warnings.push(`Mutation affects essential region: ${region.reason}`);
    }
  }

  const strategies = isFs ? findSkipStrategies(profile, mutation) : [];
  const bestStrategy = strategies.length > 0 ? strategies[0] : null;

  const therapies = bestStrategy
    ? getTherapiesForSkip("USH2A", bestStrategy.exonsToSkip)
    : [];

  return {
    mutation,
    originalFrameShift: frameShift,
    isFrameshift: isFs,
    alreadyInFrame: !isFs,
    strategies,
    bestStrategy,
    therapies,
    warnings,
  };
}
